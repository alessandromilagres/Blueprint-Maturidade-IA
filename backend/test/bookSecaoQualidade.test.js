import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  INSTRUCAO_FECHAR_FRASE_COMPLETA,
  INSTRUCAO_RETRY_QUALIDADE,
  contarPalavras,
  normalizarDescricaoUnidadeOrcamento,
  montarPromptPolirDescricaoUnidade,
  instrucaoOrcamentoTabelaResumo,
  montarPromptTabelaResumoRoadmap,
  instrucaoOrcamentoProximosPassos,
  validarSecaoBookQualidade,
  escolherMelhorConteudoQualidade,
  gerarComValidacaoQualidade,
  listarDimensoesTabelaResumo,
  blocoInstrucaoFecharFrasePrompt,
  pareceTruncado,
  linhaContinuaMeioPalavra
} from '../src/utils/bookSecaoQualidade.js';
import { blocoRegrasTaxonomiaSatfPrompt } from '../src/utils/satfBookTaxonomia.js';

describe('bookSecaoQualidade — orçamentos de prompt', () => {
  it('instrução global de fechar frase está no helper e na taxonomia SATF', () => {
    assert.match(INSTRUCAO_FECHAR_FRASE_COMPLETA, /frase completa e pontuação/);
    assert.match(blocoInstrucaoFecharFrasePrompt(), /FECHAMENTO DE TEXTO/);
    assert.match(blocoRegrasTaxonomiaSatfPrompt(), /frase completa e pontuação/);
  });

  it('prompt de descrição pede 1 parágrafo ~120 palavras', () => {
    const p = montarPromptPolirDescricaoUnidade('Missão: acelerar IA. Sistemas: LMS.');
    assert.match(p, /um único parágrafo/i);
    assert.match(p, /~120 palavras/);
    assert.match(p, /não invente/i);
    assert.match(p, /Missão: acelerar IA/);
  });

  it('normalizarDescricaoUnidadeOrcamento: vazio → —; corta ~120 palavras', () => {
    assert.equal(normalizarDescricaoUnidadeOrcamento(''), '—');
    assert.equal(normalizarDescricaoUnidadeOrcamento('   '), '—');
    const palavras = Array.from({ length: 200 }, (_, i) => `p${i}`).join(' ');
    const out = normalizarDescricaoUnidadeOrcamento(palavras);
    assert.ok(contarPalavras(out) <= 120);
    assert.match(out, /[.!?]$/);
  });

  it('tabela-resumo pede N linhas = foco (4 dims, não hardcoded 7)', () => {
    const dims = [
      { codigoFramework: 'D1', area: 'Estratégia & Postura de IA' },
      { codigoFramework: 'D3', area: 'Pessoas, Cultura & Capacitação' },
      { codigoFramework: 'D4', area: 'Engenharia & Padrões' },
      { codigoFramework: 'D7', area: 'Segurança & Qualidade' }
    ];
    assert.equal(listarDimensoesTabelaResumo(dims).length, 4);
    const instr = instrucaoOrcamentoTabelaResumo(dims, { nRoadmap: 4 });
    assert.match(instr, /Exatamente 4 linha/);
    assert.doesNotMatch(instr, /Exatamente 7 linha/);
    assert.match(instr, /20 palavras/);
    const prompt = montarPromptTabelaResumoRoadmap({
      regrasTaxonomia: 'REGRAS',
      nRoadmap: 4,
      nProximos: 5,
      dimensoesEscopo: dims,
      dados: 'DADOS'
    });
    assert.match(prompt, /### 4\.5 Tabela Resumo/);
    assert.match(prompt, /Exatamente 4 linha/);
    assert.match(prompt, /PARE.*# 5\./);
  });

  it('próximos passos: max 4 itens (não 7–10)', () => {
    const instr = instrucaoOrcamentoProximosPassos({ maxItens: 4 });
    assert.match(instr, /No máximo \*\*4 ações/);
    assert.match(instr, /1–2 frases/);
    assert.match(instr, /não 7–10/);
  });
});

describe('bookSecaoQualidade — validação descrição', () => {
  const boa =
    'Unidade responsável por acelerar a adoção segura de IA, com foco em governança, plataforma de agentes e capacitação contínua dos times.';
  const truncada =
    'Unidade responsável por acelerar a adoção segura de IA, com foco em governança, plataforma de agentes e capacitação contínua dos';

  it('aceita parágrafo bom ≤120 palavras', () => {
    const v = validarSecaoBookQualidade(boa, { tipo: 'descricao' });
    assert.equal(v.ok, true);
  });

  it('rejeita descrição truncada sem pontuação', () => {
    const v = validarSecaoBookQualidade(truncada, { tipo: 'descricao' });
    assert.equal(v.ok, false);
    assert.ok(v.problemas.some((p) => p.tipo === 'descricao_truncada'));
  });

  it('aceita travessão vazio', () => {
    assert.equal(validarSecaoBookQualidade('—', { tipo: 'descricao' }).ok, true);
  });
});

describe('bookSecaoQualidade — validação tabela-resumo', () => {
  const boa = `### 4.5 Tabela Resumo do Roadmap

| Dimensão | Ação 30d | Ação 60d | Ação 90d | Owner |
|----------|----------|----------|----------|-------|
| D1 — Estratégia | Definir OKRs. | Publicar playbook. | Revisar governance. | CTO |
| D3 — Pessoas | Mapear skills. | Abrir trilha. | Avaliar adoção. | RH TI |
`;

  const truncada = `### 4.5 Tabela Resumo do Roadmap

| Dimensão | Ação 30d | Ação 60d | Ação 90d | Owner |
|----------|----------|----------|----------|-------|
| D1 — Estratégia | Definir OKRs de IA e |
| D3 — Pessoas | Mapear skills. | Abrir trilha. | Avaliar. | RH |
`;

  it('aceita tabela consistente', () => {
    const v = validarSecaoBookQualidade(boa, { tipo: 'tabela_resumo', linhasTabelaEsperadas: 2 });
    assert.equal(v.ok, true, JSON.stringify(v.problemas));
  });

  it('detecta colunas inconsistentes / célula truncada', () => {
    const v = validarSecaoBookQualidade(truncada, { tipo: 'tabela_resumo', linhasTabelaEsperadas: 2 });
    assert.equal(v.ok, false);
    assert.ok(
      v.problemas.some((p) => p.tipo === 'tabela_colunas' || p.tipo === 'celula_truncada'),
      JSON.stringify(v.problemas)
    );
  });
});

describe('bookSecaoQualidade — validação próximos passos', () => {
  const boa = `# 5. Próximos Passos

## 5.1 Ações
1. Formalizar OKRs de IA da unidade com o sponsor em 15 dias.
2. Publicar inventário de sistemas críticos e owners em 30 dias.
3. Abrir trilha de capacitação para squads prioritários em 30 dias.
4. Revisar evidências D7 na próxima rodada de avaliação.
`;

  const truncada = `# 5. Próximos Passos

## 5.1 Ações
1. Formalizar OKRs de IA da unidade com o sponsor em 15 dias.
2. Publicar inventário de sistemas críticos e owners em
`;

  const excesso = `# 5. Próximos
1. A.
2. B.
3. C.
4. D.
5. E.
6. F.
`;

  const meioPalavra = `### 4.3 Horizonte 60 dias

**Ação 4.3** — Publicar playbook de agentes.
ido: Tech Lead / Arquiteto de Soluções. **Prazo:** Semana 8.
`;

  it('aceita até 4 itens fechados', () => {
    const v = validarSecaoBookQualidade(boa, { tipo: 'proximos', maxItensProximos: 4 });
    assert.equal(v.ok, true, JSON.stringify(v.problemas));
  });

  it('detecta último item truncado', () => {
    const v = validarSecaoBookQualidade(truncada, { tipo: 'proximos', maxItensProximos: 4 });
    assert.equal(v.ok, false);
    assert.ok(v.problemas.some((p) => p.tipo === 'lista_item_truncado'));
  });

  it('detecta excesso de ações', () => {
    const v = validarSecaoBookQualidade(excesso, { tipo: 'proximos', maxItensProximos: 4 });
    assert.equal(v.ok, false);
    assert.ok(v.problemas.some((p) => p.tipo === 'proximos_excesso'));
  });

  it('detecta continuação mid-word (ido: Tech Lead)', () => {
    assert.equal(linhaContinuaMeioPalavra('ido: Tech Lead / Arquiteto'), true);
    assert.equal(pareceTruncado('Owner suger'), true);
    const v = validarSecaoBookQualidade(meioPalavra, { tipo: 'generico' });
    assert.equal(v.ok, false);
    assert.ok(
      v.problemas.some((p) => p.tipo === 'linha_meio_palavra'),
      JSON.stringify(v.problemas)
    );
  });
});

describe('bookSecaoQualidade — retry automático', () => {
  it('escolhe segunda tentativa quando a primeira falha', () => {
    const ruim = '1. Fazer inventário de sistemas e';
    const bom = `1. Completar inventário de sistemas críticos em 30 dias.
2. Definir owners por dimensão em 15 dias.`;
    const m = escolherMelhorConteudoQualidade(ruim, bom, { tipo: 'proximos', maxItensProximos: 4 });
    assert.equal(m.ok, true);
    assert.equal(m.tentativa, 2);
    assert.match(m.content, /Completar inventário/);
  });

  it('gerarComValidacaoQualidade faz um retry e grava warning se ainda falhar', async () => {
    let calls = 0;
    const out = await gerarComValidacaoQualidade({
      prompt: 'Gere próximos',
      maxTokens: 100,
      qualidadeOpts: { tipo: 'proximos', maxItensProximos: 4 },
      chunkId: 'sec_5',
      chunkLabel: 'próximos',
      gerarFn: async () => {
        calls += 1;
        return {
          content: '1. Iniciar plano de capacitação e',
          tokensEntrada: 10,
          tokensSaida: 5,
          stopReason: 'max_tokens',
          truncated: true
        };
      }
    });
    assert.equal(calls, 2);
    assert.equal(out.meta.qualidadeRetry, true);
    assert.ok(out.warning);
    assert.match(INSTRUCAO_RETRY_QUALIDADE, /mais conciso/);
    assert.equal(out.truncated, true);
    assert.equal(out.stopReason, 'max_tokens');
  });
});

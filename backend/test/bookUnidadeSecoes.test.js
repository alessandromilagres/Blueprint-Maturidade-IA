import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizarDimensoesFocoSatfInput, normalizarDimensoesFocoMitInput, resolverPapelDimensaoUnidade, blocoInstrucaoPapelDimensaoPrompt, PAPEIS_DIMENSAO_UNIDADE, normalizarDimensoesPapelInput } from '../src/utils/empresaUnidade.js';
import { dimensoesSecao3BookUnidade, dimensaoCorrespondeFocoUnidade } from '../src/utils/bookDadosDimensao.js';
import {
  construirMapaRenumeracaoSecoesPrincipaisSatfUnidade,
  renumerarSecoesPrincipaisBookSatfUnidade,
  removerSpilloverSecao3BookSatf,
  normalizarSecoesBookSatf,
  deduplicarSubsecoesRoadmapSatf,
  corrigirScoresOficiaisTabelaEvolucaoRoadmapSatf
} from '../src/utils/satfBookTaxonomia.js';
import { extrairEntradasIndiceMarkdown } from '../src/utils/markdownSlug.js';

describe('normalizarDimensoesFocoInput', () => {
  it('extrai D1,D3,D4,D7 do template GRT (SATF)', () => {
    assert.deepEqual(normalizarDimensoesFocoSatfInput('D1, D3, D4, D7'), ['D1', 'D3', 'D4', 'D7']);
  });

  it('extrai BP do MIT separado', () => {
    assert.deepEqual(normalizarDimensoesFocoMitInput('BP1, BP4, BP7'), ['BP1', 'BP4', 'BP7']);
  });

  it('exclui dimensões marcadas com prefixo -', () => {
    assert.deepEqual(normalizarDimensoesFocoSatfInput('D1, -D8, D4'), ['D1', 'D4']);
  });
});

describe('dimensaoCorrespondeFocoUnidade por nome', () => {
  it('resolve D1 pelo nome canônico mesmo sem codigoFramework/ordem', () => {
    const dim = { area: 'Estratégia & Postura de IA', score: 2.1 };
    assert.equal(dimensaoCorrespondeFocoUnidade(dim, ['D1'], 'satf'), true);
    assert.equal(dimensaoCorrespondeFocoUnidade(dim, ['D2'], 'satf'), false);
  });
});

describe('dimensoesSecao3BookUnidade', () => {
  const dimensoes = [
    { areaId: 1, area: 'D1', codigoFramework: 'D1', ordem: 1, score: 0 },
    { areaId: 3, area: 'D3', codigoFramework: 'D3', ordem: 3, score: 0 },
    { areaId: 4, area: 'D4', codigoFramework: 'D4', ordem: 4, score: 0 },
    { areaId: 7, area: 'D7', codigoFramework: 'D7', ordem: 7, score: 0 },
    { areaId: 10, area: 'D10', codigoFramework: 'D10', ordem: 10, score: 2.1 }
  ];
  const unidade = { dimensoesFocoSatf: '["D1","D3","D4","D7"]' };

  it('mantém dimensões em foco mesmo com score 0', () => {
    const filtradas = dimensoesSecao3BookUnidade(dimensoes, unidade);
    assert.equal(filtradas.length, 4);
    assert.deepEqual(filtradas.map((d) => d.codigoFramework), ['D1', 'D3', 'D4', 'D7']);
  });
});

describe('renumeracao secoes SATF por unidade', () => {
  it('mapeia Roadmap 4→4 e Próximos 8→5 (outline 1–5)', () => {
    const mapa = construirMapaRenumeracaoSecoesPrincipaisSatfUnidade(true, {
      dimensoesFocoSatf: '["D1","D3","D4","D7"]'
    });
    assert.equal(mapa.outlineUnidade, true);
    assert.deepEqual(mapa.canonParaSeq, { 4: 4, 8: 5 });
  });

  it('renumera heading canônico 8→5 no markdown', () => {
    const mapa = construirMapaRenumeracaoSecoesPrincipaisSatfUnidade(true, {});
    const md = `# 1. METODOLOGIA
# 2. SUMÁRIO EXECUTIVO
# 3. DIAGNÓSTICO
## 3.1 Dimensão — D1
# 4. ROADMAP
### 4.1 Visão
# 8. Próximos Passos
### 8.1 Ações`;
    const out = renumerarSecoesPrincipaisBookSatfUnidade(md, mapa);
    assert.match(out, /^# 4\. ROADMAP/m);
    assert.match(out, /^### 4\.1 Visão/m);
    assert.match(out, /^# 5\. Próximos Passos/m);
    assert.match(out, /^### 5\.1 Ações/m);
    assert.doesNotMatch(out, /^# 8\./m);
  });

  it('índice SATF unidade fica 1,2,3,4,5 com dims 3.N', () => {
    const md = `# 1. METODOLOGIA SATF TI v3
# 2. SUMÁRIO EXECUTIVO
# 3. DIAGNÓSTICO POR DIMENSÃO (SATF TI v3)
## 3.1 Dimensão — Estratégia & Postura de IA — Score 1.59 · Nível 1
## 3.2 Dimensão — Governança, Risco & Conformidade — Score 1.59 · Nível 1
# 4. ROADMAP ENGENHARIA & PLATAFORMA
# 5. Próximos Passos e Encerramento`;
    const entradas = extrairEntradasIndiceMarkdown(md, { modo: 'satf' });
    const nums = entradas.filter((e) => e.level === 1).map((e) => parseInt(e.titulo, 10));
    assert.deepEqual(nums, [1, 2, 3, 4, 5]);
    const dims = entradas.filter((e) => e.level === 2).map((e) => e.tituloIndice || e.titulo);
    assert.match(dims[0], /^3\.1\b/);
    assert.match(dims[1], /^3\.2\b/);
  });

  it('não apaga ## 3.N sob # 3. DIAGNÓSTICO nem ## 2.N do sumário', () => {
    const md = `# 1. METODOLOGIA
# 2. SUMÁRIO EXECUTIVO
## 2.1 Panorama
texto sumário
# 3. DIAGNÓSTICO POR DIMENSÃO (SATF TI v3)
## 3.1 Dimensão — D1
### 3.1.1 Análise Diagnóstica
texto dim
# 4. ROADMAP
## 3.9 Dimensão — spillover indevido
# 5. Próximos Passos`;
    const out = normalizarSecoesBookSatf(md);
    assert.match(out, /^## 2\.1 Panorama/m);
    assert.match(out, /^# 3\. DIAGNÓSTICO/m);
    assert.match(out, /^## 3\.1 Dimensão — D1/m);
    assert.doesNotMatch(out, /## 3\.9 Dimensão — spillover/);
  });

  it('remove segunda sequência 4.2/4.3/4.4 após 4.5 no roadmap', () => {
    const md = `# 4. ROADMAP ENGENHARIA
### 4.1 Visão
ok
### 4.2 Horizonte 30 Dias
a
### 4.3 Horizonte 60 Dias
b
### 4.4 Horizonte 90 Dias
c
### 4.5 Tabela Resumo
resumo bom
### 4.2 Fase 60 dias
DUPLICADO
### 4.3 Fase 90 dias
DUPLICADO
### 4.4 Resumo de Evolução de Maturidade Esperada
| Dimensão SATF | Score atual (oficial) | Meta 90 dias |
| D3 — Pessoas | 2,2 | 2,8 |
# 5. Próximos Passos
acoes`;
    const out = deduplicarSubsecoesRoadmapSatf(md);
    assert.match(out, /### 4\.5 Tabela Resumo/);
    assert.match(out, /resumo bom/);
    assert.doesNotMatch(out, /Fase 60 dias/);
    assert.doesNotMatch(out, /Score atual \(oficial\)/);
    assert.doesNotMatch(out, /2,2/);
    assert.match(out, /# 5\. Próximos Passos/);
  });

  it('corrige Score atual (oficial) com scores do consolidado', () => {
    const md = `# 4. ROADMAP
### 4.4 Resumo de Evolução de Maturidade Esperada
| Dimensão SATF | Score atual (oficial) | Meta 90 dias | Alavanca |
| D3 — Pessoas, Cultura & Capacitação | 2,2 | 2,8 | Trilha |
| D5 — Plataforma, Arquitetura & Escala | 1,8 | 2,4 | Inventário |
# 5. Próximos`;
    const dims = [
      { area: 'Pessoas, Cultura & Capacitação', codigoFramework: 'D3', score: 1.25 },
      { area: 'Plataforma, Arquitetura & Escala', codigoFramework: 'D5', score: 1.0 }
    ];
    const out = corrigirScoresOficiaisTabelaEvolucaoRoadmapSatf(md, dims);
    assert.match(out, /D3[^\n]*\| 1,25 \|/);
    assert.match(out, /D5[^\n]*\| 1,00 \|/);
    assert.doesNotMatch(out, /\| 2,2 \|/);
    assert.doesNotMatch(out, /\| 1,8 \|/);
  });
});

describe('normalizacao book unidade Blueprint', () => {
  it('sanitiza chunk de dimensão removendo H1/H2 vazados e BP no heading', async () => {
    const { sanitizarChunkDimensaoBookUnidadeBlueprint, normalizarSecoesBookUnidadeBlueprint } =
      await import('../src/utils/bookUnidadeBlueprintNormalizar.js');
    const bruto = `# 4. Consolidação Estratégica e Roadmap
## 3.5 BP5 — Cultura e Gestão
### 3.5.1 Análise Diagnóstica
texto
# 12. Dimensão BP12 — Governança`;
    const out = sanitizarChunkDimensaoBookUnidadeBlueprint(bruto, {
      num: 5,
      nomeDimensao: 'Cultura e Gestão da Mudança',
      papelLabel: 'Proprietário'
    });
    assert.match(out, /^## 3\.5 Dimensão — Cultura e Gestão da Mudança \(Proprietário\)/m);
    assert.match(out, /### 3\.5\.1 Análise Diagnóstica/);
    assert.doesNotMatch(out, /^# 4\./m);
    assert.doesNotMatch(out, /BP5/);
    assert.doesNotMatch(out, /^# 12\./m);
  });

  it('deduplica dois #4 e remove 3.16 perdido sob o roadmap', async () => {
    const { normalizarSecoesBookUnidadeBlueprint } = await import(
      '../src/utils/bookUnidadeBlueprintNormalizar.js'
    );
    const md = `# 1. METODOLOGIA APLICADA (SysMap Blueprint IA)
## 1.1 Instrumento
# 2. SUMÁRIO EXECUTIVO
## 2.1 Panorama
# 3. DIAGNÓSTICO POR DIMENSÃO — UNIDADE Tech
## 3.1 Dimensão — Estratégia e Liderança
### 3.1.1 Análise
# 4. Consolidação Estratégica e Roadmap de Transformação
## 4.1 Visão Integrada dos Scores
## 3.16 — Eficácia de IA (MIT CISR)
# 4. ROADMAP ENGENHARIA 30-60-90 DIAS DA UNIDADE
## 4.1 Visão integrada
# 5. Próximos Passos e Encerramento
## 5.1 Ações
# 12. Dimensão BP12 — Governança de Dados`;
    const out = normalizarSecoesBookUnidadeBlueprint(md);
    const h1Fours = [...out.matchAll(/^# 4\.\s+(.+)$/gm)].map((m) => m[1]);
    assert.equal(h1Fours.length, 1);
    assert.match(h1Fours[0], /ROADMAP/i);
    assert.doesNotMatch(out, /## 3\.16/);
    assert.doesNotMatch(out, /^# 12\./m);
    const entradas = extrairEntradasIndiceMarkdown(out, { modo: 'unidade' });
    const nums = entradas.filter((e) => e.level === 1).map((e) => parseInt(e.titulo, 10));
    assert.deepEqual(nums, [1, 2, 3, 4, 5]);
  });
});

describe('papel dimensao unidade', () => {
  it('normaliza mapa SATF proprietario/consumidor', () => {
    const mapa = normalizarDimensoesPapelInput(
      { D1: 'proprietario', D4: 'consumer', D7: 'nao_se_aplica' },
      { prefixo: 'D' }
    );
    assert.equal(mapa.D1, PAPEIS_DIMENSAO_UNIDADE.PROPRIETARIO);
    assert.equal(mapa.D4, PAPEIS_DIMENSAO_UNIDADE.CONSUMIDOR);
    assert.equal(mapa.D7, PAPEIS_DIMENSAO_UNIDADE.NAO_SE_APLICA);
  });

  it('resolve papel e gera prompt só para proprietario/consumidor', () => {
    const unidade = {
      nome: 'GRT',
      dimensoesPapelSatf: JSON.stringify({ D1: 'consumidor', D4: 'proprietario' })
    };
    assert.equal(
      resolverPapelDimensaoUnidade(unidade, { codigoFramework: 'D1' }, 'satf'),
      PAPEIS_DIMENSAO_UNIDADE.CONSUMIDOR
    );
    assert.equal(
      resolverPapelDimensaoUnidade(unidade, { codigoFramework: 'D8' }, 'satf'),
      PAPEIS_DIMENSAO_UNIDADE.NAO_SE_APLICA
    );
    assert.match(
      blocoInstrucaoPapelDimensaoPrompt({
        papel: 'proprietario',
        unidadeNome: 'GRT',
        nomeDimensao: 'Engenharia'
      }),
      /PROPRIETÁRIO/
    );
    assert.equal(
      blocoInstrucaoPapelDimensaoPrompt({ papel: 'nao_se_aplica' }),
      ''
    );
  });
});

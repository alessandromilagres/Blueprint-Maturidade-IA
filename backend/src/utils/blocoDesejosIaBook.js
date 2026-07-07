import {
  desejosIaParaRespostasEmail,
  desejosIaTemRespostasGuardadas
} from './desejosIaAvaliacaoMaturidade.js';

/** Pistas de quais perguntas de Desejos IA priorizar por dimensão (Seção 3). */
const AFINIDADE_DESEJOS_POR_DIMENSAO = {
  'Estratégia e Liderança':
    'ambição de negócio em 2 anos (P1), vantagem competitiva e mensagem à liderança (P5)',
  'Dados e Tecnologia':
    'agilidade com dados em tempo real (P1), use cases prioritários (P3) e travas técnicas (P4)',
  'Governança e Risco':
    'travas de adoção (P4), riscos citados e conformidade implícita nas dores (P2)',
  'Pessoas e Cultura':
    'talentos e experiência (P1), travas culturais e capacitação (P4)',
  'Operações e Processos':
    'custo, qualidade e agilidade operacional (P1), dores da área (P2) e use cases (P3)',
  'Inovação e Experimentação':
    'use cases prioritários 12 meses (P3), pilotos citados e mensagem à liderança (P5)',
  'Valor de Negócio e ROI':
    'resultados de negócio desejados (P1), ROI implícito nas dores (P2) e use cases (P3)',
  'Ecossistema e Parcerias':
    'use cases e parcerias implícitas (P3), aceleradores externos (P4)',
  'Valor por Unidade de Negócio':
    'dores por área (P2), use cases por BU (P3) e receita/forecast (P1)',
  'Talentos e Capacidades':
    'retenção e experiência de talentos (P1), travas de capacitação (P4)',
  'Conformidade Regulatória':
    'travas regulatórias (P4), riscos nas dores (P2) e mensagem à liderança (P5)',
  'Prontidão para Mudança':
    'travas e aceleradores de adoção (P4), cultura e mensagem à liderança (P5)',
  'Plataforma e Industrialização de IA':
    'use cases prioritários (P3), industrialização implícita nas dores (P2) e agilidade (P1)',
  'IA como Gerador de Receita':
    'receita e vantagem competitiva (P1), use cases comerciais (P3)',
  'Maturidade por Tipo de IA':
    'use cases por tipo de IA (P3) e dores específicas (P2)',
  'Eficácia de IA (MIT CISR)':
    'resultados esperados (P1), use cases com impacto mensurável (P3) e KPIs implícitos (P5)',
  // SATF — fallback por nome parcial
  'Postura de IA e Estratégia': 'ambição (P1) e mensagem à liderança (P5)',
  'Governança, Risco e Conformidade': 'travas (P4) e riscos (P2)',
  'Pessoas, Cultura e Capacitação': 'talentos (P1) e travas culturais (P4)',
  'Engenharia e Padrões de Desenvolvimento': 'use cases (P3) e dores técnicas (P2)',
  'Plataforma, Arquitetura e Escala': 'use cases (P3), agilidade (P1) e travas (P4)',
  'Dados, Contexto e Conhecimento': 'agilidade com dados (P1) e use cases (P3)',
  'Segurança, Qualidade e QA Integrada': 'travas (P4) e qualidade (P1)',
  'Modernização e Sustentação de Legado': 'dores operacionais (P2) e use cases (P3)',
  'FinOps, Valor e Apoio ao Negócio': 'custo/receita (P1) e ROI (P3)',
  'Fábrica Agêntica de Software': 'use cases de produtividade (P3) e dores (P2)',
  'Conformidade Regulatoria de IA': 'travas regulatórias (P4) e riscos (P2)'
};

function clipTexto(s, max = 1200) {
  const t = String(s || '').trim();
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function payloadDesejos(avaliacao) {
  return avaliacao?.desejosIADados?.payload ?? avaliacao?.desejosIA ?? null;
}

export function projetoTemDesejosIaCadastrados(avaliacoesFiltradas = []) {
  return (avaliacoesFiltradas || []).some((av) =>
    desejosIaTemRespostasGuardadas(payloadDesejos(av))
  );
}

function rotuloAvaliador(av) {
  const nome = av?.usuario?.nome || av?.usuario?.email || `Avaliação #${av?.id}`;
  const cargo = av?.usuario?.cargo ? ` (${av.usuario.cargo})` : '';
  return `${nome}${cargo}`;
}

/**
 * Consolida Desejos IA das avaliações filtradas para injeção no dadosBlock do book.
 * @returns {string} Markdown ou string vazia se ninguém respondeu
 */
export function blocoDesejosIaMarkdown(avaliacoesFiltradas = []) {
  const entradas = [];
  for (const av of avaliacoesFiltradas || []) {
    const payload = payloadDesejos(av);
    if (!desejosIaTemRespostasGuardadas(payload)) continue;
    const linhas = desejosIaParaRespostasEmail(payload);
    if (!linhas.length) continue;
    entradas.push({ av, linhas });
  }
  if (!entradas.length) return '';

  const total = entradas.length;
  const linhasMd = entradas
    .map(({ av, linhas }) => {
      const blocoLinhas = linhas
        .map((l) => {
          const obs = l.observacoes ? `\n  - *Comentário:* ${clipTexto(l.observacoes, 600)}` : '';
          return `- **${l.pergunta.split('|')[0].trim()}:** ${clipTexto(l.textoResposta, 900)}${obs}`;
        })
        .join('\n');
      return `### ${rotuloAvaliador(av)}\n${blocoLinhas}`;
    })
    .join('\n\n');

  return `## Desejos IA — visão de futuro dos avaliadores (${total} resposta${total > 1 ? 's' : ''})

Bloco **opcional** preenchido ao final do questionário de maturidade. **Não altera scores** — use como **voz do negócio** para personalizar diagnóstico, riscos e **Recomendações Específicas** na Seção 3.

${linhasMd}

**Como usar na Seção 3:** quando houver desejo, dor ou use case alinhado à dimensão analisada, cite-o explicitamente nas subseções de Análise Diagnóstica, Risco e **Recomendações Específicas** (ex.: "Conforme Desejos IA — [avaliador]: …"). Não invente desejos não listados acima.`;
}

function afinidadeDimensao(dimArea) {
  const nome = String(dimArea || '').trim();
  if (AFINIDADE_DESEJOS_POR_DIMENSAO[nome]) return AFINIDADE_DESEJOS_POR_DIMENSAO[nome];
  const parcial = Object.entries(AFINIDADE_DESEJOS_POR_DIMENSAO).find(([k]) =>
    nome.toLowerCase().includes(k.toLowerCase().slice(0, 12))
  );
  return parcial?.[1] || 'dores (P2), use cases (P3) e travas/aceleradores (P4) relevantes ao tema da dimensão';
}

/** Regra no system prompt do book quando há Desejos IA. */
export function blocoInstrucoesDesejosIaSistemaBook() {
  return `
16. **Desejos IA (Seção 3 — CRÍTICO quando o bloco estiver nos DADOS):** respostas opcionais dos avaliadores sobre ambição, dores, use cases e travas. **Não** substituem scores Likert — **ancoram** recomendações. Em **cada dimensão**, na subseção **Recomendações Específicas**, inclua **≥1 ação** que referencie explicitamente um desejo/dor/use case dos DADOS quando houver afinidade temática. Cite o avaliador ou "Desejos IA — consenso" quando vários convergirem. Se nada for pertinente à dimensão, escreva uma linha: "Desejos IA: nenhum item diretamente aplicável a esta dimensão."`;
}

export function blocoInstrucoesDesejosIaSistemaExecutivo() {
  return `
10. **Desejos IA:** quando o bloco estiver nos dados, use ambição, dores e use cases dos avaliadores para enriquecer Seções 2 (diagnóstico) e 4 (roadmap) — cite explicitamente quando relevante.`;
}

/** Instruções por dimensão na Seção 3 quando há Desejos IA. */
export function blocoInstrucoesDesejosIaSecao3Dimensao(dimArea, temDesejos) {
  if (!temDesejos) return '';
  return `
## DESEJOS IA — REFERÊNCIA PARA ESTA DIMENSÃO

Dimensão: **${dimArea}**. Priorize desejos sobre: ${afinidadeDimensao(dimArea)}.

**Obrigatório em Recomendações Específicas (### … .5 ou ### … .6):**
- Pelo menos **1 recomendação** deve citar um item concreto do bloco "Desejos IA" dos DADOS (dor, use case, trava ou ambição), conectando-o ao gap/score desta dimensão.
- Formato sugerido: *"Desejos IA — [tema]: [citação resumida] → ação [número] …"*
- Se aplicável, mencione também na **Análise Diagnóstica** ou **Risco** como evidência qualitativa complementar às perguntas [Qn].

**Proibido:** inventar desejos não listados no bloco Desejos IA dos DADOS.

---
`;
}

/** Resumo compacto para relatório executivo. */
export function blocoDesejosIaResumoExecutivo(avaliacoesFiltradas = []) {
  const bloco = blocoDesejosIaMarkdown(avaliacoesFiltradas);
  if (!bloco) return '';
  return bloco;
}

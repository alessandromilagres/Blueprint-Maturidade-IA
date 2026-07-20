/**
 * Taxonomia canônica SATF TI v3 — regras, validação e blocos auxiliares do book IA.
 */
import { SATF_FRAMEWORK_SEED } from '../data/satfFrameworkSeed.js';
import { ORDEM_DIMENSOES_FRAMEWORK } from './ordemDimensoesFramework.js';
import {
  tabelaPerguntasDimensaoMarkdown,
  dimensaoComScoreZero,
  aplicarNumSecaoRotuloDimensao
} from './bookModoRapidoMarkdown.js';
import { codigoEfetivoDimensaoFramework } from './bookDadosDimensao.js';
import { blocoInstrucaoFecharFrasePrompt } from './bookSecaoQualidade.js';

/** Dimensões oficiais SATF (código + nome). */
export const SATF_DIMENSOES_CANONICAS = SATF_FRAMEWORK_SEED.map((d) => ({
  codigo: d.codigoFramework,
  nome: d.nome
}));

/** Nomes das 16 dimensões Blueprint — proibidos como estrutura no book SATF. */
const NOMES_BLUEPRINT = ORDEM_DIMENSOES_FRAMEWORK;

/** Padrões adicionais que a IA costuma alucinar fora do SATF. */
const ALUCINACOES_COMUNS = [
  'Engenharia de Dados e DataOps',
  'Engenharia de Dados',
  'Arquitetura & Infraestrutura de IA',
  'Arquitetura e Infraestrutura de IA',
  'Produto & Experiência com IA',
  'Produto e Experiência com IA',
  'Gestão de Fornecedores e Parceiros',
  'Gestão de Fornecedores',
  'Impacto no Negócio',
  'Engenharia de IA e MLOps',
  'Inovação e Experimentação',
  'Ecossistema e Parcerias',
  'Valor por Unidade de Negócio',
  'Prontidão para Mudança',
  'IA como Gerador de Receita',
  'Maturidade por Tipo de IA',
  'Eficácia de IA (MIT CISR)',
  'Plataforma e Industrialização de IA',
  'Operações e Processos',
  'Valor de Negócio e ROI',
  'Talentos e Capacidades',
  'Dados e Tecnologia',
  'Governança e Risco',
  'Pessoas e Cultura',
  'Estratégia e Liderança',
  'Conformidade Regulatória'
];

function escRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Padrões de contaminação para validação pós-geração. */
export const PADROES_CONTAMINACAO_SATF = [
  ...NOMES_BLUEPRINT.map((nome) => ({
    nome: `Dimensão Blueprint: ${nome}`,
    regex: new RegExp(
      `(?:^|[#*\\-]|\\bD\\d{1,2}\\s*[—–-]\\s*)${escRegex(nome)}`,
      'gim'
    )
  })),
  ...ALUCINACOES_COMUNS.filter((n) => !NOMES_BLUEPRINT.includes(n)).map((nome) => ({
    nome: `Taxonomia genérica: ${nome}`,
    regex: new RegExp(`\\b${escRegex(nome)}\\b`, 'gi')
  })),
  {
    nome: '16 dimensões do framework',
    regex: /\b16\s+dimens(?:õ|o)es\b/gi
  },
  {
    nome: 'MIT CISR como metodologia principal',
    regex: /(?:metodologia|framework|modelo|instrumento)[^.\\n]{0,40}\bMIT CISR\b/gi
  },
  {
    nome: 'Seções Blueprint (9–13)',
    regex: /^#\s+(?:9|10|11|12|13)\.\s/gm
  },
  {
    nome: 'SysMap Blueprint IA como framework principal',
    regex: /(?:metodologia|framework|instrumento)[^.\\n]{0,40}SysMap Blueprint IA/gi
  }
];

export function blocoTaxonomiaObrigatoriaSatfMarkdown(dimensoesDiagnostico = []) {
  const linhas = SATF_DIMENSOES_CANONICAS.map((d) => {
    const diag = dimensoesDiagnostico.find((x) => String(x.area || '').trim() === d.nome);
    const score =
      diag && Number(diag.score) > 0 ? ` — score oficial ${Number(diag.score).toFixed(2)}` : '';
    const peso =
      d.codigo === 'D10'
        ? ' · *fora da média geral*'
        : d.codigo === 'D2' || d.codigo === 'D7' || d.codigo === 'D11'
          ? ' · peso 2×'
          : '';
    return `- **${d.codigo}** — ${d.nome}${score}${peso}`;
  }).join('\n');

  return `## Taxonomia SATF TI v3 (OBRIGATÓRIA — única permitida no documento)

Este book usa **exclusivamente** as 11 dimensões abaixo. **Proibido** citar as 16 dimensões Blueprint, nomes genéricos de maturidade enterprise ou MIT CISR como estrutura principal.

${linhas}

**Formato ao citar dimensão:** **D8 — Modernização & Sustentação de Legado** (código + nome oficial SATF).
**Estrutura do book:** seções **1 a 8** apenas — não gere seções 9–13 do book Blueprint.`;
}

export function blocoRegrasTaxonomiaSatfPrompt() {
  const lista = SATF_DIMENSOES_CANONICAS.map((d) => `${d.codigo}: ${d.nome}`).join('; ');
  return `
REGRAS DE TAXONOMIA SATF (CRÍTICO — NUNCA VIOLAR):
- Use **somente** estas dimensões: ${lista}.
- **Proibido** dimensões Blueprint (16), nomes como "Engenharia de Dados", "Produto & Experiência com IA", "Impacto no Negócio", etc.
- **Proibido** MIT CISR / SysMap Blueprint IA como metodologia ou estrutura principal — o instrumento é **SATF TI v3**.
- Ao referenciar dimensão: **Dn — Nome oficial SATF** (ex.: **D5 — Plataforma, Arquitetura & Escala**).
- Book SATF tem seções **1–8**; não duplique numeração nem gere capítulos 9–13.
- **Uma seção por chunk:** se o prompt pede só a seção 4, **pare** antes de "# 5."; nunca antecipe seções 5–8 dentro de chunks anteriores.
- **Hierarquia de títulos Markdown:** \`# N.\` = seções principais 1–8; \`## 3.N Dimensão — …\` = somente cabeçalhos de dimensão na seção 3; \`### N.M\` = subseções (ex.: ### 1.1, ### 4.2, ### 5.1). **Não** use \`##\` para subseções fora da seção 3.
${blocoInstrucaoFecharFrasePrompt()}
`;
}

/** Última seção permitida por id de chunk (recorte pós-IA). */
const SECAO_MAX_POR_CHUNK_SATF = {
  sec_1: 1,
  sec_1_2: 2,
  sec_2: 2,
  sec_3: 3,
  sec_4: 4,
  sec_4_tabela: 4,
  sec_4b: 4,
  sec_5: 5,
  sec_6: 6,
  sec_7: 7,
  sec_8: 8
};

/**
 * Recorta spillover: chunks que pedem só seção N não devem incluir # N+1 em diante.
 * Também corta `## N+1` quando a IA usa h2 como nova seção principal.
 */
export function recortarConteudoChunkBookSatf(conteudo, chunkId) {
  const maxSec = SECAO_MAX_POR_CHUNK_SATF[String(chunkId || '')];
  if (!maxSec) return String(conteudo || '').trim();

  const texto = String(conteudo || '').trim();
  if (!texto) return texto;

  const linhas = texto.split('\n');
  const saida = [];
  let cortou = false;

  for (const linha of linhas) {
    if (cortou) continue;
    const m = linha.match(/^#{1,2}\s+(\d+)\.\s+/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxSec) {
        cortou = true;
        continue;
      }
    }
    saida.push(linha);
  }

  return saida.join('\n').trim();
}

/**
 * Remove blocos duplicados de seções finais (h1 `# N.`).
 * Só deduplica 4–8 (roadmap em diante). A Seção 3 (Diagnóstico) NÃO entra —
 * senão o book por unidade perde o capítulo inteiro.
 */
export function deduplicarSecoesFinaisBookSatf(markdown) {
  const linhas = String(markdown || '').split('\n');
  const blocos = [];
  let blocoAtual = { sec: null, linhas: [] };

  const flush = () => {
    if (blocoAtual.linhas.length) blocos.push(blocoAtual);
    blocoAtual = { sec: null, linhas: [] };
  };

  for (const linha of linhas) {
    const m = linha.match(/^#\s+(\d+)\.\s+/);
    if (m) {
      flush();
      blocoAtual = { sec: parseInt(m[1], 10), linhas: [linha] };
    } else {
      blocoAtual.linhas.push(linha);
    }
  }
  flush();

  const vistos = new Set();
  const saida = [];
  for (const b of blocos) {
    // Só seções pós-diagnóstico (roadmap/fábrica/capacitação/próximos).
    if (b.sec != null && b.sec >= 4 && b.sec <= 8) {
      if (vistos.has(b.sec)) continue;
      vistos.add(b.sec);
    }
    saida.push(...b.linhas);
  }

  return saida.join('\n').trim();
}

/**
 * Remove headings ## 3.N gerados indevidamente fora do Diagnóstico (spillover).
 * Não mexe em ## 2.N (subseções do Sumário Executivo).
 */
export function removerSpilloverSecao3BookSatf(markdown) {
  const linhas = String(markdown || '').split('\n');
  const saida = [];
  let dentroDiagnostico = false;

  for (const linha of linhas) {
    const t = linha.trim();
    if (/^#\s+3\.\s+DIAGNÓSTICO/i.test(t)) {
      dentroDiagnostico = true;
      saida.push(linha);
      continue;
    }
    if (/^#\s+\d+\.\s+/.test(t) && !/^#\s+3\.\s+DIAGNÓSTICO/i.test(t)) {
      dentroDiagnostico = false;
      saida.push(linha);
      continue;
    }
    if (!dentroDiagnostico && /^##\s+3\.\d+\s+/i.test(t)) {
      continue;
    }
    saida.push(linha);
  }
  return saida.join('\n').trim();
}

/**
 * Detecta seções 5–8 repetidas no índice/corpo (h1 `# N.`).
 */
export function validarSecoesDuplicadasBookSatf(markdown) {
  const contagem = { 5: 0, 6: 0, 7: 0, 8: 0 };
  const titulos = { 5: [], 6: [], 7: [], 8: [] };
  const h1Re = /^#\s+(\d+)\.\s+(.+)$/gm;

  for (const m of String(markdown || '').matchAll(h1Re)) {
    const n = parseInt(m[1], 10);
    if (n >= 5 && n <= 8) {
      contagem[n] += 1;
      titulos[n].push(String(m[2]).trim().slice(0, 80));
    }
  }

  const duplicadas = Object.entries(contagem)
    .filter(([, c]) => c > 1)
    .map(([n, c]) => ({ secao: parseInt(n, 10), count: c, titulos: titulos[n] }));

  return {
    ok: duplicadas.length === 0,
    duplicadas,
    total: duplicadas.reduce((acc, d) => acc + d.count - 1, 0)
  };
}

/**
 * Remove segunda sequência de subseções do Roadmap (ex.: após ### 4.5, a IA
 * reemite ### 4.2/4.3/4.4 com "Fase 60/90" e tabela de evolução inventada).
 * Mantém a primeira passagem 4.1→4.5; descarta regressão de numeração.
 */
export function deduplicarSubsecoesRoadmapSatf(markdown, { secaoRoadmap = 4 } = {}) {
  const nRoadmap = Number(secaoRoadmap) || 4;
  const linhas = String(markdown || '').split('\n');
  const saida = [];
  let naSecaoRoadmap = false;
  const vistos = new Set();
  let pulandoRegressao = false;
  const headingSub = new RegExp(`^#{2,4}\\s+${nRoadmap}\\.(\\d+)\\b`);
  const headingMain = /^#\s+(\d+)\.\s+/;

  for (const linha of linhas) {
    const mMain = linha.match(headingMain);
    if (mMain) {
      const n = parseInt(mMain[1], 10);
      naSecaoRoadmap = n === nRoadmap;
      vistos.clear();
      pulandoRegressao = false;
      saida.push(linha);
      continue;
    }

    if (!naSecaoRoadmap) {
      saida.push(linha);
      continue;
    }

    const mSub = linha.match(headingSub);
    if (mSub) {
      const sub = parseInt(mSub[1], 10);
      const maxVisto = vistos.size ? Math.max(...vistos) : 0;
      const regressao =
        vistos.has(sub) || (maxVisto >= 4 && sub < maxVisto && vistos.has(maxVisto));
      if (regressao) {
        pulandoRegressao = true;
        continue;
      }
      pulandoRegressao = false;
      vistos.add(sub);
      saida.push(linha);
      continue;
    }

    if (pulandoRegressao) continue;
    saida.push(linha);
  }

  return saida.join('\n').trim();
}

/**
 * Mapa Dn → score oficial (>0) a partir do consolidado do diagnóstico.
 */
export function mapaScoresOficiaisPorCodigoSatf(dimensoes = []) {
  const map = new Map();
  for (const d of dimensoes || []) {
    if (dimensaoComScoreZero(d)) continue;
    const cod = String(codigoEfetivoDimensaoFramework(d, 'satf') || '').toUpperCase();
    if (!/^D\d{1,2}$/.test(cod)) continue;
    const score = Number(d.score ?? d.scoreOficial ?? 0);
    if (!Number.isFinite(score) || score <= 0) continue;
    map.set(cod, score);
  }
  return map;
}

function formatarScoreCelulaComoExistente(valor, celulaAtual) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return String(celulaAtual || '');
  const fixed = n.toFixed(2);
  return String(celulaAtual || '').includes(',') ? fixed.replace('.', ',') : fixed;
}

function cabecalhoAtivaCorrecaoScoreAtual(linha) {
  const t = String(linha || '');
  return (
    /Score\s+[Aa]tual(\s*\(\s*oficial\s*\))?/i.test(t) ||
    /Resumo de Evolu[cç][aã]o de Maturidade/i.test(t) ||
    /Consolida[cç][aã]o de Metas/i.test(t) ||
    /Depend[eê]ncias?\s+Cr[ií]ticas?/i.test(t)
  );
}

function cabecalhoMantemTabelaScoreAtual(linha) {
  return /Evolu[cç][aã]o|Score\s+[Aa]tual|Consolida[cç][aã]o de Metas|Depend[eê]ncias?\s+Cr[ií]ticas?/i.test(
    String(linha || '')
  );
}

/**
 * Neutraliza dependência crítica que cita Cursor Enterprise já aprovado como bloqueio pendente.
 */
function sanitizarDependenciaCursorJaAprovado(linha) {
  if (!/Cursor/i.test(linha) || !/aprovad/i.test(linha)) return linha;
  // Só age em linhas de tabela com Dn
  if (!/^\|\s*D\d{1,2}\b/i.test(linha)) return linha;
  return linha.replace(
    /(\|\s*)([^|]*Cursor[^|]*)(\s*\|?\s*)$/i,
    (full, pre, celula, pos) => {
      const c = String(celula || '').trim();
      if (!/Cursor/i.test(c) || !/aprovad/i.test(c)) return full;
      if (!/depend|bloque|cr[ií]tic|pendente|aprova[cç]/i.test(c) && c.split(/\s+/).length > 12) {
        return full;
      }
      return `${pre}Cursor Enterprise já aprovado (não bloqueia)${pos}`;
    }
  );
}

/**
 * Corrige colunas "Score atual (oficial)" / "Score Atual" em tabelas de evolução
 * e "Consolidação de Metas" do roadmap, forçando scores do consolidado.
 */
export function corrigirScoresOficiaisTabelaEvolucaoRoadmapSatf(markdown, dimensoes = []) {
  const scores = mapaScoresOficiaisPorCodigoSatf(dimensoes);
  if (!scores.size) return String(markdown || '');

  const linhas = String(markdown || '').split('\n');
  const saida = [];
  let emTabelaEvolucao = false;
  let idxScoreAtual = -1;

  for (const linha of linhas) {
    if (cabecalhoAtivaCorrecaoScoreAtual(linha)) {
      emTabelaEvolucao = true;
      idxScoreAtual = -1;
      if (linha.trim().startsWith('|')) {
        const cells = linha.split('|').slice(1, -1).map((c) => c.trim());
        idxScoreAtual = cells.findIndex((c) => /Score\s+[Aa]tual/i.test(c));
      }
    }

    if (/^#\s+\d+\.\s+/.test(linha)) {
      emTabelaEvolucao = false;
      idxScoreAtual = -1;
    } else if (
      emTabelaEvolucao &&
      /^#{2,4}\s+\d+\.\d+\b/.test(linha) &&
      !cabecalhoMantemTabelaScoreAtual(linha)
    ) {
      emTabelaEvolucao = false;
      idxScoreAtual = -1;
    }

    if (emTabelaEvolucao && linha.trim().startsWith('|')) {
      const cells = linha.split('|').slice(1, -1).map((c) => c.trim());
      if (cells.length && cells.every((c) => /^:?-{3,}:?$/.test(c.replace(/\s/g, '')))) {
        saida.push(linha);
        continue;
      }
      if (cells.some((c) => /Score\s+[Aa]tual/i.test(c))) {
        idxScoreAtual = cells.findIndex((c) => /Score\s+[Aa]tual/i.test(c));
        saida.push(linha);
        continue;
      }

      const mDim = (cells[0] || '').match(/^(D\d{1,2})\b/i);
      if (mDim && scores.has(mDim[1].toUpperCase())) {
        const cod = mDim[1].toUpperCase();
        const scoreIdx = idxScoreAtual >= 1 ? idxScoreAtual : 1;
        if (cells[scoreIdx] != null && /[\d]/.test(cells[scoreIdx])) {
          cells[scoreIdx] = formatarScoreCelulaComoExistente(scores.get(cod), cells[scoreIdx]);
          let corrigida = `| ${cells.join(' | ')} |`;
          corrigida = sanitizarDependenciaCursorJaAprovado(corrigida);
          saida.push(corrigida);
          continue;
        }
      }

      // Fallback: padrão legado Dimensão|Score logo após o nome
      const m = linha.match(
        /^(\|\s*)(D\d{1,2})(\s*[—–-]\s*[^|]*\|\s*)([\d]+[.,]\d+|\d+)(\s*\|.*)$/i
      );
      if (m) {
        const cod = m[2].toUpperCase();
        if (scores.has(cod)) {
          const fmt = formatarScoreCelulaComoExistente(scores.get(cod), m[4]);
          let corrigida = `${m[1]}${m[2]}${m[3]}${fmt}${m[5]}`;
          corrigida = sanitizarDependenciaCursorJaAprovado(corrigida);
          saida.push(corrigida);
          continue;
        }
      }
    }

    saida.push(linha);
  }

  return saida.join('\n');
}

/** Aplica recorte por chunk + deduplicação global das seções finais + anti-regressão do roadmap. */
export function normalizarSecoesBookSatf(markdown) {
  return deduplicarSubsecoesRoadmapSatf(
    removerSpilloverSecao3BookSatf(deduplicarSecoesFinaisBookSatf(String(markdown || '').trim()))
  );
}

/**
 * Outline fixo do book SATF por unidade:
 * 1 Metodologia · 2 Sumário · 3 Diagnóstico (3.1–3.N, só foco) · 4 Roadmap · 5 Próximos · Apêndices.
 * Sem Seção 0 dashboard; sem seções dedicadas D10/D11/Capacitação.
 * Mapa canônico enterprise → unidade: Roadmap 4→4, Próximos 8→5.
 * @returns {{ canonParaSeq: Record<number, number>, outlineUnidade: true } | null}
 */
export function construirMapaRenumeracaoSecoesPrincipaisSatfUnidade(
  exigeUnidade,
  _unidadeMeta,
  _opts = {}
) {
  if (!exigeUnidade) return null;
  return {
    outlineUnidade: true,
    canonParaSeq: {
      4: 4,
      8: 5
    }
  };
}

/** Número efetivo da seção principal (canônica 4–8 → sequencial sem lacunas). */
export function numeroSecaoPrincipalSatfUnidade(canon, mapaRenumeracao) {
  const n = mapaRenumeracao?.canonParaSeq?.[canon];
  return n != null ? n : canon;
}

/**
 * Renumera títulos # N. e subseções ### N.M no corpo do book por unidade.
 * Usa placeholders em duas fases para evitar colisão em cascata (ex.: 8→4 depois 4→3).
 */
export function renumerarSecoesPrincipaisBookSatfUnidade(markdown, mapaRenumeracao) {
  const mapa = mapaRenumeracao?.canonParaSeq;
  if (!mapa) return String(markdown || '');

  let out = String(markdown || '');
  const canones = Object.keys(mapa)
    .map((k) => parseInt(k, 10))
    .filter((canon) => mapa[canon] !== canon)
    .sort((a, b) => b - a);

  const placeholders = new Map();
  for (const canon of canones) {
    const token = `__SEC_RENUM_${canon}__`;
    placeholders.set(token, mapa[canon]);
    out = out.replace(new RegExp(`^(#\\s+)${canon}(\\.\\s+)`, 'gm'), `$1${token}$2`);
    out = out.replace(new RegExp(`^(#{3,4}\\s+)${canon}(\\.\\d+)`, 'gm'), `$1${token}$2`);
  }
  for (const [token, seq] of placeholders) {
    out = out.split(token).join(String(seq));
  }
  return out;
}

export const NOME_DIMENSAO_D11_SATF = 'Conformidade Regulatória de IA';

export function encontrarDimensaoD11Satf(dimensoes = []) {
  return (
    dimensoes.find((d) => String(d.area || '').trim() === NOME_DIMENSAO_D11_SATF) ||
    dimensoes[10] ||
    null
  );
}

export function blocoSecao6D11FallbackMarkdown(d11) {
  const status = !d11
    ? 'Dimensão D11 ausente no consolidado — bloco de registro inserido automaticamente.'
    : d11.foraDeEscopo
      ? '**D11 desativada na configuração do projeto** — mantida no book SATF para registro e auditoria.'
      : dimensaoComScoreZero(d11)
        ? '**Sem avaliações consolidadas** nesta rodada — registro com perguntas do instrumento.'
        : 'Síntese regulatória D11 (fallback automático — regenere o book para análise completa pela IA).';

  const tabela = d11 ? tabelaPerguntasDimensaoMarkdown(d11) : '_Sem dados de perguntas D11._';

  return `# 6. Conformidade Regulatória de IA (D11)

### 6.1 Status e escopo
> ${status}

### 6.2 Registro de scores — D11
${tabela}

### 6.3 Governança e conformidade (LGPD, ISO 42001, NIST AI RMF)
Documentar SGAI, inventário de sistemas de IA, classificação de risco (PL 2.338/2023) e revisão humana de decisões automatizadas.

### 6.4 Próximos passos regulatórios
- Completar inventário e matriz de risco de sistemas de IA
- Formalizar base legal LGPD e participação do DPO
- Evidências de auditoria SGAI / ISO 42001 conforme maturidade declarada`;
}

export function blocoSecao311D11FallbackMarkdown(d11) {
  const numSecao = '3.11';
  const nome = NOME_DIMENSAO_D11_SATF;
  const cabecalho =
    d11 && !dimensaoComScoreZero(d11)
      ? `## ${numSecao} Dimensão — ${nome} — oficial ${Number(d11.score).toFixed(2)} · Nível ${d11.nivel}`
      : `## ${numSecao} Dimensão — ${nome} — Score 0 · Não analisada`;

  return `${cabecalho}

### ${numSecao}.1 Status da dimensão
> Bloco **D11** inserido automaticamente — regenere o book se faltar análise completa da IA.

### ${numSecao}.2 Registro de scores por pergunta
${d11 ? tabelaPerguntasDimensaoMarkdown(d11) : '_Sem perguntas D11 cadastradas._'}
`;
}

/** Garante Seção 6 (D11) no book SATF enterprise quando a IA omitir. Não usar em books por unidade. */
export function garantirSecoesD11BookSatf(markdown, dimensoesDiagnostico = [], opts = {}) {
  const { exigeUnidade = false } = opts;
  if (exigeUnidade) {
    return String(markdown || '').trim();
  }

  let out = String(markdown || '').trim();
  const d11 = encontrarDimensaoD11Satf(dimensoesDiagnostico);

  if (!/^#\s+6\.\s/m.test(out)) {
    const bloco6 = blocoSecao6D11FallbackMarkdown(d11);
    const idx7 = out.search(/^#\s+7\.\s/m);
    if (idx7 >= 0) {
      out = `${out.slice(0, idx7).trimEnd()}\n\n${bloco6}\n\n${out.slice(idx7)}`;
    } else {
      out = `${out.trimEnd()}\n\n${bloco6}`;
    }
  }

  return out;
}

export function introducaoSecao3SatfBookMarkdown(totalDimensoes, ordemNomes, { numPai = 3 } = {}) {
  const listaOrdem = ordemNomes.map((nome, idx) => `${idx + 1}. ${nome}`).join('\n');
  const n = Number(numPai) === 2 ? 2 : 3;
  return `# ${n}. DIAGNÓSTICO POR DIMENSÃO (SATF TI v3)

Este capítulo apresenta as **${totalDimensoes} dimensões** em escopo na ordem abaixo. Dimensões com **score 0** constam para análise quando forem do foco da unidade.

${listaOrdem}

**Numeração:** **${n}.N** = dimensão (##); **${n}.N.1** Análise Diagnóstica · **${n}.N.2** Evidências Críticas · **${n}.N.3** Risco de Negócio · **${n}.N.4** Benchmark Setorial · **${n}.N.5** Recomendações Específicas · **${n}.N.6** KPIs de Acompanhamento.

**Scores:** use o **score oficial** (certificado ou com teto por evidência). Quando o bloco DADOS indicar gap entre declarado e oficial, mencione na análise.

**Personalização:** quando houver bloco **Contexto do cliente** nos DADOS, cada dimensão deve citar entregáveis, sistemas, pilotos e métricas reais do projeto — no mesmo padrão de especificidade do book SATF (nunca genérico).`;
}

export function blocoDimensaoScoreZeroSecao3Satf(
  numSecao,
  dim,
  { isFirst = false, totalDimensoes = 11, ordemNomes = [], modoRapido = true, numPai = 3 } = {}
) {
  let md = '';
  if (isFirst) {
    md += `${introducaoSecao3SatfBookMarkdown(totalDimensoes, ordemNomes, { numPai })}\n\n`;
  }
  md += `${aplicarNumSecaoRotuloDimensao(numSecao, dim, { bookCompleto: !modoRapido })}\n\n`;
  md += `### ${numSecao}.1 Status da dimensão\n\n`;
  md += `> **Esta dimensão não será analisada** porque o score consolidado é **0** — não há avaliações consolidadas nesta rodada.\n\n`;
  md += `### ${numSecao}.2 Registro de scores por pergunta\n\n${tabelaPerguntasDimensaoMarkdown(dim)}\n`;
  return md;
}

function apendiceScoresPorPerguntaBookRapidoSatf(scoresPorArea, scoreGeral, nivel, nomesNivel) {
  const partes = scoresPorArea.map(
    (dim) => `#### ${dim.area}\n\n${tabelaPerguntasDimensaoMarkdown(dim)}`
  );
  const blocoFinal = [
    '#### Consolidado do projeto',
    '',
    '| Indicador | Valor |',
    '|:---|:---:|',
    `| **Score geral do projeto** | **${scoreGeral.toFixed(2)}** |`,
    `| **Nível de maturidade** | **${nivel} — ${nomesNivel[nivel - 1] || ''}** |`,
    '',
    '*Score geral SATF: média ponderada das dimensões núcleo (D10 fora da média). As 11 dimensões SATF TI v3 constam acima; dimensões com score 0 aparecem apenas para registro.*'
  ].join('\n');
  return `${partes.join('\n\n')}\n\n${blocoFinal}`;
}

/** Dados extras modo rápido — sem trajetória MIT nem referência a Seção 12 Blueprint. */
export function blocoDadosExtrasBookRapidoSatf({ scoresPorArea, scoreGeral, nivel, nomesNivel }) {
  const tabelasDim = scoresPorArea
    .map((dim) => `### Tabela — ${dim.area}\n\n${tabelaPerguntasDimensaoMarkdown(dim)}`)
    .join('\n\n');

  return `## Tabelas de scores por dimensão SATF (reproduza no book; **não remova a última linha** de cada tabela)

${tabelasDim}

## Apêndice — scores consolidados SATF (referência interna; **não** copie como seção 9+)

${apendiceScoresPorPerguntaBookRapidoSatf(scoresPorArea, scoreGeral, nivel, nomesNivel)}
`;
}

export function capaConfidencialBookSatfMarkdown(empresaNome = '', projetoNome = '') {
  const emp = String(empresaNome || '').trim() || 'Cliente';
  const proj = String(projetoNome || '').trim() || 'Projeto';
  return `> **CONFIDENCIAL** — ${emp} / ${proj}. Contém dados de assessment, clientes e projeções. Uso restrito; não distribuir sem autorização.\n\n---\n\n`;
}

/**
 * Valida se o book SATF contém referências a outra taxonomia.
 * @returns {{ ok: boolean, total: number, ocorrencias: Array<{ nome: string, count: number, exemplos: string[] }> }}
 */
export function validarTaxonomiaBookSatf(markdown) {
  const texto = String(markdown || '');
  const ocorrencias = [];

  const nomesSatf = SATF_DIMENSOES_CANONICAS.map((d) => d.nome);

  function indiceDentroNomeSatf(index, matchLen) {
    for (const nome of nomesSatf) {
      let pos = 0;
      while (pos < texto.length) {
        const idx = texto.indexOf(nome, pos);
        if (idx < 0) break;
        const fim = idx + nome.length;
        if (index >= idx && index + matchLen <= fim) return true;
        pos = idx + 1;
      }
    }
    return false;
  }

  for (const padrao of PADROES_CONTAMINACAO_SATF) {
    const matches = [];
    for (const m of texto.matchAll(padrao.regex)) {
      const idx = m.index ?? 0;
      const len = m[0]?.length ?? 0;
      if (!indiceDentroNomeSatf(idx, len)) {
        matches.push(m);
      }
    }
    if (matches.length > 0) {
      ocorrencias.push({
        nome: padrao.nome,
        count: matches.length,
        exemplos: matches.slice(0, 3).map((m) => String(m[0]).trim().slice(0, 120))
      });
    }
  }

  const total = ocorrencias.reduce((acc, o) => acc + o.count, 0);
  return { ok: total === 0, total, ocorrencias };
}

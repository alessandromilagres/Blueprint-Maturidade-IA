/**
 * Taxonomia canônica SATF TI v3 — regras, validação e blocos auxiliares do book IA.
 */
import { SATF_FRAMEWORK_SEED } from '../data/satfFrameworkSeed.js';
import { ORDEM_DIMENSOES_FRAMEWORK } from './ordemDimensoesFramework.js';
import { tabelaPerguntasDimensaoMarkdown, aplicarNumSecaoRotuloDimensao } from './bookModoRapidoMarkdown.js';

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
`;
}

/** Última seção permitida por id de chunk (recorte pós-IA). */
const SECAO_MAX_POR_CHUNK_SATF = {
  sec_1_2: 2,
  sec_4: 4,
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
 * Remove blocos duplicados de seções 5–8 (h1 `# N.`).
 * Mantém a primeira ocorrência de cada número.
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
    if (b.sec != null && b.sec >= 5 && b.sec <= 8) {
      if (vistos.has(b.sec)) continue;
      vistos.add(b.sec);
    }
    saida.push(...b.linhas);
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

/** Aplica recorte por chunk + deduplicação global das seções finais. */
export function normalizarSecoesBookSatf(markdown) {
  return deduplicarSecoesFinaisBookSatf(String(markdown || '').trim());
}

export function introducaoSecao3SatfBookMarkdown(totalDimensoes, ordemNomes) {
  const listaOrdem = ordemNomes.map((nome, idx) => `${idx + 1}. ${nome}`).join('\n');
  return `# 3. DIAGNÓSTICO POR DIMENSÃO (SATF TI v3)

Este capítulo apresenta as **${totalDimensoes} dimensões** do instrumento SATF TI v3 na ordem abaixo. Dimensões com **score 0** constam apenas para registro.

${listaOrdem}

**Numeração:** **3.N** = dimensão (##); **3.N.1**, **3.N.2**… = subseções (###).

**Scores:** use o **score oficial** (certificado ou com teto por evidência). Quando o bloco DADOS indicar gap entre declarado e oficial, mencione na análise.

**Personalização:** quando houver bloco **Contexto do cliente** nos DADOS, cada dimensão deve citar entregáveis, sistemas, pilotos e métricas reais do projeto — no mesmo padrão de especificidade do book SATF (nunca genérico).`;
}

export function blocoDimensaoScoreZeroSecao3Satf(
  numSecao,
  dim,
  { isFirst = false, totalDimensoes = 11, ordemNomes = [], modoRapido = true } = {}
) {
  let md = '';
  if (isFirst) {
    md += `${introducaoSecao3SatfBookMarkdown(totalDimensoes, ordemNomes)}\n\n`;
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

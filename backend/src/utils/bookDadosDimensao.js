/**
 * Dados isolados por dimensão para prompts de book IA —
 * evita enviar scores/perguntas de todas as dimensões em cada chunk.
 */
import {
  parseDimensoesFocoSatfJson,
  parseDimensoesFocoMitJson
} from './empresaUnidade.js';
import { dimensaoComScoreZero, tabelaPerguntasDimensaoMarkdown } from './bookModoRapidoMarkdown.js';
import { NOMES_NIVEL_BLUEPRINT } from './nivelMaturidadeRubrica.js';
import { nivelNumericoDeScore } from './scoresConsolidadoProjetoMaturidade.js';
import { ORDEM_DIMENSOES_FRAMEWORK } from './ordemDimensoesFramework.js';
import { SATF_FRAMEWORK_SEED } from '../data/satfFrameworkSeed.js';

function normalizarNomeDimensaoComparacao(nome) {
  return String(nome || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'e')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const SATF_NOME_PARA_CODIGO = new Map(
  SATF_FRAMEWORK_SEED.map((d) => [normalizarNomeDimensaoComparacao(d.nome), d.codigoFramework])
);
const MIT_NOME_PARA_CODIGO = new Map(
  ORDEM_DIMENSOES_FRAMEWORK.map((nome, idx) => [
    normalizarNomeDimensaoComparacao(nome),
    `BP${idx + 1}`
  ])
);

export function codigoEfetivoDimensaoFramework(dim, framework = 'satf') {
  const cod = String(dim?.codigoFramework || '').trim().toUpperCase();
  if (cod) return cod;
  if (dim?.ordem != null) {
    const o = Number(dim.ordem);
    if (framework === 'mit' && o >= 1 && o <= 16) return `BP${o}`;
    if (o >= 1 && o <= 11) return `D${o}`;
    if (o >= 1 && o <= 16) return `BP${o}`;
  }
  const nomeNorm = normalizarNomeDimensaoComparacao(dim?.area || dim?.nome);
  if (!nomeNorm) return '';
  if (framework === 'mit') return MIT_NOME_PARA_CODIGO.get(nomeNorm) || '';
  return SATF_NOME_PARA_CODIGO.get(nomeNorm) || '';
}

export function parseFocoUnidadePorFramework(unidadeMeta, framework = 'satf') {
  return framework === 'mit'
    ? parseDimensoesFocoMitJson(unidadeMeta)
    : parseDimensoesFocoSatfJson(unidadeMeta);
}

export function dimensaoCorrespondeFocoUnidade(dim, focoCodigos, framework = 'satf') {
  if (!focoCodigos?.length) return true;

  const cod = codigoEfetivoDimensaoFramework(dim, framework);
  if (cod && focoCodigos.includes(cod)) return true;

  for (const f of focoCodigos) {
    const m = /^D(\d{1,2})$/i.exec(String(f).trim());
    if (m && dim.ordem != null && Number(dim.ordem) === Number(m[1])) return true;
    if (m && cod === `D${m[1]}`) return true;
    const bp = /^BP(\d{1,2})$/i.exec(String(f).trim());
    if (bp && dim.ordem != null && Number(dim.ordem) === Number(bp[1])) return true;
    if (bp && cod === `BP${bp[1]}`) return true;
  }

  return false;
}

/** Filtra dimensões pelo cadastro de foco da unidade (D4, D5… / BP4…). Sem foco = todas. */
export function filtrarDimensoesFocoUnidade(dimensoes, unidadeMeta, framework = 'satf') {
  const foco = parseFocoUnidadePorFramework(unidadeMeta, framework);
  if (!foco?.length) return dimensoes || [];
  return (dimensoes || []).filter((d) => dimensaoCorrespondeFocoUnidade(d, foco, framework));
}

/** Dimensões em foco com score consolidado > 0 (ranking/plano de ação). */
export function filtrarDimensoesFocoUnidadeComDados(dimensoes, unidadeMeta, framework = 'satf') {
  return filtrarDimensoesFocoUnidade(dimensoes, unidadeMeta, framework).filter(
    (d) => !dimensaoComScoreZero(d)
  );
}

/**
 * Dimensões da Seção 3 em books por unidade — sempre o foco cadastrado,
 * mesmo quando o score individual da dimensão ainda não está discriminado.
 */
export function dimensoesSecao3BookUnidade(dimensoes, unidadeMeta, framework = 'satf') {
  if (!unidadeTemDimensoesFoco(unidadeMeta, framework)) return dimensoes || [];
  return filtrarDimensoesFocoUnidade(dimensoes, unidadeMeta, framework);
}

/** Índices (0-based) em `dimensoes` que permanecem após filtro de foco — null se todas. */
export function indicesDimensoesFocoUnidade(dimensoes, unidadeMeta, framework = 'satf') {
  const foco = parseFocoUnidadePorFramework(unidadeMeta, framework);
  if (!foco?.length) return null;
  const ids = new Set(filtrarDimensoesFocoUnidade(dimensoes, unidadeMeta, framework).map((d) => d.areaId));
  const indices = new Set();
  (dimensoes || []).forEach((d, idx) => {
    if (ids.has(d.areaId)) indices.add(idx);
  });
  return indices.size ? indices : null;
}

export function unidadeTemDimensoesFoco(unidadeMeta, framework = 'satf') {
  return Boolean(parseFocoUnidadePorFramework(unidadeMeta, framework)?.length);
}

export function detalhePerguntasUmaDimensaoMarkdown(dim, { maxPerguntas = 0 } = {}) {
  const perguntas = dim.perguntas || [];
  const lista = maxPerguntas > 0 ? perguntas.slice(0, maxPerguntas) : perguntas;
  if (!lista.length) return '- Nenhuma pergunta consolidada nesta dimensão.';
  return lista
    .map(
      (p) =>
        `- [Q${p.numero}] ${String(p.texto || '').substring(0, 160)}${String(p.texto || '').length > 160 ? '…' : ''} → ${
          p.totalRespostas > 0 ? p.score : '0'
        }`
    )
    .join('\n');
}

export function rotuloScoreDimensaoMarkdown(dim) {
  if (dimensaoComScoreZero(dim)) return '0 · sem dados consolidados';
  const oficial = Number(dim.score ?? dim.scoreOficial ?? 0).toFixed(2);
  const nivel = dim.nivel || nivelNumericoDeScore(dim.score);
  const decl =
    dim.scoreDeclarado != null && Math.abs(dim.scoreDeclarado - dim.score) > 0.05
      ? ` · declarado ${Number(dim.scoreDeclarado).toFixed(2)}`
      : '';
  const cert = dim.certificacao?.status ? ` · cert: ${dim.certificacao.status}` : '';
  return `${oficial} (N${nivel})${decl}${cert}`;
}

export function montarInstrucaoDadosSomenteDimensao(nomeDimensao) {
  return `> **Dados deste chunk:** use **somente** scores, perguntas [Qn] e evidências da dimensão **${nomeDimensao}** abaixo. **Não** invente nem extrapole dados de outras dimensões.`;
}

export function montarBlocoDadosDimensaoUnica(dim, {
  scoreGeral = null,
  mediaSetor = null,
  unidadeNome = null
} = {}) {
  const cod = dim.codigoFramework ? ` (${dim.codigoFramework})` : '';
  const linhas = [
    montarInstrucaoDadosSomenteDimensao(dim.area),
    '',
    `## Dimensão: ${dim.area}${cod}`,
    `- **Score desta dimensão:** ${rotuloScoreDimensaoMarkdown(dim)}`,
    dim.foraDeEscopo ? '- **Escopo:** fora de escopo na configuração do projeto' : null,
    dim.peso != null ? `- **Peso no consolidado:** ${dim.peso}%` : null,
    scoreGeral != null ? `- **Score geral do consolidado (referência):** ${Number(scoreGeral).toFixed(2)}` : null,
    mediaSetor != null ? `- **Média de referência setor/TI:** ${Number(mediaSetor).toFixed(1)}` : null,
    unidadeNome ? `- **Unidade organizacional:** ${unidadeNome}` : null,
    '',
    '### Perguntas consolidadas (somente esta dimensão)',
    detalhePerguntasUmaDimensaoMarkdown(dim),
    '',
    '### Tabela de scores (somente esta dimensão)',
    tabelaPerguntasDimensaoMarkdown(dim)
  ];
  return linhas.filter((l) => l != null).join('\n');
}

export function montarCabecalhoDadosUnidade({
  empresa,
  projeto,
  unidadeNome,
  setor,
  porte,
  scoreGeral,
  nivel,
  avaliadoresCount,
  frameworkLabel
}) {
  const nomesNivel = NOMES_NIVEL_BLUEPRINT;
  const n = Math.min(5, Math.max(1, Math.round(Number(nivel) || 1)));
  return `# DADOS — UNIDADE ${unidadeNome}

- Empresa: ${empresa} | Projeto: ${projeto}
- Framework: ${frameworkLabel}
- Setor: ${setor} | Porte: ${porte}
- Score unidade: **${Number(scoreGeral).toFixed(2)}** (N${n} — ${nomesNivel[n - 1]})
- Avaliadores: ${avaliadoresCount}
`;
}

/** Resumo compacto de scores (sem detalhe de perguntas) — sumário/roadmap. */
export function montarResumoScoresDimensoes(dimensoes, { titulo = 'Scores por dimensão (resumo)' } = {}) {
  const linhas = (dimensoes || []).map((d) => {
    if (dimensaoComScoreZero(d)) return `- ${d.area}: 0`;
    return `- ${d.area}: ${Number(d.score).toFixed(2)} (N${d.nivel || '—'})`;
  });
  if (!linhas.length) return '';
  return `## ${titulo}\n${linhas.join('\n')}\n`;
}

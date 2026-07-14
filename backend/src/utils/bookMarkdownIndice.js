/**
 * Insere um índice navegável no início do book Markdown (anchors compatíveis com MarkdownRenderer).
 */

import { extrairEntradasIndiceMarkdown } from './markdownSlug.js';
import { capaConfidencialBookSatfMarkdown } from './satfBookTaxonomia.js';
import { capaNivelAvaliadoresRelatorioIAMarkdown } from './nivelPrioridadeMapeamentoMaturidade.js';
import { blocoUnidadeRelatorioMarkdown } from './relatorioUnidadeIA.js';
import { prependSecaoDashboardUnidadeAoRelatorio } from './bookUnidadeContexto.js';

/**
 * @param {string} conteudoMd — corpo do book (sem índice)
 * @param {{ modo?: 'auto' | 'satf' | 'unidade' | 'completo' }} [options]
 * @returns {string} documento com `# Índice` + lista de links no topo
 */
export function adicionarIndiceAoBookMarkdown(conteudoMd, options = {}) {
  const entradas = extrairEntradasIndiceMarkdown(conteudoMd, options);
  if (entradas.length === 0) {
    return conteudoMd;
  }

  let blocoIndice = '# Índice\n\n';
  for (const e of entradas) {
    const pad = e.level === 2 ? '  ' : '';
    const rotulo = e.tituloIndice || e.titulo;
    blocoIndice += `${pad}- [${rotulo}](#${e.slug})\n`;
  }
  blocoIndice += '\n---\n\n';

  return blocoIndice + conteudoMd.trimStart();
}

/**
 * Ordem canônica SATF: Capa confidencial → Índice → Capa avaliadores → (unidade) → corpo 1–N.
 * Books por unidade: sem Seção 0 dashboard.
 */
export function montarPreliminaresBookSatfOrdemCanonica({
  corpoMarkdown,
  empresaNome,
  projetoNome,
  avaliacoesFiltradas,
  filtroNivelMax,
  unidadeMeta,
  secaoDashboard,
  exigeUnidade = false,
  modoIndice = null
}) {
  let corpo = String(corpoMarkdown || '').trim();
  if (exigeUnidade && secaoDashboard) {
    corpo = prependSecaoDashboardUnidadeAoRelatorio(corpo, secaoDashboard);
  }

  const modo =
    modoIndice || (exigeUnidade ? 'unidade' : 'satf');
  const indiceMaisCorpo = adicionarIndiceAoBookMarkdown(corpo, { modo });
  const m = indiceMaisCorpo.match(/^(# Índice[\s\S]*?---\n\n)([\s\S]*)$/);
  const blocoIndice = m ? m[1] : '';
  const corpoPosIndice = m ? m[2] : indiceMaisCorpo;

  const confidencial = capaConfidencialBookSatfMarkdown(empresaNome, projetoNome);
  const avaliadores = capaNivelAvaliadoresRelatorioIAMarkdown({
    filtroMax: filtroNivelMax,
    avaliacoesFiltradas,
    empresaNome,
    projetoNome
  });

  let out = `${confidencial}${blocoIndice}${avaliadores}`;
  if (exigeUnidade && unidadeMeta) {
    const blocoUnidade = blocoUnidadeRelatorioMarkdown(unidadeMeta);
    if (blocoUnidade) out += `${blocoUnidade}\n`;
  }
  out += corpoPosIndice.trimStart();
  return out;
}

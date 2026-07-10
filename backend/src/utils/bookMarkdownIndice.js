/**
 * Insere um índice navegável no início do book Markdown (anchors compatíveis com MarkdownRenderer).
 */

import { extrairEntradasIndiceMarkdown } from './markdownSlug.js';

/**
 * @param {string} conteudoMd — corpo do book (sem índice)
 * @param {{ modo?: 'auto' | 'satf' | 'completo' }} [options]
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

/**
 * Insere um índice navegável no início do book Markdown (anchors compatíveis com MarkdownRenderer).
 */

import { extrairEntradasIndiceMarkdown } from './markdownSlug.js';

/**
 * @param {string} conteudoMd — corpo do book (sem índice)
 * @returns {string} documento com `# Índice` + lista de links no topo
 */
export function adicionarIndiceAoBookMarkdown(conteudoMd) {
  const entradas = extrairEntradasIndiceMarkdown(conteudoMd);
  if (entradas.length === 0) {
    return conteudoMd;
  }

  let blocoIndice = '# Índice\n\n';
  for (const e of entradas) {
    const pad = e.level === 2 ? '  ' : '';
    blocoIndice += `${pad}- [${e.titulo}](#${e.slug})\n`;
  }
  blocoIndice += '\n---\n\n';

  return blocoIndice + conteudoMd.trimStart();
}

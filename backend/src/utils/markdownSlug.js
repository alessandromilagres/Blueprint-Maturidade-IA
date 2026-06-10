/**
 * Slugs de âncora para TOC Markdown — deve coincidir com o frontend (MarkdownRenderer).
 */

export function slugificarTituloMarkdown(titulo) {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function criarRegistroSlugs() {
  const contagem = {};
  return function slugUnicoParaTitulo(titulo) {
    const base = slugificarTituloMarkdown(String(titulo).trim());
    const n = (contagem[base] = (contagem[base] || 0) + 1);
    return n === 1 ? base : `${base}-${n}`;
  };
}

const HEADING_MATCHERS = [
  [/^####\s+(.+)$/, 4],
  [/^###\s+(.+)$/, 3],
  [/^##\s+(.+)$/, 2],
  [/^#\s+(.+)$/, 1]
];

/**
 * Lista entradas # e ## para índice. Mesma sequência de slugs que o MarkdownRenderer do frontend.
 */
export function extrairEntradasIndiceMarkdown(conteudoMd) {
  if (!conteudoMd) return [];
  const linhas = conteudoMd.split('\n');
  const slugNext = criarRegistroSlugs();
  const entradas = [];
  let inCodeFence = false;

  for (const linha of linhas) {
    const t = linha.trim();
    if (t.startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    for (const [re, depth] of HEADING_MATCHERS) {
      const m = linha.match(re);
      if (m) {
        const titulo = m[1].trim();
        const slug = slugNext(titulo);
        if (depth <= 2 && !/^índice$/i.test(titulo)) {
          entradas.push({ level: depth, titulo, slug });
        }
        break;
      }
    }
  }
  return entradas;
}

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

/** Detecta book SATF TI v3 pelo conteúdo Markdown. */
export function detectarBookSatf(conteudoMd) {
  if (!conteudoMd) return false;
  const md = String(conteudoMd);
  return (
    /^#\s+1\.\s+METODOLOGIA SATF/im.test(md) ||
    /^#\s+3\.\s+DIAGNÓSTICO POR DIMENSÃO \(SATF/im.test(md) ||
    (/SATF TI v3/i.test(md) && /^#\s+[1-8]\.\s+/m.test(md))
  );
}

/** Título curto para dimensões da seção 3 no índice (slug continua vindo do título completo). */
export function encurtarTituloDimensaoSecao3(titulo) {
  const mDim = String(titulo).match(/^3\.(\d+)\s+Dimens[aã]o\s*[—–-]\s*(.+)$/i);
  if (mDim) {
    let nome = mDim[2].trim();
    nome = nome
      .split(/\s*[—–-]\s*oficial\b/i)[0]
      .split(/\s*\(oficial\b/i)[0]
      .split(/\s*·\s*N[ií]vel\b/i)[0]
      .split(/\s*·\s*Score\b/i)[0]
      .trim();
    return `3.${mDim[1]} — ${nome}`;
  }
  const mCod = String(titulo).match(/^3\.(\d+)\s+(D(?:10|11|[1-9]))\s+[—–-]\s*(.+)$/i);
  if (mCod) {
    let nome = mCod[3].trim();
    nome = nome
      .split(/\s*[—–-]\s*Score\b/i)[0]
      .split(/\s*·\s*N[ií]vel\b/i)[0]
      .trim();
    return `3.${mCod[1]} — ${nome}`;
  }
  return null;
}

function tituloEhSecao3Dimensao(titulo) {
  return (
    /^3\.\d+\s+Dimens[aã]o\b/i.test(titulo) ||
    /^3\.\d+\s+D(?:10|11|[1-9])\s+[—–-]/i.test(titulo)
  );
}

function resolverModoIndice(conteudoMd, options = {}) {
  const modo = options.modo || 'auto';
  if (modo === 'satf') return 'satf';
  if (modo === 'completo') return 'completo';
  return detectarBookSatf(conteudoMd) ? 'satf' : 'completo';
}

function deveIncluirNoIndice(modo, depth, titulo) {
  if (/^índice$/i.test(titulo)) return false;
  if (modo !== 'satf') return depth <= 2;
  if (depth === 1) return /^[1-8]\.\s+/.test(titulo);
  if (depth === 2) return tituloEhSecao3Dimensao(titulo);
  return false;
}

function tituloIndiceParaEntrada(modo, depth, titulo) {
  if (depth === 2) {
    const curto = encurtarTituloDimensaoSecao3(titulo);
    if (curto) return curto;
  }
  return titulo;
}

/**
 * Lista entradas para índice. Mesma sequência de slugs que o MarkdownRenderer do frontend.
 * @param {string} conteudoMd
 * @param {{ modo?: 'auto' | 'satf' | 'completo' }} [options]
 */
export function extrairEntradasIndiceMarkdown(conteudoMd, options = {}) {
  if (!conteudoMd) return [];
  const modo = resolverModoIndice(conteudoMd, options);
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
        if (deveIncluirNoIndice(modo, depth, titulo)) {
          const tituloIndice = tituloIndiceParaEntrada(modo, depth, titulo);
          entradas.push({
            level: depth,
            titulo,
            tituloIndice: tituloIndice !== titulo ? tituloIndice : undefined,
            slug
          });
        }
        break;
      }
    }
  }
  return entradas;
}

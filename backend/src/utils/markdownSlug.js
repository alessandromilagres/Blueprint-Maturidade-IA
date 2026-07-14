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
    /^#\s+[23]\.\s+DIAGNÓSTICO POR DIMENSÃO \(SATF/im.test(md) ||
    (/SATF TI v3/i.test(md) && /^#\s+[1-8]\.\s+/m.test(md))
  );
}

/** Título curto para dimensões do diagnóstico no índice (slug continua vindo do título completo). */
export function encurtarTituloDimensaoSecao3(titulo) {
  const mDim = String(titulo).match(/^([23])\.(\d+)\s+Dimens[aã]o\s*[—–-]\s*(.+)$/i);
  if (mDim) {
    let nome = mDim[3].trim();
    nome = nome
      .split(/\s*[—–-]\s*oficial\b/i)[0]
      .split(/\s*\(oficial\b/i)[0]
      .split(/\s*·\s*N[ií]vel\b/i)[0]
      .split(/\s*·\s*Score\b/i)[0]
      .trim();
    return `${mDim[1]}.${mDim[2]} — ${nome}`;
  }
  const mCod = String(titulo).match(/^([23])\.(\d+)\s+(D(?:10|11|[1-9]))\s+[—–-]\s*(.+)$/i);
  if (mCod) {
    let nome = mCod[4].trim();
    nome = nome
      .split(/\s*[—–-]\s*Score\b/i)[0]
      .split(/\s*·\s*N[ií]vel\b/i)[0]
      .trim();
    return `${mCod[1]}.${mCod[2]} — ${nome}`;
  }
  const mBp = String(titulo).match(
    /^([23])\.(\d+)\s+(BP(?:1[0-6]|[1-9]))\s+[—–-]\s*(.+)$/i
  );
  if (mBp) {
    let nome = mBp[4].trim();
    nome = nome
      .split(/\s*[—–-]\s*Score\b/i)[0]
      .split(/\s*·\s*N[ií]vel\b/i)[0]
      .trim();
    return `${mBp[1]}.${mBp[2]} — ${nome}`;
  }
  return null;
}

function tituloEhSecaoDiagnosticoDimensao(titulo) {
  return (
    /^[23]\.\d+\s+Dimens[aã]o\b/i.test(titulo) ||
    /^[23]\.\d+\s+D(?:10|11|[1-9])\s+[—–-]/i.test(titulo) ||
    /^[23]\.\d+\s+BP(?:1[0-6]|[1-9])\s+[—–-]/i.test(titulo)
  );
}

function resolverModoIndice(conteudoMd, options = {}) {
  const modo = options.modo || 'auto';
  if (modo === 'satf' || modo === 'unidade' || modo === 'completo') return modo;
  return detectarBookSatf(conteudoMd) ? 'satf' : 'completo';
}

function deveIncluirNoIndice(modo, depth, titulo) {
  if (/^índice$/i.test(titulo)) return false;
  if (modo === 'completo') return depth <= 2;
  if (modo === 'unidade') {
    // Book por unidade (SATF ou Blueprint): 1–5 + apêndices; dims 3.N; subseções 1/2/4/5.
    if (depth === 1) {
      return /^[1-5]\.\s+/.test(titulo) || /^AP[EÊ]NDICES\b/i.test(titulo);
    }
    if (depth === 2) {
      return (
        tituloEhSecaoDiagnosticoDimensao(titulo) ||
        /^[1245]\.\d+\s+/.test(titulo) ||
        /^Ap[eê]ndice\b/i.test(titulo)
      );
    }
    return false;
  }
  // satf
  if (depth === 1) return /^[1-8]\.\s+/.test(titulo);
  if (depth === 2) return tituloEhSecaoDiagnosticoDimensao(titulo);
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
 * @param {{ modo?: 'auto' | 'satf' | 'unidade' | 'completo' }} [options]
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

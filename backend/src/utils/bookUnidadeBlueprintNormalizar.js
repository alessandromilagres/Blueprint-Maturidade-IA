/**
 * Normalização estrutural do Book Blueprint por unidade (outline 1–5).
 * Espelha o padrão SATF: headings canônicos + remoção de spillover da IA.
 */

import { removerSpilloverSecao3BookSatf } from './satfBookTaxonomia.js';

/** Remove H1 (# …) e H2 (## …); preserva ###+ e o corpo. */
export function removerHeadingsH1H2(markdown) {
  return String(markdown || '')
    .split('\n')
    .filter((linha) => !/^#{1,2}\s+/.test(linha) || /^#{3,}\s+/.test(linha))
    .join('\n')
    .trim();
}

/**
 * Força cabeçalho canônico da dimensão e remove H1/H2 vazados pela IA
 * (# 4. ROADMAP, ## 3.5 BP5, # 12. Dimensão BP12, etc.).
 */
export function sanitizarChunkDimensaoBookUnidadeBlueprint(content, { num, nomeDimensao, papelLabel } = {}) {
  const n = Number(num);
  if (!Number.isFinite(n) || n < 1) {
    return String(content || '').trim();
  }
  const nome = String(nomeDimensao || 'Dimensão').trim();
  const sufixo =
    papelLabel && String(papelLabel).trim() ? ` (${String(papelLabel).trim()})` : '';
  const cabecalho = `## 3.${n} Dimensão — ${nome}${sufixo}`;
  const corpo = removerHeadingsH1H2(content);
  return corpo ? `${cabecalho}\n\n${corpo}` : cabecalho;
}

/**
 * Mantém só o bloco da seção principal # N. (descarta # 4/5/12 paralelos no mesmo chunk).
 */
export function sanitizarChunkSecaoPrincipalBookUnidade(content, { num, tituloPreferido } = {}) {
  const n = Number(num);
  if (!Number.isFinite(n)) return String(content || '').trim();

  let md = String(content || '').trim();
  // Remove ## 3.N (dimensões) que vazaram para seções 1/2/4/5
  md = md
    .split('\n')
    .filter((linha) => !/^##\s+3\.\d+\b/.test(linha.trim()))
    .join('\n');

  const linhas = md.split('\n');
  const blocos = [];
  let atual = null;
  const flush = () => {
    if (atual) blocos.push(atual);
    atual = null;
  };

  for (const linha of linhas) {
    const m = linha.match(/^#\s+(\d+)\.\s+(.*)$/);
    if (m) {
      flush();
      atual = { sec: parseInt(m[1], 10), titulo: m[2].trim(), linhas: [linha] };
    } else if (atual) {
      atual.linhas.push(linha);
    } else {
      // Prefácio sem H1 — guarda em rascunho sec 0
      if (!atual) atual = { sec: 0, titulo: '', linhas: [] };
      atual.linhas.push(linha);
    }
  }
  flush();

  const preferido = String(tituloPreferido || '');
  let escolhido =
    blocos.find((b) => b.sec === n && (!preferido || new RegExp(preferido, 'i').test(b.titulo))) ||
    blocos.find((b) => b.sec === n) ||
    null;

  if (!escolhido) {
    const corpo = removerHeadingsH1H2(md);
    const titulo =
      n === 1
        ? 'METODOLOGIA APLICADA (SysMap Blueprint IA)'
        : n === 2
          ? 'SUMÁRIO EXECUTIVO'
          : n === 4
            ? 'ROADMAP ENGENHARIA 30-60-90 DIAS DA UNIDADE'
            : n === 5
              ? 'Próximos Passos e Encerramento'
              : `Seção ${n}`;
    return `# ${n}. ${titulo}\n\n${corpo}`.trim();
  }

  // Se o título preferido diverge (ex.: "Consolidação Estratégica"), força canônico
  if (preferido && !new RegExp(preferido, 'i').test(escolhido.titulo)) {
    const tituloCanon =
      n === 4
        ? 'ROADMAP ENGENHARIA 30-60-90 DIAS DA UNIDADE'
        : n === 5
          ? 'Próximos Passos e Encerramento'
          : escolhido.titulo;
    const resto = escolhido.linhas.slice(1).join('\n');
    return `# ${n}. ${tituloCanon}\n${resto}`.trim();
  }

  return escolhido.linhas.join('\n').trim();
}

/**
 * Deduplica seções principais 4 e 5: mantém a primeira ocorrência canônica
 * (ROADMAP / Próximos) e descarta "Consolidação Estratégica", "Benchmarks", etc.
 */
export function deduplicarSecoesFinaisBookUnidadeBlueprint(markdown) {
  const linhas = String(markdown || '').split('\n');
  const blocos = [];
  let atual = { sec: null, linhas: [] };

  const flush = () => {
    if (atual.linhas.length) blocos.push(atual);
    atual = { sec: null, linhas: [] };
  };

  for (const linha of linhas) {
    const m = linha.match(/^#\s+(\d+)\.\s+(.*)$/);
    if (m) {
      flush();
      atual = { sec: parseInt(m[1], 10), titulo: m[2].trim(), linhas: [linha] };
    } else {
      atual.linhas.push(linha);
    }
  }
  flush();

  const vistos = new Set();
  const saida = [];
  for (const b of blocos) {
    if (b.sec != null && b.sec >= 4 && b.sec <= 5) {
      if (vistos.has(b.sec)) continue;
      // Preferir bloco canônico; se o 1º for lixo (Consolidação…), pular até achar ROADMAP/Próximos
      const t = b.titulo || '';
      if (b.sec === 4 && /consolida|radar|mapa de calor|transforma|benchmark|risco consolidado/i.test(t) && !/roadmap/i.test(t)) {
        continue;
      }
      if (b.sec === 5 && /benchmark|competitiv|an[aá]lise aprofundada|se[cç][aã]o 3/i.test(t) && !/pr[oó]ximos/i.test(t)) {
        continue;
      }
      vistos.add(b.sec);
    }
    // Descarta H1 6+ (leak de book enterprise)
    if (b.sec != null && b.sec >= 6) continue;
    saida.push(...b.linhas);
  }
  return saida.join('\n').trim();
}

/** Remove H1 ilícitos (ex.: `# 12. Dimensão BP12`, `SEÇÃO 3 — …` como H1). */
export function removerHeadingsIlícitosBookUnidadeBlueprint(markdown) {
  const linhas = String(markdown || '').split('\n');
  const saida = [];
  let pulandoBlocoIlícito = false;

  for (const linha of linhas) {
    const t = linha.trim();
    const mNum = t.match(/^#\s+(\d+)\.\s+/);
    if (mNum) {
      const n = parseInt(mNum[1], 10);
      if (n >= 1 && n <= 5) {
        pulandoBlocoIlícito = false;
        saida.push(linha);
      } else {
        pulandoBlocoIlícito = true;
      }
      continue;
    }
    if (/^#\s+SE[CÇ][AÃ]O\s+\d+/i.test(t)) {
      pulandoBlocoIlícito = true;
      continue;
    }
    if (/^#\s+AP[EÊ]NDICES/i.test(t)) {
      pulandoBlocoIlícito = false;
      saida.push(linha);
      continue;
    }
    if (/^#\s+/.test(t) && !/^##/.test(t)) {
      // Outro H1 sem número (capa residual etc.) — mantém só se não estamos em bloco ilícito
      if (!pulandoBlocoIlícito) saida.push(linha);
      continue;
    }
    if (pulandoBlocoIlícito) continue;
    saida.push(linha);
  }
  return saida.join('\n').trim();
}

/**
 * Pipeline completo pós-IA: spillover + dedupe + remoção de seções illicitas.
 */
export function normalizarSecoesBookUnidadeBlueprint(markdown) {
  let out = String(markdown || '').trim();
  out = removerSpilloverSecao3BookSatf(out);
  out = deduplicarSecoesFinaisBookUnidadeBlueprint(out);
  out = removerHeadingsIlícitosBookUnidadeBlueprint(out);
  return out.trim();
}

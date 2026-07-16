/**
 * Normalização de códigos / papéis de dimensão em foco (unidade organizacional).
 * Espelha backend/src/utils/empresaUnidade.js — manter alinhado.
 */

const REGEX_COD_DIMENSAO = /\b(D(?:10|11|[1-9])|BP(?:1[0-6]|[1-9]))\b/gi;
const REGEX_SEGMENTO_EXCLUI =
  /\b(?:N[AÃ]O|NAO)[\s,]+(?:APARECE|FAZ\s+PARTE|EST[AÁ]\s+NO\s+ESCOPO|INCLUI|APLICA|PERTENCE)\b|\bFORA[\s,]+(?:DO[\s,]+)?ESCOPO\b/i;

export const PAPEIS_DIMENSAO_UNIDADE = Object.freeze({
  PROPRIETARIO: 'proprietario',
  CONSUMIDOR: 'consumidor',
  NAO_SE_APLICA: 'nao_se_aplica'
});

export const MODELOS_OPERACIONAIS = Object.freeze({
  DELIVERY: 'delivery',
  SUSTENTACAO: 'sustentacao',
  COE: 'coe',
  INFRAESTRUTURA: 'infraestrutura',
  DESENVOLVIMENTO: 'desenvolvimento',
  DADOS: 'dados',
  SISTEMA: 'sistema',
  SISTEMA_INTERNO: 'sistema_interno'
});

export const LABELS_MODELO_OPERACIONAL = Object.freeze({
  delivery: 'Delivery (projeto / código novo)',
  sustentacao: 'Sustentação (operação / ITSM)',
  coe: 'COE-IA (fábrica de IA)',
  infraestrutura: 'Infraestrutura (cloud / SRE / plataforma)',
  desenvolvimento: 'Desenvolvimento (engenharia / SDLC)',
  dados: 'Dados (plataforma / analytics / qualidade)',
  sistema: 'Sistema (aplicações / sistemas de negócio)',
  sistema_interno: 'Sistema interno (ERP / RH / tools corporativas)'
});

export function normalizarModeloOperacional(valor) {
  if (valor == null || valor === '') return null;
  const raw = String(valor)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!raw || raw === 'none' || raw === 'geral') return null;
  if (raw === 'delivery' || raw === 'grt' || raw === 'delivery_operacional') {
    return MODELOS_OPERACIONAIS.DELIVERY;
  }
  if (raw === 'sustentacao' || raw === 'grs' || raw === 'ops' || raw === 'itsm') {
    return MODELOS_OPERACIONAIS.SUSTENTACAO;
  }
  if (raw === 'coe' || raw === 'coe_ia' || raw === 'coe-ia' || raw === 'centro_excelencia') {
    return MODELOS_OPERACIONAIS.COE;
  }
  if (
    raw === 'infraestrutura' ||
    raw === 'infra' ||
    raw === 'sre' ||
    raw === 'cloud' ||
    raw === 'ops_infra'
  ) {
    return MODELOS_OPERACIONAIS.INFRAESTRUTURA;
  }
  if (
    raw === 'desenvolvimento' ||
    raw === 'dev' ||
    raw === 'engenharia' ||
    raw === 'sdlc'
  ) {
    return MODELOS_OPERACIONAIS.DESENVOLVIMENTO;
  }
  if (raw === 'dados' || raw === 'data' || raw === 'analytics' || raw === 'data_platform') {
    return MODELOS_OPERACIONAIS.DADOS;
  }
  if (
    raw === 'sistema_interno' ||
    raw === 'sistemas_internos' ||
    raw === 'erp' ||
    raw === 'core_interno'
  ) {
    return MODELOS_OPERACIONAIS.SISTEMA_INTERNO;
  }
  if (raw === 'sistema' || raw === 'sistemas' || raw === 'systems') {
    return MODELOS_OPERACIONAIS.SISTEMA;
  }
  if (Object.values(MODELOS_OPERACIONAIS).includes(raw)) return raw;
  return null;
}

export function labelModeloOperacional(modelo) {
  const m = normalizarModeloOperacional(modelo);
  return m ? LABELS_MODELO_OPERACIONAL[m] || m : '';
}

/** Dimensões SATF com tradução por modelo no produto (override editável na unidade). */
export const COD_DIM_COM_TRADUCAO = Object.freeze([
  'D4',
  'D5',
  'D6',
  'D7',
  'D8',
  'D9',
  'D10'
]);

export function normalizarTraducaoDimensoesInput(valor) {
  if (valor == null || valor === '') return null;
  let mapa = valor;
  if (typeof valor === 'string') {
    try {
      mapa = JSON.parse(valor);
    } catch {
      return null;
    }
  }
  if (!mapa || typeof mapa !== 'object' || Array.isArray(mapa)) return null;
  const out = {};
  for (const [k, v] of Object.entries(mapa)) {
    const cod = String(k || '')
      .trim()
      .toUpperCase();
    if (!COD_DIM_COM_TRADUCAO.includes(cod)) continue;
    if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
    const bloco = {};
    if (Array.isArray(v.perguntas_e_metricas)) {
      const arr = v.perguntas_e_metricas.map((x) => String(x || '').trim()).filter(Boolean);
      if (arr.length) bloco.perguntas_e_metricas = arr;
    } else if (typeof v.perguntas_e_metricas === 'string' && v.perguntas_e_metricas.trim()) {
      const arr = v.perguntas_e_metricas
        .split(/\n/)
        .map((x) => x.replace(/^[-*•]\s*/, '').trim())
        .filter(Boolean);
      if (arr.length) bloco.perguntas_e_metricas = arr;
    }
    for (const campo of ['proibido', 'benchmark_fonte', 'escopo', 'nota']) {
      if (v[campo] != null && String(v[campo]).trim()) {
        bloco[campo] = String(v[campo]).trim();
      }
    }
    if (Object.keys(bloco).length) out[cod] = bloco;
  }
  return Object.keys(out).length ? out : null;
}

function ordenarCodigosDimensao(codigos) {
  return [...codigos].sort((a, b) => {
    const pa = a.startsWith('BP') ? 'BP' : 'D';
    const pb = b.startsWith('BP') ? 'BP' : 'D';
    if (pa !== pb) return pa.localeCompare(pb);
    return parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10);
  });
}

export function normalizarDimensoesFocoInput(valor) {
  if (valor == null || valor === '') return null;

  let texto = '';
  if (Array.isArray(valor)) {
    texto = valor.map((x) => String(x).trim()).filter(Boolean).join(', ');
  } else {
    texto = String(valor).trim();
    try {
      const parsed = JSON.parse(texto);
      if (Array.isArray(parsed)) {
        texto = parsed.map((x) => String(x).trim()).filter(Boolean).join(', ');
      }
    } catch {
      /* texto livre */
    }
  }
  if (!texto.trim()) return null;

  const excluir = new Set();
  const incluir = new Set();

  for (const m of texto.matchAll(/(?:^|[,\s])(?:-|!|NOT\s+)(D(?:10|11|[1-9])|BP(?:1[0-6]|[1-9]))\b/gi)) {
    excluir.add(m[1].toUpperCase());
  }

  for (const m of texto.matchAll(REGEX_COD_DIMENSAO)) {
    const cod = m[1].toUpperCase();
    const afterCod = texto.slice(m.index + m[0].length);
    const proxCod = afterCod.search(/\b(D(?:10|11|[1-9])|BP(?:1[0-6]|[1-9]))\b/i);
    const janela = proxCod >= 0 ? afterCod.slice(0, proxCod) : afterCod.slice(0, 200);
    if (/^\s*[-!]/.test(afterCod) || REGEX_SEGMENTO_EXCLUI.test(janela)) {
      excluir.add(cod);
    } else {
      incluir.add(cod);
    }
  }

  for (const e of excluir) incluir.delete(e);

  const arr = ordenarCodigosDimensao(incluir);
  return arr.length ? arr : null;
}

function filtrarPrefixo(codigos, prefixo) {
  if (!codigos?.length) return null;
  const f = codigos.filter((c) => String(c).toUpperCase().startsWith(prefixo));
  return f.length ? f : null;
}

export function normalizarDimensoesFocoSatfInput(valor) {
  return filtrarPrefixo(normalizarDimensoesFocoInput(valor), 'D');
}

export function normalizarDimensoesFocoMitInput(valor) {
  return filtrarPrefixo(normalizarDimensoesFocoInput(valor), 'BP');
}

export function formatarDimensoesFocoSatfDisplay(valor) {
  const arr = normalizarDimensoesFocoSatfInput(valor);
  return arr?.length ? arr.join(', ') : '';
}

export function formatarDimensoesFocoMitDisplay(valor) {
  const arr = normalizarDimensoesFocoMitInput(valor);
  return arr?.length ? arr.join(', ') : '';
}

/** @deprecated */
export function formatarDimensoesFocoDisplay(valor) {
  return formatarDimensoesFocoSatfDisplay(valor) || formatarDimensoesFocoMitDisplay(valor);
}

export function normalizarPapelDimensaoUnidade(valor) {
  const raw = String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
  if (!raw || raw === 'n_a' || raw === 'na' || raw === 'nsa' || raw === 'none') {
    return PAPEIS_DIMENSAO_UNIDADE.NAO_SE_APLICA;
  }
  if (raw === 'owner' || raw === 'proprietaria' || raw === 'dono' || raw === 'dona') {
    return PAPEIS_DIMENSAO_UNIDADE.PROPRIETARIO;
  }
  if (raw === 'consumer' || raw === 'consumidora' || raw === 'usuario' || raw === 'usuaria') {
    return PAPEIS_DIMENSAO_UNIDADE.CONSUMIDOR;
  }
  if (Object.values(PAPEIS_DIMENSAO_UNIDADE).includes(raw)) return raw;
  return PAPEIS_DIMENSAO_UNIDADE.NAO_SE_APLICA;
}

export function labelPapelDimensaoUnidade(papel) {
  const p = normalizarPapelDimensaoUnidade(papel);
  if (p === PAPEIS_DIMENSAO_UNIDADE.PROPRIETARIO) return 'Proprietário';
  if (p === PAPEIS_DIMENSAO_UNIDADE.CONSUMIDOR) return 'Consumidor';
  return 'Não se aplica';
}

export function normalizarDimensoesPapelInput(valor, { prefixo = null } = {}) {
  if (valor == null || valor === '') return null;
  let mapa = null;
  if (typeof valor === 'object' && !Array.isArray(valor)) {
    mapa = valor;
  } else if (typeof valor === 'string') {
    try {
      const parsed = JSON.parse(valor.trim());
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) mapa = parsed;
    } catch {
      return null;
    }
  }
  if (!mapa) return null;

  const out = {};
  for (const [k, v] of Object.entries(mapa)) {
    const cod = String(k || '').trim().toUpperCase();
    if (!cod) continue;
    if (prefixo === 'D' && !/^D(?:10|11|[1-9])$/.test(cod)) continue;
    if (prefixo === 'BP' && !/^BP(?:1[0-6]|[1-9])$/.test(cod)) continue;
    out[cod] = normalizarPapelDimensaoUnidade(v);
  }
  return Object.keys(out).length ? out : null;
}

/** Mantém só códigos do foco; novos códigos default = nao_se_aplica. */
export function sincronizarPapelComFoco(mapaPapel, listaFoco) {
  const foco = Array.isArray(listaFoco) ? listaFoco : [];
  if (!foco.length) return {};
  const prev = normalizarDimensoesPapelInput(mapaPapel) || {};
  const out = {};
  for (const c of foco) {
    const cod = String(c).toUpperCase();
    out[cod] = prev[cod] || PAPEIS_DIMENSAO_UNIDADE.NAO_SE_APLICA;
  }
  return out;
}

export function formatarDimensoesPapelDisplay(mapaPapel, listaFoco = null) {
  const mapa = normalizarDimensoesPapelInput(mapaPapel);
  if (!mapa && !listaFoco?.length) return '';
  const codigos = listaFoco?.length ? listaFoco : Object.keys(mapa || {}).sort();
  return codigos
    .map((c) => {
      const cod = String(c).toUpperCase();
      const p = mapa?.[cod] || PAPEIS_DIMENSAO_UNIDADE.NAO_SE_APLICA;
      return p === PAPEIS_DIMENSAO_UNIDADE.NAO_SE_APLICA
        ? cod
        : `${cod} (${labelPapelDimensaoUnidade(p)})`;
    })
    .join(', ');
}

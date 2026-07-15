/**
 * Benchmarks de mercado por instrumento + dimensão.
 * Fonte humana: backend/src/config/biblioteca_benchmarks_mercado.yaml
 * Runtime: JSON gerado a partir do YAML (sem dependência YAML em produção).
 *
 * REGRA: nunca cruzar `satf` ↔ `blueprint_mit`.
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const RAW = require('../config/biblioteca_benchmarks_mercado.json');

export const INSTRUMENTOS_BENCHMARK = Object.freeze({
  SATF: 'satf',
  BLUEPRINT_MIT: 'blueprint_mit'
});

const BIBLIOTECA = Object.freeze({
  satf: Object.freeze(RAW.satf || {}),
  blueprint_mit: Object.freeze(RAW.blueprint_mit || {})
});

export function normalizarInstrumentoBenchmark(instrumento) {
  const raw = String(instrumento || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (!raw) return null;
  if (raw === 'satf' || raw === 'satf_ti' || raw === 'satf_ti_v3' || raw === 'sat-f') {
    return INSTRUMENTOS_BENCHMARK.SATF;
  }
  if (
    raw === 'blueprint_mit' ||
    raw === 'blueprint' ||
    raw === 'mit' ||
    raw === 'mit_cisr' ||
    raw === 'blueprint_ia'
  ) {
    return INSTRUMENTOS_BENCHMARK.BLUEPRINT_MIT;
  }
  return null;
}

function normalizarNomeDimensao(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'e')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function resolverCodigoPorNomeDimensao(inst, nome) {
  const alvo = normalizarNomeDimensao(nome);
  if (!alvo) return null;
  const bloco = BIBLIOTECA[inst] || {};
  for (const [cod, entry] of Object.entries(bloco)) {
    const nomeEntry = normalizarNomeDimensao(entry?.dimensao);
    if (nomeEntry && nomeEntry === alvo) return cod;
  }
  // match parcial (prefixo ≥ 24 chars) — cobre variações leves de rótulo
  for (const [cod, entry] of Object.entries(bloco)) {
    const nomeEntry = normalizarNomeDimensao(entry?.dimensao);
    if (!nomeEntry) continue;
    if (nomeEntry.startsWith(alvo.slice(0, 24)) || alvo.startsWith(nomeEntry.slice(0, 24))) {
      return cod;
    }
  }
  return null;
}

/** Extrai D1–D11 ou "1"–"16" a partir de string / objeto dimensão. */
export function resolverCodigoBenchmarkDimensao(instrumento, codigoOuDim) {
  const inst = normalizarInstrumentoBenchmark(instrumento);
  if (!inst) return null;

  if (codigoOuDim && typeof codigoOuDim === 'object') {
    const cod =
      codigoOuDim.codigoFramework ||
      codigoOuDim.codigo ||
      codigoOuDim.codigoDimensao ||
      '';
    const fromCod = resolverCodigoBenchmarkDimensao(inst, cod);
    if (fromCod) return fromCod;
    const fromNome = resolverCodigoPorNomeDimensao(
      inst,
      codigoOuDim.area || codigoOuDim.nome || codigoOuDim.dimensao
    );
    if (fromNome) return fromNome;
    // Blueprint às vezes só tem ordem/número da área
    const ordem = codigoOuDim.ordem ?? codigoOuDim.numero ?? codigoOuDim.num;
    if (inst === INSTRUMENTOS_BENCHMARK.BLUEPRINT_MIT && ordem != null) {
      const n = Number(ordem);
      if (Number.isFinite(n) && n >= 1 && n <= 16) return String(n);
    }
    return null;
  }

  const s = String(codigoOuDim || '')
    .trim()
    .toUpperCase();
  if (!s) return null;

  if (inst === INSTRUMENTOS_BENCHMARK.SATF) {
    // Exige prefixo D — evita confundir com chave numérica do Blueprint
    const m = s.match(/^D\s*([0-9]{1,2})$/) || s.match(/\bD\s*([0-9]{1,2})\b/);
    if (!m) return null;
    const n = Number(m[1]);
    if (n < 1 || n > 11) return null;
    return `D${n}`;
  }

  // blueprint_mit: só "1"…"16" (ou BP12) — rejeita códigos SATF tipo D4
  if (/^D\d/i.test(s)) return null;
  const m = s.match(/^BP\s*([0-9]{1,2})$/) || s.match(/^([0-9]{1,2})$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 1 || n > 16) return null;
  return String(n);
}

export function obterBenchmarkDimensao(instrumento, codigoOuDim) {
  const inst = normalizarInstrumentoBenchmark(instrumento);
  const codigo = resolverCodigoBenchmarkDimensao(inst, codigoOuDim);
  if (!inst || !codigo) return null;

  const bloco = BIBLIOTECA[inst]?.[codigo];
  if (!bloco || typeof bloco !== 'object') return null;

  const frase = String(bloco.benchmark || '').trim();
  if (!frase) return null;

  const revisarAte = String(bloco.revisar_ate || '').trim() || null;
  return {
    instrumento: inst,
    codigo,
    dimensao: String(bloco.dimensao || '').trim(),
    frase,
    fonte: String(bloco.fonte || '').trim(),
    ano: bloco.ano != null ? Number(bloco.ano) : null,
    status: String(bloco.status || '').trim() || null,
    frameworkReferencia: String(bloco.framework_referencia || '').trim() || null,
    revisarAte,
    vencido: benchmarkMercadoVencido(revisarAte),
    // Interno — não vai ao prompt do book entregável
    alertaGovernancaInterno: String(bloco.alerta_governanca || '').trim() || null
  };
}

export function benchmarkMercadoVencido(revisarAte) {
  const raw = String(revisarAte || '').trim();
  if (!raw) return false;
  // YYYY-MM ou YYYY-MM-DD
  const m = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3] || 1);
  if (!y || mo < 1 || mo > 12) return false;
  const limite = new Date(Date.UTC(y, mo - 1, d, 23, 59, 59));
  return Date.now() > limite.getTime();
}

/**
 * Bloco para prompt da Seção 3 — único benchmark permitido nesta dimensão.
 * Não inclui alerta_governanca (nota interna / controvérsia de produto).
 */
export function blocoBenchmarkDimensaoPrompt(instrumento, codigoOuDim) {
  const b = obterBenchmarkDimensao(instrumento, codigoOuDim);
  if (!b) {
    return `
BENCHMARK DE MERCADO DESTA DIMENSÃO:
- [benchmark pendente para esta dimensão] — **proibido** reutilizar número/texto de outra dimensão ou a média setorial genérica (ex.: 3,3 / 35%).
`;
  }

  if (b.vencido) {
    console.warn(
      `[benchmarks-mercado] Entrada ${b.instrumento}.${b.codigo} com revisar_ate=${b.revisarAte} vencida — revisar fonte.`
    );
  }

  const linhas = [
    '',
    'BENCHMARK DE MERCADO DESTA DIMENSÃO (usar **somente** este bloco no ### Benchmark Setorial):',
    `- Instrumento: **${b.instrumento}** · Dimensão: **${b.codigo}**${b.dimensao ? ` — ${b.dimensao}` : ''}`,
    `- Frase de referência: ${b.frase}`,
    b.fonte ? `- Fonte: ${b.fonte}${b.ano ? ` (${b.ano})` : ''}` : null,
    b.frameworkReferencia ? `- Framework de referência do benchmark: ${b.frameworkReferencia}` : null,
    b.status === 'adaptado'
      ? '- Status: **adaptado** — referência qualitativa de mercado; **não** converter literalmente para escala N1–N5 / score SATF.'
      : b.status
        ? `- Status: ${b.status}`
        : null,
    '- **Obrigatório** citar fonte e ano no parágrafo do Benchmark Setorial.',
    '- **Proibido** reutilizar este texto/números em outra dimensão, e proibido cair na média setorial genérica (ex.: 3,3 / 35%) como substituto.',
    ''
  ].filter((x) => x != null);

  return linhas.join('\n');
}

export function bibliotecaBenchmarksMercadoRaw() {
  return BIBLIOTECA;
}

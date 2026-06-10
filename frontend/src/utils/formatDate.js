/**
 * Data em pt-BR a partir de ISO, timestamp (ms), Date ou snake_case eventual na API.
 * Nunca retorna "Invalid Date".
 */
export function formatDatePtBr(value, options = {}) {
  const { fallback = '—', localeOptions } = options;
  if (value === null || value === undefined || value === '') return fallback;
  let d;
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === 'number' && Number.isFinite(value)) {
    d = new Date(value);
  } else if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return fallback;
    d = new Date(s);
  } else {
    return fallback;
  }
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString('pt-BR', localeOptions);
}

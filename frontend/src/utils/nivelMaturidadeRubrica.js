/**
 * Faixas oficiais da Rubrica Blueprint IA — espelho do backend.
 */
export const RUBRICA_LIMITES_NIVEL = Object.freeze([1.8, 2.6, 3.4, 4.2]);

export const RUBRICA_FAIXAS_NIVEL = Object.freeze([
  { nivel: 1, min: 1.0, max: 1.8, nome: 'Inexistente' },
  { nivel: 2, min: 1.8, max: 2.6, nome: 'Inicial' },
  { nivel: 3, min: 2.6, max: 3.4, nome: 'Definido' },
  { nivel: 4, min: 3.4, max: 4.2, nome: 'Gerenciado' },
  { nivel: 5, min: 4.2, max: 5.0, nome: 'Otimizado' }
]);

export const NOMES_NIVEL_BLUEPRINT = Object.freeze([
  'Inexistente / Experimentando',
  'Inicial / Preparando',
  'Definido / Escalando',
  'Gerenciado / Industrializando',
  'Otimizado / Liderando'
]);

export function nivelNumericoDeScore(score) {
  const s = Number(score);
  if (!Number.isFinite(s) || s < RUBRICA_LIMITES_NIVEL[0]) return 1;
  if (s < RUBRICA_LIMITES_NIVEL[1]) return 2;
  if (s < RUBRICA_LIMITES_NIVEL[2]) return 3;
  if (s < RUBRICA_LIMITES_NIVEL[3]) return 4;
  return 5;
}

export function nomeNivelBlueprint(nivel) {
  const n = Math.min(5, Math.max(1, Number(nivel) || 1));
  return NOMES_NIVEL_BLUEPRINT[n - 1];
}

export function faixaNivelPorScore(score) {
  const nivel = nivelNumericoDeScore(score);
  return RUBRICA_FAIXAS_NIVEL[nivel - 1];
}

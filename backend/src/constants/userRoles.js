/**
 * Fase 2 — perfis vinculados à empresa (Usuario.empresaId obrigatório).
 * admin/gestor/avaliador permanecem por compatibilidade.
 */
export const PERFIS_EMPRESA_FASE2 = Object.freeze(['negocios', 'ti', 'sysmap']);

/** Ordem estável para validação e UI de backend */
export const ROLES_USUARIO = Object.freeze([
  'admin',
  'gestor',
  'avaliador',
  'negocios',
  'ti',
  'sysmap',
]);

export function normalizarRole(role) {
  return String(role || '').trim().toLowerCase();
}

export function roleValido(role) {
  return ROLES_USUARIO.includes(normalizarRole(role));
}

export function perfilEhFase2Empresa(role) {
  return PERFIS_EMPRESA_FASE2.includes(normalizarRole(role));
}

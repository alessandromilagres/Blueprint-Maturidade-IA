/**
 * Fase 2 — rótulos e opções de perfil (Usuario.role + empresaId).
 */
export const PERFIL_USUARIO_LABELS = {
  admin: 'Administrador',
  gestor: 'Gestor',
  executivo: 'Executivo',
  avaliador: 'Avaliador',
  negocios: 'Negócios',
  ti: 'TI',
  sysmap: 'SysMap',
};

export function labelPerfilUsuario(role) {
  const k = String(role || '').trim().toLowerCase();
  return PERFIL_USUARIO_LABELS[k] || (role ? String(role) : 'Usuário');
}

/** Opções do select de cadastro (perfil sempre ligado à empresa selecionada) */
export const OPCOES_PERFIL_USUARIO = [
  { value: 'negocios', label: 'Negócios' },
  { value: 'ti', label: 'TI' },
  { value: 'sysmap', label: 'SysMap' },
  { value: 'executivo', label: 'Executivo' },
  { value: 'avaliador', label: 'Avaliador' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'admin', label: 'Administrador' },
];

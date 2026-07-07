/** Perfis que podem editar roadmap/iniciativas — alinhado ao módulo regulatório. */
export const PERFIS_GESTAO_EXECUCAO = ['admin', 'gestor', 'sysmap', 'negocios', 'ti', 'executivo'];

export function podeGerenciarExecucao(role) {
  return PERFIS_GESTAO_EXECUCAO.includes(String(role || '').trim().toLowerCase());
}

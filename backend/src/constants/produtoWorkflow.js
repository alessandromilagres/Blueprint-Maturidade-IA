import { normalizarRole } from './userRoles.js';

/** Quem pode iniciar / cadastrar / editar o produto (fluxo geral). */
export const ROLES_CADASTRO_PRODUTO = ['admin', 'negocios', 'ti', 'sysmap', 'gestor', 'avaliador'];

/** Etapas vi–xiii: apenas Administrador, TI ou SysMap. */
export const ROLES_DETALHAMENTO_PRODUTO = ['admin', 'ti', 'sysmap'];

/** Recebem e-mail de “requer atenção” (mesma empresa do projeto). */
export const ROLES_NOTIFICACAO_PRODUTO = ['admin', 'ti', 'sysmap'];

/** Informações financeiras e cronograma: apenas Administrador ou SysMap (mesma empresa). */
export const ROLES_FINANCEIRO_CRONOGRAMA_PRODUTO = ['admin', 'sysmap'];

export function usuarioPodeIniciarCadastroProduto(usuario, empresaIdProjeto) {
  if (!usuario) return false;
  const r = normalizarRole(usuario.role);
  if (r === 'admin') return true;
  if (!ROLES_CADASTRO_PRODUTO.includes(r)) return false;
  return Number(usuario.empresaId) === Number(empresaIdProjeto);
}

export function usuarioPodeEditarDetalhamentoProduto(usuario, empresaIdProjeto) {
  if (!usuario) return false;
  const r = normalizarRole(usuario.role);
  if (r === 'admin') return true;
  if (!ROLES_DETALHAMENTO_PRODUTO.includes(r)) return false;
  return Number(usuario.empresaId) === Number(empresaIdProjeto);
}

export function usuarioPodeEditarFinanceiroCronogramaProduto(usuario, empresaIdProjeto) {
  if (!usuario) return false;
  const r = normalizarRole(usuario.role);
  if (r === 'admin') return true;
  if (r !== 'sysmap') return false;
  return Number(usuario.empresaId) === Number(empresaIdProjeto);
}

/** Etapas i–v: qualquer usuário da mesma empresa (incl. gestor, avaliador). */
export function usuarioMesmaEmpresaProjeto(usuario, empresaIdProjeto) {
  if (!usuario) return false;
  if (normalizarRole(usuario.role) === 'admin') return true;
  return Number(usuario.empresaId) === Number(empresaIdProjeto);
}

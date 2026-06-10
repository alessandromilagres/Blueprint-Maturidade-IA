export const ROLES_CADASTRO_PRODUTO = ['admin', 'negocios', 'ti', 'sysmap', 'gestor', 'avaliador'];
export const ROLES_DETALHAMENTO_PRODUTO = ['admin', 'ti', 'sysmap'];

export const CATEGORIA_ARQUIVO_FASE1 = 'cadastro_fase1';
export const CATEGORIA_ARQUIVO_FASE2 = 'cadastro_fase2';

export function podeIniciarCadastroProduto(usuario) {
  const r = String(usuario?.role || '').trim().toLowerCase();
  if (r === 'admin') return true;
  return ROLES_CADASTRO_PRODUTO.includes(r);
}

export function podeDetalhamentoTecnicoProduto(usuario) {
  const r = String(usuario?.role || '').trim().toLowerCase();
  if (r === 'admin') return true;
  return ROLES_DETALHAMENTO_PRODUTO.includes(r);
}

/** Etapas i–v: qualquer perfil da empresa (cadastro colaborativo). */
export function podeEditarEtapasIniciais(usuario, empresaIdProjeto) {
  if (!usuario) return false;
  const r = String(usuario.role || '').trim().toLowerCase();
  if (r === 'admin') return true;
  return Number(usuario.empresaId) === Number(empresaIdProjeto);
}

/** Informações financeiras e cronograma: apenas Administrador ou SysMap (mesma empresa do projeto). */
export function podeFinanceiroCronogramaProduto(usuario, empresaIdProjeto) {
  if (!usuario) return false;
  const r = String(usuario.role || '').trim().toLowerCase();
  if (r === 'admin') return true;
  if (r !== 'sysmap') return false;
  if (empresaIdProjeto == null || empresaIdProjeto === '') return false;
  return Number(usuario.empresaId) === Number(empresaIdProjeto);
}

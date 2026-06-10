/**
 * Rótulo amigável para heartbeat / observabilidade (pathname sem query).
 * Ordem: rotas mais específicas primeiro.
 */
export function rotuloParaRota(pathname) {
  if (!pathname || pathname === '/') return 'Dashboard';

  const pairs = [
    [/^\/empresas\/\d+$/, 'Empresa — detalhe'],
    [/^\/empresas$/, 'Empresas'],
    [/^\/projetos\/\d+$/, 'Projeto — detalhe'],
    [/^\/projetos$/, 'Projetos'],
    [/^\/produtos\/novo\/(convencional|design-thinking)$/, 'Novo produto — cadastro'],
    [/^\/produtos\/novo$/, 'Novo produto — escolha do modelo'],
    [/^\/produtos\/\d+\/idealizacao$/, 'Idealização do produto'],
    [/^\/produtos\/\d+\/especificacao$/, 'Especificação automática'],
    [/^\/produtos\/\d+\/editar$/, 'Editar produto'],
    [/^\/produtos\/\d+$/, 'Produto — detalhe'],
    [/^\/produtos$/, 'Produtos IA-First'],
    [/^\/avaliacoes-produto\/\d+$/, 'Avaliação de produto'],
    [/^\/avaliacoes\/\d+$/, 'Avaliação de maturidade'],
    [/^\/avaliacoes$/, 'Avaliações'],
    [/^\/especificacoes$/, 'Biblioteca de especificações'],
    [/^\/usuarios$/, 'Usuários'],
    [/^\/observabilidade$/, 'Observabilidade'],
    [/^\/configuracoes\/ia$/, 'Configurações IA'],
    [/^\/biblioteca-ia$/, 'Biblioteca de relatórios IA'],
    [/^\/relatorios\/\d+/, 'Relatório'],
    [/^\/dashboard\/projeto\/\d+$/, 'Dashboard do projeto'],
    [/^\/dashboard\/empresa\/\d+$/, 'Dashboard da empresa'],
    [/^\/dashboard\/produto\/\d+$/, 'Dashboard do produto'],
    [/^\/dashboard\/projetos-ranking$/, 'Ranking de projetos'],
    [/^\/dashboard\/projeto-produtos\/\d+$/, 'Produtos no projeto'],
    [/^\/dashboard\/projeto-financeiro\/\d+$/, 'Financeiro do projeto'],
    [/^\/estagio-ai-first$/, 'Estágio AI-First'],
    [/^\/arquiteturas-referencia/, 'Arquiteturas de referência'],
    [/^\/diagnosticos$/, 'Diagnósticos']
  ];

  for (const [re, label] of pairs) {
    if (re.test(pathname)) return label;
  }

  return pathname;
}

const DIMENSOES = {
  estrategia: 'Estratégia e Liderança',
  governanca: 'Governança e Risco',
  dados: 'Dados e Tecnologia',
  plataforma: 'Plataforma e Industrialização de IA',
  maturidadeTipo: 'Maturidade por Tipo de IA',
  talentos: 'Talentos e Capacidades',
  cultura: 'Pessoas e Cultura',
  operacoes: 'Operações e Processos',
  inovacao: 'Inovação e Experimentação',
  roi: 'Valor de Negócio e ROI',
  receita: 'IA como Gerador de Receita',
  valorUnidade: 'Valor por Unidade de Negócio',
  ecossistema: 'Ecossistema e Parcerias',
  eficacia: 'Eficácia de IA (MIT CISR)',
  conformidade: 'Conformidade Regulatória',
  mudanca: 'Prontidão para Mudança'
};

export const MAPA_CARGOS_DIMENSOES_AVALIACAO = {
  CEO: [
    DIMENSOES.estrategia,
    DIMENSOES.governanca,
    DIMENSOES.dados,
    DIMENSOES.maturidadeTipo,
    DIMENSOES.talentos,
    DIMENSOES.cultura,
    DIMENSOES.operacoes,
    DIMENSOES.inovacao,
    DIMENSOES.roi,
    DIMENSOES.receita,
    DIMENSOES.valorUnidade,
    DIMENSOES.ecossistema,
    DIMENSOES.eficacia,
    DIMENSOES.conformidade,
    DIMENSOES.mudanca
  ],
  CIO: [
    DIMENSOES.estrategia,
    DIMENSOES.governanca,
    DIMENSOES.dados,
    DIMENSOES.maturidadeTipo,
    DIMENSOES.talentos,
    DIMENSOES.inovacao,
    DIMENSOES.roi,
    DIMENSOES.receita,
    DIMENSOES.valorUnidade,
    DIMENSOES.ecossistema,
    DIMENSOES.eficacia,
    DIMENSOES.conformidade,
    DIMENSOES.mudanca
  ],
  CTO: [
    DIMENSOES.estrategia,
    DIMENSOES.governanca,
    DIMENSOES.dados,
    DIMENSOES.plataforma,
    DIMENSOES.maturidadeTipo,
    DIMENSOES.talentos,
    DIMENSOES.inovacao,
    DIMENSOES.receita,
    DIMENSOES.ecossistema,
    DIMENSOES.conformidade
  ],
  COO: [
    DIMENSOES.estrategia,
    DIMENSOES.governanca,
    DIMENSOES.dados,
    DIMENSOES.maturidadeTipo,
    DIMENSOES.talentos,
    DIMENSOES.cultura,
    DIMENSOES.operacoes,
    DIMENSOES.inovacao,
    DIMENSOES.roi,
    DIMENSOES.receita,
    DIMENSOES.valorUnidade,
    DIMENSOES.ecossistema,
    DIMENSOES.eficacia,
    DIMENSOES.conformidade,
    DIMENSOES.mudanca
  ],
  'Governança Operacional': [
    DIMENSOES.estrategia,
    DIMENSOES.governanca,
    DIMENSOES.talentos,
    DIMENSOES.cultura,
    DIMENSOES.operacoes,
    DIMENSOES.roi,
    DIMENSOES.receita,
    DIMENSOES.valorUnidade,
    DIMENSOES.ecossistema,
    DIMENSOES.eficacia,
    DIMENSOES.conformidade,
    DIMENSOES.mudanca
  ],
  Negócios: [
    DIMENSOES.estrategia,
    DIMENSOES.governanca,
    DIMENSOES.talentos,
    DIMENSOES.cultura,
    DIMENSOES.operacoes,
    DIMENSOES.roi,
    DIMENSOES.receita,
    DIMENSOES.valorUnidade,
    DIMENSOES.ecossistema,
    DIMENSOES.eficacia,
    DIMENSOES.conformidade,
    DIMENSOES.mudanca
  ],
  'Head de Arquitetura': [
    DIMENSOES.estrategia,
    DIMENSOES.governanca,
    DIMENSOES.dados,
    DIMENSOES.plataforma,
    DIMENSOES.maturidadeTipo,
    DIMENSOES.inovacao,
    DIMENSOES.receita,
    DIMENSOES.ecossistema
  ],
  Produto: [
    DIMENSOES.estrategia,
    DIMENSOES.governanca,
    DIMENSOES.dados,
    DIMENSOES.plataforma,
    DIMENSOES.maturidadeTipo,
    DIMENSOES.inovacao,
    DIMENSOES.receita,
    DIMENSOES.ecossistema
  ],
  'Governança de Sistemas': [
    DIMENSOES.governanca,
    DIMENSOES.dados,
    DIMENSOES.plataforma,
    DIMENSOES.operacoes,
    DIMENSOES.ecossistema,
    DIMENSOES.conformidade
  ],
  'Infra e Segurança': [
    DIMENSOES.governanca,
    DIMENSOES.dados,
    DIMENSOES.plataforma,
    DIMENSOES.operacoes,
    DIMENSOES.ecossistema,
    DIMENSOES.conformidade
  ],
  Delivery: [
    DIMENSOES.plataforma,
    DIMENSOES.maturidadeTipo,
    DIMENSOES.talentos,
    DIMENSOES.cultura,
    DIMENSOES.operacoes,
    DIMENSOES.inovacao,
    DIMENSOES.roi,
    DIMENSOES.receita,
    DIMENSOES.valorUnidade,
    DIMENSOES.eficacia,
    DIMENSOES.mudanca
  ],
  PMO: [
    DIMENSOES.governanca,
    DIMENSOES.talentos,
    DIMENSOES.cultura,
    DIMENSOES.operacoes,
    DIMENSOES.inovacao,
    DIMENSOES.roi,
    DIMENSOES.valorUnidade,
    DIMENSOES.eficacia,
    DIMENSOES.mudanca
  ],
  RH: [
    DIMENSOES.talentos,
    DIMENSOES.cultura,
    DIMENSOES.conformidade,
    DIMENSOES.mudanca
  ]
};

const ALIASES_CARGOS = [
  ['Head de Arquitetura', ['head de arquitetura', 'arquitetura', 'arquiteto']],
  ['Infra e Segurança', ['infra e seguranca', 'infraestrutura', 'seguranca', 'security', 'cyber', 'ciso']],
  ['Governança de Sistemas', ['governanca de sistemas', 'sistemas', 'erp', 'governanca ti']],
  ['Governança Operacional', ['governanca operacional', 'compliance operacional', 'controles internos']],
  ['Produto', ['produto', 'product', 'product owner', 'product manager', 'po']],
  ['Delivery', ['delivery', 'entrega', 'scrum', 'agile', 'squad']],
  ['PMO', ['pmo', 'project management office', 'gerente de projetos', 'coordenador de projetos']],
  ['RH', ['rh', 'recursos humanos', 'people', 'gente', 'dho', 'talent']],
  ['Negócios', ['negocios', 'business', 'comercial', 'vendas', 'diretor comercial']],
  ['CTO', ['cto', 'chief technology', 'diretor de tecnologia', 'tecnologia']],
  ['CIO', ['cio', 'chief information', 'diretor de ti', 'head de ti', 'ti']],
  ['COO', ['coo', 'chief operating', 'diretor de operacoes', 'operacoes']],
  ['CEO', ['ceo', 'chief executive', 'presidente', 'diretor geral', 'executivo']]
];

function normalizarTexto(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function inferirPerfilCargoAvaliador(cargo) {
  const c = normalizarTexto(cargo);
  if (!c) return null;
  for (const [perfil, aliases] of ALIASES_CARGOS) {
    if (aliases.some((alias) => c.includes(normalizarTexto(alias)))) {
      return perfil;
    }
  }
  return null;
}

export function nomesDimensoesPorCargoAvaliador(cargo) {
  const perfil = inferirPerfilCargoAvaliador(cargo);
  return perfil ? MAPA_CARGOS_DIMENSOES_AVALIACAO[perfil] || [] : [];
}

export function idsAreasSugeridasPorCargo(cargo, areas = []) {
  const nomes = new Set(nomesDimensoesPorCargoAvaliador(cargo).map(normalizarTexto));
  if (nomes.size === 0) return [];
  return areas
    .filter((area) => nomes.has(normalizarTexto(area.nome)))
    .map((area) => area.id);
}

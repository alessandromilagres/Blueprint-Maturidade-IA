// Gerador de Relatório Word - SysMap Blueprint IA
// Baseado no MIT CISR Enterprise AI Maturity Model

import {
  escalarRoiPercentModelo,
  multiplicadorRoiPorFaturamento,
  percentualReferenciaRoi
} from './roiPorFaturamento.js';

// =============================================================================
// BENCHMARKING POR VERTICAL (Dados de mercado baseados em pesquisas de 2024)
// =============================================================================
const BENCHMARKING_POR_VERTICAL = {
  fintech: {
    mediaSetor: 3.2,
    top25: 4.1,
    bottom25: 2.1,
    distribuicao: { nivel1: 15, nivel2: 25, nivel3: 30, nivel4: 22, nivel5: 8 },
    tendencia: 'crescente',
    fonte: 'MIT CISR Financial Services AI Study 2024'
  },
  saude: {
    mediaSetor: 2.6,
    top25: 3.5,
    bottom25: 1.8,
    distribuicao: { nivel1: 25, nivel2: 30, nivel3: 28, nivel4: 14, nivel5: 3 },
    tendencia: 'crescente',
    fonte: 'HIMSS Analytics Healthcare AI Adoption Report 2024'
  },
  tecnologia: {
    mediaSetor: 3.5,
    top25: 4.4,
    bottom25: 2.5,
    distribuicao: { nivel1: 10, nivel2: 20, nivel3: 30, nivel4: 28, nivel5: 12 },
    tendencia: 'estável-alto',
    fonte: 'Gartner Tech Industry AI Maturity Index 2024'
  },
  ecommerce: {
    mediaSetor: 3.1,
    top25: 4.0,
    bottom25: 2.0,
    distribuicao: { nivel1: 18, nivel2: 25, nivel3: 32, nivel4: 18, nivel5: 7 },
    tendencia: 'crescente',
    fonte: 'Forrester Retail AI Readiness Survey 2024'
  },
  manufatura: {
    mediaSetor: 2.4,
    top25: 3.3,
    bottom25: 1.6,
    distribuicao: { nivel1: 30, nivel2: 32, nivel3: 25, nivel4: 10, nivel5: 3 },
    tendencia: 'crescente',
    fonte: 'McKinsey Industry 4.0 AI Adoption Study 2024'
  },
  legaltech: {
    mediaSetor: 2.3,
    top25: 3.2,
    bottom25: 1.5,
    distribuicao: { nivel1: 35, nivel2: 30, nivel3: 22, nivel4: 10, nivel5: 3 },
    tendencia: 'crescente',
    fonte: 'Thomson Reuters Legal AI Adoption Report 2024'
  },
  edtech: {
    mediaSetor: 2.8,
    top25: 3.7,
    bottom25: 1.9,
    distribuicao: { nivel1: 22, nivel2: 28, nivel3: 30, nivel4: 15, nivel5: 5 },
    tendencia: 'crescente',
    fonte: 'HolonIQ EdTech AI Index 2024'
  },
  aifirst: {
    mediaSetor: 3.8,
    top25: 4.6,
    bottom25: 2.8,
    distribuicao: { nivel1: 8, nivel2: 15, nivel3: 25, nivel4: 32, nivel5: 20 },
    tendencia: 'estável-alto',
    fonte: 'AI Engineering Maturity Benchmark 2024'
  },
  agrovert: {
    mediaSetor: 2.2,
    top25: 3.1,
    bottom25: 1.4,
    distribuicao: { nivel1: 38, nivel2: 30, nivel3: 20, nivel4: 9, nivel5: 3 },
    tendencia: 'crescente',
    fonte: 'AgFunder AgTech AI Adoption Report 2024'
  }
};

// =============================================================================
// PROJEÇÃO DE IMPACTO FINANCEIRO POR NÍVEL DE MATURIDADE
// =============================================================================
const PROJECAO_FINANCEIRA_POR_NIVEL = {
  1: {
    crescimentoReceita: { min: -5, max: 0, media: -2 },
    reducaoCustos: { min: 0, max: 5, media: 2 },
    roiEsperado: { min: -50, max: 50, media: 0 },
    tempoParaROI: '18-24 meses',
    investimentoRecomendado: '0.5% a 1% do faturamento',
    riscosFinanceiros: [
      'Investimentos sem retorno mensurável',
      'Custos ocultos de experimentação',
      'Perda de oportunidade de mercado'
    ]
  },
  2: {
    crescimentoReceita: { min: 0, max: 5, media: 2 },
    reducaoCustos: { min: 3, max: 8, media: 5 },
    roiEsperado: { min: 50, max: 150, media: 100 },
    tempoParaROI: '12-18 meses',
    investimentoRecomendado: '1% a 2% do faturamento',
    riscosFinanceiros: [
      'Pilotos sem escala não geram valor',
      'Custos de infraestrutura iniciais',
      'Dificuldade de demonstrar valor'
    ]
  },
  3: {
    crescimentoReceita: { min: 3, max: 10, media: 6 },
    reducaoCustos: { min: 5, max: 15, media: 10 },
    roiEsperado: { min: 150, max: 300, media: 200 },
    tempoParaROI: '9-12 meses',
    investimentoRecomendado: '2% a 4% do faturamento',
    riscosFinanceiros: [
      'Escalabilidade de modelos',
      'Custos de MLOps crescentes',
      'Dependência de talentos escassos'
    ]
  },
  4: {
    crescimentoReceita: { min: 8, max: 18, media: 12 },
    reducaoCustos: { min: 10, max: 25, media: 18 },
    roiEsperado: { min: 300, max: 500, media: 400 },
    tempoParaROI: '6-9 meses',
    investimentoRecomendado: '4% a 7% do faturamento',
    riscosFinanceiros: [
      'Complexidade de governança',
      'Custos de manutenção de modelos',
      'Riscos regulatórios'
    ]
  },
  5: {
    crescimentoReceita: { min: 15, max: 30, media: 22 },
    reducaoCustos: { min: 20, max: 35, media: 28 },
    roiEsperado: { min: 500, max: 1000, media: 700 },
    tempoParaROI: '3-6 meses',
    investimentoRecomendado: '7% a 12% do faturamento',
    riscosFinanceiros: [
      'Disrupção tecnológica',
      'Dependência crítica de IA',
      'Custos de inovação contínua'
    ]
  }
};

// =============================================================================
// MATRIZ DE DEPENDÊNCIAS - SEQUÊNCIA CRÍTICA DE IMPLEMENTAÇÃO
// =============================================================================
const MATRIZ_DEPENDENCIAS = {
  areas: [
    { id: 1, nome: 'Estratégia e Liderança', prioridade: 1, dependencias: [], habilitaAcoes: [2, 3, 7, 9, 12] },
    { id: 2, nome: 'Dados e Tecnologia', prioridade: 2, dependencias: [1], habilitaAcoes: [5, 6] },
    { id: 3, nome: 'Governança e Risco', prioridade: 2, dependencias: [1], habilitaAcoes: [5, 8, 11] },
    { id: 4, nome: 'Pessoas e Cultura', prioridade: 3, dependencias: [1, 10, 12], habilitaAcoes: [5, 6] },
    { id: 5, nome: 'Operações e Processos', prioridade: 4, dependencias: [2, 3, 4], habilitaAcoes: [6] },
    { id: 6, nome: 'Inovação e Experimentação', prioridade: 5, dependencias: [2, 4, 5], habilitaAcoes: [7] },
    { id: 7, nome: 'Valor de Negócio e ROI', prioridade: 3, dependencias: [1], habilitaAcoes: [8, 9] },
    { id: 8, nome: 'Ecossistema e Parcerias', prioridade: 5, dependencias: [3, 7], habilitaAcoes: [] },
    { id: 9, nome: 'Valor por Unidade de Negócio', prioridade: 3, dependencias: [1, 7], habilitaAcoes: [5, 6] },
    { id: 10, nome: 'Talentos e Capacidades', prioridade: 2, dependencias: [1], habilitaAcoes: [4, 5, 6] },
    { id: 11, nome: 'Conformidade Regulatória', prioridade: 2, dependencias: [1, 3], habilitaAcoes: [5, 8] },
    { id: 12, nome: 'Prontidão para Mudança', prioridade: 2, dependencias: [1], habilitaAcoes: [4, 5, 6] }
  ],
  sequenciaCritica: [
    { fase: 1, areas: ['Estratégia e Liderança'], descricao: 'Fundação - define direção e prioridades', duracao: '1-2 meses' },
    { fase: 2, areas: ['Dados e Tecnologia', 'Governança e Risco', 'Talentos e Capacidades', 'Conformidade Regulatória', 'Prontidão para Mudança'], descricao: 'Infraestrutura, Talentos e Compliance - habilita execução segura', duracao: '2-4 meses' },
    { fase: 3, areas: ['Pessoas e Cultura', 'Valor de Negócio e ROI', 'Valor por Unidade de Negócio'], descricao: 'Capacitação e Valor - desenvolve talentos e mapeia valor', duracao: '3-6 meses' },
    { fase: 4, areas: ['Operações e Processos'], descricao: 'Execução - coloca IA em produção', duracao: '4-8 meses' },
    { fase: 5, areas: ['Inovação e Experimentação', 'Ecossistema e Parcerias'], descricao: 'Escala - amplia impacto', duracao: '6-12 meses' }
  ],
  acoesCriticas: {
    'Estratégia e Liderança': {
      acaoPrincipal: 'Definir e aprovar estratégia de IA',
      preRequisitos: ['Alinhamento C-Level', 'Análise de mercado'],
      habilitaAcoes: ['Alocação de orçamento', 'Priorização de casos de uso', 'Definição de governança']
    },
    'Dados e Tecnologia': {
      acaoPrincipal: 'Criar infraestrutura de dados e MLOps',
      preRequisitos: ['Estratégia aprovada', 'Orçamento alocado'],
      habilitaAcoes: ['Desenvolvimento de modelos', 'Automação de processos', 'Experimentação']
    },
    'Governança e Risco': {
      acaoPrincipal: 'Estabelecer framework de governança',
      preRequisitos: ['Estratégia aprovada', 'Políticas de dados'],
      habilitaAcoes: ['Deploy seguro de modelos', 'Compliance regulatório', 'Parcerias externas']
    },
    'Pessoas e Cultura': {
      acaoPrincipal: 'Capacitar e contratar talentos',
      preRequisitos: ['Estratégia aprovada', 'Plano de carreira'],
      habilitaAcoes: ['Execução de projetos', 'Inovação interna', 'Adoção organizacional']
    },
    'Operações e Processos': {
      acaoPrincipal: 'Colocar modelos em produção',
      preRequisitos: ['Infraestrutura de dados', 'Governança', 'Equipe capacitada'],
      habilitaAcoes: ['Geração de valor', 'Escala de automação', 'Métricas de ROI']
    },
    'Inovação e Experimentação': {
      acaoPrincipal: 'Criar pipeline de inovação contínua',
      preRequisitos: ['Infraestrutura', 'Cultura de experimentação', 'Processos maduros'],
      habilitaAcoes: ['Novos produtos', 'Vantagem competitiva', 'Parcerias estratégicas']
    },
    'Valor de Negócio e ROI': {
      acaoPrincipal: 'Implementar medição de valor',
      preRequisitos: ['Estratégia', 'Métricas definidas'],
      habilitaAcoes: ['Priorização baseada em dados', 'Business cases', 'Comunicação de resultados']
    },
    'Ecossistema e Parcerias': {
      acaoPrincipal: 'Desenvolver rede de parceiros',
      preRequisitos: ['Governança', 'Capacidade de integração', 'ROI comprovado'],
      habilitaAcoes: ['Aceleração de inovação', 'Acesso a tecnologia', 'Co-criação']
    },
    'Valor por Unidade de Negócio': {
      acaoPrincipal: 'Mapear e priorizar valor de IA por unidade',
      preRequisitos: ['Estratégia aprovada', 'ROI definido', 'Unidades identificadas'],
      habilitaAcoes: ['Priorização de investimentos', 'Autonomia das unidades', 'Compartilhamento de soluções']
    },
    'Talentos e Capacidades': {
      acaoPrincipal: 'Realizar gap analysis e plano de desenvolvimento',
      preRequisitos: ['Estratégia aprovada', 'Inventário de skills', 'Necessidades mapeadas'],
      habilitaAcoes: ['Recrutamento direcionado', 'Upskilling estruturado', 'Retenção de talentos']
    },
    'Conformidade Regulatória': {
      acaoPrincipal: 'Estabelecer programa de compliance em IA',
      preRequisitos: ['Governança definida', 'Regulações mapeadas', 'Jurídico envolvido'],
      habilitaAcoes: ['Deploy seguro', 'Explicabilidade', 'Auditoria contínua']
    },
    'Prontidão para Mudança': {
      acaoPrincipal: 'Implementar gestão de mudança organizacional',
      preRequisitos: ['Estratégia aprovada', 'Patrocínio executivo', 'Comunicação estruturada'],
      habilitaAcoes: ['Adoção sustentável', 'Redução de resistências', 'Capacitação organizacional', 'Cultura de transformação']
    }
  }
};

// =============================================================================
// ANÁLISE DE CENÁRIOS (CONSERVADOR, BASE, AGRESSIVO)
// =============================================================================
const CENARIOS_EVOLUCAO = {
  conservador: {
    nome: 'Conservador',
    descricao: 'Evolução gradual com foco em fundamentos e baixo risco',
    velocidadeEvolucao: 0.3, // níveis por ano
    investimentoRelativo: 0.6, // 60% do recomendado
    timeline: {
      1: { tempoParaProximoNivel: '24-36 meses', investimento: 'Baixo', foco: 'Capacitação e governança' },
      2: { tempoParaProximoNivel: '18-24 meses', investimento: 'Baixo-Médio', foco: 'Pilotos selecionados' },
      3: { tempoParaProximoNivel: '18-24 meses', investimento: 'Médio', foco: 'Escala gradual' },
      4: { tempoParaProximoNivel: '24-30 meses', investimento: 'Médio', foco: 'Otimização contínua' },
      5: { tempoParaProximoNivel: 'N/A', investimento: 'Médio', foco: 'Manutenção de liderança' }
    },
    riscos: 'Perda de competitividade para concorrentes mais ágeis',
    adequadoPara: 'Organizações com baixa tolerância a risco ou setores altamente regulados'
  },
  base: {
    nome: 'Base (Recomendado)',
    descricao: 'Evolução balanceada com investimento proporcional ao retorno',
    velocidadeEvolucao: 0.5, // níveis por ano
    investimentoRelativo: 1.0, // 100% do recomendado
    timeline: {
      1: { tempoParaProximoNivel: '12-18 meses', investimento: 'Médio', foco: 'Fundação sólida' },
      2: { tempoParaProximoNivel: '12-15 meses', investimento: 'Médio', foco: 'Pilotos estratégicos' },
      3: { tempoParaProximoNivel: '12-18 meses', investimento: 'Médio-Alto', foco: 'Industrialização' },
      4: { tempoParaProximoNivel: '18-24 meses', investimento: 'Alto', foco: 'Escala e otimização' },
      5: { tempoParaProximoNivel: 'N/A', investimento: 'Alto', foco: 'Inovação contínua' }
    },
    riscos: 'Balanceado entre velocidade e sustentabilidade',
    adequadoPara: 'Maioria das organizações com ambição de transformação digital'
  },
  agressivo: {
    nome: 'Agressivo',
    descricao: 'Transformação acelerada com alto investimento e tolerância a risco',
    velocidadeEvolucao: 0.8, // níveis por ano
    investimentoRelativo: 1.5, // 150% do recomendado
    timeline: {
      1: { tempoParaProximoNivel: '6-9 meses', investimento: 'Alto', foco: 'Fast track completo' },
      2: { tempoParaProximoNivel: '6-9 meses', investimento: 'Alto', foco: 'Múltiplos pilotos paralelos' },
      3: { tempoParaProximoNivel: '9-12 meses', investimento: 'Muito Alto', foco: 'Escala rápida' },
      4: { tempoParaProximoNivel: '12-15 meses', investimento: 'Muito Alto', foco: 'Liderança de mercado' },
      5: { tempoParaProximoNivel: 'N/A', investimento: 'Muito Alto', foco: 'Disrupção do setor' }
    },
    riscos: 'Alto risco de execução, queima de caixa, exaustão de equipe',
    adequadoPara: 'Startups, scale-ups ou empresas em mercados altamente competitivos'
  }
};

// =============================================================================
// INDICADORES DE SAÚDE (HEALTH INDICATORS) POR VERTICAL E NÍVEL
// =============================================================================
const INDICADORES_SAUDE = {
  estrategia: {
    nome: 'Saúde Estratégica',
    indicadores: [
      { nome: 'Clareza da visão de IA', peso: 0.3, avaliacaoAreas: [1] },
      { nome: 'Alinhamento C-Level', peso: 0.3, avaliacaoAreas: [1] },
      { nome: 'Consistência orçamentária', peso: 0.2, avaliacaoAreas: [1] },
      { nome: 'Roadmap definido', peso: 0.2, avaliacaoAreas: [1] }
    ],
    thresholds: { critico: 2.0, atencao: 3.0, saudavel: 4.0 }
  },
  execucao: {
    nome: 'Saúde de Execução',
    indicadores: [
      { nome: 'Modelos em produção', peso: 0.25, avaliacaoAreas: [5] },
      { nome: 'Qualidade de dados', peso: 0.25, avaliacaoAreas: [2] },
      { nome: 'Automação de processos', peso: 0.25, avaliacaoAreas: [5] },
      { nome: 'MLOps maduro', peso: 0.25, avaliacaoAreas: [2] }
    ],
    thresholds: { critico: 1.8, atencao: 2.8, saudavel: 3.8 }
  },
  pessoas: {
    nome: 'Saúde de Pessoas',
    indicadores: [
      { nome: 'Disponibilidade de talentos', peso: 0.3, avaliacaoAreas: [4] },
      { nome: 'Capacitação contínua', peso: 0.25, avaliacaoAreas: [4] },
      { nome: 'Cultura de experimentação', peso: 0.25, avaliacaoAreas: [4] },
      { nome: 'Colaboração TI-Negócio', peso: 0.2, avaliacaoAreas: [4] }
    ],
    thresholds: { critico: 2.0, atencao: 3.0, saudavel: 4.0 }
  },
  governanca: {
    nome: 'Saúde de Governança',
    indicadores: [
      { nome: 'Framework de governança', peso: 0.3, avaliacaoAreas: [3] },
      { nome: 'Compliance regulatório', peso: 0.3, avaliacaoAreas: [3] },
      { nome: 'Gestão de riscos', peso: 0.2, avaliacaoAreas: [3] },
      { nome: 'Ética em IA', peso: 0.2, avaliacaoAreas: [3] }
    ],
    thresholds: { critico: 1.8, atencao: 2.8, saudavel: 3.8 }
  },
  valor: {
    nome: 'Saúde de Valor',
    indicadores: [
      { nome: 'ROI mensurável', peso: 0.3, avaliacaoAreas: [7] },
      { nome: 'Alinhamento financeiro', peso: 0.25, avaliacaoAreas: [7] },
      { nome: 'Priorização por valor', peso: 0.25, avaliacaoAreas: [7] },
      { nome: 'Comunicação de resultados', peso: 0.2, avaliacaoAreas: [7] }
    ],
    thresholds: { critico: 1.8, atencao: 2.8, saudavel: 3.8 }
  }
};

// KPIs específicos por vertical (complementa os KPIs genéricos)
const KPIS_ESPECIFICOS_VERTICAL = {
  fintech: {
    operacionais: [
      { nome: 'Taxa de detecção de fraude', unidade: '%', benchmark: { baixo: 85, medio: 92, alto: 98 } },
      { nome: 'Tempo médio de aprovação de crédito', unidade: 'horas', benchmark: { baixo: 48, medio: 24, alto: 2 } },
      { nome: 'Taxa de automação de compliance', unidade: '%', benchmark: { baixo: 30, medio: 60, alto: 90 } }
    ],
    financeiros: [
      { nome: 'Redução de perdas por fraude', unidade: '%', benchmark: { baixo: 10, medio: 30, alto: 50 } },
      { nome: 'Aumento de conversão por personalização', unidade: '%', benchmark: { baixo: 5, medio: 15, alto: 30 } },
      { nome: 'Economia em custos operacionais', unidade: '%', benchmark: { baixo: 5, medio: 15, alto: 25 } }
    ]
  },
  saude: {
    operacionais: [
      { nome: 'Acurácia de diagnóstico assistido', unidade: '%', benchmark: { baixo: 80, medio: 90, alto: 97 } },
      { nome: 'Redução de tempo de espera', unidade: '%', benchmark: { baixo: 15, medio: 30, alto: 50 } },
      { nome: 'Taxa de readmissão evitada', unidade: '%', benchmark: { baixo: 5, medio: 15, alto: 30 } }
    ],
    financeiros: [
      { nome: 'Economia por paciente/ano', unidade: 'R$', benchmark: { baixo: 500, medio: 2000, alto: 5000 } },
      { nome: 'Aumento de throughput clínico', unidade: '%', benchmark: { baixo: 10, medio: 25, alto: 40 } },
      { nome: 'ROI de equipamentos com IA', unidade: '%', benchmark: { baixo: 50, medio: 150, alto: 300 } }
    ]
  },
  tecnologia: {
    operacionais: [
      { nome: 'Aumento produtividade de devs', unidade: '%', benchmark: { baixo: 15, medio: 35, alto: 55 } },
      { nome: 'Redução de MTTR (incidentes)', unidade: '%', benchmark: { baixo: 20, medio: 40, alto: 70 } },
      { nome: 'Cobertura de testes automatizados', unidade: '%', benchmark: { baixo: 50, medio: 75, alto: 95 } }
    ],
    financeiros: [
      { nome: 'Economia em infraestrutura (FinOps)', unidade: '%', benchmark: { baixo: 10, medio: 25, alto: 40 } },
      { nome: 'Redução de custo por deploy', unidade: '%', benchmark: { baixo: 15, medio: 35, alto: 60 } },
      { nome: 'ROI de ferramentas de IA', unidade: '%', benchmark: { baixo: 100, medio: 250, alto: 500 } }
    ]
  },
  ecommerce: {
    operacionais: [
      { nome: 'Lift em conversão', unidade: '%', benchmark: { baixo: 5, medio: 15, alto: 30 } },
      { nome: 'Precisão de recomendações', unidade: '%', benchmark: { baixo: 20, medio: 40, alto: 60 } },
      { nome: 'Redução de churn', unidade: '%', benchmark: { baixo: 10, medio: 25, alto: 40 } }
    ],
    financeiros: [
      { nome: 'Aumento de ticket médio', unidade: '%', benchmark: { baixo: 5, medio: 12, alto: 25 } },
      { nome: 'ROAS de campanhas otimizadas', unidade: 'x', benchmark: { baixo: 3, medio: 6, alto: 12 } },
      { nome: 'Aumento de LTV', unidade: '%', benchmark: { baixo: 10, medio: 30, alto: 60 } }
    ]
  },
  manufatura: {
    operacionais: [
      { nome: 'Redução de paradas não planejadas', unidade: '%', benchmark: { baixo: 15, medio: 35, alto: 60 } },
      { nome: 'Melhoria de OEE', unidade: 'pontos', benchmark: { baixo: 3, medio: 8, alto: 15 } },
      { nome: 'Redução de defeitos', unidade: '%', benchmark: { baixo: 10, medio: 30, alto: 50 } }
    ],
    financeiros: [
      { nome: 'Economia em manutenção', unidade: '%', benchmark: { baixo: 10, medio: 25, alto: 45 } },
      { nome: 'Redução de perdas de produção', unidade: '%', benchmark: { baixo: 5, medio: 15, alto: 30 } },
      { nome: 'ROI de projetos Indústria 4.0', unidade: '%', benchmark: { baixo: 80, medio: 200, alto: 400 } }
    ]
  }
};

// Recomendações específicas por vertical (baseado em frameworks de indústria)
const VERTICAIS_CONFIG = {
  health: {
    nome: 'Health (Saúde)',
    icon: '🏥',
    frameworks: ['HIMSS Analytics EMRAM', 'AMIA Clinical AI Guidelines', 'FDA AI/ML Framework'],
    casosDeUso: [
      'Diagnóstico assistido por IA (imagens médicas, patologia)',
      'Predição de readmissão e deterioração de pacientes',
      'Otimização de agendamento e fluxo de pacientes',
      'Assistentes virtuais para triagem e pré-consulta',
      'Descoberta de medicamentos e ensaios clínicos',
      'Personalização de tratamentos (medicina de precisão)'
    ],
    desafiosEspecificos: [
      'Regulamentação rigorosa (ANVISA, FDA) para dispositivos médicos com IA',
      'Privacidade de dados sensíveis de saúde (LGPD, HIPAA)',
      'Necessidade de explicabilidade em decisões clínicas',
      'Integração com sistemas legados (EHR, PACS, LIS)',
      'Viés algorítmico em populações sub-representadas',
      'Validação clínica e aprovação regulatória'
    ],
    recomendacoesPorArea: {
      'Estratégia e Liderança': [
        'Envolver Chief Medical Officer (CMO) e CMIO nas decisões de IA',
        'Alinhar roadmap de IA com prioridades clínicas e de pacientes',
        'Estabelecer parceria com centros acadêmicos de pesquisa em saúde'
      ],
      'Dados e Tecnologia': [
        'Implementar padrões FHIR/HL7 para interoperabilidade de dados',
        'Criar data lakes de saúde com governança rigorosa',
        'Investir em anonimização e synthetic data para P&D'
      ],
      'Governança e Risco': [
        'Criar comitê de ética clínica em IA com médicos e especialistas',
        'Implementar auditoria de viés em algoritmos clínicos',
        'Desenvolver processo de validação clínica antes de deploy'
      ],
      'Pessoas e Cultura': [
        'Capacitar profissionais de saúde em literacia de IA',
        'Contratar profissionais híbridos (clínico + dados)',
        'Criar cultura de colaboração entre TI e áreas clínicas'
      ],
      'Prontidão para Mudança': [
        'Mapear resistências específicas de profissionais de saúde (médicos, enfermeiros)',
        'Criar champions de IA entre líderes clínicos respeitados',
        'Comunicar benefícios para pacientes e não substituição de profissionais',
        'Envolver conselhos de classe na validação de soluções de IA'
      ]
    },
    kpisEspecificos: [
      'Taxa de acurácia em diagnósticos assistidos',
      'Redução de tempo de espera para resultados',
      'NPS de pacientes em jornadas com IA',
      'Economia em custos de cuidado por paciente'
    ],
    tendencias2024: [
      'IA Generativa para sumarização de prontuários',
      'Agentes de IA para tarefas administrativas clínicas',
      'Modelos multimodais (texto + imagem) para diagnóstico',
      'Digital Twins de pacientes para simulação de tratamentos'
    ]
  },
  financeiro: {
    nome: 'Financeiro',
    icon: '💰',
    frameworks: ['Basel III/IV AI Risk', 'BCBS 239', 'SR 11-7 Model Risk Management'],
    casosDeUso: [
      'Detecção de fraudes em tempo real (cartões, transações)',
      'Credit scoring com ML para concessão de crédito',
      'Robôs de atendimento e assessoria financeira (robo-advisors)',
      'Previsão de churn e retenção de clientes',
      'Automação de processos de compliance (KYC, AML)',
      'Otimização de portfólio e gestão de riscos'
    ],
    desafiosEspecificos: [
      'Regulamentação financeira rigorosa (BACEN, CVM, SEC)',
      'Necessidade de explicabilidade em decisões de crédito',
      'Proteção contra adversarial attacks em modelos de fraude',
      'Legacy systems (core banking) difíceis de integrar',
      'Competição com fintechs e big techs',
      'Gestão de model risk e validação independente'
    ],
    recomendacoesPorArea: {
      'Estratégia e Liderança': [
        'Posicionar IA como diferencial competitivo frente a fintechs',
        'Criar centro de excelência em IA com reporte ao C-Level',
        'Investir em open banking e ecossistema de dados'
      ],
      'Dados e Tecnologia': [
        'Modernizar core banking para suportar decisões em tempo real',
        'Implementar feature stores para modelos de ML',
        'Criar pipelines de dados para regulatory reporting automatizado'
      ],
      'Governança e Risco': [
        'Implementar framework de Model Risk Management (SR 11-7)',
        'Criar processo de validação independente de modelos',
        'Documentar lineage de dados para auditoria regulatória'
      ],
      'Valor de Negócio e ROI': [
        'Medir ROI de cada modelo em produção (NII, NIM, provisões)',
        'Criar attribution model para vendas com auxílio de IA',
        'Estabelecer métricas de economia em fraude evitada'
      ],
      'Prontidão para Mudança': [
        'Mapear resistências em áreas de compliance e risco (alta resistência a automação)',
        'Engajar gerentes de agências como agentes de mudança',
        'Comunicar claramente que IA apoia (não substitui) decisões humanas',
        'Criar quick wins visíveis para demonstrar valor rapidamente'
      ]
    },
    kpisEspecificos: [
      'Taxa de detecção de fraude vs falsos positivos',
      'Gini/KS de modelos de credit scoring',
      'Tempo de aprovação de crédito (time-to-yes)',
      'Receita incremental de cross-sell com IA'
    ],
    tendencias2024: [
      'IA Generativa para análise de documentos de crédito',
      'Agentes de IA para atendimento financeiro personalizado',
      'Modelos de linguagem para detecção de compliance',
      'Real-time risk scoring com streaming data'
    ]
  },
  utilities: {
    nome: 'Utilities',
    icon: '⚡',
    frameworks: ['IEEE 2755 Smart Grid AI', 'ISO 55000 Asset Management', 'NERC CIP'],
    casosDeUso: [
      'Previsão de demanda de energia (load forecasting)',
      'Manutenção preditiva de ativos (transformadores, linhas)',
      'Otimização de despacho e geração distribuída',
      'Detecção de perdas técnicas e não-técnicas (furto)',
      'Atendimento automatizado ao consumidor',
      'Gestão inteligente de smart grids'
    ],
    desafiosEspecificos: [
      'Infraestrutura crítica com requisitos de alta disponibilidade',
      'Regulação setorial rígida (ANEEL, agências)',
      'Legacy systems SCADA e OT difíceis de integrar com TI',
      'Dados de sensores em tempo real (IoT) em escala',
      'Transição energética e integração de renováveis',
      'Cibersegurança em sistemas de controle industrial'
    ],
    recomendacoesPorArea: {
      'Estratégia e Liderança': [
        'Alinhar IA com metas de transição energética e ESG',
        'Criar roadmap conjunto TI-OT para digitalização',
        'Estabelecer parcerias com startups de cleantech'
      ],
      'Dados e Tecnologia': [
        'Implementar plataforma de IoT para coleta de dados de sensores',
        'Criar data lake que integre dados de SCADA, AMI e GIS',
        'Investir em edge computing para inferência em campo'
      ],
      'Operações e Processos': [
        'Implementar digital twin de rede para simulação',
        'Automatizar detecção de perdas com ML',
        'Criar workflows de manutenção preditiva integrados'
      ],
      'Governança e Risco': [
        'Seguir normas de cibersegurança industrial (IEC 62443)',
        'Implementar governança de dados OT (sensores, SCADA)',
        'Criar processo de validação de modelos críticos'
      ],
      'Prontidão para Mudança': [
        'Preparar equipes de campo para novas ferramentas digitais',
        'Mapear resistências entre técnicos de manutenção tradicional',
        'Criar champions de IA entre engenheiros de operação',
        'Comunicar benefícios de segurança e não apenas produtividade'
      ]
    },
    kpisEspecificos: [
      'Acurácia de previsão de demanda (MAPE)',
      'Redução de perdas técnicas e não-técnicas',
      'Disponibilidade de ativos críticos (SAIDI, SAIFI)',
      'Economia em manutenção corretiva vs preditiva'
    ],
    tendencias2024: [
      'IA para otimização de energia renovável e storage',
      'Gêmeos digitais de redes de distribuição',
      'Agentes de IA para automação de subestações',
      'Modelos de previsão para integração de veículos elétricos'
    ]
  },
  marketing: {
    nome: 'Marketing',
    icon: '📢',
    frameworks: ['Marketing AI Institute Framework', 'Gartner AI Marketing Hype Cycle'],
    casosDeUso: [
      'Personalização de conteúdo e recomendações',
      'Segmentação avançada de clientes (micro-segmentos)',
      'Otimização de campanhas e bidding automatizado',
      'Geração de conteúdo com IA (copywriting, imagens)',
      'Análise de sentimento e social listening',
      'Attribution modeling e marketing mix modeling'
    ],
    desafiosEspecificos: [
      'Privacidade e fim de cookies de terceiros',
      'Fragmentação de dados entre canais',
      'Equilibrar automação vs autenticidade de marca',
      'Medir ROI real de iniciativas de IA',
      'Competição por atenção em ambiente saturado',
      'Adaptar a regulamentações de privacidade (LGPD, GDPR)'
    ],
    recomendacoesPorArea: {
      'Estratégia e Liderança': [
        'Posicionar IA como enabler de customer experience',
        'Criar roadmap de first-party data strategy',
        'Alinhar CMO e CTO em iniciativas de MarTech'
      ],
      'Dados e Tecnologia': [
        'Implementar Customer Data Platform (CDP) unificada',
        'Criar single customer view integrando todos canais',
        'Investir em consent management para privacidade'
      ],
      'Inovação e Experimentação': [
        'Criar lab de IA generativa para criação de conteúdo',
        'Testar personalização em tempo real com A/B testing',
        'Experimentar com agentes de IA para campanhas autônomas'
      ],
      'Valor de Negócio e ROI': [
        'Implementar marketing mix modeling com ML',
        'Medir incrementalidade de campanhas com experimentos',
        'Criar dashboards de ROI por canal com attribution'
      ]
    },
    kpisEspecificos: [
      'Lift em conversão com personalização',
      'ROAS (Return on Ad Spend) de campanhas otimizadas',
      'Engagement rate em conteúdo gerado por IA',
      'Custo por aquisição vs baseline'
    ],
    tendencias2024: [
      'IA Generativa para criação de assets em escala',
      'Agentes de IA para gestão autônoma de campanhas',
      'Synthetic audiences para pesquisa de mercado',
      'AI-powered creative optimization em tempo real'
    ]
  },
  sales: {
    nome: 'Sales (Vendas)',
    icon: '🛒',
    frameworks: ['Salesforce Einstein Analytics', 'Gartner Sales Tech Framework'],
    casosDeUso: [
      'Lead scoring e priorização de pipeline',
      'Previsão de vendas (forecasting) com ML',
      'Recomendação de produtos e upsell/cross-sell',
      'Coaching de vendedores com análise de calls',
      'Automação de follow-ups e cadências',
      'Otimização de pricing dinâmico'
    ],
    desafiosEspecificos: [
      'Adoção por equipes de vendas resistentes a tecnologia',
      'Qualidade de dados em CRM desatualizado',
      'Integração de múltiplas ferramentas de sales stack',
      'Equilibrar automação vs relacionamento humano',
      'Ciclos de venda longos em B2B',
      'Medir impacto real de IA em performance'
    ],
    recomendacoesPorArea: {
      'Estratégia e Liderança': [
        'Posicionar IA como assistente (não substituto) do vendedor',
        'Criar incentivos alinhados à adoção de ferramentas',
        'Envolver líderes de vendas no design de soluções'
      ],
      'Dados e Tecnologia': [
        'Garantir qualidade de dados no CRM (higiene)',
        'Integrar dados de marketing e customer success',
        'Implementar revenue intelligence unificada'
      ],
      'Pessoas e Cultura': [
        'Treinar vendedores em uso de ferramentas de IA',
        'Criar champions de IA em cada time de vendas',
        'Compartilhar cases de sucesso internamente'
      ],
      'Operações e Processos': [
        'Automatizar tarefas administrativas (data entry, follow-ups)',
        'Implementar guided selling com IA em tempo real',
        'Criar playbooks dinâmicos baseados em contexto'
      ],
      'Prontidão para Mudança': [
        'Identificar vendedores resistentes e endereçar medos específicos',
        'Criar champions de IA entre top performers da força de vendas',
        'Demonstrar ganhos rápidos (quick wins) com automação de tarefas',
        'Vincular adoção de IA a metas e bonificações de forma positiva'
      ]
    },
    kpisEspecificos: [
      'Acurácia de forecast de vendas',
      'Aumento em win rate com lead scoring',
      'Tempo economizado por vendedor/semana',
      'Ticket médio em deals com recomendação de IA'
    ],
    tendencias2024: [
      'Agentes de IA para SDRs (prospecção automatizada)',
      'Conversation intelligence com LLMs',
      'AI Copilots para preparação de reuniões',
      'Automação de propostas e contratos com GenAI'
    ]
  },
  tecnologia: {
    nome: 'Tecnologia',
    icon: '💻',
    frameworks: ['DORA Metrics', 'MLOps Maturity Model', 'FinOps Foundation'],
    casosDeUso: [
      'Assistentes de código e pair programming (Copilot)',
      'Automação de testes e QA com IA',
      'AIOps para monitoramento e incident management',
      'Otimização de infraestrutura e FinOps',
      'Detecção de vulnerabilidades e segurança',
      'Documentação automática de código e sistemas'
    ],
    desafiosEspecificos: [
      'Segurança de código gerado por IA',
      'Propriedade intelectual e licensing de modelos',
      'Dependência excessiva de ferramentas de IA',
      'Skill gap em MLOps e AI Engineering',
      'Custos de infraestrutura de IA (GPUs, cloud)',
      'Governança de modelos em produção'
    ],
    recomendacoesPorArea: {
      'Estratégia e Liderança': [
        'Definir política clara de uso de IA generativa no dev',
        'Investir em AI/ML como competência core',
        'Criar centro de excelência em AI Engineering'
      ],
      'Dados e Tecnologia': [
        'Implementar plataforma de MLOps end-to-end',
        'Criar feature store e model registry centralizados',
        'Investir em observabilidade de modelos em produção'
      ],
      'Governança e Risco': [
        'Auditar código gerado por IA antes de produção',
        'Implementar guardrails para uso de ferramentas de IA',
        'Criar processo de revisão de licensing de modelos'
      ],
      'Pessoas e Cultura': [
        'Capacitar desenvolvedores em prompt engineering',
        'Formar AI Engineers e ML Engineers',
        'Criar comunidade interna de práticas de IA'
      ]
    },
    kpisEspecificos: [
      'Produtividade de devs com ferramentas de IA',
      'MTTR (Mean Time to Recovery) com AIOps',
      'Cobertura de testes automatizados com IA',
      'Custo por deploy com otimização de IA'
    ],
    tendencias2024: [
      'AI Agents para automação de tarefas de DevOps',
      'Modelos especializados para código (CodeLlama, StarCoder)',
      'AI para refactoring e modernização de legacy',
      'Autonomous coding agents para tasks complexas'
    ]
  }
};

const MIT_CISR_LEVELS = {
  1: {
    name: 'Nível 1: Inicial',
    nameEn: 'Initial / Experimenting',
    focus: 'Exploração e Educação',
    description: 'Organização ainda está explorando o potencial da IA. Poucos ou nenhum projeto formal.',
    characteristics: [
      'Sem estratégia formal de IA',
      'Iniciativas isoladas e ad-hoc',
      'Falta de infraestrutura de dados',
      'Baixa conscientização sobre IA',
      'Orçamento não dedicado'
    ],
    recommendations: [
      'Investir em programas de alfabetização em IA para liderança e equipes',
      'Desenvolver políticas claras de governança e uso ético de IA',
      'Iniciar inventário e catalogação de dados disponíveis',
      'Criar comitê de ética em IA com representantes de diferentes áreas',
      'Identificar quick wins e casos de uso de baixo risco para experimentação'
    ],
    kpis: [
      '% de líderes treinados em fundamentos de IA',
      'Número de políticas de IA documentadas',
      'Catálogo de dados criado (sim/não)',
      'Número de casos de uso identificados'
    ],
    riscos: [
      'Resistência cultural à mudança',
      'Falta de patrocínio executivo',
      'Expectativas irreais sobre resultados de curto prazo'
    ],
    performance: { growth: '-15% a -10%', profit: 'Abaixo da média', roi: 'Negativo ou não mensurável', timeToValue: '> 24 meses' },
    investimento: 'Baixo (foco em capacitação inicial)',
    marketImpact: 'Empresas neste nível perdem competitividade para concorrentes mais maduros. Risco de disrupção por novos entrantes.'
  },
  2: {
    name: 'Nível 2: Oportunista',
    nameEn: 'Preparing / Experimenting',
    focus: 'Preparação e Experimentação',
    description: 'Empresa começa a investir em IA de forma mais estruturada, com pilotos iniciais. Múltiplos projetos em andamento com sucessos pontuais.',
    characteristics: [
      'Educar a força de trabalho sobre IA',
      'Estabelecer políticas de uso aceitável',
      'Tornar dados mais acessíveis',
      'Primeiros experimentos formais',
      'Identificar onde humanos devem estar no loop'
    ],
    recommendations: [
      'Desenvolver estratégia inicial de IA alinhada ao negócio',
      'Investir em qualidade e governança de dados',
      'Criar equipe multidisciplinar para projetos de IA',
      'Estabelecer métricas e KPIs para medir valor',
      'Documentar e compartilhar aprendizados'
    ],
    kpis: [
      'Número de experimentos de IA realizados',
      'Taxa de conclusão de treinamentos',
      'Qualidade de dados (% de dados catalogados)',
      'Número de políticas de IA documentadas'
    ],
    riscos: [
      'Pilotos sem conexão com estratégia',
      'Falta de dados de qualidade',
      'Dificuldade em demonstrar valor'
    ],
    performance: { growth: '-10% a -5%', profit: 'Ligeiramente abaixo da média', roi: '50-100%', timeToValue: '12-18 meses' },
    investimento: 'Baixo a Médio (capacitação e governance)',
    marketImpact: 'Crescimento 5-10% abaixo da média do setor. Concorrentes mais maduros ganham market share gradualmente.'
  },
  3: {
    name: 'Nível 3: Estruturado',
    nameEn: 'Building Pilots',
    focus: 'Casos de Negócio e Pilotos',
    description: 'Pilotos em andamento com métricas definidas. Processos começam a ser automatizados.',
    characteristics: [
      'Simplificar e automatizar processos',
      'Criar casos de uso com métricas',
      'Compartilhar dados via APIs',
      'Usar LLMs para aumentar o trabalho',
      'Estilo de gestão coach e comunicação'
    ],
    recommendations: [
      'Desenvolver 3-5 pilotos de IA com métricas claras de sucesso',
      'Investir em infraestrutura de dados e APIs padronizadas',
      'Criar equipes multidisciplinares para projetos de IA',
      'Estabelecer métricas e KPIs para medir valor gerado',
      'Documentar e compartilhar aprendizados dos pilotos'
    ],
    kpis: [
      'Número de pilotos de IA em execução',
      'Taxa de sucesso dos pilotos (% que atingem objetivos)',
      'Tempo médio de desenvolvimento de piloto',
      'ROI dos pilotos finalizados'
    ],
    riscos: [
      'Pilotos sem conexão com estratégia de negócio',
      'Falta de dados de qualidade',
      'Dificuldade em escalar pilotos bem-sucedidos'
    ],
    performance: { growth: '0% a +5%', profit: 'Na média da indústria', roi: '100-200%', timeToValue: '9-12 meses' },
    investimento: 'Médio (infraestrutura, ferramentas e equipe inicial)',
    marketImpact: 'Performance alinhada com o mercado. Início da aceleração de valor com IA.'
  },
  4: {
    name: 'Nível 4: Gerenciado',
    nameEn: 'Developing AI Ways of Working',
    focus: 'Escalar Plataformas e Dashboards',
    description: 'IA integrada ao negócio com governança estabelecida e modelos em produção.',
    characteristics: [
      'Expandir automação de processos',
      'Cultura test-and-learn estabelecida',
      'Arquitetar para reuso',
      'Incorporar modelos pré-treinados',
      'Explorar agentes autônomos'
    ],
    recommendations: [
      'Criar plataforma empresarial de IA para escalar e reutilizar modelos',
      'Implementar cultura de experimentação contínua (test-and-learn)',
      'Desenvolver dashboards de negócio com transparência de dados',
      'Expandir automação de processos de negócio',
      'Avaliar uso de modelos de linguagem especializados (SLMs)'
    ],
    kpis: [
      'Número de modelos em produção',
      'Taxa de reuso de componentes de IA',
      '% de processos automatizados com IA',
      'Tempo de deploy de novos modelos (MLOps)'
    ],
    riscos: [
      'Dívida técnica acumulada',
      'Complexidade de governança em escala',
      'Dependência excessiva de fornecedores'
    ],
    performance: { growth: '+5% a +15%', profit: 'Acima da média', roi: '200-400%', timeToValue: '6-9 meses' },
    investimento: 'Médio a Alto (plataformas, MLOps e escala)',
    marketImpact: 'Vantagem competitiva sustentável. Crescimento acima do mercado e margens superiores.'
  },
  5: {
    name: 'Nível 5: Otimizado',
    nameEn: 'AI Future Ready',
    focus: 'Inovação Contínua e Novas Receitas',
    description: 'IA como diferencial competitivo, com inovação contínua e monetização de capacidades.',
    characteristics: [
      'IA embarcada em decisões e processos',
      'Criar e vender serviços aumentados por IA',
      'Combinar IA tradicional, generativa e agêntica',
      'Proprietary AI como vantagem competitiva',
      'Liderança de inovação no setor'
    ],
    recommendations: [
      'Integrar IA em todas as decisões estratégicas e operacionais',
      'Explorar monetização de capacidades de IA como serviço',
      'Combinar diferentes tipos de IA (analítica, generativa, agêntica)',
      'Investir em IA proprietária e diferenciada',
      'Liderar inovação no ecossistema e indústria'
    ],
    kpis: [
      '% de decisões estratégicas suportadas por IA',
      'Receita gerada por produtos/serviços de IA',
      'Número de patentes ou inovações em IA',
      'Posição no ranking de maturidade da indústria'
    ],
    riscos: [
      'Disrupção por competidores mais ágeis',
      'Regulamentações emergentes',
      'Obsolescência tecnológica acelerada'
    ],
    performance: { growth: '+15% ou mais', profit: 'Significativamente acima', roi: '400-800%+', timeToValue: '3-6 meses' },
    investimento: 'Alto (P&D, inovação e diferenciação)',
    marketImpact: 'Liderança de mercado. Define tendências do setor e captura valor desproporcional.'
  }
};

const CAUSAS_EFEITOS_POR_VERTICAL = {
  fintech: {
    causas: {
      1: ['Falta de estratégia de dados integrada', 'Regulamentação financeira limita experimentação', 'Legacy systems de core banking'],
      2: ['Competição com fintechs nativas digitais', 'Silos de dados entre áreas', 'Resistência cultural à mudança'],
      3: ['Necessidade de escalar modelos de fraude', 'Demanda por personalização em tempo real', 'Pressão regulatória (BACEN, CVM)'],
      4: ['Maturidade em open banking', 'Cultura de inovação estabelecida', 'Investimento contínuo em AI/ML'],
      5: ['Liderança em tecnologia financeira', 'Ecossistema de parcerias maduro', 'IA proprietária como diferencial']
    },
    efeitos: {
      1: ['Perda de market share para fintechs', 'Ineficiência operacional', 'Experiência do cliente abaixo da média'],
      2: ['Primeiros ganhos em detecção de fraude', 'Melhoria incremental em credit scoring', 'Início de automação de compliance'],
      3: ['Redução significativa em fraudes', 'Time-to-yes em crédito otimizado', 'Robo-advisors em piloto'],
      4: ['Liderança em inovação financeira', 'Novos produtos baseados em IA', 'Monetização de capacidades'],
      5: ['Referência global em FinTech', 'IA como vantagem competitiva sustentável', 'Novos modelos de receita']
    }
  },
  aifirst: {
    causas: {
      1: ['Falta de casos de uso definidos', 'Ausência de infraestrutura de MLOps', 'Equipe sem experiência em IA'],
      2: ['Dificuldade em medir ROI dos pilotos', 'Dados não estruturados', 'Falta de governança de modelos'],
      3: ['Necessidade de escalar agentes verticais', 'Demanda por automação profunda', 'Competição por talentos'],
      4: ['Domínio de técnicas avançadas', 'Plataforma de IA madura', 'Cultura de experimentação'],
      5: ['Liderança em AI Engineering', 'Agentes autônomos em produção', 'IA generativa integrada']
    },
    efeitos: {
      1: ['Oportunidades de automação não exploradas', 'Baixa eficiência operacional', 'Competidores avançando'],
      2: ['Primeiros agentes em piloto', 'Ganhos pontuais de eficiência', 'Aprendizado organizacional'],
      3: ['Automação superior a 50% em processos-chave', 'Agentes verticais em produção', 'ROI comprovado'],
      4: ['Liderança em IA aplicada', 'Eficiência operacional best-in-class', 'Novos modelos de negócio'],
      5: ['Referência em AI First', 'Monetização de agentes', 'Inovação contínua']
    }
  },
  edtech: {
    causas: {
      1: ['Resistência de educadores à tecnologia', 'Conteúdo não digitalizado', 'Falta de dados de aprendizagem'],
      2: ['Dificuldade em personalização em escala', 'Integração com LMS legados', 'Métricas de engajamento limitadas'],
      3: ['Demanda por aprendizado adaptativo', 'Necessidade de escalar tutores IA', 'Pressão por resultados mensuráveis'],
      4: ['Domínio de learning analytics', 'Plataforma de IA educacional madura', 'Cultura data-driven'],
      5: ['Liderança em tecnologia educacional', 'Tutores IA avançados', 'Personalização em escala']
    },
    efeitos: {
      1: ['Experiência de aprendizado genérica', 'Altas taxas de abandono', 'Baixo engajamento'],
      2: ['Primeiras personalizações implementadas', 'Melhoria em métricas de conclusão', 'Tutores IA em piloto'],
      3: ['Aprendizado adaptativo em escala', 'Redução significativa de abandono', 'Tutores IA produtivos'],
      4: ['Liderança em EdTech', 'Resultados de aprendizado superiores', 'Novos produtos educacionais'],
      5: ['Referência global em educação com IA', 'Outcomes excepcionais', 'Modelo replicável']
    }
  },
  legaltech: {
    causas: {
      1: ['Cultura conservadora do setor jurídico', 'Documentos em formatos legados', 'Preocupações com confidencialidade'],
      2: ['Complexidade de contratos', 'Necessidade de precisão legal', 'Integração com sistemas de escritórios'],
      3: ['Demanda por e-discovery eficiente', 'Volume crescente de documentos', 'Pressão por redução de custos'],
      4: ['Maturidade em NLP jurídico', 'Governança de dados estabelecida', 'Confiança em automação'],
      5: ['Domínio de IA jurídica', 'Análise preditiva avançada', 'Automação end-to-end']
    },
    efeitos: {
      1: ['Processos manuais ineficientes', 'Custos elevados de revisão', 'Risco de erros humanos'],
      2: ['Primeiras automações de contratos', 'Redução de tempo em due diligence', 'Início de e-discovery assistido'],
      3: ['Automação de contratos em escala', 'E-discovery eficiente', 'Análise preditiva de casos'],
      4: ['Liderança em LegalTech', 'Serviços jurídicos diferenciados', 'Novos modelos de precificação'],
      5: ['Referência em automação jurídica', 'IA como diferencial competitivo', 'Novos serviços baseados em IA']
    }
  },
  saude: {
    causas: {
      1: ['Regulamentação rigorosa (ANVISA)', 'Dados sensíveis de pacientes', 'Sistemas legados (EHR, PACS)'],
      2: ['Necessidade de validação clínica', 'Viés em dados de saúde', 'Integração com fluxos clínicos'],
      3: ['Demanda por diagnóstico assistido', 'Pressão por eficiência operacional', 'Medicina de precisão'],
      4: ['Maturidade em IA clínica', 'Governança de dados de saúde', 'Confiança médica em IA'],
      5: ['Liderança em HealthTech', 'IA em todas as especialidades', 'Medicina personalizada']
    },
    efeitos: {
      1: ['Diagnósticos sem suporte de IA', 'Ineficiência em agendamentos', 'Experiência do paciente básica'],
      2: ['Primeiros modelos de triagem', 'Otimização inicial de fluxos', 'Assistentes virtuais em piloto'],
      3: ['Diagnóstico assistido em produção', 'Predição de readmissão', 'Medicina personalizada inicial'],
      4: ['Liderança em HealthTech', 'Outcomes clínicos superiores', 'Telessaúde avançada'],
      5: ['Referência global em saúde digital', 'Prevenção preditiva', 'Novos modelos de cuidado']
    }
  },
  ecommerce: {
    causas: {
      1: ['Dados de cliente fragmentados', 'Falta de personalização', 'Operação reativa'],
      2: ['Desafio de recomendação em escala', 'Gestão de catálogo complexa', 'Competição com marketplaces'],
      3: ['Demanda por personalização real-time', 'Otimização de pricing dinâmico', 'Logística preditiva'],
      4: ['Domínio de ML para e-commerce', 'CDP unificado', 'Cultura customer-centric'],
      5: ['Liderança em experiência digital', 'IA em toda jornada do cliente', 'Automação total']
    },
    efeitos: {
      1: ['Conversão abaixo da média', 'Experiência genérica', 'Churn elevado'],
      2: ['Primeiras recomendações personalizadas', 'Melhoria em conversão', 'Segmentação avançada'],
      3: ['Personalização em tempo real', 'Pricing dinâmico otimizado', 'Logística preditiva'],
      4: ['Liderança em experiência digital', 'LTV maximizado', 'Novos canais de receita'],
      5: ['Referência em e-commerce', 'Experiência omnichannel perfeita', 'IA como diferencial']
    }
  },
  manufatura: {
    causas: {
      1: ['Sistemas SCADA/OT isolados', 'Falta de sensores IoT', 'Cultura operacional tradicional'],
      2: ['Integração TI-OT complexa', 'Dados de produção não estruturados', 'Resistência do chão de fábrica'],
      3: ['Demanda por manutenção preditiva', 'Pressão por qualidade zero defeito', 'Otimização de cadeia de suprimentos'],
      4: ['Maturidade em IIoT', 'Digital twins em produção', 'Cultura de melhoria contínua'],
      5: ['Liderança em Indústria 4.0', 'Fábrica autônoma', 'Supply chain inteligente']
    },
    efeitos: {
      1: ['Manutenção corretiva cara', 'Qualidade inconsistente', 'Paradas não planejadas'],
      2: ['Primeiros modelos preditivos', 'Monitoramento em tempo real', 'Início de controle de qualidade IA'],
      3: ['Manutenção preditiva em escala', 'Qualidade otimizada', 'Supply chain inteligente'],
      4: ['Liderança em Indústria 4.0', 'OEE maximizado', 'Fábrica digital'],
      5: ['Referência em manufatura inteligente', 'Operações autônomas', 'Novos modelos de negócio']
    }
  },
  agrovert: {
    causas: {
      1: ['Falta de sensores em ambientes controlados', 'Dados agronômicos limitados', 'Operação manual'],
      2: ['Desafio de integração de sistemas', 'Variabilidade de culturas', 'Falta de expertise em IA'],
      3: ['Demanda por otimização de recursos', 'Pressão por sustentabilidade', 'Escala de produção'],
      4: ['Domínio de agricultura de precisão', 'IoT integrado', 'Cultura data-driven'],
      5: ['Liderança em AgTech', 'Automação total', 'Sustentabilidade como diferencial']
    },
    efeitos: {
      1: ['Desperdício de recursos (água, energia)', 'Produtividade subótima', 'Sustentabilidade limitada'],
      2: ['Primeiros controles automatizados', 'Monitoramento de condições', 'Otimização inicial'],
      3: ['Ambiente totalmente controlado', 'Recursos otimizados', 'Produção sustentável'],
      4: ['Liderança em AgTech', 'Máxima eficiência de recursos', 'Modelo replicável'],
      5: ['Referência em agricultura inteligente', 'Carbon neutral', 'Inovação contínua']
    }
  },
  tecnologia: {
    causas: {
      1: ['Falta de estratégia de IA definida', 'Projetos ad-hoc', 'Equipe sem especialização em ML'],
      2: ['Dificuldade em medir impacto', 'Dívida técnica acumulada', 'Falta de MLOps'],
      3: ['Demanda por produtividade de devs', 'Necessidade de AIOps', 'Escala de operações'],
      4: ['Domínio de AI Engineering', 'Plataforma MLOps madura', 'Cultura de experimentação'],
      5: ['Liderança em engenharia de software', 'Agentes de código em produção', 'Inovação contínua']
    },
    efeitos: {
      1: ['Produtividade de desenvolvimento padrão', 'Operações reativas', 'Sem diferenciação tecnológica'],
      2: ['Primeiros Copilots em uso', 'AIOps básico', 'Automação de testes inicial'],
      3: ['Produtividade de devs aumentada', 'AIOps proativo', 'CI/CD otimizado por IA'],
      4: ['Liderança em engenharia de software', 'Operações autônomas', 'Inovação contínua'],
      5: ['Referência em AI Engineering', 'Desenvolvimento assistido por IA', 'Novos produtos de IA']
    }
  }
};

const ROADMAP_DETALHADO = {
  fase1: {
    nome: 'Fase 1: Fundação e Quick Wins',
    duracao: 'Mês 1-3',
    objetivo: 'Estabelecer bases sólidas e gerar primeiros resultados visíveis',
    entregaveis: [
      'Diagnóstico detalhado de maturidade atual',
      'Estratégia de IA alinhada com objetivos de negócio',
      'Framework de governança e ética em IA',
      'Roadmap de capacitação da equipe',
      '2-3 quick wins implementados'
    ],
    marcos: [
      { semana: 2, entrega: 'Kickoff e alinhamento executivo' },
      { semana: 4, entrega: 'Diagnóstico finalizado e priorização' },
      { semana: 8, entrega: 'Framework de governança aprovado' },
      { semana: 12, entrega: 'Quick wins em produção' }
    ],
    recursos: ['Sponsor executivo', 'Equipe multidisciplinar (3-5 pessoas)', 'Budget para ferramentas iniciais'],
    riscos: ['Falta de alinhamento executivo', 'Escopo mal definido'],
    kpis: ['Nº de stakeholders engajados', 'Quick wins entregues', 'Satisfação inicial']
  },
  fase2: {
    nome: 'Fase 2: Pilotos Estratégicos',
    duracao: 'Mês 4-6',
    objetivo: 'Desenvolver e validar casos de uso com impacto mensurável',
    entregaveis: [
      '3-5 pilotos de IA em diferentes áreas',
      'Infraestrutura de dados inicial',
      'Métricas de ROI por piloto',
      'Documentação de lições aprendidas',
      'Plano de escala para pilotos bem-sucedidos'
    ],
    marcos: [
      { semana: 14, entrega: 'Casos de uso priorizados e aprovados' },
      { semana: 18, entrega: 'Infraestrutura de dados operacional' },
      { semana: 22, entrega: 'Pilotos em execução com métricas' },
      { semana: 24, entrega: 'Avaliação de resultados e decisão de escala' }
    ],
    recursos: ['Cientistas de dados (2-3)', 'Engenheiros de ML', 'Parceiros tecnológicos'],
    riscos: ['Qualidade de dados insuficiente', 'Pilotos sem patrocínio de negócio'],
    kpis: ['ROI por piloto', 'Time-to-value', 'Adoção pelos usuários']
  },
  fase3: {
    nome: 'Fase 3: Escala e Industrialização',
    duracao: 'Mês 7-12',
    objetivo: 'Escalar casos de uso bem-sucedidos e estabelecer práticas de MLOps',
    entregaveis: [
      'Plataforma de IA empresarial',
      'Pipeline de MLOps automatizado',
      'Centro de Excelência em IA (CoE)',
      'Programa de capacitação contínua',
      'Governança de modelos em produção'
    ],
    marcos: [
      { semana: 28, entrega: 'Plataforma de IA MVP' },
      { semana: 32, entrega: 'CoE estabelecido e operacional' },
      { semana: 40, entrega: 'Pipeline MLOps em produção' },
      { semana: 48, entrega: 'Modelos escalados com monitoramento' }
    ],
    recursos: ['Equipe de IA expandida (8-12 pessoas)', 'Plataforma cloud', 'Ferramentas de MLOps'],
    riscos: ['Complexidade de integração', 'Resistência organizacional', 'Custos acima do previsto'],
    kpis: ['Nº de modelos em produção', 'Uptime dos modelos', 'Custo por inferência']
  },
  fase4: {
    nome: 'Fase 4: Otimização e Inovação Contínua',
    duracao: 'Mês 12+',
    objetivo: 'Alcançar excelência operacional e explorar fronteiras de inovação',
    entregaveis: [
      'IA embarcada em decisões estratégicas',
      'Produtos/serviços aumentados por IA',
      'Experimentação com IA generativa e agêntica',
      'Parcerias estratégicas de inovação',
      'Métricas de impacto no negócio'
    ],
    marcos: [
      { semana: 52, entrega: 'IA integrada em processos core' },
      { semana: 60, entrega: 'Primeiro produto com IA no mercado' },
      { semana: 72, entrega: 'Agentes de IA em operação' },
      { semana: 84, entrega: 'Referência de maturidade na indústria' }
    ],
    recursos: ['Equipe de IA madura', 'Budget para P&D', 'Ecossistema de parceiros'],
    riscos: ['Disrupção tecnológica', 'Mudanças regulatórias', 'Competição acirrada'],
    kpis: ['Receita com IA', 'NPS de produtos com IA', 'Posição competitiva']
  }
};

function getMaturityLevelFromScore(score) {
  if (score < 1.5) return 1;
  if (score < 2.5) return 2;
  if (score < 3.5) return 3;
  if (score < 4.5) return 4;
  return 5;
}

/** Projeção financeira do Word ajustada pelo faturamento anual do projeto (quando informado). */
export function getProjecaoFinanceiraAjustada(dashboardData) {
  const maturityLevel = getMaturityLevelFromScore(dashboardData.scoreGeral);
  const base = PROJECAO_FINANCEIRA_POR_NIVEL[maturityLevel];
  const fatRaw = dashboardData.projeto?.faturamentoAnualProjeto;
  const fat = fatRaw != null && Number(fatRaw) > 0 ? Number(fatRaw) : null;
  if (!fat) {
    return { projecao: base, notaFaturamento: null };
  }
  const m = multiplicadorRoiPorFaturamento(fat);
  const pct = percentualReferenciaRoi(fat);
  const projecao = {
    ...base,
    crescimentoReceita: {
      min: Math.round(base.crescimentoReceita.min * m),
      max: Math.round(base.crescimentoReceita.max * m),
      media: Math.round(base.crescimentoReceita.media * m)
    },
    reducaoCustos: {
      min: Math.round(base.reducaoCustos.min * m),
      max: Math.round(base.reducaoCustos.max * m),
      media: Math.round(base.reducaoCustos.media * m)
    },
    roiEsperado: escalarRoiPercentModelo(
      base.roiEsperado.min,
      base.roiEsperado.max,
      base.roiEsperado.media,
      fat
    ),
    investimentoRecomendado: `${base.investimentoRecomendado} (escala ref. ${pct}% do faturamento anual do projeto)`
  };
  return {
    projecao,
    notaFaturamento: `Faturamento anual do projeto (organização): R$ ${fat.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} · Percentual de referência para ROI: ${pct}%`
  };
}

function getNivelMaturidade(score) {
  if (score <= 1.5) return 'Inicial';
  if (score <= 2.5) return 'Oportunista';
  if (score <= 3.5) return 'Estruturado';
  if (score <= 4.5) return 'Gerenciado';
  return 'Otimizado';
}

// ==========================================
// SISTEMA DE RECOMENDAÇÕES CONTEXTUALIZADAS
// ==========================================

// Recomendações específicas por setor/vertical
const ACOES_POR_VERTICAL = {
  fintech: {
    'Estratégia e Liderança': [
      'Alinhar estratégia de IA com roadmap de Open Finance e Pix',
      'Definir casos de uso prioritários em análise de crédito e detecção de fraude',
      'Estabelecer métricas de compliance regulatório (BACEN, CVM) em projetos de IA'
    ],
    'Dados e Tecnologia': [
      'Implementar data lake com compliance BACEN e rastreabilidade',
      'Garantir linhagem de dados para auditoria de modelos de crédito',
      'Desenvolver APIs seguras para Open Finance com IA embarcada'
    ],
    'Governança e Risco': [
      'Implementar explicabilidade (XAI) obrigatória para modelos de crédito',
      'Criar comitê de ética em IA com participação de compliance e jurídico',
      'Estabelecer processo de auditoria de vieses em decisões automatizadas'
    ],
    'Conformidade Regulatória': [
      'Mapear regulações BACEN 4.658/18 e 4.893/21 aplicáveis a IA',
      'Implementar documentação de explicabilidade conforme exigência CVM',
      'Preparar para regulações emergentes de IA no setor financeiro'
    ],
    regulacoes: ['BACEN', 'CVM', 'LGPD', 'Open Finance'],
    naoCitar: ['ANVISA', 'CFM', 'DORA Metrics sem contexto']
  },
  saude: {
    'Estratégia e Liderança': [
      'Mapear oportunidades de IA na jornada completa do paciente',
      'Avaliar regulações ANVISA para software como dispositivo médico (SaMD)',
      'Definir governança clínica para validação de modelos diagnósticos'
    ],
    'Dados e Tecnologia': [
      'Criar data mesh com segregação rigorosa de dados de saúde (PHI)',
      'Implementar anonimização e pseudonimização conforme LGPD art. 11',
      'Desenvolver pipelines de dados com auditoria de acesso'
    ],
    'Governança e Risco': [
      'Estabelecer protocolo de validação clínica para IA diagnóstica',
      'Documentar responsabilidades médico-legais em decisões assistidas por IA',
      'Criar comitê de ética com participação médica obrigatória'
    ],
    'Conformidade Regulatória': [
      'Mapear requisitos ANVISA para classificação de risco de IA médica',
      'Implementar consentimento informado específico para uso de IA',
      'Preparar documentação para eventual certificação de dispositivo médico'
    ],
    regulacoes: ['ANVISA', 'CFM', 'LGPD', 'Lei 13.709 (dados sensíveis)'],
    naoCitar: ['BACEN', 'CVM', 'Open Finance']
  },
  tecnologia: {
    'Estratégia e Liderança': [
      'Integrar IA como diferencial competitivo no roadmap de produto',
      'Definir estratégia AI-first para novos desenvolvimentos',
      'Criar métricas de produtividade de desenvolvedores com IA (DORA + IA)'
    ],
    'Dados e Tecnologia': [
      'Construir feature store centralizada com versionamento',
      'Implementar MLOps completo com CI/CD para modelos',
      'Criar plataforma de experimentação com A/B testing integrado'
    ],
    'Operações e Processos': [
      'Implementar AIOps para monitoramento preditivo de infraestrutura',
      'Automatizar testes e code review com IA',
      'Criar pipeline de deploy de modelos com rollback automático'
    ],
    'Pessoas e Cultura': [
      'Upskilling massivo em prompt engineering e AI tools',
      'Criar comunidade de prática de AI/ML com demos semanais',
      'Estabelecer AI Champions em cada squad de desenvolvimento'
    ],
    regulacoes: ['LGPD', 'Propriedade Intelectual', 'Contratos SaaS'],
    naoCitar: ['BACEN', 'CVM', 'ANVISA', 'CFM']
  },
  varejo: {
    'Estratégia e Liderança': [
      'Priorizar personalização e recomendação como diferencial competitivo',
      'Alinhar IA com estratégia omnichannel (loja, e-commerce, app)',
      'Definir KPIs de conversão e ticket médio impactados por IA'
    ],
    'Dados e Tecnologia': [
      'Unificar dados de todos os canais em CDP (Customer Data Platform)',
      'Criar visão 360° do cliente com embeddings de comportamento',
      'Implementar real-time scoring para personalização instantânea'
    ],
    'Operações e Processos': [
      'Automatizar reposição de estoque com previsão de demanda por ML',
      'Implementar precificação dinâmica assistida por IA',
      'Otimizar logística e roteirização com algoritmos preditivos'
    ],
    'Valor de Negócio e ROI': [
      'Medir incremento de receita atribuível a recomendações de IA',
      'Calcular redução de ruptura de estoque por previsão de demanda',
      'Quantificar aumento de margem por precificação inteligente'
    ],
    regulacoes: ['LGPD', 'CDC', 'Regulações de e-commerce'],
    naoCitar: ['BACEN', 'CVM', 'ANVISA', 'CFM', 'DORA Metrics']
  },
  industria: {
    'Estratégia e Liderança': [
      'Focar em manutenção preditiva e controle de qualidade como quick wins',
      'Mapear integração de IA com sistemas OT/SCADA existentes',
      'Definir roadmap de Indústria 4.0 com IA como habilitador'
    ],
    'Dados e Tecnologia': [
      'Integrar dados de OT/IT em plataforma unificada',
      'Implementar edge computing para latência baixa em linha de produção',
      'Criar data lake industrial com dados de sensores IoT'
    ],
    'Operações e Processos': [
      'Implementar manutenção preditiva em equipamentos críticos',
      'Automatizar controle de qualidade com visão computacional',
      'Criar digital twins para simulação e otimização de processos'
    ],
    'Governança e Risco': [
      'Validar segurança de IA em ambientes operacionais críticos',
      'Certificar modelos de IA em processos de segurança (NRs)',
      'Estabelecer fallback humano para decisões automatizadas críticas'
    ],
    regulacoes: ['NRs de segurança', 'ISO 9001', 'ISO 14001', 'LGPD'],
    naoCitar: ['BACEN', 'CVM', 'ANVISA', 'CFM', 'Open Finance']
  },
  servicos: {
    'Estratégia e Liderança': [
      'Automatizar processos documentais de alto volume repetitivo',
      'Identificar uso de IA generativa em entregas de conhecimento',
      'Criar diferencial competitivo com insights assistidos por IA'
    ],
    'Dados e Tecnologia': [
      'Estruturar base de conhecimento corporativo para RAG',
      'Implementar gestão de documentos com embeddings semânticos',
      'Criar APIs de acesso seguro a conhecimento proprietário'
    ],
    'Operações e Processos': [
      'Automatizar geração de documentos, propostas e relatórios',
      'Implementar assistentes de pesquisa e análise para consultores',
      'Criar workflows inteligentes com triagem automática'
    ],
    'Pessoas e Cultura': [
      'Treinar profissionais em uso responsável de IA generativa',
      'Desenvolver mindset de augmented intelligence (IA como copiloto)',
      'Criar guidelines de qualidade para outputs assistidos por IA'
    ],
    regulacoes: ['LGPD', 'Regulações profissionais (OAB, CRC, CREA, etc.)'],
    naoCitar: ['BACEN', 'CVM', 'ANVISA específico', 'DORA Metrics']
  }
};

// Recomendações por porte da empresa
const ESTRUTURA_POR_PORTE = {
  pequeno: {
    equipe: 'squad multidisciplinar de 2-3 pessoas',
    abordagem: 'Priorizar soluções SaaS, APIs prontas e low-code AI',
    investimento: '1-2% do faturamento',
    coe: 'Não aplicável - foco em squads ágeis',
    timeframe: 'Quick wins em 1-3 meses'
  },
  medio: {
    equipe: 'equipe dedicada de 4-6 pessoas com cientista de dados',
    abordagem: 'Combinar soluções prontas com desenvolvimento interno seletivo',
    investimento: '2-3% do faturamento',
    coe: 'Centro de competência enxuto (2-3 especialistas)',
    timeframe: 'Pilotos em 3-6 meses, escala em 9-12 meses'
  },
  grande: {
    equipe: 'Centro de Excelência com 8-15 pessoas',
    abordagem: 'Desenvolver capabilities internas com parceiros estratégicos',
    investimento: '3-5% do faturamento',
    coe: 'CoE dedicado com governança estruturada',
    timeframe: 'Roadmap de 12-24 meses com entregáveis trimestrais'
  },
  enterprise: {
    equipe: 'CoE federado com squads em cada unidade de negócio',
    abordagem: 'AI-first mindset com plataforma corporativa',
    investimento: '4-6% do faturamento',
    coe: 'CoE central + squads descentralizados',
    timeframe: 'Transformação contínua com ciclos de inovação'
  }
};

function normalizarVertical(vertical) {
  if (!vertical) return null;
  const v = vertical.toLowerCase();
  
  if (v.includes('fintech') || v.includes('financ') || v.includes('banco') || v.includes('pagamento')) return 'fintech';
  if (v.includes('saude') || v.includes('health') || v.includes('hospital') || v.includes('farma')) return 'saude';
  if (v.includes('tecnologia') || v.includes('tech') || v.includes('software') || v.includes('saas')) return 'tecnologia';
  if (v.includes('varejo') || v.includes('retail') || v.includes('ecommerce') || v.includes('loja')) return 'varejo';
  if (v.includes('industria') || v.includes('manufatura') || v.includes('fabrica') || v.includes('automotiv')) return 'industria';
  
  return 'servicos';
}

function normalizarPorte(porte) {
  if (!porte) return 'medio';
  const p = porte.toLowerCase();
  
  if (p.includes('pequen') || p.includes('micro') || p.includes('startup') || p.includes('pme')) return 'pequeno';
  if (p.includes('grand')) return 'grande';
  if (p.includes('enterprise') || p.includes('corporat') || p.includes('multinacional')) return 'enterprise';
  
  return 'medio';
}

function getProblemasERecomendacoes(scoresPorArea, vertical = null, porte = null) {
  const problemas = [];
  
  // IMPORTANTE: Ordenar por GAP (distância de 3.5, que é o ideal)
  // Não apenas por score baixo, mas por quanto está abaixo do esperado
  const mediaIdeal = 3.5;
  const areasComGap = scoresPorArea.map(area => ({
    ...area,
    gap: mediaIdeal - area.score,
    gapPercentual: ((mediaIdeal - area.score) / mediaIdeal * 100).toFixed(0)
  }));
  
  // Ordenar por GAP (maior gap primeiro)
  const areasOrdenadas = [...areasComGap].sort((a, b) => b.gap - a.gap);
  
  const verticalNorm = normalizarVertical(vertical);
  const porteNorm = normalizarPorte(porte);
  
  areasOrdenadas.forEach((area, index) => {
    if (area.score < 3.5) { // Considera gap qualquer score abaixo do ideal
      problemas.push({
        area: area.area,
        score: area.score,
        nivel: area.nivel,
        gap: area.gap,
        gapPercentual: area.gapPercentual,
        prioridade: area.gap > 1.5 ? 'Alta' : area.gap > 0.5 ? 'Média' : 'Baixa',
        problema: getProblemaByArea(area.area, area.score),
        acoes: getAcoesContextualizadas(area.area, area.score, verticalNorm, porteNorm)
      });
    }
  });
  
  return { problemas, areasOrdenadas };
}

// Nova função que retorna ações contextualizadas
function getAcoesContextualizadas(areaNome, score, vertical, porte) {
  const acoesBase = getAcoesByArea(areaNome, score);
  
  // Se não há vertical, retorna ações genéricas
  if (!vertical) return acoesBase;
  
  const configVertical = ACOES_POR_VERTICAL[vertical];
  const configPorte = ESTRUTURA_POR_PORTE[porte] || ESTRUTURA_POR_PORTE.medio;
  
  // Buscar ações específicas da vertical para esta área
  const acoesVertical = configVertical?.[areaNome] || [];
  
  // Filtrar ações genéricas que não devem aparecer para esta vertical
  const regulacoesNaoCitar = configVertical?.naoCitar || [];
  const acoesFiltradasBase = acoesBase.filter(acao => 
    !regulacoesNaoCitar.some(termo => acao.includes(termo))
  );
  
  // Combinar: primeiro ações da vertical (mais específicas), depois as genéricas filtradas
  const acoesFinais = [
    ...acoesVertical.slice(0, 2),
    ...acoesFiltradasBase.slice(0, 2)
  ];
  
  // Adicionar recomendação de estrutura por porte se relevante para a área
  if (areaNome.includes('Pessoas') || areaNome.includes('Talentos')) {
    acoesFinais.push(`Estruturar ${configPorte.equipe}`);
  }
  
  return acoesFinais.slice(0, 4);
}

function getProblemaByArea(areaNome, score) {
  const problemas = {
    'Estratégia e Liderança': score < 2 
      ? 'Ausência de estratégia formal de IA e baixo engajamento executivo'
      : 'Estratégia de IA em desenvolvimento, mas ainda não totalmente integrada ao negócio',
    'Dados e Tecnologia': score < 2
      ? 'Infraestrutura de dados fragmentada e falta de ferramentas de MLOps'
      : 'Qualidade de dados inconsistente e arquitetura com limitações de escalabilidade',
    'Governança e Risco': score < 2
      ? 'Ausência de framework de governança e políticas de compliance'
      : 'Governança básica implementada, mas sem processos de auditoria contínua',
    'Pessoas e Cultura': score < 2
      ? 'Escassez de talentos em IA e cultura avessa à experimentação'
      : 'Equipe em desenvolvimento, mas com gaps de capacitação e colaboração',
    'Operações e Processos': score < 2
      ? 'Poucos ou nenhum modelo em produção gerando valor'
      : 'Modelos em produção, mas sem processos maduros de MLOps',
    'Inovação e Experimentação': score < 2
      ? 'Sem ambiente dedicado para experimentação e inovação'
      : 'Experimentação pontual sem processo estruturado de escala',
    'Valor de Negócio e ROI': score < 2
      ? 'Sem métricas de ROI e desalinhamento com prioridades financeiras'
      : 'Métricas básicas, mas sem metodologia consistente de medição de valor',
    'Ecossistema e Parcerias': score < 2
      ? 'Operação isolada sem parcerias estratégicas de IA'
      : 'Parcerias pontuais sem estratégia estruturada de ecossistema',
    'Valor por Unidade de Negócio': score < 2
      ? 'Sem mapeamento de valor por unidade, IA centralizada sem conexão com áreas de negócio'
      : 'Mapeamento parcial, algumas unidades com casos de uso identificados mas sem priorização',
    'Talentos e Capacidades': score < 2
      ? 'Gap de talentos crítico, sem mapeamento de skills nem estratégia de desenvolvimento'
      : 'Equipe em formação, gaps identificados mas sem plano estruturado de upskilling/recrutamento',
    'Conformidade Regulatória': score < 2
      ? 'Conformidade ignorada, regulações desconhecidas, alto risco legal e regulatório'
      : 'Conformidade básica com LGPD, mas regulações setoriais e emergentes não endereçadas',
    'Prontidão para Mudança': score < 2
      ? 'Organização sem preparo para mudanças, resistência alta e sem gestão estruturada'
      : 'Gestão de mudança inicial, mas sem mapeamento de resistências e rede de agentes',
    'Plataforma e Industrialização de IA': score < 2
      ? 'Sem plataforma unificada, desenvolvimento ad-hoc e falta de componentes reutilizáveis'
      : 'Plataforma inicial existente, mas com baixa padronização e reuso limitado entre equipes',
    'IA como Gerador de Receita': score < 2
      ? 'IA não contribui para receita, foco apenas em redução de custos ou projetos internos'
      : 'Primeiros casos de monetização identificados, mas sem estratégia estruturada de produtos de IA',
    'Maturidade por Tipo de IA': score < 2
      ? 'Uso limitado a IA tradicional (ML básico), sem exploração de GenAI ou IA agêntica'
      : 'Experimentação com múltiplos tipos de IA, mas sem estratégia clara de quando usar cada tipo'
  };
  return problemas[areaNome] || `Score atual (${score.toFixed(1)}) indica oportunidades de melhoria nesta dimensão`;
}

function getAcoesByArea(areaNome, score) {
  const acoes = {
    'Estratégia e Liderança': [
      'Desenvolver e documentar estratégia de IA alinhada aos objetivos de negócio',
      'Engajar C-Level como sponsors ativos de iniciativas de IA',
      'Definir orçamento dedicado e roadmap de 1-3 anos',
      'Estabelecer métricas de sucesso claras para projetos de IA'
    ],
    'Dados e Tecnologia': [
      'Criar catálogo centralizado de dados com metadados',
      'Implementar processos de qualidade e governança de dados',
      'Investir em ferramentas de MLOps (versionamento, CI/CD)',
      'Desenvolver APIs padronizadas para acesso a dados'
    ],
    'Governança e Risco': [
      'Estabelecer framework de governança de IA',
      'Garantir conformidade com LGPD/GDPR em todos os projetos',
      'Criar comitê de ética em IA com reuniões regulares',
      'Implementar processos de identificação e mitigação de vieses'
    ],
    'Pessoas e Cultura': [
      'Recrutar ou desenvolver talentos em ciência de dados e ML',
      'Criar programa estruturado de capacitação em IA',
      'Fomentar cultura de experimentação e tolerância a falhas',
      'Estabelecer plano de carreira para profissionais de IA'
    ],
    'Operações e Processos': [
      'Identificar e priorizar processos para automação com IA',
      'Implementar SLAs para modelos em produção',
      'Desenvolver integração de IA com sistemas legados',
      'Estabelecer monitoramento contínuo de performance dos modelos'
    ],
    'Inovação e Experimentação': [
      'Criar laboratório ou sandbox dedicado para experimentação',
      'Estabelecer processo ágil para testar novas ideias',
      'Monitorar e adotar novas tecnologias de IA (LLMs, Transformers)',
      'Desenvolver parcerias com universidades e startups'
    ],
    'Valor de Negócio e ROI': [
      'Implementar modelo padronizado de medição de ROI',
      'Alinhar projetos de IA com prioridades financeiras',
      'Criar processo de priorização baseado em valor',
      'Estabelecer comunicação regular de resultados para stakeholders'
    ],
    'Ecossistema e Parcerias': [
      'Desenvolver estratégia de cloud (AWS, Azure, GCP) para IA',
      'Criar catálogo de serviços de terceiros homologados',
      'Estabelecer framework de make vs. buy para soluções',
      'Desenvolver parcerias estratégicas de longo prazo'
    ],
    'Valor por Unidade de Negócio': [
      'Mapear casos de uso de IA por unidade de negócio (Serviços, Produtos, Operações)',
      'Definir KPIs específicos de valor gerado por IA em cada unidade',
      'Criar framework de priorização de investimentos por potencial de valor',
      'Estabelecer autonomia controlada para unidades proporem iniciativas',
      'Implementar catálogo de soluções compartilháveis entre unidades',
      'Identificar e escalar best practices das unidades mais avançadas'
    ],
    'Talentos e Capacidades': [
      'Realizar inventário quantitativo de profissionais de IA (Data Scientists, ML Engineers, etc.)',
      'Executar gap analysis entre capacidades atuais e necessidades futuras',
      'Definir estratégia de Build vs. Buy vs. Borrow para talentos',
      'Criar programa estruturado de upskilling/reskilling em IA',
      'Estabelecer papéis especializados (MLOps, AI Ethics, AI Product Manager)',
      'Implementar métricas de produtividade e retenção da equipe de IA'
    ],
    'Conformidade Regulatória': [
      'Mapear todas as regulações aplicáveis (LGPD, BACEN, CVM, ANVISA conforme setor)',
      'Implementar Privacy by Design com DPIA obrigatório em projetos de IA',
      'Preparar para regulações emergentes (EU AI Act, regulações de algoritmos)',
      'Documentar explicabilidade e transparência de todos os modelos',
      'Estabelecer auditorias regulares de conformidade em IA',
      'Capacitar área jurídica/compliance em especificidades de IA'
    ],
    'Prontidão para Mudança': [
      'Implementar plano estruturado de gestão de mudança (baseado em ADKAR/Prosci)',
      'Mapear resistências por área, nível hierárquico e perfil comportamental',
      'Criar rede de agentes de mudança (champions de IA) em todas as áreas',
      'Desenvolver comunicação contínua sobre o "porquê" da transformação',
      'Engajar liderança intermediária como facilitadores da mudança',
      'Estabelecer mecanismos de sustentação e reforço das mudanças implementadas'
    ],
    'Plataforma e Industrialização de IA': [
      'Definir arquitetura de referência para plataforma de IA unificada',
      'Implementar Feature Store para compartilhamento de features entre modelos',
      'Criar Model Registry centralizado com versionamento e governança',
      'Padronizar pipelines de ML com templates reutilizáveis',
      'Estabelecer catálogo de componentes e APIs de IA compartilháveis',
      'Implementar observabilidade end-to-end (logs, métricas, traces) para modelos'
    ],
    'IA como Gerador de Receita': [
      'Identificar oportunidades de monetização direta de IA (produtos, APIs, serviços)',
      'Desenvolver pricing strategy para ofertas baseadas em IA',
      'Criar roadmap de produtos de IA para mercado externo',
      'Implementar métricas de revenue attribution para iniciativas de IA',
      'Explorar modelos de negócio inovadores (AI-as-a-Service, outcome-based)',
      'Estabelecer P&L específico para produtos de IA'
    ],
    'Maturidade por Tipo de IA': [
      'Mapear casos de uso adequados para cada tipo de IA (ML tradicional, GenAI, agentes)',
      'Desenvolver competências específicas para IA Generativa (prompt engineering, RAG)',
      'Criar framework de decisão para escolha do tipo de IA por problema',
      'Pilotar agentes de IA para automação de tarefas complexas',
      'Estabelecer governança específica para cada tipo de IA (riscos diferentes)',
      'Monitorar evolução tecnológica e atualizar estratégia de tipos de IA'
    ]
  };
  return acoes[areaNome] || [
    'Realizar diagnóstico detalhado da situação atual',
    'Definir metas específicas de melhoria com prazos',
    'Alocar recursos e responsáveis para evolução',
    'Estabelecer métricas de acompanhamento'
  ];
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

export function generateWordReport(dashboardData) {
  const maturityLevel = getMaturityLevelFromScore(dashboardData.scoreGeral);
  const { projecao: projFin, notaFaturamento } = getProjecaoFinanceiraAjustada(dashboardData);
  const levelInfo = MIT_CISR_LEVELS[maturityLevel];
  
  // Extrair vertical e porte para contextualização
  const verticalProjeto = dashboardData.projeto?.vertical || null;
  const porteEmpresa = dashboardData.empresa?.porte || null;
  
  // Usar recomendações CONTEXTUALIZADAS
  const { problemas, areasOrdenadas } = getProblemasERecomendacoes(
    dashboardData.scoresPorArea, 
    verticalProjeto, 
    porteEmpresa
  );

  const isProjeto = !!dashboardData.projeto;
  const entityName = isProjeto ? dashboardData.projeto.nome : dashboardData.empresa.nome;
  const empresaNome = dashboardData.empresa.nome;
  
  const vertical = isProjeto && dashboardData.projeto.vertical ? dashboardData.projeto.vertical : null;
  const verticalConfig = vertical ? VERTICAIS_CONFIG[vertical] : null;
  
  const getScoreColor = (score) => {
    if (score >= 4) return '#059669';
    if (score >= 3) return '#3b82f6';
    if (score >= 2) return '#d97706';
    return '#dc2626';
  };
  
  const getScoreBg = (score) => {
    if (score >= 4) return '#dcfce7';
    if (score >= 3) return '#dbeafe';
    if (score >= 2) return '#fef3c7';
    return '#fee2e2';
  };
  
  const getStatusLabel = (score) => {
    if (score >= 4) return 'Saudável';
    if (score >= 3) return 'Adequado';
    if (score >= 2) return 'Atenção';
    return 'Crítico';
  };

  const KPIS_WORD = {
    'Estratégia e Liderança': [
      { kpi: 'NPS Executivo em IA', meta: '> 70 pontos' },
      { kpi: 'Budget aprovado para IA', meta: '> 3% faturamento' },
      { kpi: 'Reuniões C-Level sobre IA', meta: '> 2/mês' }
    ],
    'Dados e Tecnologia': [
      { kpi: 'Qualidade de dados (DQI)', meta: '> 85%' },
      { kpi: 'Cobertura Data Catalog', meta: '> 80%' },
      { kpi: 'Uptime infraestrutura ML', meta: '> 99.5%' }
    ],
    'Valor de Negócio e ROI': [
      { kpi: 'ROI médio projetos IA', meta: '> 150%' },
      { kpi: 'Time-to-Value', meta: '< 6 meses' },
      { kpi: 'Projetos com ROI positivo', meta: '> 70%' }
    ],
    'Governança e Risco': [
      { kpi: 'Cobertura políticas IA', meta: '100%' },
      { kpi: 'Incidentes compliance', meta: '0/ano' },
      { kpi: 'Modelos auditados', meta: '> 90%' }
    ],
    'Pessoas e Cultura': [
      { kpi: 'Colaboradores capacitados', meta: '> 50%' },
      { kpi: 'Retenção talentos IA', meta: '> 85%' },
      { kpi: 'eNPS área de IA', meta: '> 50 pontos' }
    ],
    'Operações e Processos': [
      { kpi: 'Processos automatizados', meta: '> 40%' },
      { kpi: 'Redução tempo ciclo', meta: '> 30%' },
      { kpi: 'Taxa erro humano', meta: '< 2%' }
    ]
  };

  const DEPENDENCIAS_WORD = [
    { area: 'Estratégia e Liderança', depende: '-', habilita: 'Governança, Dados, Valor', ordem: 1 },
    { area: 'Governança e Risco', depende: 'Estratégia', habilita: 'Dados, Operações', ordem: 2 },
    { area: 'Pessoas e Cultura', depende: 'Estratégia', habilita: 'Operações, Inovação', ordem: 2 },
    { area: 'Dados e Tecnologia', depende: 'Estratégia, Governança', habilita: 'Operações, Inovação', ordem: 3 },
    { area: 'Operações e Processos', depende: 'Dados, Pessoas', habilita: 'Valor', ordem: 4 },
    { area: 'Valor de Negócio e ROI', depende: 'Operações', habilita: 'Inovação', ordem: 5 }
  ];

  const ROADMAP_WORD = [
    { trimestre: 'T1', titulo: 'Fundação', entregas: 'Estratégia de IA aprovada, Comitê de governança, Assessment de dados, Quick wins identificados', marco: 'Sponsor executivo nomeado' },
    { trimestre: 'T2', titulo: 'Capacitação', entregas: 'Programa upskilling, Políticas publicadas, Plataforma dados MVP, Pilotos em execução', marco: '3 pilotos validados' },
    { trimestre: 'T3', titulo: 'Escala', entregas: 'MLOps implementado, Catálogo de modelos, Expansão áreas, Framework ROI', marco: 'ROI comprovado' },
    { trimestre: 'T4', titulo: 'Otimização', entregas: 'Automação em escala, IA em produção, CoE maduro, Inovação contínua', marco: 'Nível Gerenciado atingido' }
  ];

  const top5Gaps = areasOrdenadas.slice(-5).reverse();
  
  const html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page { size: A4; margin: 1.5cm; }
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 10pt; line-height: 1.4; color: #1e293b; margin: 0; padding: 15px; }
    .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 15px; }
    .logo { font-size: 18pt; font-weight: bold; color: #1e3a8a; }
    .logo span { color: #3b82f6; }
    .subtitle { color: #64748b; font-size: 9pt; margin-top: 3px; }
    h1 { color: #1e3a8a; font-size: 13pt; margin: 20px 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #3b82f6; page-break-after: avoid; }
    h2 { color: #1e40af; font-size: 11pt; margin: 15px 0 8px 0; page-break-after: avoid; }
    h3 { color: #334155; font-size: 10pt; margin: 10px 0 6px 0; }
    p { margin: 6px 0; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9pt; }
    th { background-color: #1e3a8a; color: white; padding: 6px 8px; text-align: left; font-weight: bold; border: 1px solid #1e3a8a; }
    td { padding: 5px 8px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .score-box { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 15px; text-align: center; margin: 15px 0; border-radius: 8px; }
    .score-box .score { font-size: 28pt; font-weight: bold; }
    .score-box .label { font-size: 9pt; opacity: 0.9; }
    .info-box { background-color: #f8fafc; padding: 8px 12px; margin: 6px 0; border-left: 3px solid #3b82f6; }
    .info-box .label { font-size: 8pt; color: #64748b; text-transform: uppercase; }
    .info-box .value { font-size: 10pt; font-weight: bold; color: #1e3a8a; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin: 8px 0; }
    .card-header { font-weight: bold; color: #1e3a8a; margin-bottom: 5px; }
    .highlight-green { background-color: #dcfce7; border-left: 3px solid #22c55e; padding: 8px 12px; margin: 8px 0; }
    .highlight-amber { background-color: #fef3c7; border-left: 3px solid #f59e0b; padding: 8px 12px; margin: 8px 0; }
    .highlight-red { background-color: #fee2e2; border-left: 3px solid #ef4444; padding: 8px 12px; margin: 8px 0; }
    .highlight-blue { background-color: #dbeafe; border-left: 3px solid #3b82f6; padding: 8px 12px; margin: 8px 0; }
    ul { margin: 6px 0; padding-left: 20px; }
    li { margin: 4px 0; }
    .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 8pt; }
    br.page-break { page-break-before: always; mso-special-character: line-break; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9pt; font-weight: bold; }
  </style>
</head>
<body>

<!-- ============================================ -->
<!-- CAPA -->
<!-- ============================================ -->
<div class="header">
  <div class="logo">Sys<span>Map</span> Solutions</div>
  <div class="subtitle">Blueprint IA — Relatório Técnico de Maturidade em Inteligência Artificial</div>
</div>

<div style="text-align: center; margin: 25px 0;">
  <p style="font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 2px;">Relatório Técnico</p>
  <h1 style="border: none; font-size: 20pt; margin: 5px 0;">Maturidade em Inteligência Artificial</h1>
  <p style="font-size: 10pt; color: #64748b;">Assessment Completo • MIT CISR Framework</p>
</div>

<div class="score-box">
  <div class="label">RESULTADO DA AVALIAÇÃO</div>
  <div class="score">${dashboardData.scoreGeral.toFixed(2)}</div>
  <div style="font-size: 14pt; margin-top: 5px;">${dashboardData.nivelGeral}</div>
</div>

<table style="margin: 15px 0;">
  <tr>
    <td style="width: 50%; background: #f8fafc; border-left: 3px solid #3b82f6;">
      <div style="font-size: 8pt; color: #64748b; text-transform: uppercase;">Empresa</div>
      <div style="font-size: 11pt; font-weight: bold; color: #1e3a8a;">${empresaNome}</div>
    </td>
    <td style="width: 50%; background: #f8fafc; border-left: 3px solid #3b82f6;">
      <div style="font-size: 8pt; color: #64748b; text-transform: uppercase;">${isProjeto ? 'Projeto' : 'Tipo'}</div>
      <div style="font-size: 11pt; font-weight: bold; color: #1e3a8a;">${isProjeto ? dashboardData.projeto.nome : 'Avaliação Consolidada'}</div>
    </td>
  </tr>
  <tr>
    <td style="width: 50%; background: #f8fafc; border-left: 3px solid #3b82f6;">
      <div style="font-size: 8pt; color: #64748b; text-transform: uppercase;">Avaliadores</div>
      <div style="font-size: 11pt; font-weight: bold; color: #1e3a8a;">${dashboardData.totalAvaliadores}</div>
    </td>
    <td style="width: 50%; background: #f8fafc; border-left: 3px solid #3b82f6;">
      <div style="font-size: 8pt; color: #64748b; text-transform: uppercase;">Data</div>
      <div style="font-size: 11pt; font-weight: bold; color: #1e3a8a;">${formatDate(new Date())}</div>
    </td>
  </tr>
</table>

<!-- ÍNDICE -->
<div class="card" style="margin-top: 20px;">
  <div class="card-header">📋 Índice</div>
  <table style="margin: 5px 0; font-size: 9pt;">
    <tr><td style="border: none; padding: 3px 8px;">1. Sumário Executivo</td><td style="border: none; width: 60px; text-align: right; color: #64748b;">p. 2</td></tr>
    <tr><td style="border: none; padding: 3px 8px;">2. Detalhamento por Dimensão</td><td style="border: none; width: 60px; text-align: right; color: #64748b;">p. 2</td></tr>
    <tr><td style="border: none; padding: 3px 8px;">3. KPIs Específicos por Área</td><td style="border: none; width: 60px; text-align: right; color: #64748b;">p. 3</td></tr>
    <tr><td style="border: none; padding: 3px 8px;">4. Matriz de Dependências</td><td style="border: none; width: 60px; text-align: right; color: #64748b;">p. 4</td></tr>
    <tr><td style="border: none; padding: 3px 8px;">5. Roadmap Estratégico 12 Meses</td><td style="border: none; width: 60px; text-align: right; color: #64748b;">p. 5</td></tr>
    <tr><td style="border: none; padding: 3px 8px;">6. Apêndices Metodológicos</td><td style="border: none; width: 60px; text-align: right; color: #64748b;">p. 6</td></tr>
  </table>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<!-- ============================================ -->
<!-- 1. SUMÁRIO EXECUTIVO -->
<!-- ============================================ -->
<h1>1. SUMÁRIO EXECUTIVO</h1>

<p>Este relatório apresenta os resultados do Assessment de Maturidade em Inteligência Artificial realizado na <strong>${empresaNome}</strong>${isProjeto ? ` para o projeto <strong>${dashboardData.projeto.nome}</strong>` : ''}, utilizando a metodologia SysMap Blueprint IA, alinhada com o <strong>MIT CISR Enterprise AI Maturity Model</strong>.</p>

<p>A avaliação analisou <strong>múltiplas dimensões</strong> críticas de maturidade em IA, com base nas respostas de <strong>${dashboardData.totalAvaliadores} avaliador(es)</strong>, resultando em um score geral de <strong>${dashboardData.scoreGeral.toFixed(1)} pontos</strong>, classificando a organização no nível <strong>"${dashboardData.nivelGeral}"</strong>.</p>

<div class="stage-box">
  <div class="stage-title">📊 Nível de Maturidade: ${levelInfo.name}</div>
  <p><strong>Score:</strong> ${dashboardData.scoreGeral.toFixed(1)} / 5.0 (Nível ${maturityLevel} de 5)</p>
  <p><strong>Foco Principal:</strong> ${levelInfo.focus}</p>
  <p><strong>Referência MIT:</strong> ${levelInfo.nameEn}</p>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin: 15px 0; background: #f8fafc; padding: 15px; border-radius: 8px;">
    <div style="text-align: center;">
      <div style="font-size: 12px; color: #64748b;">Crescimento vs. Mercado</div>
      <div style="font-size: 18px; font-weight: bold; color: ${levelInfo.performance.growth.includes('+') ? '#22c55e' : levelInfo.performance.growth.includes('-') ? '#ef4444' : '#f59e0b'};">${levelInfo.performance.growth}</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 12px; color: #64748b;">Lucratividade</div>
      <div style="font-size: 18px; font-weight: bold; color: #334155;">${levelInfo.performance.profit}</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 12px; color: #64748b;">ROI Típico</div>
      <div style="font-size: 18px; font-weight: bold; color: #3b82f6;">${levelInfo.performance.roi}</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 12px; color: #64748b;">Time to Value</div>
      <div style="font-size: 18px; font-weight: bold; color: #8b5cf6;">${levelInfo.performance.timeToValue}</div>
    </div>
  </div>

  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; border-radius: 0 8px 8px 0;">
    <p style="margin: 0;"><strong>⚠️ Impacto Competitivo:</strong> ${levelInfo.marketImpact}</p>
  </div>
  
  <p style="margin-top: 15px;"><strong>Características deste nível:</strong></p>
  <ul>
    ${levelInfo.characteristics.map(c => `<li>${c}</li>`).join('')}
  </ul>
</div>

<h2>1.1 Escala de Maturidade em IA (1-5)</h2>
<table>
  <thead>
    <tr>
      <th>Nível</th>
      <th>Nome</th>
      <th>Score</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr style="${maturityLevel === 1 ? 'background: #fee2e2; font-weight: bold;' : ''}">
      <td style="text-align: center;"><span class="badge" style="background: #ef4444; color: white;">1</span></td>
      <td>Inicial</td>
      <td>1.0 - 1.5</td>
      <td>${maturityLevel === 1 ? '← ATUAL' : ''}</td>
    </tr>
    <tr style="${maturityLevel === 2 ? 'background: #fef3c7; font-weight: bold;' : ''}">
      <td style="text-align: center;"><span class="badge" style="background: #f59e0b; color: white;">2</span></td>
      <td>Oportunista</td>
      <td>1.5 - 2.5</td>
      <td>${maturityLevel === 2 ? '← ATUAL' : ''}</td>
    </tr>
    <tr style="${maturityLevel === 3 ? 'background: #dbeafe; font-weight: bold;' : ''}">
      <td style="text-align: center;"><span class="badge" style="background: #3b82f6; color: white;">3</span></td>
      <td>Estruturado</td>
      <td>2.5 - 3.5</td>
      <td>${maturityLevel === 3 ? '← ATUAL' : ''}</td>
    </tr>
    <tr style="${maturityLevel === 4 ? 'background: #dbeafe; font-weight: bold;' : ''}">
      <td style="text-align: center;"><span class="badge" style="background: #2563eb; color: white;">4</span></td>
      <td>Gerenciado</td>
      <td>3.5 - 4.5</td>
      <td>${maturityLevel === 4 ? '← ATUAL' : ''}</td>
    </tr>
    <tr style="${maturityLevel === 5 ? 'background: #dcfce7; font-weight: bold;' : ''}">
      <td style="text-align: center;"><span class="badge" style="background: #22c55e; color: white;">5</span></td>
      <td>Otimizado</td>
      <td>4.5 - 5.0</td>
      <td>${maturityLevel === 5 ? '← ATUAL' : ''}</td>
    </tr>
  </tbody>
</table>

<h2>Score por Dimensão</h2>
<table>
  <thead>
    <tr>
      <th>Dimensão</th>
      <th>Score</th>
      <th>Nível</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    ${areasOrdenadas.map(area => `
    <tr>
      <td>${area.area}</td>
      <td style="font-weight: bold; color: ${getScoreColor(area.score)};">${area.score.toFixed(1)}</td>
      <td>${area.nivel}</td>
      <td style="color: ${getScoreColor(area.score)};">${getStatusLabel(area.score)}</td>
    </tr>
    `).join('')}
  </tbody>
</table>

${vertical && BENCHMARKING_POR_VERTICAL[vertical] ? `
<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>2. BENCHMARKING COMPETITIVO</h1>

<p>Comparação do score da organização com o benchmark do setor <strong>${verticalConfig?.nome || vertical}</strong>:</p>

<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 20px 0;">
  <div style="background: linear-gradient(135deg, ${dashboardData.scoreGeral >= BENCHMARKING_POR_VERTICAL[vertical].mediaSetor ? '#059669' : '#dc2626'}, ${dashboardData.scoreGeral >= BENCHMARKING_POR_VERTICAL[vertical].mediaSetor ? '#10b981' : '#ef4444'}); color: white; padding: 20px; border-radius: 12px; text-align: center;">
    <div style="font-size: 14px; opacity: 0.9;">Sua Empresa</div>
    <div style="font-size: 36px; font-weight: bold;">${dashboardData.scoreGeral.toFixed(1)}</div>
    <div style="font-size: 12px; margin-top: 5px;">${dashboardData.scoreGeral >= BENCHMARKING_POR_VERTICAL[vertical].mediaSetor ? '✓ Acima da média' : '⚠ Abaixo da média'}</div>
  </div>
  <div style="background: #f8fafc; border: 2px solid #3b82f6; padding: 20px; border-radius: 12px; text-align: center;">
    <div style="font-size: 14px; color: #666;">Média do Setor</div>
    <div style="font-size: 36px; font-weight: bold; color: #3b82f6;">${BENCHMARKING_POR_VERTICAL[vertical].mediaSetor.toFixed(1)}</div>
    <div style="font-size: 12px; color: #666; margin-top: 5px;">Benchmark 2024</div>
  </div>
  <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 12px; text-align: center;">
    <div style="font-size: 14px; color: #666;">Top 25% do Setor</div>
    <div style="font-size: 36px; font-weight: bold; color: #22c55e;">${BENCHMARKING_POR_VERTICAL[vertical].top25.toFixed(1)}</div>
    <div style="font-size: 12px; color: #666; margin-top: 5px;">Referência de excelência</div>
  </div>
</div>

<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <h4 style="margin: 0 0 15px 0; color: #1e3a8a;">Distribuição do Mercado - ${verticalConfig?.nome || vertical}</h4>
  <table style="width: 100%; margin: 0;">
    <tr style="background: #f1f5f9;">
      <th style="padding: 8px; text-align: left;">Nível</th>
      <th style="padding: 8px; text-align: center;">% do Mercado</th>
      <th style="padding: 8px; text-align: center;">Sua Posição</th>
    </tr>
    <tr><td style="padding: 8px;">Nível 1 - Inicial</td><td style="padding: 8px; text-align: center;">${BENCHMARKING_POR_VERTICAL[vertical].distribuicao.nivel1}%</td><td style="padding: 8px; text-align: center;">${maturityLevel === 1 ? '← VOCÊ ESTÁ AQUI' : ''}</td></tr>
    <tr style="background: #f8fafc;"><td style="padding: 8px;">Nível 2 - Oportunista</td><td style="padding: 8px; text-align: center;">${BENCHMARKING_POR_VERTICAL[vertical].distribuicao.nivel2}%</td><td style="padding: 8px; text-align: center;">${maturityLevel === 2 ? '← VOCÊ ESTÁ AQUI' : ''}</td></tr>
    <tr><td style="padding: 8px;">Nível 3 - Estruturado</td><td style="padding: 8px; text-align: center;">${BENCHMARKING_POR_VERTICAL[vertical].distribuicao.nivel3}%</td><td style="padding: 8px; text-align: center;">${maturityLevel === 3 ? '← VOCÊ ESTÁ AQUI' : ''}</td></tr>
    <tr style="background: #f8fafc;"><td style="padding: 8px;">Nível 4 - Gerenciado</td><td style="padding: 8px; text-align: center;">${BENCHMARKING_POR_VERTICAL[vertical].distribuicao.nivel4}%</td><td style="padding: 8px; text-align: center;">${maturityLevel === 4 ? '← VOCÊ ESTÁ AQUI' : ''}</td></tr>
    <tr><td style="padding: 8px;">Nível 5 - Otimizado</td><td style="padding: 8px; text-align: center;">${BENCHMARKING_POR_VERTICAL[vertical].distribuicao.nivel5}%</td><td style="padding: 8px; text-align: center;">${maturityLevel === 5 ? '← VOCÊ ESTÁ AQUI' : ''}</td></tr>
  </table>
  <p style="margin: 15px 0 0 0; font-size: 11px; color: #666; font-style: italic;">Fonte: ${BENCHMARKING_POR_VERTICAL[vertical].fonte}</p>
</div>
` : ''}

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>3. PROJEÇÃO DE IMPACTO FINANCEIRO</h1>

<p>Com base no nível de maturidade atual (${levelInfo.name}), apresentamos projeções de impacto financeiro esperado:</p>

<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0;">
  <div style="background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 12px; text-align: center;">
    <div style="font-size: 12px; color: #666; text-transform: uppercase;">Crescimento de Receita</div>
    <div style="font-size: 28px; font-weight: bold; color: #15803d;">+${projFin.crescimentoReceita.min}% a +${projFin.crescimentoReceita.max}%</div>
    <div style="font-size: 12px; color: #666;">Média: +${projFin.crescimentoReceita.media}%</div>
  </div>
  <div style="background: #eff6ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 12px; text-align: center;">
    <div style="font-size: 12px; color: #666; text-transform: uppercase;">Redução de Custos</div>
    <div style="font-size: 28px; font-weight: bold; color: #1e40af;">-${projFin.reducaoCustos.min}% a -${projFin.reducaoCustos.max}%</div>
    <div style="font-size: 12px; color: #666;">Média: -${projFin.reducaoCustos.media}%</div>
  </div>
  <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 12px; text-align: center;">
    <div style="font-size: 12px; color: #666; text-transform: uppercase;">ROI Esperado</div>
    <div style="font-size: 28px; font-weight: bold; color: #b45309;">${projFin.roiEsperado.min}% a ${projFin.roiEsperado.max}%</div>
    <div style="font-size: 12px; color: #666;">Tempo: ${projFin.tempoParaROI}</div>
  </div>
</div>

<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <h4 style="margin: 0 0 15px 0; color: #1e3a8a;">💰 Investimento Recomendado</h4>
  <p style="font-size: 24px; font-weight: bold; color: #1e40af; margin: 0 0 10px 0;">${projFin.investimentoRecomendado}</p>
  ${notaFaturamento ? `<p style="font-size: 12px; color: #64748b; margin: 8px 0 0 0;">${notaFaturamento}</p>` : ''}
  <p style="margin: 0; font-size: 14px; color: #666;">Para organizações no ${levelInfo.name}</p>
</div>

<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
  <h4 style="margin: 0 0 10px 0; color: #dc2626;">⚠️ Riscos Financeiros a Considerar</h4>
  <ul style="margin: 0; padding-left: 20px;">
    ${projFin.riscosFinanceiros.map(r => `<li style="margin: 5px 0; font-size: 14px;">${r}</li>`).join('')}
  </ul>
</div>

<div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <h4 style="margin: 0 0 15px 0; color: #1e40af;">📚 Metodologia e Fontes</h4>
  
  <div style="margin-bottom: 12px;">
    <p style="margin: 0 0 8px 0; font-size: 13px;"><strong style="color: #1e3a8a;">Fontes dos benchmarks:</strong></p>
    <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.6;">
      As faixas de ROI, crescimento de receita e redução de custos são baseadas em estudos publicados pelo 
      <strong>MIT CISR - Center for Information Systems Research</strong> (Weill, Woerner & Sebastian, 2024), 
      <strong>McKinsey Global Institute</strong> "The State of AI in 2024", e 
      <strong>Gartner AI Maturity Model</strong>. 
      ${vertical && BENCHMARKING_POR_VERTICAL[vertical] ? `Dados setoriais específicos extraídos de <strong>${BENCHMARKING_POR_VERTICAL[vertical].fonte}</strong>.` : ''}
    </p>
  </div>
  
  <div style="margin-bottom: 12px;">
    <p style="margin: 0 0 8px 0; font-size: 13px;"><strong style="color: #1e3a8a;">Conversão do score:</strong></p>
    <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.6;">
      O score de maturidade (escala 1-5) é mapeado para faixas de impacto financeiro conforme a progressão típica observada nos estudos de referência. 
      O nível atual (${maturityLevel}) corresponde a empresas em fase de <strong>${maturityLevel <= 2 ? 'experimentação e preparação' : maturityLevel <= 3 ? 'estruturação e pilotos' : 'industrialização e escala'}</strong>, 
      com crescimento típico de <strong>${projFin.crescimentoReceita.min}% a ${projFin.crescimentoReceita.max}%</strong> vs. mercado
      e ROI médio de <strong>${projFin.roiEsperado.media}%</strong> em iniciativas de IA.
    </p>
  </div>
  
  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-top: 15px; border-radius: 0 8px 8px 0;">
    <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.6;">
      <strong>⚠ Nota importante:</strong> As projeções apresentadas são <strong>referenciais baseados em benchmarks de mercado</strong> e não constituem promessas contratuais. 
      Resultados reais dependem de fatores como qualidade da execução, contexto setorial específico, nível de investimento realizado e maturidade organizacional para absorver mudanças.
    </p>
  </div>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>4. RESULTADOS POR DIMENSÃO</h1>

<table>
  <thead>
    <tr>
      <th>Dimensão</th>
      <th>Score</th>
      <th>Nível</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    ${areasOrdenadas.map(area => `
    <tr>
      <td>${area.area}</td>
      <td class="score-cell ${area.score >= 4 ? 'score-high' : area.score >= 2.5 ? 'score-medium' : 'score-low'}">${area.score.toFixed(1)}</td>
      <td>${area.nivel}</td>
      <td>${area.score >= 4 ? '✓ Excelente' : area.score >= 3 ? '◐ Bom' : area.score >= 2 ? '◑ Aceitável' : '✗ Crítico'}</td>
    </tr>
    `).join('')}
  </tbody>
</table>

${dashboardData.avaliadores && dashboardData.avaliadores.length > 0 ? `
<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>5. AVALIADORES E PARTICIPANTES</h1>

<table>
  <thead>
    <tr>
      <th>Nome</th>
      <th>Email</th>
      <th>Áreas Avaliadas</th>
      <th>Data</th>
    </tr>
  </thead>
  <tbody>
    ${dashboardData.avaliadores.map(av => `
    <tr>
      <td>${av.nome}</td>
      <td>${av.email}</td>
      <td>${av.areasSelecionadas.length} áreas</td>
      <td>${formatDate(av.dataAvaliacao)}</td>
    </tr>
    `).join('')}
  </tbody>
</table>
` : ''}

${verticalConfig ? `
<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>6. ANÁLISE POR VERTICAL: ${verticalConfig.nome.toUpperCase()}</h1>

<div style="background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 25px; border-radius: 12px; margin: 20px 0;">
  <div style="font-size: 48px; margin-bottom: 10px;">${verticalConfig.icon}</div>
  <div style="font-size: 24px; font-weight: bold;">${verticalConfig.nome}</div>
  <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">Análise especializada para o setor</div>
</div>

<h2>6.1 Frameworks de Referência do Setor</h2>
<p>A análise considera os seguintes frameworks e padrões específicos da indústria:</p>
<ul>
  ${verticalConfig.frameworks.map(f => `<li><strong>${f}</strong></li>`).join('')}
</ul>

<h2>6.2 Casos de Uso Prioritários para ${verticalConfig.nome}</h2>
<p>Com base no estágio atual de maturidade (${levelInfo.name}), os seguintes casos de uso são recomendados:</p>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
  ${verticalConfig.casosDeUso.map((caso, i) => `
  <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 0 8px 8px 0;">
    <span style="color: #1e40af; font-weight: bold;">${i + 1}.</span> ${caso}
  </div>
  `).join('')}
</div>

<h2>6.3 Desafios Específicos do Setor ${verticalConfig.nome}</h2>
<p>A implementação de IA neste setor enfrenta os seguintes desafios específicos que devem ser considerados:</p>
<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <ul style="margin: 0;">
    ${verticalConfig.desafiosEspecificos.map(d => `<li style="margin: 8px 0; color: #991b1b;">${d}</li>`).join('')}
  </ul>
</div>

<h2>6.4 Recomendações Específicas por Área de Maturidade</h2>
<p>Baseado nas características do setor ${verticalConfig.nome}, apresentamos recomendações específicas para cada área avaliada:</p>

${Object.entries(verticalConfig.recomendacoesPorArea).map(([area, recs]) => {
  const areaScore = dashboardData.scoresPorArea?.find(a => a.area === area);
  const scoreColor = areaScore ? (areaScore.score >= 4 ? '#059669' : areaScore.score >= 3 ? '#3b82f6' : areaScore.score >= 2 ? '#d97706' : '#dc2626') : '#666';
  return `
<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
    <h4 style="margin: 0; color: #1e3a8a;">${area}</h4>
    ${areaScore ? `<span style="background: ${scoreColor}20; color: ${scoreColor}; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;">Score: ${areaScore.score.toFixed(1)}</span>` : ''}
  </div>
  <ul style="margin: 0; padding-left: 20px;">
    ${recs.map(r => `<li style="margin: 5px 0;">${r}</li>`).join('')}
  </ul>
</div>
`;
}).join('')}

<h2>6.5 KPIs Específicos do Setor</h2>
<p>Para medir o sucesso das iniciativas de IA no setor ${verticalConfig.nome}, recomendamos acompanhar:</p>
<table>
  <thead>
    <tr>
      <th>KPI</th>
      <th>Relevância</th>
    </tr>
  </thead>
  <tbody>
    ${verticalConfig.kpisEspecificos.map((kpi, i) => `
    <tr>
      <td><strong>${kpi}</strong></td>
      <td>${i < 2 ? '🔴 Crítico' : i < 3 ? '🟡 Alta' : '🟢 Média'}</td>
    </tr>
    `).join('')}
  </tbody>
</table>

<h2>6.6 Tendências de IA para ${verticalConfig.nome} (2024-2026)</h2>
<p>Fique atento às seguintes tendências que estão transformando o setor:</p>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
  ${verticalConfig.tendencias2024.map(t => `
  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 0 8px 8px 0;">
    <span style="font-size: 18px;">🚀</span> ${t}
  </div>
  `).join('')}
</div>
` : ''}

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>7. PRINCIPAIS GAPS E PROBLEMAS IDENTIFICADOS</h1>

${problemas.length > 0 ? problemas.map((p, i) => `
<div class="problem-box">
  <div class="problem-title">🔴 ${i + 1}. ${p.area} (Score: ${p.score.toFixed(1)} - Prioridade ${p.prioridade})</div>
  <p><strong>Diagnóstico:</strong> ${p.problema}</p>
</div>
`).join('') : '<p>✓ Todas as áreas estão com score acima de 3.0, indicando bom nível de maturidade.</p>'}

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>8. PLANO DE AÇÃO RECOMENDADO</h1>

<p>Com base na análise dos resultados e no modelo de maturidade do MIT CISR, recomendamos as seguintes ações para evolução:</p>

<h2>8.1 Ações Imediatas (0-3 meses)</h2>
${problemas.slice(0, 2).map((p, i) => `
<div class="action-box">
  <div class="action-title">✓ ${p.area}</div>
  <ul>
    ${p.acoes.slice(0, 2).map(a => `<li>${a}</li>`).join('')}
  </ul>
</div>
`).join('') || '<p>Manter foco em melhorias contínuas nas áreas de destaque.</p>'}

<h2>8.2 Ações de Curto Prazo (3-6 meses)</h2>
${problemas.slice(0, 3).map((p, i) => {
  const acoesCurtoPrazo = p.acoes.length > 2 ? p.acoes.slice(2, 4) : p.acoes.slice(0, 2);
  return acoesCurtoPrazo.length > 0 ? `
<div class="action-box">
  <div class="action-title">✓ ${p.area}</div>
  <ul>
    ${acoesCurtoPrazo.map(a => `<li>${a}</li>`).join('')}
  </ul>
</div>` : '';
}).join('') || '<p>Expandir iniciativas de sucesso e explorar novas oportunidades.</p>'}

<h2>8.3 Evolução para o Próximo Nível</h2>

<div class="stage-box">
  <div class="stage-title">🎯 Recomendações para ${levelInfo.name}</div>
  <p><strong>Nível de Investimento Recomendado:</strong> ${levelInfo.investimento}</p>
  <ul>
    ${levelInfo.recommendations.map(r => `<li>${r}</li>`).join('')}
  </ul>
</div>

${maturityLevel < 5 ? `
<div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <h4 style="color: #15803d; margin-bottom: 15px;">🚀 Para avançar ao Nível ${maturityLevel + 1}: ${MIT_CISR_LEVELS[maturityLevel + 1].name}</h4>
  <p style="margin-bottom: 10px;"><strong>Foco:</strong> ${MIT_CISR_LEVELS[maturityLevel + 1].focus}</p>
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 10px 0; background: #dcfce7; padding: 10px; border-radius: 6px;">
    <div style="text-align: center;">
      <div style="font-size: 11px; color: #166534;">Crescimento Esperado</div>
      <div style="font-size: 14px; font-weight: bold; color: #15803d;">${MIT_CISR_LEVELS[maturityLevel + 1].performance.growth}</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 11px; color: #166534;">ROI Típico</div>
      <div style="font-size: 14px; font-weight: bold; color: #15803d;">${MIT_CISR_LEVELS[maturityLevel + 1].performance.roi}</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 11px; color: #166534;">Time to Value</div>
      <div style="font-size: 14px; font-weight: bold; color: #15803d;">${MIT_CISR_LEVELS[maturityLevel + 1].performance.timeToValue}</div>
    </div>
  </div>
  <p><strong>Principais capacidades a desenvolver:</strong></p>
  <ul>
    ${MIT_CISR_LEVELS[maturityLevel + 1].characteristics.map(c => `<li>${c}</li>`).join('')}
  </ul>
</div>
` : `
<div style="background: #faf5ff; border: 2px solid #8b5cf6; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <h4 style="color: #7c3aed; margin-bottom: 15px;">🏆 Parabéns! Você está no Nível Máximo de Maturidade</h4>
  <p>A organização alcançou o nível máximo de maturidade em IA. O foco agora deve ser:</p>
  <ul>
    <li>Manter a liderança através de inovação contínua</li>
    <li>Explorar novas fronteiras como IA agêntica e robótica</li>
    <li>Monetizar capacidades de IA para terceiros</li>
    <li>Liderar o ecossistema da indústria</li>
  </ul>
</div>
`}

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>9. ROADMAP ESTRATÉGICO DE EVOLUÇÃO</h1>

<p>O roadmap a seguir foi desenvolvido considerando o estágio atual de maturidade e os gaps identificados. Cada fase inclui entregáveis específicos, marcos temporais, recursos necessários e KPIs de acompanhamento.</p>

${Object.values(ROADMAP_DETALHADO).map((fase, index) => `
<div class="roadmap-phase" style="background: ${index % 2 === 0 ? '#f8fafc' : '#fff'}; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">${index + 1}</div>
    <div>
      <h3 style="margin: 0; color: #1e3a8a; font-size: 18px;">${fase.nome}</h3>
      <p style="margin: 0; color: #666; font-size: 14px;">${fase.duracao} | Objetivo: ${fase.objetivo}</p>
    </div>
  </div>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
    <div>
      <h4 style="color: #059669; font-size: 14px; margin-bottom: 10px;">✓ Entregáveis</h4>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
        ${fase.entregaveis.map(e => `<li style="margin: 5px 0;">${e}</li>`).join('')}
      </ul>
    </div>
    <div>
      <h4 style="color: #1e40af; font-size: 14px; margin-bottom: 10px;">📊 KPIs de Acompanhamento</h4>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
        ${fase.kpis.map(k => `<li style="margin: 5px 0;">${k}</li>`).join('')}
      </ul>
    </div>
  </div>

  <div style="margin-top: 15px;">
    <h4 style="color: #7c3aed; font-size: 14px; margin-bottom: 10px;">🎯 Marcos Principais</h4>
    <table style="width: 100%; margin: 0; font-size: 10pt;">
      <tr style="background-color: #ede9fe;">
        <th style="padding: 8px; text-align: left; width: 80px; background-color: #7c3aed; color: white;">Semana</th>
        <th style="padding: 8px; text-align: left; background-color: #7c3aed; color: white;">Entrega</th>
      </tr>
      ${fase.marcos.map(m => '<tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #5b21b6;">S' + m.semana + '</td><td style="padding: 8px; border: 1px solid #e2e8f0;">' + m.entrega + '</td></tr>').join('')}
    </table>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
    <div>
      <h4 style="color: #ea580c; font-size: 14px; margin-bottom: 10px;">⚠️ Riscos a Mitigar</h4>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #9a3412;">
        ${fase.riscos.map(r => `<li style="margin: 5px 0;">${r}</li>`).join('')}
      </ul>
    </div>
    <div>
      <h4 style="color: #0891b2; font-size: 14px; margin-bottom: 10px;">👥 Recursos Necessários</h4>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
        ${fase.recursos.map(r => `<li style="margin: 5px 0;">${r}</li>`).join('')}
      </ul>
    </div>
  </div>
</div>
`).join('')}

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>10. ANÁLISE DETALHADA DO NÍVEL ATUAL</h1>

<div class="stage-box">
  <div class="stage-title">📊 ${levelInfo.name}</div>
  <p><strong>Score Atual:</strong> ${dashboardData.scoreGeral.toFixed(1)} / 5.0</p>
  <p><strong>Foco Principal:</strong> ${levelInfo.focus}</p>
  <p><strong>Referência MIT:</strong> ${levelInfo.nameEn}</p>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin: 15px 0; background: #f1f5f9; padding: 15px; border-radius: 8px;">
    <div style="text-align: center;">
      <div style="font-size: 11px; color: #64748b;">Crescimento</div>
      <div style="font-size: 16px; font-weight: bold; color: ${levelInfo.performance.growth.includes('+') ? '#22c55e' : levelInfo.performance.growth.includes('-') ? '#ef4444' : '#f59e0b'};">${levelInfo.performance.growth}</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 11px; color: #64748b;">Lucratividade</div>
      <div style="font-size: 16px; font-weight: bold; color: #334155;">${levelInfo.performance.profit}</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 11px; color: #64748b;">ROI Típico</div>
      <div style="font-size: 16px; font-weight: bold; color: #3b82f6;">${levelInfo.performance.roi}</div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 11px; color: #64748b;">Time to Value</div>
      <div style="font-size: 16px; font-weight: bold; color: #8b5cf6;">${levelInfo.performance.timeToValue}</div>
    </div>
  </div>

  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin-bottom: 15px; border-radius: 0 8px 8px 0;">
    <p style="margin: 0; font-size: 13px;"><strong>Impacto Competitivo:</strong> ${levelInfo.marketImpact}</p>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
    <div>
      <h4 style="color: #1e40af;">Características deste Nível</h4>
      <ul>
        ${levelInfo.characteristics.map(c => `<li>${c}</li>`).join('')}
      </ul>
    </div>
    <div>
      <h4 style="color: #059669;">KPIs Recomendados</h4>
      <ul>
        ${levelInfo.kpis.map(k => `<li>${k}</li>`).join('')}
      </ul>
    </div>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
    <div>
      <h4 style="color: #dc2626;">Riscos Típicos</h4>
      <ul>
        ${levelInfo.riscos.map(r => `<li>${r}</li>`).join('')}
      </ul>
    </div>
    <div>
      <h4 style="color: #7c3aed;">Nível de Investimento</h4>
      <p style="font-size: 16px; font-weight: bold; color: #5b21b6;">${levelInfo.investimento}</p>
    </div>
  </div>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>11. MATRIZ DE PRIORIZAÇÃO DE AÇÕES</h1>

<p>A matriz abaixo organiza as ações recomendadas por impacto e esforço de implementação:</p>

<table>
  <thead>
    <tr>
      <th>Prioridade</th>
      <th>Área</th>
      <th>Ação</th>
      <th>Impacto</th>
      <th>Esforço</th>
      <th>Prazo</th>
    </tr>
  </thead>
  <tbody>
    ${problemas.slice(0, 6).map((p, i) => `
    <tr>
      <td><span style="background: ${i < 2 ? '#fef2f2' : i < 4 ? '#fef9c3' : '#f0fdf4'}; color: ${i < 2 ? '#dc2626' : i < 4 ? '#ca8a04' : '#059669'}; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${i < 2 ? 'CRÍTICA' : i < 4 ? 'ALTA' : 'MÉDIA'}</span></td>
      <td>${p.area}</td>
      <td>${p.acoes[0]}</td>
      <td>${p.score < 2 ? 'Alto' : 'Médio'}</td>
      <td>${i < 2 ? 'Médio' : 'Baixo'}</td>
      <td>${i < 2 ? '0-3 meses' : i < 4 ? '3-6 meses' : '6-12 meses'}</td>
    </tr>
    `).join('')}
  </tbody>
</table>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>12. MATRIZ DE DEPENDÊNCIAS — SEQUÊNCIA CRÍTICA DE IMPLEMENTAÇÃO</h1>

<p>A matriz abaixo mostra as dependências entre as áreas de maturidade e a sequência crítica de implementação. Ações em áreas dependentes só devem ser iniciadas após as áreas habilitadoras estarem maduras.</p>

<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <h4 style="margin: 0 0 15px 0; color: #1e3a8a;">📊 Sequência Crítica de Implementação</h4>
  
  ${MATRIZ_DEPENDENCIAS.sequenciaCritica.map((fase, idx) => `
  <div style="display: flex; align-items: flex-start; gap: 15px; margin: 15px 0; padding: 15px; background: ${idx % 2 === 0 ? 'white' : '#f1f5f9'}; border-radius: 8px; border-left: 4px solid ${['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6'][idx]};">
    <div style="width: 40px; height: 40px; background: ${['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6'][idx]}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">
      ${fase.fase}
    </div>
    <div style="flex: 1;">
      <div style="font-weight: bold; color: #1e3a8a; margin-bottom: 5px;">${fase.areas.join(' + ')}</div>
      <div style="font-size: 13px; color: #666; margin-bottom: 5px;">${fase.descricao}</div>
      <div style="font-size: 12px; color: #888;">Duração estimada: ${fase.duracao}</div>
    </div>
  </div>
  `).join('')}
</div>

<h4>Mapa de Dependências por Área</h4>
<table>
  <thead>
    <tr>
      <th>Área</th>
      <th>Pré-Requisitos</th>
      <th>Ação Principal</th>
      <th>Habilita</th>
    </tr>
  </thead>
  <tbody>
    ${Object.entries(MATRIZ_DEPENDENCIAS.acoesCriticas).map(([area, info]) => `
    <tr>
      <td><strong>${area}</strong></td>
      <td style="font-size: 12px;">${info.preRequisitos.join(', ')}</td>
      <td style="font-size: 12px; color: #1e40af;">${info.acaoPrincipal}</td>
      <td style="font-size: 12px;">${info.habilitaAcoes.join(', ') || 'N/A'}</td>
    </tr>
    `).join('')}
  </tbody>
</table>

<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
  <h4 style="margin: 0 0 10px 0; color: #b45309;">⚠️ Atenção: Ordem de Implementação</h4>
  <p style="margin: 0; font-size: 14px;">Iniciar ações em áreas sem os pré-requisitos cumpridos aumenta significativamente o risco de falha. Por exemplo, colocar modelos em produção (Operações) sem governança adequada pode gerar riscos regulatórios e de reputação.</p>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>13. ANÁLISE DE CENÁRIOS — CONSERVADOR, BASE E AGRESSIVO</h1>

<p>Apresentamos três cenários de evolução para a organização, cada um com diferentes níveis de investimento, velocidade e risco:</p>

<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0;">
  ${Object.entries(CENARIOS_EVOLUCAO).map(([key, cenario]) => `
  <div style="background: ${key === 'conservador' ? '#f1f5f9' : key === 'base' ? '#dbeafe' : '#fef3c7'}; border: 2px solid ${key === 'conservador' ? '#94a3b8' : key === 'base' ? '#3b82f6' : '#f59e0b'}; border-radius: 12px; padding: 20px;">
    <div style="text-align: center; margin-bottom: 15px;">
      <span style="font-size: 28px;">${key === 'conservador' ? '🐢' : key === 'base' ? '⚖️' : '🚀'}</span>
      <h4 style="margin: 5px 0; color: ${key === 'conservador' ? '#475569' : key === 'base' ? '#1e40af' : '#b45309'};">${cenario.nome}</h4>
    </div>
    <p style="font-size: 12px; color: #666; margin-bottom: 15px;">${cenario.descricao}</p>
    
    <div style="font-size: 12px;">
      <div style="margin-bottom: 8px;">
        <strong>Velocidade:</strong> ${cenario.velocidadeEvolucao} níveis/ano
      </div>
      <div style="margin-bottom: 8px;">
        <strong>Investimento:</strong> ${Math.round(cenario.investimentoRelativo * 100)}% do recomendado
      </div>
      <div style="margin-bottom: 8px;">
        <strong>Tempo p/ próximo nível:</strong> ${cenario.timeline[maturityLevel]?.tempoParaProximoNivel || 'N/A'}
      </div>
      <div style="margin-bottom: 8px;">
        <strong>Foco:</strong> ${cenario.timeline[maturityLevel]?.foco || 'N/A'}
      </div>
    </div>
    
    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid ${key === 'conservador' ? '#cbd5e1' : key === 'base' ? '#93c5fd' : '#fcd34d'};">
      <div style="font-size: 11px; color: #666;">
        <strong>Adequado para:</strong> ${cenario.adequadoPara}
      </div>
    </div>
  </div>
  `).join('')}
</div>

<h4>Projeção de Evolução por Cenário (a partir do Nível ${maturityLevel})</h4>
<table>
  <thead>
    <tr>
      <th>Cenário</th>
      <th>Nível ${maturityLevel} → ${Math.min(maturityLevel + 1, 5)}</th>
      <th>Nível ${Math.min(maturityLevel + 1, 5)} → ${Math.min(maturityLevel + 2, 5)}</th>
      <th>Tempo total p/ Nível 5</th>
      <th>Risco Principal</th>
    </tr>
  </thead>
  <tbody>
    ${Object.entries(CENARIOS_EVOLUCAO).map(([key, cenario]) => {
      const tempoTotal = maturityLevel < 5 
        ? Math.ceil((5 - maturityLevel) / cenario.velocidadeEvolucao) 
        : 0;
      return `
      <tr style="${key === 'base' ? 'background: #dbeafe;' : ''}">
        <td><strong>${cenario.nome}</strong></td>
        <td>${cenario.timeline[maturityLevel]?.tempoParaProximoNivel || 'N/A'}</td>
        <td>${maturityLevel < 4 ? cenario.timeline[Math.min(maturityLevel + 1, 5)]?.tempoParaProximoNivel : 'N/A'}</td>
        <td>${tempoTotal > 0 ? `~${tempoTotal} anos` : 'Já no nível 5'}</td>
        <td style="font-size: 12px; color: #666;">${cenario.riscos}</td>
      </tr>
      `;
    }).join('')}
  </tbody>
</table>

<div style="background: #dbeafe; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <h4 style="margin: 0 0 10px 0; color: #1e40af;">✓ Recomendação: Cenário Base</h4>
  <p style="margin: 0; font-size: 14px;">Para a maioria das organizações, o <strong>cenário Base</strong> oferece o melhor equilíbrio entre velocidade de evolução e sustentabilidade. Permite construir fundações sólidas enquanto demonstra valor progressivamente.</p>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>14. INDICADORES DE SAÚDE DA INICIATIVA DE IA</h1>

<p>Os indicadores de saúde abaixo fornecem uma visão consolidada do estado atual da iniciativa de IA, agrupando métricas por dimensão crítica:</p>

<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0;">
  ${Object.entries(INDICADORES_SAUDE).map(([key, indicador]) => {
    const areasRelacionadas = indicador.indicadores.flatMap(i => i.avaliacaoAreas);
    const scoresRelacionados = dashboardData.scoresPorArea?.filter(a => areasRelacionadas.includes(a.areaId)) || [];
    const scoreMedia = scoresRelacionados.length > 0 
      ? scoresRelacionados.reduce((acc, a) => acc + a.score, 0) / scoresRelacionados.length 
      : 0;
    const status = scoreMedia >= indicador.thresholds.saudavel ? 'saudavel' 
      : scoreMedia >= indicador.thresholds.atencao ? 'atencao' 
      : 'critico';
    const statusConfig = {
      saudavel: { cor: '#22c55e', bg: '#f0fdf4', emoji: '✓', texto: 'Saudável' },
      atencao: { cor: '#f59e0b', bg: '#fef3c7', emoji: '⚠', texto: 'Atenção' },
      critico: { cor: '#ef4444', bg: '#fef2f2', emoji: '✗', texto: 'Crítico' }
    };
    
    return `
    <div style="background: ${statusConfig[status].bg}; border: 2px solid ${statusConfig[status].cor}; border-radius: 12px; padding: 15px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="font-size: 20px;">${statusConfig[status].emoji}</span>
        <span style="background: ${statusConfig[status].cor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
          ${statusConfig[status].texto}
        </span>
      </div>
      <h4 style="margin: 0 0 5px 0; color: #1e3a8a; font-size: 14px;">${indicador.nome}</h4>
      <div style="font-size: 24px; font-weight: bold; color: ${statusConfig[status].cor}; margin: 10px 0;">
        ${scoreMedia.toFixed(1)} / 5.0
      </div>
      <div style="font-size: 11px; color: #666;">
        Limite crítico: ${indicador.thresholds.critico} | Atenção: ${indicador.thresholds.atencao} | Saudável: ${indicador.thresholds.saudavel}+
      </div>
    </div>
    `;
  }).join('')}
</div>

<h4>Detalhamento dos Indicadores de Saúde</h4>
<table>
  <thead>
    <tr>
      <th>Indicador</th>
      <th>Score</th>
      <th>Status</th>
      <th>Ação Recomendada</th>
    </tr>
  </thead>
  <tbody>
    ${Object.entries(INDICADORES_SAUDE).map(([key, indicador]) => {
      const areasRelacionadas = indicador.indicadores.flatMap(i => i.avaliacaoAreas);
      const scoresRelacionados = dashboardData.scoresPorArea?.filter(a => areasRelacionadas.includes(a.areaId)) || [];
      const scoreMedia = scoresRelacionados.length > 0 
        ? scoresRelacionados.reduce((acc, a) => acc + a.score, 0) / scoresRelacionados.length 
        : 0;
      const status = scoreMedia >= indicador.thresholds.saudavel ? 'Saudável' 
        : scoreMedia >= indicador.thresholds.atencao ? 'Atenção' 
        : 'Crítico';
      const acao = status === 'Crítico' ? 'Ação imediata necessária' 
        : status === 'Atenção' ? 'Monitorar e planejar melhorias' 
        : 'Manter e otimizar';
      
      return `
      <tr>
        <td><strong>${indicador.nome}</strong></td>
        <td style="font-weight: bold; color: ${status === 'Saudável' ? '#22c55e' : status === 'Atenção' ? '#f59e0b' : '#ef4444'};">
          ${scoreMedia.toFixed(1)}
        </td>
        <td>
          <span style="background: ${status === 'Saudável' ? '#dcfce7' : status === 'Atenção' ? '#fef3c7' : '#fee2e2'}; color: ${status === 'Saudável' ? '#15803d' : status === 'Atenção' ? '#b45309' : '#dc2626'}; padding: 3px 8px; border-radius: 12px; font-size: 11px;">
            ${status}
          </span>
        </td>
        <td style="font-size: 12px;">${acao}</td>
      </tr>
      `;
    }).join('')}
  </tbody>
</table>

${vertical && KPIS_ESPECIFICOS_VERTICAL[vertical] ? `
<h4>KPIs Específicos Recomendados — ${verticalConfig?.nome || vertical}</h4>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
  <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 12px; padding: 15px;">
    <h5 style="color: #15803d; margin: 0 0 10px 0;">📊 KPIs Operacionais</h5>
    <table style="width: 100%; font-size: 12px;">
      <tr style="background: #dcfce7;">
        <th style="padding: 5px; text-align: left;">KPI</th>
        <th style="padding: 5px; text-align: center;">Benchmark</th>
      </tr>
      ${KPIS_ESPECIFICOS_VERTICAL[vertical].operacionais.map(kpi => `
      <tr>
        <td style="padding: 5px;">${kpi.nome}</td>
        <td style="padding: 5px; text-align: center;">
          <span style="color: #ef4444;">${kpi.benchmark.baixo}</span> / 
          <span style="color: #f59e0b;">${kpi.benchmark.medio}</span> / 
          <span style="color: #22c55e;">${kpi.benchmark.alto}</span> ${kpi.unidade}
        </td>
      </tr>
      `).join('')}
    </table>
  </div>
  <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 12px; padding: 15px;">
    <h5 style="color: #1e40af; margin: 0 0 10px 0;">💰 KPIs Financeiros</h5>
    <table style="width: 100%; font-size: 12px;">
      <tr style="background: #dbeafe;">
        <th style="padding: 5px; text-align: left;">KPI</th>
        <th style="padding: 5px; text-align: center;">Benchmark</th>
      </tr>
      ${KPIS_ESPECIFICOS_VERTICAL[vertical].financeiros.map(kpi => `
      <tr>
        <td style="padding: 5px;">${kpi.nome}</td>
        <td style="padding: 5px; text-align: center;">
          <span style="color: #ef4444;">${kpi.benchmark.baixo}</span> / 
          <span style="color: #f59e0b;">${kpi.benchmark.medio}</span> / 
          <span style="color: #22c55e;">${kpi.benchmark.alto}</span> ${kpi.unidade}
        </td>
      </tr>
      `).join('')}
    </table>
  </div>
</div>
<p style="font-size: 11px; color: #666; font-style: italic;">Legenda de benchmarks: <span style="color: #ef4444;">Baixo</span> / <span style="color: #f59e0b;">Médio</span> / <span style="color: #22c55e;">Alto</span> desempenho</p>
` : ''}

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>15. PRÓXIMOS PASSOS IMEDIATOS</h1>

<div class="action-box">
  <div class="action-title">🚀 Ações para as Próximas 2 Semanas</div>
  <ol>
    <li><strong>Alinhamento Executivo:</strong> Apresentar este relatório para a liderança e obter patrocínio formal</li>
    <li><strong>Formação de Equipe:</strong> Identificar responsáveis por cada área de melhoria prioritária</li>
    <li><strong>Quick Win:</strong> Selecionar 1 iniciativa de baixo risco e alto impacto para iniciar imediatamente</li>
    <li><strong>Governança:</strong> Estabelecer reunião quinzenal de acompanhamento do roadmap</li>
    <li><strong>Comunicação:</strong> Criar canal de comunicação para disseminar avanços em IA</li>
  </ol>
</div>

<div class="mit-reference">
  <strong>📚 Referência Metodológica:</strong> Este assessment utiliza como base o <strong>MIT CISR Enterprise AI Maturity Model</strong> (Weill, Woerner & Sebastian, 2024), adaptado para uma escala de 5 níveis de maturidade. Estudos do MIT com 721 empresas indicam que organizações nos níveis mais altos têm performance financeira significativamente acima da média da indústria (+11% a +17% em crescimento).
  <br><br>
  <strong>🔗 Link para o estudo:</strong> <a href="https://cisr.mit.edu/publication/2024_1201_EnterpriseAIMaturityModel_WeillWoernerSebastian" target="_blank">MIT CISR - Building Enterprise AI Maturity</a>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>16. CONCLUSÃO</h1>

<p>A organização <strong>${empresaNome}</strong> encontra-se no <strong>${levelInfo.name}</strong> de maturidade em IA, com um score geral de <strong>${dashboardData.scoreGeral.toFixed(1)}/5.0</strong> (Nível ${maturityLevel} de 5). Este diagnóstico identificou ${problemas.length} área(s) que requerem atenção prioritária e um conjunto de ${problemas.reduce((acc, p) => acc + p.acoes.length, 0)} ações específicas para evolução.</p>

${vertical && BENCHMARKING_POR_VERTICAL[vertical] ? `
<h2>16.1 Posicionamento Competitivo no Mercado</h2>

<div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 25px; border-radius: 12px; margin: 20px 0;">
  <h3 style="color: white; margin: 0 0 15px 0; border: none;">📊 Comparativo com o Setor ${verticalConfig?.nome || vertical}</h3>
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center;">
    <div>
      <div style="font-size: 12px; opacity: 0.9;">Sua Empresa</div>
      <div style="font-size: 32px; font-weight: bold;">${dashboardData.scoreGeral.toFixed(1)}</div>
    </div>
    <div>
      <div style="font-size: 12px; opacity: 0.9;">Média do Setor</div>
      <div style="font-size: 32px; font-weight: bold;">${BENCHMARKING_POR_VERTICAL[vertical].mediaSetor.toFixed(1)}</div>
    </div>
    <div>
      <div style="font-size: 12px; opacity: 0.9;">Bottom 25%</div>
      <div style="font-size: 32px; font-weight: bold;">${BENCHMARKING_POR_VERTICAL[vertical].bottom25.toFixed(1)}</div>
    </div>
    <div>
      <div style="font-size: 12px; opacity: 0.9;">Top 25%</div>
      <div style="font-size: 32px; font-weight: bold;">${BENCHMARKING_POR_VERTICAL[vertical].top25.toFixed(1)}</div>
    </div>
  </div>
</div>

<div style="background: ${dashboardData.scoreGeral >= BENCHMARKING_POR_VERTICAL[vertical].mediaSetor ? '#f0fdf4' : '#fef2f2'}; border: 2px solid ${dashboardData.scoreGeral >= BENCHMARKING_POR_VERTICAL[vertical].mediaSetor ? '#22c55e' : '#ef4444'}; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <h4 style="margin: 0 0 15px 0; color: ${dashboardData.scoreGeral >= BENCHMARKING_POR_VERTICAL[vertical].mediaSetor ? '#15803d' : '#dc2626'};">
    ${dashboardData.scoreGeral >= BENCHMARKING_POR_VERTICAL[vertical].top25 
      ? '🏆 Sua empresa está entre os LÍDERES do setor!' 
      : dashboardData.scoreGeral >= BENCHMARKING_POR_VERTICAL[vertical].mediaSetor 
        ? '✓ Sua empresa está ACIMA DA MÉDIA do mercado' 
        : '⚠️ Oportunidade de melhoria identificada'}
  </h4>
  <p style="margin: 0 0 10px 0;">
    ${dashboardData.scoreGeral >= BENCHMARKING_POR_VERTICAL[vertical].top25 
      ? 'Com score de <strong>' + dashboardData.scoreGeral.toFixed(1) + '</strong>, sua organização está entre os <strong>25% mais maduros</strong> do setor ' + (verticalConfig?.nome || vertical) + '. Você está <strong>' + (dashboardData.scoreGeral - BENCHMARKING_POR_VERTICAL[vertical].mediaSetor).toFixed(1) + ' pontos acima</strong> da média do mercado.'
      : dashboardData.scoreGeral >= BENCHMARKING_POR_VERTICAL[vertical].mediaSetor 
        ? 'Com score de <strong>' + dashboardData.scoreGeral.toFixed(1) + '</strong>, sua organização está <strong>' + (dashboardData.scoreGeral - BENCHMARKING_POR_VERTICAL[vertical].mediaSetor).toFixed(1) + ' pontos acima</strong> da média do setor (' + BENCHMARKING_POR_VERTICAL[vertical].mediaSetor.toFixed(1) + '). Para alcançar o top 25%, você precisa evoluir mais <strong>' + (BENCHMARKING_POR_VERTICAL[vertical].top25 - dashboardData.scoreGeral).toFixed(1) + ' pontos</strong>.'
        : 'Com score de <strong>' + dashboardData.scoreGeral.toFixed(1) + '</strong>, sua organização está <strong>' + (BENCHMARKING_POR_VERTICAL[vertical].mediaSetor - dashboardData.scoreGeral).toFixed(1) + ' pontos abaixo</strong> da média do setor (' + BENCHMARKING_POR_VERTICAL[vertical].mediaSetor.toFixed(1) + '). ' + BENCHMARKING_POR_VERTICAL[vertical].distribuicao['nivel' + maturityLevel] + '% das empresas do setor estão no mesmo nível que você.'
    }
  </p>
  <p style="margin: 0; font-size: 13px; color: #666;">
    <strong>Contexto de mercado:</strong> A tendência do setor é <strong>${BENCHMARKING_POR_VERTICAL[vertical].tendencia}</strong>, indicando ${BENCHMARKING_POR_VERTICAL[vertical].tendencia.includes('crescente') ? 'que empresas estão investindo cada vez mais em IA' : 'um mercado já maduro com alta competição'}.
  </p>
</div>
` : ''}

<h2>16.2 Destaques Positivos da Avaliação</h2>

<div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <h4 style="margin: 0 0 15px 0; color: #15803d;">✨ Pontos Fortes Identificados</h4>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
    ${areasOrdenadas.filter(a => a.score >= 3).slice(0, 4).map(area => '<div style="background: white; border-left: 4px solid #22c55e; padding: 12px; border-radius: 0 8px 8px 0;"><div style="font-weight: bold; color: #15803d;">' + area.area + '</div><div style="font-size: 24px; font-weight: bold; color: #059669;">' + area.score.toFixed(1) + '</div><div style="font-size: 12px; color: #666;">Nível: ' + area.nivel + '</div></div>').join('') || '<p style="color: #666;">Foco em desenvolver áreas fundamentais para construir pontos fortes.</p>'}
  </div>
  ${areasOrdenadas.filter(a => a.score >= 3).length > 0 ? '<p style="margin: 15px 0 0 0; font-size: 14px;"><strong>Celebre estas conquistas!</strong> Estas áreas demonstram maturidade acima da média e podem servir como modelo para as demais. Considere alavancar estes pontos fortes para acelerar a evolução das áreas mais fracas.</p>' : ''}
</div>

<h2>16.3 Dicas Rápidas para Agregar Valor Imediatamente</h2>

<div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <h4 style="margin: 0 0 15px 0; color: #b45309;">🚀 Quick Wins — Ações de Alto Impacto e Baixo Esforço</h4>
  
  <div style="display: grid; gap: 15px;">
    <div style="background: white; padding: 15px; border-radius: 8px; display: flex; gap: 15px; align-items: flex-start;">
      <div style="width: 40px; height: 40px; background: #22c55e; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">1</div>
      <div>
        <div style="font-weight: bold; color: #15803d;">Automatize uma tarefa repetitiva com IA Generativa</div>
        <div style="font-size: 13px; color: #666;">Use ferramentas como ChatGPT, Claude ou Copilot para automatizar geração de relatórios, respostas a emails, ou análise de documentos. <strong>Impacto: 5-10h economizadas/semana em até 2 semanas.</strong></div>
      </div>
    </div>
    
    <div style="background: white; padding: 15px; border-radius: 8px; display: flex; gap: 15px; align-items: flex-start;">
      <div style="width: 40px; height: 40px; background: #3b82f6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">2</div>
      <div>
        <div style="font-weight: bold; color: #1e40af;">Realize um workshop de IA com a liderança</div>
        <div style="font-size: 13px; color: #666;">Apresente este relatório e alinhe expectativas. Defina 1-2 casos de uso prioritários com patrocínio executivo. <strong>Impacto: Alinhamento estratégico em 1 sessão de 2h.</strong></div>
      </div>
    </div>
    
    <div style="background: white; padding: 15px; border-radius: 8px; display: flex; gap: 15px; align-items: flex-start;">
      <div style="width: 40px; height: 40px; background: #7c3aed; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">3</div>
      <div>
        <div style="font-weight: bold; color: #5b21b6;">Identifique seu "low-hanging fruit" de dados</div>
        <div style="font-size: 13px; color: #666;">Mapeie 3 processos onde você já tem dados estruturados e que poderiam se beneficiar de análise preditiva ou automação. <strong>Impacto: Pipeline de projetos priorizados em 1 semana.</strong></div>
      </div>
    </div>
    
    ${problemas.length > 0 ? '<div style="background: white; padding: 15px; border-radius: 8px; display: flex; gap: 15px; align-items: flex-start;"><div style="width: 40px; height: 40px; background: #ef4444; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">4</div><div><div style="font-weight: bold; color: #dc2626;">Endereçe sua maior fraqueza: ' + problemas[0].area + '</div><div style="font-size: 13px; color: #666;">' + problemas[0].acoes[0] + '. <strong>Impacto: Evita riscos e acelera evolução geral.</strong></div></div></div>' : ''}
  </div>
</div>

<div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <h4 style="margin: 0 0 15px 0; color: #1e40af;">📈 Projeção de Retorno com Quick Wins</h4>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center;">
    <div style="background: white; padding: 15px; border-radius: 8px;">
      <div style="font-size: 28px; font-weight: bold; color: #22c55e;">30-60 dias</div>
      <div style="font-size: 12px; color: #666;">Primeiros resultados visíveis</div>
    </div>
    <div style="background: white; padding: 15px; border-radius: 8px;">
      <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">5-15%</div>
      <div style="font-size: 12px; color: #666;">Ganho de produtividade estimado</div>
    </div>
    <div style="background: white; padding: 15px; border-radius: 8px;">
      <div style="font-size: 28px; font-weight: bold; color: #7c3aed;">+0.3 a +0.5</div>
      <div style="font-size: 12px; color: #666;">Evolução esperada no score</div>
    </div>
  </div>
</div>

<h2>16.4 Considerações Finais</h2>

<p><strong>Performance esperada para o ${levelInfo.name}:</strong> Crescimento ${levelInfo.performance.growth} comparado à média da indústria.</p>

<p>O roadmap proposto, com horizonte de 12+ meses, fornece um caminho estruturado para avançar em direção aos próximos estágios de maturidade. O sucesso desta jornada dependerá fundamentalmente do:</p>

<ul>
  <li><strong>Comprometimento da liderança</strong> com a visão de longo prazo</li>
  <li><strong>Investimento adequado</strong> em pessoas, processos e tecnologia</li>
  <li><strong>Cultura de experimentação</strong> e tolerância a falhas controladas</li>
  <li><strong>Governança efetiva</strong> para garantir uso ético e responsável de IA</li>
  <li><strong>Execução disciplinada</strong> dos quick wins para gerar momentum</li>
</ul>

<div style="background: linear-gradient(135deg, #1e3a8a, #7c3aed); color: white; padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center;">
  <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">💡 Mensagem Final</div>
  <p style="margin: 0; font-size: 15px; opacity: 0.95;">
    ${maturityLevel <= 2 
      ? 'Sua jornada de IA está começando. O momento de agir é agora — empresas que iniciarem sua transformação hoje terão vantagem competitiva significativa nos próximos anos.'
      : maturityLevel <= 3 
        ? 'Você está no caminho certo. Mantenha o foco na execução dos pilotos e comece a pensar em escala. A consistência será seu maior aliado.'
        : maturityLevel <= 4
          ? 'Sua organização já demonstra maturidade sólida em IA. O próximo passo é transformar IA de ferramenta em diferencial competitivo estratégico.'
          : 'Parabéns! Você está entre os líderes de mercado. Continue inovando e considere monetizar suas capacidades de IA.'}
  </p>
</div>

<p>A SysMap Solutions está à disposição para apoiar a organização em cada fase desta jornada de transformação.</p>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>APÊNDICES — REFERÊNCIAS METODOLÓGICAS</h1>

<p>Os apêndices a seguir detalham as metodologias, frameworks e referências utilizadas neste assessment de maturidade em IA. Cada apêndice fornece fundamentação teórica e prática para os conceitos aplicados na avaliação.</p>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h2>APÊNDICE A — MIT CISR Enterprise AI Maturity Model</h2>

<div style="background: #f8fafc; border: 2px solid #3b82f6; border-radius: 12px; padding: 25px; margin: 20px 0;">
  <h3 style="color: #1e3a8a; margin-top: 0;">A.1 Origem e Fundamentação</h3>
  <p>O <strong>MIT CISR Enterprise AI Maturity Model</strong> foi desenvolvido pelo Center for Information Systems Research (CISR) do Massachusetts Institute of Technology (MIT), uma das instituições de pesquisa mais respeitadas do mundo em tecnologia da informação e transformação digital.</p>
  
  <p><strong>Autores Principais:</strong></p>
  <ul>
    <li><strong>Peter Weill</strong> — Chairman do MIT CISR, especialista em governança de TI</li>
    <li><strong>Stephanie Woerner</strong> — Pesquisadora sênior em transformação digital</li>
    <li><strong>Ina Sebastian</strong> — Pesquisadora em arquitetura empresarial de IA</li>
  </ul>
  
  <p><strong>Base de Pesquisa:</strong></p>
  <ul>
    <li>Estudo com <strong>721 empresas</strong> de diversos setores e geografias</li>
    <li>Análise longitudinal de <strong>2019 a 2024</strong></li>
    <li>Correlação entre maturidade em IA e performance financeira</li>
  </ul>

  <h3 style="color: #1e3a8a;">A.2 Os 5 Níveis de Maturidade</h3>
  <table style="width: 100%; margin: 15px 0;">
    <tr style="background: #1e3a8a; color: white;">
      <th style="padding: 10px;">Nível</th>
      <th style="padding: 10px;">Nome (EN)</th>
      <th style="padding: 10px;">Foco Principal</th>
      <th style="padding: 10px;">Impacto Financeiro</th>
    </tr>
    <tr>
      <td style="padding: 10px; text-align: center;"><strong>1</strong></td>
      <td style="padding: 10px;">Initial / Experimenting</td>
      <td style="padding: 10px;">Exploração e Educação</td>
      <td style="padding: 10px; color: #dc2626;">-15% a -10% vs. média</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px; text-align: center;"><strong>2</strong></td>
      <td style="padding: 10px;">Preparing / Experimenting</td>
      <td style="padding: 10px;">Preparação e Experimentação</td>
      <td style="padding: 10px; color: #ea580c;">-10% a -5% vs. média</td>
    </tr>
    <tr>
      <td style="padding: 10px; text-align: center;"><strong>3</strong></td>
      <td style="padding: 10px;">Building Pilots</td>
      <td style="padding: 10px;">Casos de Negócio e Pilotos</td>
      <td style="padding: 10px; color: #3b82f6;">0% a +5% vs. média</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px; text-align: center;"><strong>4</strong></td>
      <td style="padding: 10px;">Developing AI Ways of Working</td>
      <td style="padding: 10px;">Escalar Plataformas e Dashboards</td>
      <td style="padding: 10px; color: #22c55e;">+5% a +15% vs. média</td>
    </tr>
    <tr>
      <td style="padding: 10px; text-align: center;"><strong>5</strong></td>
      <td style="padding: 10px;">AI Future Ready</td>
      <td style="padding: 10px;">Inovação Contínua e Novas Receitas</td>
      <td style="padding: 10px; color: #059669;">+15% ou mais vs. média</td>
    </tr>
  </table>

  <h3 style="color: #1e3a8a;">A.3 Principais Descobertas da Pesquisa MIT</h3>
  <ul>
    <li>Empresas no <strong>Nível 5</strong> têm crescimento de receita <strong>11% a 17% superior</strong> à média da indústria</li>
    <li>A transição do Nível 2 para o Nível 3 é a mais crítica — muitas empresas ficam presas no "piloto eterno"</li>
    <li><strong>Governança</strong> e <strong>Cultura</strong> são os maiores bloqueadores de evolução, não tecnologia</li>
    <li>Empresas que investem em <strong>alfabetização em IA</strong> para liderança evoluem 2x mais rápido</li>
  </ul>

  <h3 style="color: #1e3a8a;">A.4 Referência Bibliográfica</h3>
  <p style="font-size: 13px; background: #e0e7ff; padding: 15px; border-radius: 8px;">
    Weill, P., Woerner, S., & Sebastian, I. (2024). <em>Building Enterprise AI Maturity: From Experimenting to AI Future Ready</em>. MIT CISR Research Briefing, Vol. XXIV, No. 12.<br>
    <strong>Link:</strong> <a href="https://cisr.mit.edu/publication/2024_1201_EnterpriseAIMaturityModel_WeillWoernerSebastian" style="color: #1e40af;">https://cisr.mit.edu/publication/2024_1201_EnterpriseAIMaturityModel_WeillWoernerSebastian</a>
  </p>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h2>APÊNDICE B — Framework de Benchmarking por Vertical</h2>

<div style="background: #f8fafc; border: 2px solid #7c3aed; border-radius: 12px; padding: 25px; margin: 20px 0;">
  <h3 style="color: #5b21b6; margin-top: 0;">B.1 Metodologia de Benchmarking</h3>
  <p>O benchmarking setorial utilizado neste relatório é baseado em pesquisas de mercado de instituições reconhecidas, consolidando dados de maturidade em IA por vertical de atuação.</p>
  
  <h3 style="color: #5b21b6;">B.2 Fontes de Dados por Setor</h3>
  <table style="width: 100%; margin: 15px 0;">
    <tr style="background: #7c3aed; color: white;">
      <th style="padding: 10px;">Setor</th>
      <th style="padding: 10px;">Fonte de Benchmark</th>
      <th style="padding: 10px;">Ano</th>
    </tr>
    <tr>
      <td style="padding: 10px;"><strong>Fintech</strong></td>
      <td style="padding: 10px;">MIT CISR Financial Services AI Study</td>
      <td style="padding: 10px;">2024</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px;"><strong>Saúde</strong></td>
      <td style="padding: 10px;">HIMSS Analytics Healthcare AI Adoption Report</td>
      <td style="padding: 10px;">2024</td>
    </tr>
    <tr>
      <td style="padding: 10px;"><strong>Tecnologia</strong></td>
      <td style="padding: 10px;">Gartner Tech Industry AI Maturity Index</td>
      <td style="padding: 10px;">2024</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px;"><strong>E-commerce</strong></td>
      <td style="padding: 10px;">Forrester Retail AI Readiness Survey</td>
      <td style="padding: 10px;">2024</td>
    </tr>
    <tr>
      <td style="padding: 10px;"><strong>Manufatura</strong></td>
      <td style="padding: 10px;">McKinsey Industry 4.0 AI Adoption Study</td>
      <td style="padding: 10px;">2024</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px;"><strong>LegalTech</strong></td>
      <td style="padding: 10px;">Thomson Reuters Legal AI Adoption Report</td>
      <td style="padding: 10px;">2024</td>
    </tr>
    <tr>
      <td style="padding: 10px;"><strong>EdTech</strong></td>
      <td style="padding: 10px;">HolonIQ EdTech AI Index</td>
      <td style="padding: 10px;">2024</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px;"><strong>AI First</strong></td>
      <td style="padding: 10px;">AI Engineering Maturity Benchmark</td>
      <td style="padding: 10px;">2024</td>
    </tr>
    <tr>
      <td style="padding: 10px;"><strong>AgTech</strong></td>
      <td style="padding: 10px;">AgFunder AgTech AI Adoption Report</td>
      <td style="padding: 10px;">2024</td>
    </tr>
  </table>

  <h3 style="color: #5b21b6;">B.3 Métricas de Benchmark</h3>
  <ul>
    <li><strong>Média do Setor:</strong> Score médio de maturidade das empresas avaliadas no setor</li>
    <li><strong>Top 25%:</strong> Score mínimo das empresas no quartil superior (líderes)</li>
    <li><strong>Bottom 25%:</strong> Score máximo das empresas no quartil inferior</li>
    <li><strong>Distribuição:</strong> Percentual de empresas em cada nível de maturidade</li>
    <li><strong>Tendência:</strong> Direção da evolução do setor (crescente, estável, decrescente)</li>
  </ul>

  <h3 style="color: #5b21b6;">B.4 Limitações do Benchmark</h3>
  <p style="background: #fef3c7; padding: 15px; border-radius: 8px; font-size: 13px;">
    <strong>⚠️ Importante:</strong> Os benchmarks são referências de mercado e podem variar conforme região, porte da empresa e segmento específico dentro de cada vertical. Utilize como guia direcional, não como métrica absoluta.
  </p>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h2>APÊNDICE C — Modelo de Projeção de Impacto Financeiro</h2>

<div style="background: #f8fafc; border: 2px solid #22c55e; border-radius: 12px; padding: 25px; margin: 20px 0;">
  <h3 style="color: #15803d; margin-top: 0;">C.1 Fundamentação da Projeção Financeira</h3>
  <p>As projeções de impacto financeiro são baseadas em estudos empíricos que correlacionam nível de maturidade em IA com indicadores de performance financeira.</p>
  
  <h3 style="color: #15803d;">C.2 Fontes de Dados Financeiros</h3>
  <ul>
    <li><strong>McKinsey Global Institute (2023):</strong> "The Economic Potential of Generative AI"</li>
    <li><strong>MIT CISR (2024):</strong> Correlação maturidade-performance em 721 empresas</li>
    <li><strong>Gartner (2024):</strong> "AI Maturity Model" — benchmark de maturidade em IA</li>
    <li><strong>Harvard Business Review (2024):</strong> Estudos de impacto financeiro de IA</li>
  </ul>

  <h3 style="color: #15803d;">C.3 Modelo de Cálculo</h3>
  <table style="width: 100%; margin: 15px 0;">
    <tr style="background: #22c55e; color: white;">
      <th style="padding: 10px;">Nível</th>
      <th style="padding: 10px;">Crescimento Receita</th>
      <th style="padding: 10px;">Redução Custos</th>
      <th style="padding: 10px;">ROI Médio</th>
      <th style="padding: 10px;">Tempo ROI</th>
    </tr>
    <tr>
      <td style="padding: 10px; text-align: center;"><strong>1</strong></td>
      <td style="padding: 10px;">-5% a 0%</td>
      <td style="padding: 10px;">0% a 5%</td>
      <td style="padding: 10px;">0%</td>
      <td style="padding: 10px;">18-24 meses</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px; text-align: center;"><strong>2</strong></td>
      <td style="padding: 10px;">0% a 5%</td>
      <td style="padding: 10px;">3% a 8%</td>
      <td style="padding: 10px;">100%</td>
      <td style="padding: 10px;">12-18 meses</td>
    </tr>
    <tr>
      <td style="padding: 10px; text-align: center;"><strong>3</strong></td>
      <td style="padding: 10px;">3% a 10%</td>
      <td style="padding: 10px;">5% a 15%</td>
      <td style="padding: 10px;">200%</td>
      <td style="padding: 10px;">9-12 meses</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px; text-align: center;"><strong>4</strong></td>
      <td style="padding: 10px;">8% a 18%</td>
      <td style="padding: 10px;">10% a 25%</td>
      <td style="padding: 10px;">400%</td>
      <td style="padding: 10px;">6-9 meses</td>
    </tr>
    <tr>
      <td style="padding: 10px; text-align: center;"><strong>5</strong></td>
      <td style="padding: 10px;">15% a 30%</td>
      <td style="padding: 10px;">20% a 35%</td>
      <td style="padding: 10px;">700%</td>
      <td style="padding: 10px;">3-6 meses</td>
    </tr>
  </table>

  <h3 style="color: #15803d;">C.4 Investimento Recomendado por Nível</h3>
  <ul>
    <li><strong>Nível 1:</strong> 0.5% a 1% do faturamento — foco em capacitação</li>
    <li><strong>Nível 2:</strong> 1% a 2% do faturamento — pilotos e governança</li>
    <li><strong>Nível 3:</strong> 2% a 4% do faturamento — infraestrutura e escala</li>
    <li><strong>Nível 4:</strong> 4% a 7% do faturamento — plataformas e MLOps</li>
    <li><strong>Nível 5:</strong> 7% a 12% do faturamento — P&D e inovação</li>
  </ul>

  <p style="background: #dcfce7; padding: 15px; border-radius: 8px; font-size: 13px;">
    <strong>💡 Nota:</strong> O investimento recomendado considera empresas de médio e grande porte. Startups e scale-ups podem ter percentuais significativamente maiores devido à natureza de seu modelo de negócio.
  </p>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h2>APÊNDICE D — Matriz de Dependências e Sequência Crítica</h2>

<div style="background: #f8fafc; border: 2px solid #f59e0b; border-radius: 12px; padding: 25px; margin: 20px 0;">
  <h3 style="color: #b45309; margin-top: 0;">D.1 Conceito de Dependências</h3>
  <p>A matriz de dependências mapeia as relações de pré-requisito entre as diferentes áreas de maturidade em IA. Compreender estas dependências é essencial para evitar investimentos prematuros em áreas que não têm suas bases estabelecidas.</p>
  
  <h3 style="color: #b45309;">D.2 Princípio da Sequência Crítica</h3>
  <p>Baseado nos princípios de <strong>Critical Path Method (CPM)</strong> e <strong>Theory of Constraints (TOC)</strong>, a sequência crítica identifica a ordem ótima de implementação que minimiza riscos e maximiza chances de sucesso.</p>

  <h3 style="color: #b45309;">D.3 Fases da Implementação</h3>
  <table style="width: 100%; margin: 15px 0;">
    <tr style="background: #f59e0b; color: white;">
      <th style="padding: 10px;">Fase</th>
      <th style="padding: 10px;">Áreas Envolvidas</th>
      <th style="padding: 10px;">Descrição</th>
      <th style="padding: 10px;">Duração</th>
    </tr>
    <tr>
      <td style="padding: 10px; text-align: center;"><strong>1</strong></td>
      <td style="padding: 10px;">Estratégia e Liderança</td>
      <td style="padding: 10px;">Fundação — define direção e prioridades</td>
      <td style="padding: 10px;">1-2 meses</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px; text-align: center;"><strong>2</strong></td>
      <td style="padding: 10px;">Dados, Governança, Talentos, Compliance, Mudança</td>
      <td style="padding: 10px;">Infraestrutura — habilita execução segura</td>
      <td style="padding: 10px;">2-4 meses</td>
    </tr>
    <tr>
      <td style="padding: 10px; text-align: center;"><strong>3</strong></td>
      <td style="padding: 10px;">Pessoas, Valor de Negócio, Valor por Unidade</td>
      <td style="padding: 10px;">Capacitação e Valor — desenvolve e mapeia</td>
      <td style="padding: 10px;">3-6 meses</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px; text-align: center;"><strong>4</strong></td>
      <td style="padding: 10px;">Operações e Processos</td>
      <td style="padding: 10px;">Execução — coloca IA em produção</td>
      <td style="padding: 10px;">4-8 meses</td>
    </tr>
    <tr>
      <td style="padding: 10px; text-align: center;"><strong>5</strong></td>
      <td style="padding: 10px;">Inovação, Ecossistema</td>
      <td style="padding: 10px;">Escala — amplia impacto</td>
      <td style="padding: 10px;">6-12 meses</td>
    </tr>
  </table>

  <h3 style="color: #b45309;">D.4 Anti-padrões Comuns</h3>
  <div style="background: #fef2f2; padding: 15px; border-radius: 8px;">
    <p style="margin: 0 0 10px 0;"><strong>❌ Evite estes erros comuns:</strong></p>
    <ul style="margin: 0;">
      <li><strong>Pular Fase 1:</strong> Iniciar pilotos sem estratégia clara leva a projetos desconectados</li>
      <li><strong>Ignorar Governança:</strong> Colocar modelos em produção sem framework de risco gera passivos</li>
      <li><strong>Subestimar Cultura:</strong> Forçar adoção sem gestão de mudança cria resistência</li>
      <li><strong>Escalar Prematuramente:</strong> Industrializar pilotos sem MLOps aumenta dívida técnica</li>
    </ul>
  </div>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h2>APÊNDICE E — Análise de Cenários de Evolução</h2>

<div style="background: #f8fafc; border: 2px solid #3b82f6; border-radius: 12px; padding: 25px; margin: 20px 0;">
  <h3 style="color: #1e40af; margin-top: 0;">E.1 Metodologia de Cenários</h3>
  <p>A análise de cenários utiliza técnicas de <strong>planejamento estratégico baseado em cenários</strong>, originalmente desenvolvidas pela Shell e amplamente utilizadas em consultoria estratégica.</p>
  
  <h3 style="color: #1e40af;">E.2 Os Três Cenários</h3>
  
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0;">
    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; border-top: 4px solid #64748b;">
      <h4 style="color: #475569; margin: 0 0 10px 0;">🐢 Conservador</h4>
      <ul style="font-size: 12px; margin: 0; padding-left: 20px;">
        <li>Velocidade: 0.3 níveis/ano</li>
        <li>Investimento: 60% do recomendado</li>
        <li>Risco: Perda de competitividade</li>
        <li>Ideal para: Alta regulação, baixo apetite a risco</li>
      </ul>
    </div>
    <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-top: 4px solid #3b82f6;">
      <h4 style="color: #1e40af; margin: 0 0 10px 0;">⚖️ Base (Recomendado)</h4>
      <ul style="font-size: 12px; margin: 0; padding-left: 20px;">
        <li>Velocidade: 0.5 níveis/ano</li>
        <li>Investimento: 100% do recomendado</li>
        <li>Risco: Balanceado</li>
        <li>Ideal para: Maioria das empresas</li>
      </ul>
    </div>
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-top: 4px solid #f59e0b;">
      <h4 style="color: #b45309; margin: 0 0 10px 0;">🚀 Agressivo</h4>
      <ul style="font-size: 12px; margin: 0; padding-left: 20px;">
        <li>Velocidade: 0.8 níveis/ano</li>
        <li>Investimento: 150% do recomendado</li>
        <li>Risco: Alto — execução e burnout</li>
        <li>Ideal para: Startups, mercados competitivos</li>
      </ul>
    </div>
  </div>

  <h3 style="color: #1e40af;">E.3 Fatores de Decisão</h3>
  <p>A escolha do cenário deve considerar:</p>
  <ul>
    <li><strong>Apetite a risco:</strong> Tolerância da liderança a falhas e incertezas</li>
    <li><strong>Disponibilidade de capital:</strong> Budget disponível para investimento em IA</li>
    <li><strong>Pressão competitiva:</strong> Velocidade de evolução dos concorrentes</li>
    <li><strong>Capacidade organizacional:</strong> Habilidade de absorver mudanças</li>
    <li><strong>Contexto regulatório:</strong> Restrições e exigências do setor</li>
  </ul>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h2>APÊNDICE F — Indicadores de Saúde da Iniciativa de IA</h2>

<div style="background: #f8fafc; border: 2px solid #8b5cf6; border-radius: 12px; padding: 25px; margin: 20px 0;">
  <h3 style="color: #6d28d9; margin-top: 0;">F.1 Conceito de Health Indicators</h3>
  <p>Os indicadores de saúde são métricas agregadas que fornecem uma visão rápida do estado geral da iniciativa de IA, inspirados nos conceitos de <strong>Balanced Scorecard</strong> e <strong>OKRs</strong>.</p>
  
  <h3 style="color: #6d28d9;">F.2 Dimensões de Saúde</h3>
  <table style="width: 100%; margin: 15px 0;">
    <tr style="background: #8b5cf6; color: white;">
      <th style="padding: 10px;">Dimensão</th>
      <th style="padding: 10px;">O que Mede</th>
      <th style="padding: 10px;">Crítico</th>
      <th style="padding: 10px;">Atenção</th>
      <th style="padding: 10px;">Saudável</th>
    </tr>
    <tr>
      <td style="padding: 10px;"><strong>Estratégica</strong></td>
      <td style="padding: 10px;">Clareza de visão, alinhamento C-Level</td>
      <td style="padding: 10px; text-align: center;">&lt; 2.0</td>
      <td style="padding: 10px; text-align: center;">2.0 - 3.0</td>
      <td style="padding: 10px; text-align: center;">&gt; 4.0</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px;"><strong>Execução</strong></td>
      <td style="padding: 10px;">Modelos em produção, qualidade de dados</td>
      <td style="padding: 10px; text-align: center;">&lt; 1.8</td>
      <td style="padding: 10px; text-align: center;">1.8 - 2.8</td>
      <td style="padding: 10px; text-align: center;">&gt; 3.8</td>
    </tr>
    <tr>
      <td style="padding: 10px;"><strong>Pessoas</strong></td>
      <td style="padding: 10px;">Talentos, capacitação, cultura</td>
      <td style="padding: 10px; text-align: center;">&lt; 2.0</td>
      <td style="padding: 10px; text-align: center;">2.0 - 3.0</td>
      <td style="padding: 10px; text-align: center;">&gt; 4.0</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px;"><strong>Governança</strong></td>
      <td style="padding: 10px;">Framework, compliance, ética</td>
      <td style="padding: 10px; text-align: center;">&lt; 1.8</td>
      <td style="padding: 10px; text-align: center;">1.8 - 2.8</td>
      <td style="padding: 10px; text-align: center;">&gt; 3.8</td>
    </tr>
    <tr>
      <td style="padding: 10px;"><strong>Valor</strong></td>
      <td style="padding: 10px;">ROI, alinhamento financeiro</td>
      <td style="padding: 10px; text-align: center;">&lt; 1.8</td>
      <td style="padding: 10px; text-align: center;">1.8 - 2.8</td>
      <td style="padding: 10px; text-align: center;">&gt; 3.8</td>
    </tr>
  </table>

  <h3 style="color: #6d28d9;">F.3 Como Interpretar</h3>
  <ul>
    <li><strong style="color: #dc2626;">Crítico:</strong> Ação imediata necessária — risco de falha da iniciativa</li>
    <li><strong style="color: #f59e0b;">Atenção:</strong> Monitorar e planejar melhorias — potencial de degradação</li>
    <li><strong style="color: #22c55e;">Saudável:</strong> Manter e otimizar — base sólida para evolução</li>
  </ul>

  <h3 style="color: #6d28d9;">F.4 Frequência de Monitoramento</h3>
  <p style="background: #ede9fe; padding: 15px; border-radius: 8px;">
    <strong>Recomendação:</strong> Reavaliar os indicadores de saúde a cada <strong>3 meses</strong> durante a fase de implementação, e <strong>semestralmente</strong> após atingir estabilidade no Nível 3 ou superior.
  </p>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h2>APÊNDICE G — Glossário de Termos Técnicos</h2>

<div style="background: #f8fafc; border: 2px solid #64748b; border-radius: 12px; padding: 25px; margin: 20px 0;">
  <table style="width: 100%;">
    <tr>
      <td style="padding: 10px; width: 25%; vertical-align: top;"><strong>AI/ML</strong></td>
      <td style="padding: 10px;">Artificial Intelligence / Machine Learning — Inteligência Artificial e Aprendizado de Máquina</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 10px; vertical-align: top;"><strong>MLOps</strong></td>
      <td style="padding: 10px;">Machine Learning Operations — práticas de DevOps aplicadas ao ciclo de vida de modelos de ML</td>
    </tr>
    <tr>
      <td style="padding: 10px; vertical-align: top;"><strong>LLM</strong></td>
      <td style="padding: 10px;">Large Language Model — Modelos de linguagem de grande escala (ex: GPT, Claude, Llama)</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 10px; vertical-align: top;"><strong>GenAI</strong></td>
      <td style="padding: 10px;">Generative AI — IA Generativa capaz de criar conteúdo (texto, imagem, código)</td>
    </tr>
    <tr>
      <td style="padding: 10px; vertical-align: top;"><strong>ROI</strong></td>
      <td style="padding: 10px;">Return on Investment — Retorno sobre Investimento</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 10px; vertical-align: top;"><strong>CoE</strong></td>
      <td style="padding: 10px;">Center of Excellence — Centro de Excelência em IA</td>
    </tr>
    <tr>
      <td style="padding: 10px; vertical-align: top;"><strong>LGPD</strong></td>
      <td style="padding: 10px;">Lei Geral de Proteção de Dados — regulamentação brasileira de privacidade</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 10px; vertical-align: top;"><strong>GDPR</strong></td>
      <td style="padding: 10px;">General Data Protection Regulation — regulamentação europeia de privacidade</td>
    </tr>
    <tr>
      <td style="padding: 10px; vertical-align: top;"><strong>Feature Store</strong></td>
      <td style="padding: 10px;">Repositório centralizado de features (variáveis) para modelos de ML</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 10px; vertical-align: top;"><strong>Model Registry</strong></td>
      <td style="padding: 10px;">Catálogo versionado de modelos de ML em produção</td>
    </tr>
    <tr>
      <td style="padding: 10px; vertical-align: top;"><strong>Quick Win</strong></td>
      <td style="padding: 10px;">Iniciativa de baixo esforço e alto impacto para gerar resultados rápidos</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 10px; vertical-align: top;"><strong>Pilot/PoC</strong></td>
      <td style="padding: 10px;">Projeto piloto / Proof of Concept — teste controlado de viabilidade</td>
    </tr>
    <tr>
      <td style="padding: 10px; vertical-align: top;"><strong>DORA</strong></td>
      <td style="padding: 10px;">DevOps Research and Assessment — métricas de performance de entrega de software</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 10px; vertical-align: top;"><strong>FinOps</strong></td>
      <td style="padding: 10px;">Financial Operations — práticas de gestão financeira de cloud computing</td>
    </tr>
    <tr>
      <td style="padding: 10px; vertical-align: top;"><strong>MTTR</strong></td>
      <td style="padding: 10px;">Mean Time to Recovery — tempo médio de recuperação após incidentes</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 10px; vertical-align: top;"><strong>CI/CD</strong></td>
      <td style="padding: 10px;">Continuous Integration / Continuous Deployment — integração e deploy contínuos</td>
    </tr>
  </table>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h2>APÊNDICE H — DORA Metrics (DevOps Research and Assessment)</h2>

<div style="background: #f8fafc; border: 2px solid #ef4444; border-radius: 12px; padding: 25px; margin: 20px 0;">
  <h3 style="color: #dc2626; margin-top: 0;">H.1 O que é DORA?</h3>
  <p>O <strong>DORA (DevOps Research and Assessment)</strong> é um programa de pesquisa fundado em 2014 por Nicole Forsgren, Jez Humble e Gene Kim, posteriormente adquirido pelo Google em 2018. O DORA estabeleceu as métricas mais amplamente aceitas para medir a performance de times de engenharia de software e operações.</p>
  
  <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <p style="margin: 0;"><strong>📖 Referência Principal:</strong> Forsgren, N., Humble, J., & Kim, G. (2018). <em>Accelerate: The Science of Lean Software and DevOps</em>. IT Revolution Press.</p>
  </div>

  <h3 style="color: #dc2626;">H.2 As 4 Métricas-Chave do DORA</h3>
  <table style="width: 100%; margin: 15px 0;">
    <tr style="background: #ef4444; color: white;">
      <th style="padding: 10px;">Métrica</th>
      <th style="padding: 10px;">O que Mede</th>
      <th style="padding: 10px;">Elite</th>
      <th style="padding: 10px;">High</th>
      <th style="padding: 10px;">Medium</th>
      <th style="padding: 10px;">Low</th>
    </tr>
    <tr>
      <td style="padding: 10px;"><strong>Deployment Frequency</strong></td>
      <td style="padding: 10px;">Frequência de deploys em produção</td>
      <td style="padding: 10px; color: #22c55e;">On-demand (múltiplos/dia)</td>
      <td style="padding: 10px;">1x/dia a 1x/semana</td>
      <td style="padding: 10px;">1x/semana a 1x/mês</td>
      <td style="padding: 10px; color: #dc2626;">1x/mês a 1x/6 meses</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px;"><strong>Lead Time for Changes</strong></td>
      <td style="padding: 10px;">Tempo do commit até produção</td>
      <td style="padding: 10px; color: #22c55e;">&lt; 1 hora</td>
      <td style="padding: 10px;">1 dia a 1 semana</td>
      <td style="padding: 10px;">1 semana a 1 mês</td>
      <td style="padding: 10px; color: #dc2626;">1 a 6 meses</td>
    </tr>
    <tr>
      <td style="padding: 10px;"><strong>Change Failure Rate</strong></td>
      <td style="padding: 10px;">% de deploys que causam falhas</td>
      <td style="padding: 10px; color: #22c55e;">0-15%</td>
      <td style="padding: 10px;">16-30%</td>
      <td style="padding: 10px;">31-45%</td>
      <td style="padding: 10px; color: #dc2626;">46-60%</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px;"><strong>Time to Restore Service</strong></td>
      <td style="padding: 10px;">Tempo para recuperar de falhas</td>
      <td style="padding: 10px; color: #22c55e;">&lt; 1 hora</td>
      <td style="padding: 10px;">&lt; 1 dia</td>
      <td style="padding: 10px;">1 dia a 1 semana</td>
      <td style="padding: 10px; color: #dc2626;">&gt; 1 semana</td>
    </tr>
  </table>

  <h3 style="color: #dc2626;">H.3 Relevância para Maturidade em IA</h3>
  <ul>
    <li><strong>MLOps:</strong> As métricas DORA são aplicadas a pipelines de ML para medir velocidade e qualidade de deploy de modelos</li>
    <li><strong>Model Deployment:</strong> Deployment Frequency indica quão ágil é o ciclo de experimentação</li>
    <li><strong>Model Rollback:</strong> Time to Restore mede capacidade de reverter modelos problemáticos</li>
    <li><strong>Model Quality:</strong> Change Failure Rate indica robustez dos processos de validação</li>
  </ul>

  <h3 style="color: #dc2626;">H.4 Como Aplicar na Prática</h3>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
    <div style="background: white; padding: 15px; border-radius: 8px;">
      <h4 style="color: #1e40af; margin: 0 0 10px 0;">Para Times de Engenharia</h4>
      <ul style="margin: 0; font-size: 13px;">
        <li>Automatizar CI/CD pipelines</li>
        <li>Implementar feature flags</li>
        <li>Adotar trunk-based development</li>
        <li>Monitorar com alertas proativos</li>
      </ul>
    </div>
    <div style="background: white; padding: 15px; border-radius: 8px;">
      <h4 style="color: #7c3aed; margin: 0 0 10px 0;">Para Times de ML/IA</h4>
      <ul style="margin: 0; font-size: 13px;">
        <li>Automatizar pipelines de ML</li>
        <li>Implementar A/B testing de modelos</li>
        <li>Monitorar drift e performance</li>
        <li>Criar rollback automatizado</li>
      </ul>
    </div>
  </div>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h2>APÊNDICE I — MLOps Maturity Model</h2>

<div style="background: #f8fafc; border: 2px solid #7c3aed; border-radius: 12px; padding: 25px; margin: 20px 0;">
  <h3 style="color: #6d28d9; margin-top: 0;">I.1 O que é MLOps?</h3>
  <p><strong>MLOps (Machine Learning Operations)</strong> é um conjunto de práticas que combina Machine Learning, DevOps e Engenharia de Dados para automatizar e padronizar o ciclo de vida de modelos de ML em produção. O termo foi popularizado por organizações como Google, Microsoft e empresas de ML tooling.</p>

  <div style="background: #ede9fe; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <p style="margin: 0;"><strong>📖 Referências:</strong></p>
    <ul style="margin: 5px 0 0 0; font-size: 13px;">
      <li>Google Cloud: "MLOps: Continuous delivery and automation pipelines in machine learning"</li>
      <li>Microsoft Azure: "Machine learning operations (MLOps) framework"</li>
      <li>MLOps Community: "MLOps Principles" (mlops.community)</li>
    </ul>
  </div>

  <h3 style="color: #6d28d9;">I.2 Os 5 Níveis de Maturidade MLOps</h3>
  <table style="width: 100%; margin: 15px 0;">
    <tr style="background: #7c3aed; color: white;">
      <th style="padding: 10px;">Nível</th>
      <th style="padding: 10px;">Nome</th>
      <th style="padding: 10px;">Características</th>
      <th style="padding: 10px;">Automação</th>
    </tr>
    <tr>
      <td style="padding: 10px; text-align: center;"><strong>0</strong></td>
      <td style="padding: 10px;">No MLOps</td>
      <td style="padding: 10px;">Scripts manuais, notebooks em produção, sem versionamento</td>
      <td style="padding: 10px; color: #dc2626;">0%</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px; text-align: center;"><strong>1</strong></td>
      <td style="padding: 10px;">DevOps but no MLOps</td>
      <td style="padding: 10px;">CI/CD para código, mas modelos são tratados como artefatos estáticos</td>
      <td style="padding: 10px; color: #f59e0b;">25%</td>
    </tr>
    <tr>
      <td style="padding: 10px; text-align: center;"><strong>2</strong></td>
      <td style="padding: 10px;">Automated Training</td>
      <td style="padding: 10px;">Pipelines automatizados de treinamento, versionamento de dados e modelos</td>
      <td style="padding: 10px; color: #3b82f6;">50%</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px; text-align: center;"><strong>3</strong></td>
      <td style="padding: 10px;">Automated Model Deployment</td>
      <td style="padding: 10px;">CI/CD completo para modelos, A/B testing, feature stores</td>
      <td style="padding: 10px; color: #22c55e;">75%</td>
    </tr>
    <tr>
      <td style="padding: 10px; text-align: center;"><strong>4</strong></td>
      <td style="padding: 10px;">Full MLOps Automation</td>
      <td style="padding: 10px;">Retraining automatizado, monitoramento de drift, self-healing</td>
      <td style="padding: 10px; color: #059669;">100%</td>
    </tr>
  </table>

  <h3 style="color: #6d28d9;">I.3 Componentes de uma Plataforma MLOps</h3>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0;">
    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
      <h4 style="margin: 0 0 10px 0; color: #1e40af;">Data Layer</h4>
      <ul style="margin: 0; font-size: 12px; padding-left: 15px;">
        <li>Data Versioning (DVC)</li>
        <li>Feature Store</li>
        <li>Data Validation</li>
        <li>Data Lineage</li>
      </ul>
    </div>
    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
      <h4 style="margin: 0 0 10px 0; color: #15803d;">Model Layer</h4>
      <ul style="margin: 0; font-size: 12px; padding-left: 15px;">
        <li>Model Registry</li>
        <li>Experiment Tracking</li>
        <li>Model Validation</li>
        <li>Model Versioning</li>
      </ul>
    </div>
    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
      <h4 style="margin: 0 0 10px 0; color: #b45309;">Deployment Layer</h4>
      <ul style="margin: 0; font-size: 12px; padding-left: 15px;">
        <li>Model Serving</li>
        <li>A/B Testing</li>
        <li>Monitoring</li>
        <li>Rollback</li>
      </ul>
    </div>
  </div>

  <h3 style="color: #6d28d9;">I.4 Ferramentas Populares</h3>
  <table style="width: 100%; font-size: 13px;">
    <tr style="background: #ede9fe;">
      <th style="padding: 8px;">Categoria</th>
      <th style="padding: 8px;">Open Source</th>
      <th style="padding: 8px;">Cloud/Enterprise</th>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>Experiment Tracking</strong></td>
      <td style="padding: 8px;">MLflow, Weights & Biases, Neptune</td>
      <td style="padding: 8px;">SageMaker Experiments, Vertex AI</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 8px;"><strong>Feature Store</strong></td>
      <td style="padding: 8px;">Feast, Hopsworks</td>
      <td style="padding: 8px;">Databricks Feature Store, Vertex Feature Store</td>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>Model Registry</strong></td>
      <td style="padding: 8px;">MLflow, DVC</td>
      <td style="padding: 8px;">SageMaker Model Registry, Azure ML</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 8px;"><strong>Pipeline Orchestration</strong></td>
      <td style="padding: 8px;">Kubeflow, Airflow, Prefect</td>
      <td style="padding: 8px;">SageMaker Pipelines, Vertex Pipelines</td>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>Model Serving</strong></td>
      <td style="padding: 8px;">Seldon, BentoML, TorchServe</td>
      <td style="padding: 8px;">SageMaker Endpoints, Vertex Prediction</td>
    </tr>
  </table>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h2>APÊNDICE J — FinOps Foundation Framework</h2>

<div style="background: #f8fafc; border: 2px solid #22c55e; border-radius: 12px; padding: 25px; margin: 20px 0;">
  <h3 style="color: #15803d; margin-top: 0;">J.1 O que é FinOps?</h3>
  <p><strong>FinOps (Financial Operations)</strong> é uma prática de gerenciamento financeiro de cloud computing que combina sistemas, boas práticas e cultura para que organizações entendam seus custos de nuvem e tomem decisões data-driven. A <strong>FinOps Foundation</strong> (parte da Linux Foundation) estabelece os padrões da indústria.</p>

  <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <p style="margin: 0;"><strong>📖 Referência Principal:</strong> FinOps Foundation. "FinOps Framework" (finops.org)</p>
    <p style="margin: 5px 0 0 0; font-size: 13px;">Storment, J.R. & Fuller, M. (2023). <em>Cloud FinOps: Collaborative, Real-Time Cloud Value</em>. O'Reilly Media.</p>
  </div>

  <h3 style="color: #15803d;">J.2 Os 3 Pilares do FinOps</h3>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0;">
    <div style="background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 20px; border-radius: 12px; text-align: center;">
      <div style="font-size: 32px; margin-bottom: 10px;">📊</div>
      <h4 style="margin: 0 0 10px 0;">Inform</h4>
      <p style="font-size: 12px; opacity: 0.9; margin: 0;">Visibilidade e alocação de custos. Saber quanto custa e quem é responsável.</p>
    </div>
    <div style="background: linear-gradient(135deg, #22c55e, #15803d); color: white; padding: 20px; border-radius: 12px; text-align: center;">
      <div style="font-size: 32px; margin-bottom: 10px;">⚡</div>
      <h4 style="margin: 0 0 10px 0;">Optimize</h4>
      <p style="font-size: 12px; opacity: 0.9; margin: 0;">Otimização de recursos. Eliminar desperdício e usar recursos certos.</p>
    </div>
    <div style="background: linear-gradient(135deg, #f59e0b, #b45309); color: white; padding: 20px; border-radius: 12px; text-align: center;">
      <div style="font-size: 32px; margin-bottom: 10px;">🚀</div>
      <h4 style="margin: 0 0 10px 0;">Operate</h4>
      <p style="font-size: 12px; opacity: 0.9; margin: 0;">Governança e operação contínua. Processos e accountability.</p>
    </div>
  </div>

  <h3 style="color: #15803d;">J.3 Níveis de Maturidade FinOps</h3>
  <table style="width: 100%; margin: 15px 0;">
    <tr style="background: #22c55e; color: white;">
      <th style="padding: 10px;">Fase</th>
      <th style="padding: 10px;">Nome</th>
      <th style="padding: 10px;">Foco</th>
      <th style="padding: 10px;">Economia Típica</th>
    </tr>
    <tr>
      <td style="padding: 10px; text-align: center;"><strong>1</strong></td>
      <td style="padding: 10px;">Crawl</td>
      <td style="padding: 10px;">Visibilidade básica, tagueamento, relatórios de custos</td>
      <td style="padding: 10px;">10-15%</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 10px; text-align: center;"><strong>2</strong></td>
      <td style="padding: 10px;">Walk</td>
      <td style="padding: 10px;">Otimização ativa, right-sizing, reserved instances</td>
      <td style="padding: 10px;">20-30%</td>
    </tr>
    <tr>
      <td style="padding: 10px; text-align: center;"><strong>3</strong></td>
      <td style="padding: 10px;">Run</td>
      <td style="padding: 10px;">Automação, showback/chargeback, unit economics</td>
      <td style="padding: 10px;">30-40%</td>
    </tr>
  </table>

  <h3 style="color: #15803d;">J.4 Relevância para Projetos de IA/ML</h3>
  <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <p style="margin: 0 0 10px 0;"><strong>⚠️ Por que FinOps é crítico para IA:</strong></p>
    <ul style="margin: 0; font-size: 13px;">
      <li><strong>Custos de GPU:</strong> Instâncias com GPU (training) podem custar $2-30/hora por GPU</li>
      <li><strong>Storage de dados:</strong> Datasets de ML podem crescer rapidamente (TBs de dados)</li>
      <li><strong>Inferência:</strong> Custos de serving podem escalar com volume de requisições</li>
      <li><strong>Experimentação:</strong> Múltiplos experimentos paralelos consomem recursos rapidamente</li>
    </ul>
  </div>

  <h3 style="color: #15803d;">J.5 Boas Práticas de FinOps para ML</h3>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
    <div style="background: white; padding: 15px; border-radius: 8px;">
      <h4 style="color: #1e40af; margin: 0 0 10px 0;">💰 Reduzir Custos</h4>
      <ul style="margin: 0; font-size: 12px; padding-left: 15px;">
        <li>Usar Spot Instances para training</li>
        <li>Right-size instâncias de GPU</li>
        <li>Desligar recursos não utilizados</li>
        <li>Usar preemptible VMs quando possível</li>
        <li>Comprimir e limpar datasets antigos</li>
      </ul>
    </div>
    <div style="background: white; padding: 15px; border-radius: 8px;">
      <h4 style="color: #7c3aed; margin: 0 0 10px 0;">📊 Medir e Alocar</h4>
      <ul style="margin: 0; font-size: 12px; padding-left: 15px;">
        <li>Taguear recursos por projeto/time</li>
        <li>Medir custo por experimento</li>
        <li>Calcular custo por inferência</li>
        <li>Criar dashboards de custo em tempo real</li>
        <li>Estabelecer budgets por projeto</li>
      </ul>
    </div>
  </div>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h2>APÊNDICE K — Frameworks Específicos por Vertical</h2>

<div style="background: #f8fafc; border: 2px solid #f59e0b; border-radius: 12px; padding: 25px; margin: 20px 0;">
  <h3 style="color: #b45309; margin-top: 0;">K.1 Frameworks por Indústria</h3>
  <p>Cada vertical possui frameworks e padrões específicos que influenciam a implementação de IA. Abaixo listamos os principais:</p>

  <h4 style="color: #1e40af; margin-top: 20px;">🏥 Saúde (Health)</h4>
  <table style="width: 100%; font-size: 13px; margin: 10px 0;">
    <tr style="background: #dbeafe;">
      <th style="padding: 8px;">Framework</th>
      <th style="padding: 8px;">Descrição</th>
      <th style="padding: 8px;">Aplicação em IA</th>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>HIMSS EMRAM</strong></td>
      <td style="padding: 8px;">Electronic Medical Record Adoption Model — mede maturidade de sistemas de saúde</td>
      <td style="padding: 8px;">Nível 6-7 requer análise preditiva e decisão clínica com IA</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 8px;"><strong>FDA AI/ML Framework</strong></td>
      <td style="padding: 8px;">Regulamentação americana para dispositivos médicos com IA/ML</td>
      <td style="padding: 8px;">Requisitos de validação, explicabilidade e monitoramento</td>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>AMIA Guidelines</strong></td>
      <td style="padding: 8px;">American Medical Informatics Association — diretrizes para IA clínica</td>
      <td style="padding: 8px;">Padrões éticos e de segurança para IA em saúde</td>
    </tr>
  </table>

  <h4 style="color: #15803d; margin-top: 20px;">💰 Financeiro (FinTech)</h4>
  <table style="width: 100%; font-size: 13px; margin: 10px 0;">
    <tr style="background: #dcfce7;">
      <th style="padding: 8px;">Framework</th>
      <th style="padding: 8px;">Descrição</th>
      <th style="padding: 8px;">Aplicação em IA</th>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>SR 11-7</strong></td>
      <td style="padding: 8px;">Federal Reserve Model Risk Management — gestão de risco de modelos</td>
      <td style="padding: 8px;">Validação, documentação e governança de modelos de ML</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 8px;"><strong>Basel III/IV</strong></td>
      <td style="padding: 8px;">Framework regulatório bancário internacional</td>
      <td style="padding: 8px;">Requisitos de capital e risco para modelos de crédito</td>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>BCBS 239</strong></td>
      <td style="padding: 8px;">Princípios de agregação de dados de risco</td>
      <td style="padding: 8px;">Qualidade de dados para modelos de risco</td>
    </tr>
  </table>

  <h4 style="color: #7c3aed; margin-top: 20px;">💻 Tecnologia</h4>
  <table style="width: 100%; font-size: 13px; margin: 10px 0;">
    <tr style="background: #ede9fe;">
      <th style="padding: 8px;">Framework</th>
      <th style="padding: 8px;">Descrição</th>
      <th style="padding: 8px;">Aplicação em IA</th>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>DORA Metrics</strong></td>
      <td style="padding: 8px;">Métricas de performance de engenharia de software</td>
      <td style="padding: 8px;">Aplicadas a MLOps para medir velocidade de deploy de modelos</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 8px;"><strong>FinOps Framework</strong></td>
      <td style="padding: 8px;">Gestão financeira de cloud computing</td>
      <td style="padding: 8px;">Otimização de custos de infraestrutura de ML</td>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>MLOps Maturity Model</strong></td>
      <td style="padding: 8px;">Níveis de maturidade em operações de ML</td>
      <td style="padding: 8px;">Automação de pipelines de dados e modelos</td>
    </tr>
  </table>

  <h4 style="color: #ea580c; margin-top: 20px;">🏭 Manufatura (Industry 4.0)</h4>
  <table style="width: 100%; font-size: 13px; margin: 10px 0;">
    <tr style="background: #fed7aa;">
      <th style="padding: 8px;">Framework</th>
      <th style="padding: 8px;">Descrição</th>
      <th style="padding: 8px;">Aplicação em IA</th>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>RAMI 4.0</strong></td>
      <td style="padding: 8px;">Reference Architecture Model for Industry 4.0</td>
      <td style="padding: 8px;">Arquitetura de referência para IA industrial</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 8px;"><strong>ISA-95</strong></td>
      <td style="padding: 8px;">Padrão de integração TI-OT na manufatura</td>
      <td style="padding: 8px;">Integração de IA com sistemas de chão de fábrica</td>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>IEC 62443</strong></td>
      <td style="padding: 8px;">Cibersegurança industrial</td>
      <td style="padding: 8px;">Segurança de sistemas de IA em ambientes industriais</td>
    </tr>
  </table>

  <h4 style="color: #0891b2; margin-top: 20px;">⚡ Utilities (Energia)</h4>
  <table style="width: 100%; font-size: 13px; margin: 10px 0;">
    <tr style="background: #cffafe;">
      <th style="padding: 8px;">Framework</th>
      <th style="padding: 8px;">Descrição</th>
      <th style="padding: 8px;">Aplicação em IA</th>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>IEEE 2755</strong></td>
      <td style="padding: 8px;">Smart Grid Analytics (em desenvolvimento)</td>
      <td style="padding: 8px;">Padrões para IA em redes elétricas inteligentes</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 8px;"><strong>ISO 55000</strong></td>
      <td style="padding: 8px;">Asset Management — gestão de ativos</td>
      <td style="padding: 8px;">IA para manutenção preditiva de ativos</td>
    </tr>
    <tr>
      <td style="padding: 8px;"><strong>NERC CIP</strong></td>
      <td style="padding: 8px;">Critical Infrastructure Protection</td>
      <td style="padding: 8px;">Segurança de sistemas de IA em infraestrutura crítica</td>
    </tr>
  </table>
</div>

<div class="footer">
  <p><strong>SysMap Solutions</strong> — Blueprint IA</p>
  <p>Assessment de Maturidade em Inteligência Artificial</p>
  <p>Documento gerado em ${formatDate(new Date())}</p>
  <p style="margin-top: 10px; font-size: 10px; color: #999;">© ${new Date().getFullYear()} SysMap Solutions. Todos os direitos reservados.</p>
</div>

</body>
</html>
  `;
  
  return html;
}

export function downloadWordDocument(dashboardData) {
  try {
    // Validar dados de entrada
    if (!dashboardData) {
      console.error('downloadWordDocument: dashboardData é undefined');
      alert('Erro: Dados do dashboard não disponíveis. Por favor, recarregue a página.');
      return;
    }
    
    if (!dashboardData.empresa) {
      console.error('downloadWordDocument: empresa é undefined');
      alert('Erro: Dados da empresa não disponíveis. Por favor, recarregue a página.');
      return;
    }
    
    const html = generateWordReport(dashboardData);
    
    if (!html) {
      console.error('downloadWordDocument: HTML gerado é vazio');
      alert('Erro ao gerar o relatório. Por favor, tente novamente.');
      return;
    }
    
    const isProjeto = !!dashboardData.projeto;
    const entityName = isProjeto 
      ? (dashboardData.projeto?.nome || 'Projeto') 
      : (dashboardData.empresa?.nome || 'Empresa');
    const filename = `Relatorio_Maturidade_IA_${entityName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`;
    
    // Criar blob com conteúdo HTML que o Word consegue abrir
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    
    // Criar link e fazer download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Usar setTimeout para garantir que o link foi adicionado ao DOM
    setTimeout(() => {
      link.click();
      // Limpar após um delay para garantir que o download iniciou
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    }, 0);
    
  } catch (error) {
    console.error('Erro ao gerar relatório Word:', error);
    alert(`Erro ao gerar o relatório: ${error.message}. Por favor, tente novamente.`);
  }
}

// ============================================================================
// RELATÓRIO EXECUTIVO (Versão resumida para C-Level)
// ============================================================================

export function generateExecutiveWordReport(dashboardData) {
  const maturityLevel = getMaturityLevelFromScore(dashboardData.scoreGeral);
  const { projecao } = getProjecaoFinanceiraAjustada(dashboardData);
  const levelInfo = MIT_CISR_LEVELS[maturityLevel];
  
  const verticalProjeto = dashboardData.projeto?.vertical || null;
  const porteEmpresa = dashboardData.empresa?.porte || null;
  const vertical = normalizarVertical(verticalProjeto);
  const porte = normalizarPorte(porteEmpresa);
  
  const isProjeto = !!dashboardData.projeto;
  const empresaNome = dashboardData.empresa?.nome || 'Empresa';
  const entityName = isProjeto ? dashboardData.projeto.nome : empresaNome;
  
  const areasOrdenadas = [...(dashboardData.scoresPorArea || [])]
    .filter(a => a && typeof a.score === 'number')
    .sort((a, b) => a.score - b.score);
  
  // Top 5 gaps
  const MEDIA_IDEAL = 3.5;
  const top5Gaps = areasOrdenadas
    .filter(a => a.score < MEDIA_IDEAL)
    .slice(0, 5)
    .map((a, i) => ({
      ...a,
      gap: (MEDIA_IDEAL - a.score).toFixed(1),
      prioridade: a.score < 2 ? 'Crítica' : a.score < 2.5 ? 'Alta' : 'Média'
    }));
  
  // Benchmark - mapear vertical para nome amigável
  const NOMES_VERTICAIS = {
    fintech: 'Fintech / Serviços Financeiros',
    saude: 'Saúde / HealthTech',
    tecnologia: 'Tecnologia / Software',
    varejo: 'Varejo / E-commerce',
    industria: 'Indústria / Manufatura',
    servicos: 'Serviços',
    agrovert: 'Agronegócio / AgTech',
    legaltech: 'LegalTech / Jurídico',
    edtech: 'EdTech / Educação',
    aifirst: 'AI-First'
  };
  const verticalNome = NOMES_VERTICAIS[vertical] || vertical || 'Geral';
  const benchmarkData = BENCHMARKING_POR_VERTICAL[vertical];
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Relatório Executivo - Maturidade IA - ${entityName}</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; }
    h1 { color: #1e3a8a; font-size: 18pt; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-top: 30px; page-break-after: avoid; }
    h2 { color: #1e40af; font-size: 14pt; margin-top: 25px; page-break-after: avoid; }
    h3 { color: #3b82f6; font-size: 12pt; margin-top: 20px; }
    .cover { text-align: center; padding: 60px 0; page-break-after: always; }
    .cover-title { font-size: 28pt; color: #1e3a8a; margin-bottom: 10px; }
    .cover-subtitle { font-size: 16pt; color: #64748b; margin-bottom: 40px; }
    .score-box { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 30px; border-radius: 16px; text-align: center; margin: 30px 0; }
    .score-number { font-size: 48pt; font-weight: bold; }
    .score-label { font-size: 14pt; opacity: 0.9; }
    .metric-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
    .metric-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-align: center; }
    .metric-value { font-size: 24pt; font-weight: bold; color: #1e40af; }
    .metric-label { font-size: 10pt; color: #64748b; text-transform: uppercase; }
    .gap-item { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 15px; margin: 10px 0; border-radius: 0 8px 8px 0; }
    .gap-title { font-weight: bold; color: #dc2626; }
    .gap-score { float: right; background: #ef4444; color: white; padding: 2px 10px; border-radius: 12px; font-size: 11pt; }
    .cenario-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
    .cenario-box { border-radius: 12px; padding: 20px; text-align: center; }
    .cenario-conservador { background: #f1f5f9; border: 2px solid #94a3b8; }
    .cenario-base { background: #dbeafe; border: 2px solid #3b82f6; }
    .cenario-agressivo { background: #fef3c7; border: 2px solid #f59e0b; }
    .cenario-title { font-weight: bold; font-size: 12pt; margin-bottom: 10px; }
    .cenario-value { font-size: 28pt; font-weight: bold; }
    .action-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 15px; margin: 10px 0; border-radius: 0 8px 8px 0; }
    .action-title { font-weight: bold; color: #15803d; }
    .timeline { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin: 20px 0; }
    .timeline-item { text-align: center; padding: 15px; border-radius: 12px; }
    .timeline-t1 { background: #fef3c7; border: 2px solid #f59e0b; }
    .timeline-t2 { background: #dbeafe; border: 2px solid #3b82f6; }
    .timeline-t3 { background: #e9d5ff; border: 2px solid #a855f7; }
    .timeline-t4 { background: #dcfce7; border: 2px solid #22c55e; }
    .nota { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 10pt; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 10pt; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: bold; }
  </style>
</head>
<body>

<!-- CAPA -->
<div class="cover">
  <p style="color: #64748b; font-size: 12pt; text-transform: uppercase; letter-spacing: 3px;">Relatório Executivo</p>
  <h1 class="cover-title" style="border: none;">Maturidade em Inteligência Artificial</h1>
  <p class="cover-subtitle">Assessment Estratégico • MIT CISR Framework</p>
  
  <div class="score-box">
    <div class="score-number">${dashboardData.scoreGeral.toFixed(1)}</div>
    <div class="score-label">${dashboardData.nivelGeral || levelInfo.name}</div>
  </div>
  
  <div style="margin-top: 40px;">
    <p style="font-size: 14pt; font-weight: bold;">${empresaNome}</p>
    ${isProjeto ? `<p style="color: #64748b;">Projeto: ${dashboardData.projeto.nome}</p>` : ''}
    <p style="color: #64748b; margin-top: 20px;">${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
  </div>
</div>

<!-- 1. VISÃO GERAL -->
<h1>1. Visão Geral da Maturidade</h1>

<p>A avaliação identificou que a <strong>${empresaNome}</strong> encontra-se no <strong>${levelInfo.name}</strong> de maturidade em IA, 
com foco em <strong>${levelInfo.focus}</strong>. Este relatório executivo resume os principais achados e recomendações para a liderança.</p>

<div class="metric-grid">
  <div class="metric-box">
    <div class="metric-value">${dashboardData.scoreGeral.toFixed(1)}</div>
    <div class="metric-label">Score Geral</div>
  </div>
  <div class="metric-box">
    <div class="metric-value">${maturityLevel}</div>
    <div class="metric-label">Nível (1-5)</div>
  </div>
  <div class="metric-box">
    <div class="metric-value">${dashboardData.totalAvaliadores || 1}</div>
    <div class="metric-label">Avaliadores</div>
  </div>
</div>

<div class="metric-grid">
  <div class="metric-box">
    <div class="metric-value" style="color: ${projecao.crescimentoReceita.media >= 0 ? '#22c55e' : '#ef4444'};">
      ${projecao.crescimentoReceita.media >= 0 ? '+' : ''}${projecao.crescimentoReceita.media}%
    </div>
    <div class="metric-label">Crescimento vs Mercado</div>
  </div>
  <div class="metric-box">
    <div class="metric-value" style="color: #3b82f6;">${projecao.roiEsperado.media}%</div>
    <div class="metric-label">ROI Típico</div>
  </div>
  <div class="metric-box">
    <div class="metric-value">${projecao.tempoParaROI}</div>
    <div class="metric-label">Tempo para ROI</div>
  </div>
</div>

<!-- 2. TOP 5 GAPS PRIORITÁRIOS -->
<h1>2. Top 5 Gaps Prioritários</h1>

<p>As áreas abaixo apresentam os maiores gaps em relação ao nível ideal (3.5) e devem ser priorizadas:</p>

${top5Gaps.length > 0 ? top5Gaps.map((gap, i) => `
<div class="gap-item">
  <span class="gap-score">${gap.score.toFixed(1)}</span>
  <span class="gap-title">${i + 1}. ${gap.area}</span>
  <p style="margin: 5px 0 0 0; font-size: 10pt; color: #64748b;">Gap: -${gap.gap} pontos • Prioridade: ${gap.prioridade}</p>
</div>
`).join('') : '<p>✓ Todas as áreas estão acima do nível ideal. Foco em otimização contínua.</p>'}

${benchmarkData ? `
<!-- 3. BENCHMARKING -->
<h1>3. Posicionamento Competitivo</h1>

<p>Comparação com o benchmark do setor <strong>${verticalNome}</strong>:</p>

<div class="metric-grid">
  <div class="metric-box" style="background: ${dashboardData.scoreGeral >= benchmarkData.mediaSetor ? '#f0fdf4' : '#fef2f2'}; border-color: ${dashboardData.scoreGeral >= benchmarkData.mediaSetor ? '#22c55e' : '#ef4444'};">
    <div class="metric-value" style="color: ${dashboardData.scoreGeral >= benchmarkData.mediaSetor ? '#22c55e' : '#ef4444'};">${dashboardData.scoreGeral.toFixed(1)}</div>
    <div class="metric-label">Sua Empresa</div>
  </div>
  <div class="metric-box">
    <div class="metric-value">${benchmarkData.mediaSetor}</div>
    <div class="metric-label">Média do Setor</div>
  </div>
  <div class="metric-box">
    <div class="metric-value">${benchmarkData.top25}</div>
    <div class="metric-label">Top 25%</div>
  </div>
</div>

<p><strong>Posição:</strong> ${dashboardData.scoreGeral >= benchmarkData.top25 ? '🏆 Top Quartil - Líder do setor' : 
  dashboardData.scoreGeral >= benchmarkData.mediaSetor ? '✓ Acima da média do setor' : 
  '⚠ Abaixo da média - Risco competitivo'}</p>
` : ''}

<!-- 4. PROJEÇÃO DE IMPACTO FINANCEIRO -->
<h1>4. Projeção de Impacto Financeiro</h1>

<p>Cenários de retorno ao evoluir para o próximo nível de maturidade:</p>

<div class="cenario-grid">
  <div class="cenario-box cenario-conservador">
    <div class="cenario-title">🐢 Conservador</div>
    <div class="cenario-value" style="color: #475569;">${Math.round(projecao.roiEsperado.min * 0.6)}%</div>
    <div style="font-size: 10pt; color: #64748b;">ROI Esperado</div>
    <div style="margin-top: 10px; font-size: 10pt;">Payback: ${parseInt(projecao.tempoParaROI) + 6} meses</div>
  </div>
  <div class="cenario-box cenario-base">
    <div class="cenario-title">⚖️ Base (Recomendado)</div>
    <div class="cenario-value" style="color: #1e40af;">${projecao.roiEsperado.media}%</div>
    <div style="font-size: 10pt; color: #64748b;">ROI Esperado</div>
    <div style="margin-top: 10px; font-size: 10pt;">Payback: ${projecao.tempoParaROI}</div>
  </div>
  <div class="cenario-box cenario-agressivo">
    <div class="cenario-title">🚀 Agressivo</div>
    <div class="cenario-value" style="color: #b45309;">${Math.round(projecao.roiEsperado.max * 1.2)}%</div>
    <div style="font-size: 10pt; color: #64748b;">ROI Esperado</div>
    <div style="margin-top: 10px; font-size: 10pt;">Payback: ${Math.max(3, parseInt(projecao.tempoParaROI) - 6)} meses</div>
  </div>
</div>

<div class="nota">
  <strong>📚 Metodologia:</strong> Projeções baseadas em MIT CISR (Weill, Woerner & Sebastian, 2024), 
  McKinsey "The State of AI in 2024" e Gartner AI Maturity Model. 
  <strong>Nota:</strong> Valores são referenciais de mercado, não promessas contratuais.
</div>

<!-- 5. PLANO DE AÇÃO 90 DIAS -->
<h1>5. Plano de Ação - Próximos 90 Dias</h1>

<div class="timeline">
  <div class="timeline-item timeline-t1">
    <div style="font-weight: bold; color: #b45309;">Semana 1-4</div>
    <div style="font-size: 12pt; font-weight: bold;">Quick Wins</div>
    <ul style="text-align: left; font-size: 9pt; margin: 10px 0 0 0; padding-left: 15px;">
      <li>Validar estratégia de IA</li>
      <li>Identificar patrocinador</li>
      <li>Mapear dados críticos</li>
    </ul>
  </div>
  <div class="timeline-item timeline-t2">
    <div style="font-weight: bold; color: #1e40af;">Semana 5-8</div>
    <div style="font-size: 12pt; font-weight: bold;">Fundação</div>
    <ul style="text-align: left; font-size: 9pt; margin: 10px 0 0 0; padding-left: 15px;">
      <li>Formar comitê de IA</li>
      <li>Priorizar casos de uso</li>
      <li>Definir políticas</li>
    </ul>
  </div>
  <div class="timeline-item timeline-t3">
    <div style="font-weight: bold; color: #7c3aed;">Semana 9-10</div>
    <div style="font-size: 12pt; font-weight: bold;">Pilotos</div>
    <ul style="text-align: left; font-size: 9pt; margin: 10px 0 0 0; padding-left: 15px;">
      <li>Iniciar POCs</li>
      <li>Capacitar equipe</li>
      <li>Medir baseline</li>
    </ul>
  </div>
  <div class="timeline-item timeline-t4">
    <div style="font-weight: bold; color: #15803d;">Semana 11-12</div>
    <div style="font-size: 12pt; font-weight: bold;">Validação</div>
    <ul style="text-align: left; font-size: 9pt; margin: 10px 0 0 0; padding-left: 15px;">
      <li>Avaliar resultados</li>
      <li>Ajustar roadmap</li>
      <li>Planejar escala</li>
    </ul>
  </div>
</div>

${top5Gaps.length > 0 ? `
<h2>5.1 Ações Prioritárias por Gap</h2>
${top5Gaps.slice(0, 3).map(gap => {
  const acoes = getAcoesByArea(gap.area, gap.score);
  return `
<div class="action-box">
  <div class="action-title">✓ ${gap.area}</div>
  <ul style="margin: 5px 0 0 20px; font-size: 10pt;">
    ${acoes.slice(0, 2).map(a => `<li>${a}</li>`).join('')}
  </ul>
</div>
`;
}).join('')}
` : ''}

<!-- 6. PRÓXIMOS PASSOS -->
<h1>6. Próximos Passos para a Liderança</h1>

<table>
  <tr>
    <th style="width: 30%;">Ação</th>
    <th style="width: 40%;">Descrição</th>
    <th style="width: 30%;">Responsável Sugerido</th>
  </tr>
  <tr>
    <td><strong>1. Aprovar Roadmap</strong></td>
    <td>Validar plano de 90 dias e alocar recursos iniciais</td>
    <td>CEO / Comitê Executivo</td>
  </tr>
  <tr>
    <td><strong>2. Nomear Sponsor</strong></td>
    <td>Definir executivo C-level como sponsor de IA</td>
    <td>CEO</td>
  </tr>
  <tr>
    <td><strong>3. Definir Budget</strong></td>
    <td>Aprovar investimento de ${projecao.investimentoRecomendado} para Fase 1</td>
    <td>CFO</td>
  </tr>
  <tr>
    <td><strong>4. Formar Comitê</strong></td>
    <td>Criar comitê de governança de IA multidisciplinar</td>
    <td>Sponsor de IA</td>
  </tr>
  <tr>
    <td><strong>5. Comunicar Estratégia</strong></td>
    <td>Compartilhar visão de IA com a organização</td>
    <td>CEO / RH</td>
  </tr>
</table>

<!-- RODAPÉ -->
<div class="footer">
  <p><strong>Blueprint IA</strong> • Relatório Executivo de Maturidade em Inteligência Artificial</p>
  <p>${empresaNome} • ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
  <p style="font-size: 9pt; margin-top: 10px;">Baseado no MIT CISR Enterprise AI Maturity Model (Weill, Woerner & Sebastian, 2024)</p>
</div>

</body>
</html>
`;
  
  return html;
}

export function downloadExecutiveWordDocument(dashboardData) {
  try {
    if (!dashboardData) {
      console.error('downloadExecutiveWordDocument: dashboardData é undefined');
      alert('Erro: Dados do dashboard não disponíveis.');
      return;
    }
    
    const html = generateExecutiveWordReport(dashboardData);
    
    if (!html) {
      console.error('downloadExecutiveWordDocument: HTML gerado é vazio');
      alert('Erro ao gerar o relatório executivo.');
      return;
    }
    
    const isProjeto = !!dashboardData.projeto;
    const entityName = isProjeto 
      ? (dashboardData.projeto?.nome || 'Projeto') 
      : (dashboardData.empresa?.nome || 'Empresa');
    const filename = `Relatorio_Executivo_IA_${entityName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`;
    
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    setTimeout(() => {
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    }, 0);
    
  } catch (error) {
    console.error('Erro ao gerar relatório executivo Word:', error);
    alert(`Erro ao gerar o relatório: ${error.message}`);
  }
}

// Função para converter relatório individual em formato de dashboard
export function downloadWordFromRelatorio(relatorio) {
  const dashboardData = {
    projeto: relatorio.projeto,
    empresa: relatorio.empresa,
    scoreGeral: relatorio.scoreGeral,
    nivelGeral: relatorio.nivelGeral,
    classificacao: getClassificacao(relatorio.scoreGeral),
    totalAvaliadores: 1,
    etapasAvaliadas: relatorio.scoresPorArea.filter(a => a.score > 0).length,
    totalEtapas: relatorio.scoresPorArea.length,
    progresso: Math.round((relatorio.scoresPorArea.filter(a => a.respondidas > 0).length / relatorio.scoresPorArea.length) * 100),
    scoresPorArea: relatorio.scoresPorArea,
    avaliadores: [{
      nome: relatorio.usuario.nome,
      email: relatorio.usuario.email,
      areasSelecionadas: relatorio.avaliacao.areasSelecionadas || relatorio.scoresPorArea.map(a => a.areaId),
      dataAvaliacao: relatorio.avaliacao.updatedAt
    }]
  };
  
  downloadWordDocument(dashboardData);
}

function getClassificacao(score) {
  if (score <= 1.5) return 'Iniciante';
  if (score <= 2.5) return 'Básico';
  if (score <= 3.5) return 'Intermediário';
  if (score <= 4.5) return 'Avançado';
  return 'Expert';
}

export function generateUserReport(avaliador, dashboardData) {
  const isProjeto = !!dashboardData.projeto;
  const entityName = isProjeto ? dashboardData.projeto.nome : dashboardData.empresa.nome;
  const empresaNome = dashboardData.empresa.nome;
  
  const getScoreColor = (score) => {
    if (score >= 4) return '#059669';
    if (score >= 3) return '#3b82f6';
    if (score >= 2) return '#d97706';
    return '#dc2626';
  };
  
  const getScoreBg = (score) => {
    if (score >= 4) return '#dcfce7';
    if (score >= 3) return '#dbeafe';
    if (score >= 2) return '#fef3c7';
    return '#fee2e2';
  };
  
  const areasAvaliadas = avaliador.areasSelecionadas || [];
  const scoresPorAreaFiltrado = dashboardData.scoresPorArea?.filter(a => 
    areasAvaliadas.length === 0 || areasAvaliadas.includes(a.areaId)
  ) || [];
  
  const respostasDoAvaliador = avaliador.respostas || [];
  const areas = dashboardData.areas || [];
  
  const respostasPorArea = {};
  if (areas.length > 0 && respostasDoAvaliador.length > 0) {
    areas.forEach(area => {
      if (areasAvaliadas.length === 0 || areasAvaliadas.includes(area.id)) {
        respostasPorArea[area.id] = {
          nome: area.nome,
          perguntas: area.perguntas?.map(p => {
            const resposta = respostasDoAvaliador.find(r => r.perguntaId === p.id);
            return {
              numero: p.numero,
              texto: p.texto,
              pontuacao: resposta?.pontuacao || null,
              observacoes: resposta?.observacoes || null
            };
          }) || []
        };
      }
    });
  }
  
  const html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #333333; margin: 0; padding: 20px; }
    .header { text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 25px; }
    .logo { font-size: 24pt; font-weight: bold; color: #1e3a8a; }
    .logo span { color: #3b82f6; }
    .subtitle { color: #666666; font-size: 11pt; margin-top: 5px; }
    h1 { color: #1e3a8a; font-size: 16pt; margin-top: 25px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #7c3aed; page-break-after: avoid; }
    h2 { color: #1e40af; font-size: 14pt; margin-top: 20px; margin-bottom: 12px; page-break-after: avoid; }
    h3 { color: #374151; font-size: 12pt; margin-top: 15px; margin-bottom: 10px; }
    p { margin: 10px 0; text-align: justify; }
    .user-box { background-color: #7c3aed; color: white; padding: 20px; text-align: center; margin: 20px 0; border: 1px solid #7c3aed; }
    .user-box .name { font-size: 20pt; font-weight: bold; }
    .user-box .email { font-size: 11pt; margin-top: 5px; }
    .info-grid { margin: 15px 0; }
    .info-item { background-color: #f8fafc; padding: 10px 15px; margin: 8px 0; border-left: 4px solid #7c3aed; }
    .info-item .label { font-size: 9pt; color: #666666; text-transform: uppercase; }
    .info-item .value { font-size: 12pt; font-weight: bold; color: #1e3a8a; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10pt; }
    th { background-color: #7c3aed; color: white; padding: 10px; text-align: left; font-weight: bold; border: 1px solid #7c3aed; }
    td { padding: 8px 10px; border: 1px solid #e5e7eb; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: center; color: #666666; font-size: 9pt; }
    .areas-badge { background-color: #ede9fe; color: #5b21b6; padding: 4px 10px; font-size: 10pt; margin: 3px; }
    .score-badge { padding: 4px 12px; font-size: 10pt; font-weight: bold; }
    .area-section { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 20px 0; }
    .area-header { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
    .area-title { font-size: 14pt; font-weight: bold; color: #1e3a8a; }
    .resposta-item { background-color: white; border: 1px solid #e2e8f0; padding: 12px; margin: 10px 0; }
    .resposta-pergunta { font-weight: bold; color: #374151; margin-bottom: 10px; }
    .resposta-score { margin-top: 10px; }
    .resposta-obs { background-color: #fef3c7; border-left: 3px solid #f59e0b; padding: 10px; margin-top: 10px; font-style: italic; font-size: 10pt; }
    br.page-break { page-break-before: always; mso-special-character: line-break; }
  </style>
</head>
<body>

<div class="header">
  <div class="logo">Sys<span>Map</span> Solutions</div>
  <div class="subtitle">Blueprint IA — Relatório Completo de Avaliação Individual</div>
</div>

<div class="user-box">
  <div class="name">${avaliador.nome}</div>
  <div class="email">${avaliador.email}</div>
  <div style="margin-top: 15px; font-size: 14px;">Avaliação realizada em ${formatDate(avaliador.dataAvaliacao)}</div>
</div>

<div class="info-grid">
  <div class="info-item">
    <div class="label">Empresa</div>
    <div class="value">${empresaNome}</div>
  </div>
  <div class="info-item">
    <div class="label">${isProjeto ? 'Projeto' : 'Tipo'}</div>
    <div class="value">${isProjeto ? dashboardData.projeto.nome : 'Avaliação Consolidada'}</div>
  </div>
  <div class="info-item">
    <div class="label">Áreas Avaliadas</div>
    <div class="value">${areasAvaliadas.length || 'Todas'} área(s)</div>
  </div>
  <div class="info-item">
    <div class="label">Data do Relatório</div>
    <div class="value">${formatDate(new Date())}</div>
  </div>
</div>

<h1>1. Resumo dos Scores por Área</h1>

<p>Abaixo estão os scores consolidados por área de avaliação (média de todas as avaliações do projeto):</p>

<table>
  <thead>
    <tr>
      <th>Área</th>
      <th>Score</th>
      <th>Nível</th>
      <th>Avaliadores</th>
    </tr>
  </thead>
  <tbody>
    ${scoresPorAreaFiltrado.map(area => `
    <tr>
      <td><strong>${area.area}</strong></td>
      <td>
        <span class="score-badge" style="background: ${getScoreBg(area.score)}; color: ${getScoreColor(area.score)};">
          ${area.score.toFixed(1)}
        </span>
      </td>
      <td>${area.nivel}</td>
      <td>${area.avaliadoresCobriram || 1}/${dashboardData.totalAvaliadores || 1}</td>
    </tr>
    `).join('')}
  </tbody>
</table>

<div style="background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
  <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Score Geral Consolidado</div>
  <div style="font-size: 48px; font-weight: bold; color: #1e3a8a;">${dashboardData.scoreGeral?.toFixed(1) || 'N/A'}</div>
  <div style="margin-top: 10px; color: #1e40af; font-weight: 600;">${dashboardData.nivelGeral || ''} - ${dashboardData.classificacao || ''}</div>
</div>

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>2. Detalhamento das Respostas por Área</h1>

<p>A seguir, apresentamos todas as respostas registradas nesta avaliação, organizadas por área de conhecimento:</p>

${Object.keys(respostasPorArea).length > 0 ? Object.entries(respostasPorArea).map(([areaId, areaData]) => {
  const areaScore = scoresPorAreaFiltrado.find(a => a.areaId === parseInt(areaId));
  const respostasComPontuacao = areaData.perguntas.filter(p => p.pontuacao !== null);
  const mediaArea = respostasComPontuacao.length > 0 
    ? respostasComPontuacao.reduce((acc, p) => acc + p.pontuacao, 0) / respostasComPontuacao.length 
    : 0;
  
  return `
<div class="area-section">
  <div class="area-header">
    <div class="area-title">${areaData.nome}</div>
    <span class="score-badge" style="background: ${getScoreBg(mediaArea)}; color: ${getScoreColor(mediaArea)}; font-size: 16px;">
      Score: ${mediaArea.toFixed(1)}
    </span>
  </div>
  
  ${areaData.perguntas.map(p => `
  <div class="resposta-item">
    <div class="resposta-pergunta">${p.numero}. ${p.texto}</div>
    <div class="resposta-score">
      <strong>Pontuação:</strong>
      ${p.pontuacao !== null ? `
        <span class="score-badge" style="background: ${getScoreBg(p.pontuacao)}; color: ${getScoreColor(p.pontuacao)};">
          ${p.pontuacao} / 5
        </span>
        <span style="color: #666; font-size: 12px;">(${getNivelMaturidade(p.pontuacao)})</span>
      ` : '<span style="color: #999;">Não respondida</span>'}
    </div>
    ${p.observacoes ? `
    <div class="resposta-obs">
      <strong>Observações:</strong> ${p.observacoes}
    </div>
    ` : ''}
  </div>
  `).join('')}
</div>
`;
}).join('') : `
<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
  <p><strong>Nota:</strong> As respostas detalhadas deste avaliador não estão disponíveis no contexto atual do dashboard. Para ver as respostas completas, acesse o relatório individual através do link "Ver avaliação individual" no dashboard.</p>
</div>

<h2>Scores por Etapa (Consolidado)</h2>
<p>Abaixo estão os scores por etapa/pergunta do assessment (média de todos os avaliadores):</p>

<table>
  <thead>
    <tr>
      <th>Etapa</th>
      <th>Área</th>
      <th>Score</th>
      <th>Nível</th>
    </tr>
  </thead>
  <tbody>
    ${(dashboardData.scoresPorEtapa || []).slice(0, 20).map(etapa => `
    <tr>
      <td>${etapa.etapa}</td>
      <td style="font-size: 11px; color: #666;">${etapa.areaNome}</td>
      <td>
        <span class="score-badge" style="background: ${getScoreBg(etapa.score)}; color: ${getScoreColor(etapa.score)};">
          ${etapa.score.toFixed(1)}
        </span>
      </td>
      <td>${etapa.nivel}</td>
    </tr>
    `).join('')}
  </tbody>
</table>
`}

<br clear="all" style="mso-special-character:line-break;page-break-before:always">
<h1>3. Escala de Maturidade Utilizada</h1>

<p>As pontuações seguem a escala de maturidade em IA baseada no MIT CISR:</p>

<table>
  <thead>
    <tr>
      <th>Pontuação</th>
      <th>Nível</th>
      <th>Descrição</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><span class="score-badge" style="background: #fee2e2; color: #dc2626;">1</span></td>
      <td>Inicial</td>
      <td>Sem estratégia formal, iniciativas isoladas e reativas</td>
    </tr>
    <tr>
      <td><span class="score-badge" style="background: #fed7aa; color: #ea580c;">2</span></td>
      <td>Oportunista</td>
      <td>Experimentos iniciais, algumas iniciativas em andamento</td>
    </tr>
    <tr>
      <td><span class="score-badge" style="background: #fef3c7; color: #ca8a04;">3</span></td>
      <td>Estruturado</td>
      <td>Processos definidos, projetos alinhados com estratégia</td>
    </tr>
    <tr>
      <td><span class="score-badge" style="background: #dbeafe; color: #2563eb;">4</span></td>
      <td>Gerenciado</td>
      <td>IA integrada ao negócio, governança estabelecida</td>
    </tr>
    <tr>
      <td><span class="score-badge" style="background: #dcfce7; color: #059669;">5</span></td>
      <td>Otimizado</td>
      <td>IA como diferencial competitivo, inovação contínua</td>
    </tr>
  </tbody>
</table>

<h1>4. Contribuição e Agradecimento</h1>

<p>A participação de <strong>${avaliador.nome}</strong> foi fundamental para a construção do diagnóstico de maturidade em IA. Sua contribuição abrangeu ${areasAvaliadas.length || 'todas as'} área(s) de avaliação, trazendo perspectivas valiosas sobre a realidade da organização.</p>

<div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
  <strong style="color: #059669;">Obrigado pela participação!</strong>
  <p style="margin: 10px 0 0 0; font-size: 14px;">Sua avaliação ajuda a construir uma visão mais completa e precisa da maturidade em IA da organização. Os insights fornecidos serão utilizados para desenvolver um plano de ação personalizado.</p>
</div>

<div class="footer">
  <p><strong>SysMap Solutions</strong> — Blueprint IA</p>
  <p>Relatório Completo de Avaliação Individual</p>
  <p>Documento gerado em ${formatDate(new Date())}</p>
  <p style="margin-top: 10px; font-size: 10px; color: #999;">© ${new Date().getFullYear()} SysMap Solutions. Todos os direitos reservados.</p>
</div>

</body>
</html>
  `;
  
  return html;
}

export function downloadUserReport(avaliador, dashboardData) {
  try {
    // Validar dados de entrada
    if (!avaliador || !avaliador.nome) {
      console.error('downloadUserReport: avaliador é undefined ou sem nome');
      alert('Erro: Dados do avaliador não disponíveis.');
      return;
    }
    
    if (!dashboardData) {
      console.error('downloadUserReport: dashboardData é undefined');
      alert('Erro: Dados do dashboard não disponíveis.');
      return;
    }
    
    const html = generateUserReport(avaliador, dashboardData);
    
    if (!html) {
      console.error('downloadUserReport: HTML gerado é vazio');
      alert('Erro ao gerar o relatório. Por favor, tente novamente.');
      return;
    }
    
    const filename = `Avaliacao_${(avaliador.nome || 'Usuario').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`;
    
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    setTimeout(() => {
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    }, 0);
    
  } catch (error) {
    console.error('Erro ao gerar relatório do usuário:', error);
    alert(`Erro ao gerar o relatório: ${error.message}. Por favor, tente novamente.`);
  }
}

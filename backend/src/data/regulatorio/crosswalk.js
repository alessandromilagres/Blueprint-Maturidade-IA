/**
 * Crosswalk estático BluePrint (16 dimensões) → ISO 42001, PL 2338/2023, LGPD.
 * Semana 1: referência para badges e gaps por dimensão (não substitui auditoria/certificação).
 */

export const DISCLAIMER_REGULATORIO =
  'Estimativa orientativa com base no score de maturidade BluePrint. Não constitui certificação ISO 42001, parecer jurídico nem avaliação de conformidade legal.';

export const CROSSWALK_DIMENSOES = [
  {
    codigoDimensao: 'D01',
    nomeDimensao: 'Estratégia e Liderança',
    scoreLimiar: 2.5,
    riscoNivelPadrao: 'ALTO',
    isoClausulas: ['5.1', '5.2', '5.3'],
    plArtigos: ['Art. 3º', 'Art. 20'],
    lgpdArtigos: [],
    logicaMapeamento:
      'Comprometimento da direção e política de IA alinhada à estratégia organizacional (ISO 42001 cl. 5).',
    textoIso: 'Liderança e política de gestão de IA — comprometimento, direção e alinhamento estratégico.',
    textoPl: 'Responsabilização e transparência na adoção de sistemas de IA (PL 2338).',
    textoLgpd: null
  },
  {
    codigoDimensao: 'D02',
    nomeDimensao: 'Dados e Tecnologia',
    scoreLimiar: 2.0,
    riscoNivelPadrao: 'ALTO',
    isoClausulas: ['8.3', '8.4'],
    plArtigos: ['Art. 7º', 'Art. 20'],
    lgpdArtigos: ['Art. 6º', 'Art. 46'],
    logicaMapeamento:
      'Design e desenvolvimento do sistema de IA, requisitos de dados e controles técnicos.',
    textoIso: 'Projeto e desenvolvimento de sistemas de IA; requisitos de dados e qualidade.',
    textoPl: 'Requisitos técnicos e documentação de sistemas de IA de alto impacto.',
    textoLgpd: 'Bases legais, minimização e medidas de segurança sobre dados usados em IA.'
  },
  {
    codigoDimensao: 'D03',
    nomeDimensao: 'Governança e Risco',
    scoreLimiar: 2.0,
    riscoNivelPadrao: 'CRITICO',
    isoClausulas: ['6.1', '8.2', '9.1'],
    plArtigos: ['Art. 3º', 'Art. 7º', 'Art. 20'],
    lgpdArtigos: ['Art. 6º', 'Art. 37', 'Art. 46'],
    logicaMapeamento:
      'Gestão de riscos de IA, avaliação de impacto e monitoramento — núcleo da governança ISO 42001.',
    textoIso: 'Ações para riscos e oportunidades; avaliação de impacto de IA; monitoramento.',
    textoPl: 'Avaliação de risco, mitigação e governança de sistemas de IA.',
    textoLgpd: 'Governança de dados pessoais, relatório de impacto (RIPD) e controles.'
  },
  {
    codigoDimensao: 'D04',
    nomeDimensao: 'Pessoas e Cultura',
    scoreLimiar: 2.5,
    riscoNivelPadrao: 'MEDIO',
    isoClausulas: ['7.1', '7.2', '7.3'],
    plArtigos: [],
    lgpdArtigos: ['Art. 39'],
    logicaMapeamento: 'Competência, conscientização e cultura de uso responsável de IA.',
    textoIso: 'Recursos, competência e conscientização para gestão de IA.',
    textoPl: null,
    textoLgpd: 'Capacitação e responsabilização de operadores de tratamento de dados.'
  },
  {
    codigoDimensao: 'D05',
    nomeDimensao: 'Operações e Processos',
    scoreLimiar: 2.5,
    riscoNivelPadrao: 'ALTO',
    isoClausulas: ['8.1', '8.5', '8.6'],
    plArtigos: ['Art. 7º'],
    lgpdArtigos: ['Art. 46'],
    logicaMapeamento: 'Operação, controle e melhoria contínua de sistemas de IA em produção.',
    textoIso: 'Planejamento operacional, controle de mudanças e melhoria de processos de IA.',
    textoPl: 'Obrigações operacionais e de documentação em sistemas de IA.',
    textoLgpd: 'Medidas técnicas e administrativas na operação de tratamentos com IA.'
  },
  {
    codigoDimensao: 'D06',
    nomeDimensao: 'Inovação e Experimentação',
    scoreLimiar: 2.5,
    riscoNivelPadrao: 'MEDIO',
    isoClausulas: ['8.3', '10.1'],
    plArtigos: ['Art. 3º'],
    lgpdArtigos: ['Art. 6º'],
    logicaMapeamento: 'Experimentação controlada e inovação com gestão de risco em pilotos de IA.',
    textoIso: 'Design/desenvolvimento e melhoria contínua em iniciativas experimentais de IA.',
    textoPl: 'Sandbox e avaliação de impacto em experimentos com IA.',
    textoLgpd: 'Tratamento de dados em fase de experimentação e PoCs.'
  },
  {
    codigoDimensao: 'D07',
    nomeDimensao: 'Valor de Negócio e ROI',
    scoreLimiar: 3.0,
    riscoNivelPadrao: 'MEDIO',
    isoClausulas: ['6.2', '9.1'],
    plArtigos: [],
    lgpdArtigos: [],
    logicaMapeamento: 'Objetivos de IA mensuráveis e monitoramento de valor (indireto para conformidade).',
    textoIso: 'Objetivos de IA e avaliação de desempenho do sistema de gestão.',
    textoPl: null,
    textoLgpd: null
  },
  {
    codigoDimensao: 'D08',
    nomeDimensao: 'Ecossistema e Parcerias',
    scoreLimiar: 2.5,
    riscoNivelPadrao: 'ALTO',
    isoClausulas: ['8.4'],
    plArtigos: ['Art. 20'],
    lgpdArtigos: ['Art. 41', 'Art. 42'],
    logicaMapeamento: 'Controle de fornecedores, APIs e terceiros que compõem cadeia de IA.',
    textoIso: 'Controle de processos, produtos e serviços fornecidos externamente (terceiros de IA).',
    textoPl: 'Responsabilidade solidária e cadeia de fornecimento em sistemas de IA.',
    textoLgpd: 'Operadores, subprocessadores e transferências internacionais de dados.'
  },
  {
    codigoDimensao: 'D09',
    nomeDimensao: 'Valor por Unidade de Negócio',
    scoreLimiar: 3.0,
    riscoNivelPadrao: 'MEDIO',
    isoClausulas: ['6.2'],
    plArtigos: [],
    lgpdArtigos: [],
    logicaMapeamento: 'Escopo de IA por unidade de negócio — referência indireta para priorização de conformidade.',
    textoIso: 'Objetivos de IA alinhados a unidades de negócio.',
    textoPl: null,
    textoLgpd: null
  },
  {
    codigoDimensao: 'D10',
    nomeDimensao: 'Talentos e Capacidades',
    scoreLimiar: 2.5,
    riscoNivelPadrao: 'MEDIO',
    isoClausulas: ['7.2'],
    plArtigos: [],
    lgpdArtigos: ['Art. 39'],
    logicaMapeamento: 'Competências técnicas e de governança para operar IA com segurança.',
    textoIso: 'Competência e treinamento para funções relacionadas à gestão de IA.',
    textoPl: null,
    textoLgpd: 'Capacitação de equipes que tratam dados pessoais em fluxos de IA.'
  },
  {
    codigoDimensao: 'D11',
    nomeDimensao: 'Conformidade Regulatória',
    scoreLimiar: 3.0,
    riscoNivelPadrao: 'CRITICO',
    isoClausulas: ['4.1', '4.2', '6.1', '8.2', '9.2', '10.2'],
    plArtigos: ['Art. 3º', 'Art. 7º', 'Art. 20'],
    lgpdArtigos: ['Art. 6º', 'Art. 37', 'Art. 46', 'Art. 48'],
    logicaMapeamento:
      'Proxy principal de conformidade regulatória geral — dimensão dedicada a requisitos legais e normativos.',
    textoIso: 'Requisitos legais, avaliação de conformidade, auditoria interna e melhoria.',
    textoPl: 'Obrigações transversais do marco brasileiro de IA (PL 2338).',
    textoLgpd: 'Conformidade LGPD, direitos do titular e comunicação de incidentes.'
  },
  {
    codigoDimensao: 'D12',
    nomeDimensao: 'Prontidão para Mudança',
    scoreLimiar: 2.5,
    riscoNivelPadrao: 'MEDIO',
    isoClausulas: ['10.1'],
    plArtigos: [],
    lgpdArtigos: [],
    logicaMapeamento: 'Capacidade de adaptar o sistema de gestão de IA a mudanças regulatórias.',
    textoIso: 'Melhoria contínua e adaptação do SGIA a mudanças de contexto.',
    textoPl: null,
    textoLgpd: null
  },
  {
    codigoDimensao: 'D13',
    nomeDimensao: 'Plataforma e Industrialização de IA',
    scoreLimiar: 2.0,
    riscoNivelPadrao: 'ALTO',
    isoClausulas: ['8.6', '8.5'],
    plArtigos: ['Art. 7º'],
    lgpdArtigos: ['Art. 46'],
    logicaMapeamento: 'MLOps, monitoramento em produção e controles de plataforma de IA.',
    textoIso: 'Controle de mudanças, monitoramento pós-implantação e operação de plataformas de IA.',
    textoPl: 'Requisitos de monitoramento e documentação em sistemas implantados.',
    textoLgpd: 'Segurança e rastreabilidade em pipelines de dados e modelos.'
  },
  {
    codigoDimensao: 'D14',
    nomeDimensao: 'IA como Gerador de Receita',
    scoreLimiar: 2.5,
    riscoNivelPadrao: 'MEDIO',
    isoClausulas: ['6.2', '9.1'],
    plArtigos: ['Art. 3º', 'Art. 20'],
    lgpdArtigos: ['Art. 7º', 'Art. 8º'],
    logicaMapeamento: 'Produtos de IA expostos ao mercado — transparência e responsabilidade comercial.',
    textoIso: 'Objetivos de IA e monitoramento de desempenho em produtos comercializados.',
    textoPl: 'Transparência e informação ao usuário em produtos de IA.',
    textoLgpd: 'Transparência no tratamento de dados em produtos digitais com IA.'
  },
  {
    codigoDimensao: 'D15',
    nomeDimensao: 'Maturidade por Tipo de IA',
    scoreLimiar: 2.0,
    riscoNivelPadrao: 'ALTO',
    isoClausulas: ['8.2', '8.3'],
    plArtigos: ['Art. 3º', 'Art. 7º'],
    lgpdArtigos: ['Art. 6º'],
    logicaMapeamento: 'Riscos específicos por tipo de IA (LLM, visão, autonomia, agentes).',
    textoIso: 'Avaliação de impacto e requisitos por categoria de sistema de IA.',
    textoPl: 'Classificação de risco por tipo e grau de autonomia do sistema.',
    textoLgpd: 'Bases legais e finalidade conforme o tipo de tratamento automatizado.'
  },
  {
    codigoDimensao: 'D16',
    nomeDimensao: 'Eficácia de IA (MIT CISR)',
    scoreLimiar: 2.0,
    riscoNivelPadrao: 'ALTO',
    isoClausulas: ['9.1', '9.2', '10.1'],
    plArtigos: [],
    lgpdArtigos: [],
    logicaMapeamento: 'Monitoramento, auditoria interna e melhoria da eficácia do programa de IA.',
    textoIso: 'Monitoramento, medição, análise, avaliação e melhoria contínua do SGIA.',
    textoPl: null,
    textoLgpd: null
  }
];

export const CROSSWALK_POR_CODIGO = new Map(
  CROSSWALK_DIMENSOES.map((item) => [item.codigoDimensao, item])
);

export const CROSSWALK_POR_NOME = new Map(
  CROSSWALK_DIMENSOES.map((item) => [item.nomeDimensao, item])
);

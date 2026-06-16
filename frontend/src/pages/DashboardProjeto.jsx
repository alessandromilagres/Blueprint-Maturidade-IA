import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
} from 'chart.js';
import { Radar, Bar, Doughnut } from 'react-chartjs-2';
import { Download, Building2, Users, ArrowLeft, ChevronRight, FileText, UserCheck, Target, TrendingUp, AlertTriangle, Lightbulb, BarChart3, Activity, DollarSign, GitBranch, Loader2, Moon, Sun, ChevronDown, FileCode, File, Printer, Sparkles, Brain, Zap } from 'lucide-react';
import { dashboardApi, exportarApi } from '../services/api';
import { downloadWordDocument, downloadExecutiveWordDocument, downloadUserReport } from '../utils/generateReport';
import { multiplicadorRoiPorFaturamento, percentualReferenciaRoi } from '../utils/roiPorFaturamento';
import { VERTICAIS } from './Projetos';
import { useTheme } from '../contexts/ThemeContext';
import { queryNivelMapeamentoMaturidade } from '../utils/filtroNivelMaturidade';
import { nivelNumericoDeScore } from '../utils/nivelMaturidadeRubrica.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement
);

const MIT_CISR_LEVELS = {
  1: {
    name: 'Nível 1: Inicial',
    nameEn: 'Initial / Experimenting',
    focus: 'Exploração e Educação',
    color: '#ef4444',
    bgColor: 'bg-red-500',
    description: 'Organização ainda está explorando o potencial da IA. Poucos ou nenhum projeto formal. Experimentos isolados conduzidos por entusiastas individuais.',
    descriptionExtended: 'Empresas neste nível tipicamente não possuem estratégia de IA documentada, dependem de iniciativas individuais e têm ROI não mensurado. A infraestrutura de dados é fragmentada e há baixa conscientização sobre IA na organização.',
    characteristics: [
      'Sem estratégia formal de IA',
      'Iniciativas isoladas e ad-hoc',
      'Falta de infraestrutura de dados',
      'Baixa conscientização sobre IA',
      'Orçamento não dedicado',
      'Dependência de entusiastas individuais',
      'ROI não mensurado'
    ],
    recommendations: [
      'Definir sponsor executivo para IA',
      'Identificar 2-3 casos de uso com ROI mensurável',
      'Criar inventário de dados disponíveis',
      'Iniciar programa de conscientização sobre IA'
    ],
    performance: { 
      growth: '-15% a -10%', 
      profit: 'Abaixo da média',
      roi: 'Negativo ou não mensurável',
      timeToValue: '> 24 meses'
    },
    percentage: '~25%',
    marketImpact: 'Empresas neste nível perdem competitividade para concorrentes mais maduros. Risco de disrupção por novos entrantes.'
  },
  2: {
    name: 'Nível 2: Oportunista',
    nameEn: 'Preparing / Experimenting',
    focus: 'Preparação e Experimentação',
    color: '#f59e0b',
    bgColor: 'bg-amber-500',
    description: 'Empresa começa a investir em IA de forma mais estruturada, com pilotos iniciais. Múltiplos projetos em andamento com sucessos pontuais.',
    descriptionExtended: 'Neste estágio, a organização já reconhece o valor da IA e iniciou investimentos. Há múltiplos projetos em andamento, mas o sucesso é variável e não replicável. A governança está emergindo e os talentos estão concentrados em poucos indivíduos.',
    characteristics: [
      'Educar a força de trabalho sobre IA',
      'Estabelecer políticas de uso aceitável',
      'Tornar dados mais acessíveis',
      'Primeiros experimentos formais',
      'Identificar onde humanos devem estar no loop',
      'Múltiplos projetos com sucesso variável',
      'ROI medido de forma inconsistente'
    ],
    recommendations: [
      'Documentar estratégia de IA formalmente',
      'Estabelecer governança básica de IA',
      'Criar centro de excelência (CoE) em IA',
      'Definir métricas padronizadas de sucesso',
      'Investir em capacitação da equipe'
    ],
    performance: { 
      growth: '-10% a -5%', 
      profit: 'Ligeiramente abaixo',
      roi: '50-100%',
      timeToValue: '12-18 meses'
    },
    percentage: '~30%',
    marketImpact: 'Crescimento 5-10% abaixo da média do setor. Concorrentes mais maduros ganham market share gradualmente.'
  },
  3: {
    name: 'Nível 3: Estruturado',
    nameEn: 'Building Pilots',
    focus: 'Casos de Negócio e Pilotos',
    color: '#3b82f6',
    bgColor: 'bg-blue-500',
    description: 'Pilotos em andamento com métricas definidas. Processos começam a ser automatizados. Estratégia documentada e governança definida.',
    descriptionExtended: 'A organização possui estratégia documentada, governança definida e processos de MLOps básicos. Métricas de sucesso são padronizadas e há talentos distribuídos em múltiplas equipes. Este é o ponto de inflexão onde o valor começa a ser gerado de forma consistente.',
    characteristics: [
      'Simplificar e automatizar processos',
      'Criar casos de uso com métricas',
      'Compartilhar dados via APIs',
      'Usar LLMs para aumentar o trabalho',
      'Estilo de gestão coach e comunicação',
      'MLOps básico implementado',
      'Métricas de sucesso padronizadas'
    ],
    recommendations: [
      'Integrar IA aos processos core de negócio',
      'Escalar soluções bem-sucedidas',
      'Estabelecer plataforma de dados unificada',
      'Criar programas de upskilling em IA',
      'Implementar MLOps avançado'
    ],
    performance: { 
      growth: '0% a +5%', 
      profit: 'Na média do setor',
      roi: '100-200%',
      timeToValue: '9-12 meses'
    },
    percentage: '~25%',
    marketImpact: 'Performance alinhada com o mercado. Início da aceleração de valor com IA.'
  },
  4: {
    name: 'Nível 4: Gerenciado',
    nameEn: 'Developing AI Ways of Working',
    focus: 'Escalar Plataformas e Dashboards',
    color: '#22c55e',
    bgColor: 'bg-green-500',
    description: 'IA integrada ao negócio com governança estabelecida e modelos em produção. Métricas consistentes e cultura de dados disseminada.',
    descriptionExtended: 'Neste nível, a IA está integrada a processos críticos de negócio. Métricas são consistentes, dashboards de valor estão em uso e a governança é avançada. A cultura de dados está disseminada e parcerias estratégicas estão estabelecidas.',
    characteristics: [
      'Expandir automação de processos',
      'Cultura test-and-learn estabelecida',
      'Arquitetar para reuso',
      'Incorporar modelos pré-treinados',
      'Explorar agentes autônomos',
      'Governança avançada e compliance',
      'Dashboards de valor em produção'
    ],
    recommendations: [
      'Experimentar com Multi-Agent Systems',
      'Criar produtos IA-First',
      'Monetizar capacidades de IA',
      'Estabelecer parcerias estratégicas de IA',
      'Preparar para transformação agêntica'
    ],
    performance: { 
      growth: '+5% a +15%', 
      profit: 'Acima da média',
      roi: '200-400%',
      timeToValue: '6-9 meses'
    },
    percentage: '~15%',
    marketImpact: 'Vantagem competitiva sustentável. Crescimento acima do mercado e margens superiores.'
  },
  5: {
    name: 'Nível 5: Otimizado',
    nameEn: 'AI Future Ready',
    focus: 'Inovação Contínua e Novas Receitas',
    color: '#8b5cf6',
    bgColor: 'bg-purple-500',
    description: 'IA como diferencial competitivo central, com inovação contínua e monetização de capacidades. Liderança reconhecida no setor.',
    descriptionExtended: 'Organizações otimizadas têm IA como diferencial competitivo central. Há inovação contínua, antecipação de tendências e cultura de experimentação pervasiva. A empresa é referência no setor e contribui para o ecossistema de IA.',
    characteristics: [
      'IA embarcada em decisões e processos',
      'Criar e vender serviços aumentados por IA',
      'Combinar IA tradicional, generativa e agêntica',
      'Proprietary AI como vantagem competitiva',
      'Liderança de inovação no setor',
      'Contribuição para comunidade e ecossistema',
      'Multi-Agent Systems em produção'
    ],
    recommendations: [
      'Manter liderança através de inovação radical',
      'Expandir para novos mercados com IA',
      'Criar spin-offs de tecnologia',
      'Investir em pesquisa de IA de fronteira',
      'Desenvolver IA proprietária diferenciada'
    ],
    performance: { 
      growth: '+15% ou mais', 
      profit: 'Significativamente acima',
      roi: '400-800%+',
      timeToValue: '3-6 meses'
    },
    percentage: '~5%',
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
  },
  servicos: {
    causas: {
      1: ['Atendimento manual e fragmentado', 'Sistemas de ticketing legados', 'Falta de base de conhecimento estruturada'],
      2: ['Dificuldade em escalar atendimento', 'Turnover alto de atendentes', 'Métricas de qualidade inconsistentes'],
      3: ['Demanda por atendimento 24/7', 'Pressão por redução de custos', 'Expectativa de resolução imediata'],
      4: ['Domínio de agentes conversacionais', 'Base de conhecimento inteligente', 'Cultura de automação'],
      5: ['Liderança em CX automatizado', 'Atendimento proativo', 'IA como diferencial de serviço']
    },
    efeitos: {
      1: ['Tempo de espera elevado', 'NPS abaixo da média', 'Custos operacionais altos'],
      2: ['Primeiros chatbots em produção', 'Triagem automatizada', 'Redução inicial de volume'],
      3: ['Atendimento omnichannel integrado', 'Resolução automática de 50%+', 'NPS em crescimento'],
      4: ['Liderança em atendimento digital', 'Custos otimizados', 'Experiência diferenciada'],
      5: ['Referência em BPO inteligente', 'Atendimento proativo e preditivo', 'Novos modelos de serviço']
    }
  },
  logistica: {
    causas: {
      1: ['Planejamento manual de rotas', 'Visibilidade limitada da cadeia', 'Sistemas legados não integrados'],
      2: ['Dificuldade em prever demanda', 'Gestão de estoque reativa', 'Rastreamento básico'],
      3: ['Demanda por entregas mais rápidas', 'Pressão por redução de custos', 'Complexidade de last mile'],
      4: ['Domínio de otimização logística', 'Torre de controle inteligente', 'Cultura de dados em operações'],
      5: ['Liderança em supply chain digital', 'Logística autônoma', 'Sustentabilidade como diferencial']
    },
    efeitos: {
      1: ['Custos logísticos acima da média', 'OTIF abaixo do esperado', 'Perdas e rupturas frequentes'],
      2: ['Primeiras otimizações de rota', 'Previsão de demanda inicial', 'Visibilidade básica'],
      3: ['Rotas otimizadas em tempo real', 'Previsão de demanda precisa', 'Gestão de estoque inteligente'],
      4: ['Liderança em logística digital', 'OTIF best-in-class', 'Custos otimizados'],
      5: ['Referência em supply chain', 'Operações autônomas', 'Logística como serviço']
    }
  },
  mobilidade: {
    causas: {
      1: ['Controle de acesso manual', 'Falta de dados de ocupação', 'Sistemas de pagamento básicos'],
      2: ['Dificuldade em prever demanda', 'Gestão de vagas ineficiente', 'Experiência do usuário fragmentada'],
      3: ['Demanda por smart parking', 'Pressão por otimização de ativos', 'Expectativa de experiência digital'],
      4: ['Domínio de IoT e sensores', 'Pricing dinâmico em produção', 'Cultura de inovação urbana'],
      5: ['Liderança em mobilidade urbana', 'Operações autônomas', 'Ecossistema de smart city']
    },
    efeitos: {
      1: ['Baixo giro de vagas', 'Experiência do usuário ruim', 'Receita por m² subótima'],
      2: ['Primeiros sensores instalados', 'App de pagamento básico', 'Monitoramento inicial'],
      3: ['Ocupação em tempo real', 'Pricing dinâmico', 'Experiência digital integrada'],
      4: ['Liderança em smart parking', 'Giro de vagas otimizado', 'Novos serviços de mobilidade'],
      5: ['Referência em smart cities', 'Operações totalmente autônomas', 'Ecossistema integrado de mobilidade']
    }
  }
};

function getMaturityLevelFromScore(score) {
  return nivelNumericoDeScore(score);
}

const categoriasAgrupadas = {
  'ESTRATÉGIA': ['Estratégia e Liderança'],
  'PLANEJAMENTO': ['Valor de Negócio e ROI'],
  'EXECUÇÃO': ['Dados e Tecnologia', 'Operações e Processos', 'Inovação e Experimentação'],
  'PESSOAS': ['Pessoas e Cultura'],
  'GOVERNANÇA': ['Governança e Risco', 'Ecossistema e Parcerias'],
};

// Benchmarking por Vertical
const BENCHMARKING_POR_VERTICAL = {
  fintech: { mediaSetor: 3.2, top25: 4.1, bottom25: 2.1 },
  saude: { mediaSetor: 2.6, top25: 3.5, bottom25: 1.8 },
  tecnologia: { mediaSetor: 3.5, top25: 4.4, bottom25: 2.5 },
  ecommerce: { mediaSetor: 3.1, top25: 4.0, bottom25: 2.0 },
  manufatura: { mediaSetor: 2.4, top25: 3.3, bottom25: 1.6 },
  legaltech: { mediaSetor: 2.3, top25: 3.2, bottom25: 1.5 },
  edtech: { mediaSetor: 2.8, top25: 3.7, bottom25: 1.9 },
  aifirst: { mediaSetor: 3.8, top25: 4.6, bottom25: 2.8 },
  agrovert: { mediaSetor: 2.2, top25: 3.1, bottom25: 1.4 },
  servicos: { mediaSetor: 2.5, top25: 3.4, bottom25: 1.7 },
  logistica: { mediaSetor: 2.7, top25: 3.6, bottom25: 1.8 },
  mobilidade: { mediaSetor: 2.4, top25: 3.3, bottom25: 1.5 }
};

// Projeção Financeira por Nível
const PROJECAO_FINANCEIRA = {
  1: { crescimento: '-2%', custos: '-2%', roi: '0%', tempo: '18-24m' },
  2: { crescimento: '+2%', custos: '-5%', roi: '100%', tempo: '12-18m' },
  3: { crescimento: '+6%', custos: '-10%', roi: '200%', tempo: '9-12m' },
  4: { crescimento: '+12%', custos: '-18%', roi: '400%', tempo: '6-9m' },
  5: { crescimento: '+22%', custos: '-28%', roi: '700%', tempo: '3-6m' }
};

// Indicadores de Saúde
const INDICADORES_SAUDE = {
  estrategia: { nome: 'Saúde Estratégica', areas: [1], thresholds: { critico: 2.0, atencao: 3.0, saudavel: 4.0 } },
  execucao: { nome: 'Saúde de Execução', areas: [2, 5], thresholds: { critico: 1.8, atencao: 2.8, saudavel: 3.8 } },
  pessoas: { nome: 'Saúde de Pessoas', areas: [4], thresholds: { critico: 2.0, atencao: 3.0, saudavel: 4.0 } },
  governanca: { nome: 'Saúde de Governança', areas: [3], thresholds: { critico: 1.8, atencao: 2.8, saudavel: 3.8 } },
  valor: { nome: 'Saúde de Valor', areas: [7], thresholds: { critico: 1.8, atencao: 2.8, saudavel: 3.8 } }
};

export default function DashboardProjeto() {
  const { id } = useParams();
  const location = useLocation();
  const versaoIdSelecionada = new URLSearchParams(location.search).get('versaoId');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroNivelMapeamentoMaturidade, setFiltroNivelMapeamentoMaturidade] = useState(3);
  const [selectedArea, setSelectedArea] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const exportMenuRef = useRef(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleDownloadReport(format) {
    setExportMenuOpen(false);
    const projectName = dashboard.projeto.nome.replace(/\s+/g, '_');
    const versaoQ = dashboard.projetoVersao?.id ? `versaoId=${dashboard.projetoVersao.id}` : '';
    const projetoVersaoQ = dashboard.projetoVersao?.id ? `projetoVersaoId=${dashboard.projetoVersao.id}` : '';
    
    // RELATÓRIOS COMPLETOS
    if (format === 'word') {
      setGeneratingReport(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        downloadWordDocument(dashboard);
      } finally {
        setTimeout(() => setGeneratingReport(false), 500);
      }
    } else if (format === 'md') {
      await exportarApi.download(
        `${exportarApi.dashboard(id)}${versaoQ ? `?${versaoQ}` : ''}`,
        `Relatorio_Maturidade_Completo_${projectName}.md`
      );
    } else if (format === 'pdf') {
      window.print();
    }
    
    // RELATÓRIOS EXECUTIVOS
    else if (format === 'exec-word') {
      setGeneratingReport(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        downloadExecutiveWordDocument(dashboard);
      } finally {
        setTimeout(() => setGeneratingReport(false), 500);
      }
    } else if (format === 'exec-md') {
      await exportarApi.download(
        `/api/exportacao/executive/${id}${versaoQ ? `?${versaoQ}` : ''}`,
        `Relatorio_Executivo_IA_${projectName}.md`
      );
    } else if (format === 'exec-pdf') {
      window.open(`/relatorios/${id}/executivo${versaoQ ? `?${versaoQ}` : ''}`, '_blank');
    }
    
    // RELATÓRIOS GERADOS POR IA (validados pelo MIT) — usa o filtro já selecionado no dashboard
    else if (format === 'mit-ia') {
      const nivelQ = `${queryNivelMapeamentoMaturidade(filtroNivelMapeamentoMaturidade)}${projetoVersaoQ ? `&${projetoVersaoQ}` : ''}`;
      window.open(`/relatorios/${id}/mit-ia?${nivelQ}`, '_blank');
    } else if (format === 'mit-ia-completo') {
      const nivelQ = `${queryNivelMapeamentoMaturidade(filtroNivelMapeamentoMaturidade)}${projetoVersaoQ ? `&${projetoVersaoQ}` : ''}`;
      window.open(`/relatorios/${id}/mit-ia-completo?${nivelQ}`, '_blank');
    } else if (format === 'mit-ia-completo-rapido') {
      const nivelQ = `${queryNivelMapeamentoMaturidade(filtroNivelMapeamentoMaturidade)}${projetoVersaoQ ? `&${projetoVersaoQ}` : ''}`;
      window.open(`/relatorios/${id}/mit-ia-completo?modo=rapido&${nivelQ}`, '_blank');
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [id, filtroNivelMapeamentoMaturidade, versaoIdSelecionada]);

  async function loadDashboard() {
    try {
      setLoading(true);
      const data = await dashboardApi.projeto(id, {
        nivelPrioridadeMapeamentoMaturidade: filtroNivelMapeamentoMaturidade,
        versaoId: versaoIdSelecionada
      });
      setDashboard(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Dashboard não encontrado</h2>
          <Link to="/projetos" className="text-blue-400 hover:underline mt-2 inline-block">
            Voltar para projetos
          </Link>
        </div>
      </div>
    );
  }

  const radarData = {
    labels: dashboard.scoresPorArea.map(a => a.area.split(' ')[0]),
    datasets: [{
      label: 'Maturidade',
      data: dashboard.scoresPorArea.map(a => a.score),
      backgroundColor: 'rgba(59, 130, 246, 0.3)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
    }],
  };

  const radarOptions = {
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: { stepSize: 1, color: '#94a3b8' },
        pointLabels: { font: { size: 10 }, color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.2)' },
        angleLines: { color: 'rgba(148, 163, 184, 0.2)' },
      },
    },
    plugins: { legend: { display: false } },
    maintainAspectRatio: true,
  };

  const barData = {
    labels: dashboard.scoresPorEtapa.slice(0, 12).map(e => e.etapa.substring(0, 20)),
    datasets: [{
      label: 'Score',
      data: dashboard.scoresPorEtapa.slice(0, 12).map(e => e.score),
      backgroundColor: dashboard.scoresPorEtapa.slice(0, 12).map(e => 
        e.score >= 4 ? 'rgba(34, 197, 94, 0.8)' :
        e.score >= 3 ? 'rgba(59, 130, 246, 0.8)' :
        e.score >= 2 ? 'rgba(234, 179, 8, 0.8)' :
        'rgba(239, 68, 68, 0.8)'
      ),
      borderRadius: 4,
    }],
  };

  const barOptions = {
    indexAxis: 'y',
    scales: {
      x: { min: 0, max: 5, ticks: { stepSize: 1, color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
      y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
    },
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
  };

  const getScoreColor = (score) => {
    if (score >= 4) return 'text-green-400';
    if (score >= 3) return 'text-blue-400';
    if (score >= 2) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 4) return 'bg-green-500/20 border-green-500/30';
    if (score >= 3) return 'bg-blue-500/20 border-blue-500/30';
    if (score >= 2) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getCategoriasComScores = () => {
    const result = {};
    Object.entries(categoriasAgrupadas).forEach(([categoria, areas]) => {
      const areasComScore = dashboard.scoresPorArea.filter(a => areas.includes(a.area));
      if (areasComScore.length > 0) {
        const mediaCategoria = areasComScore.reduce((acc, a) => acc + a.score, 0) / areasComScore.length;
        result[categoria] = {
          score: parseFloat(mediaCategoria.toFixed(1)),
          areas: areasComScore
        };
      }
    });
    return result;
  };

  const categoriasComScores = getCategoriasComScores();
  const planoAcao = dashboard.planoAcao || [];
  const resumoComentarios = dashboard.resumoComentarios || { totalComentarios: 0, areas: [] };
  const comparativoAvaliacoes = dashboard.comparativoAvaliacoes || {};
  const prazoAvaliacao = dashboard.prazoAvaliacao || {};
  const prazoLabel = {
    sem_prazo: 'Sem prazo definido',
    atrasado: 'Atrasado',
    vence_em_breve: 'Vence em breve',
    no_prazo: 'No prazo'
  }[prazoAvaliacao.status] || 'Sem prazo definido';
  const prazoColor = {
    sem_prazo: 'text-slate-300 border-slate-600 bg-slate-700/40',
    atrasado: 'text-red-200 border-red-500/40 bg-red-500/15',
    vence_em_breve: 'text-amber-200 border-amber-500/40 bg-amber-500/15',
    no_prazo: 'text-emerald-200 border-emerald-500/40 bg-emerald-500/15'
  }[prazoAvaliacao.status] || 'text-slate-300 border-slate-600 bg-slate-700/40';

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <Link to="/projetos" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-3">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <span className="text-white font-semibold block text-sm">SysMap</span>
              <span className="text-blue-400 text-xs">Blueprint IA</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-slate-700">
          <Link 
            to={`/dashboard/projeto/${id}`}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg text-sm font-medium"
          >
            Dashboard
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {Object.entries(categoriasComScores).map(([categoria, data]) => (
            <div key={categoria} className="mb-4">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {categoria}
              </div>
              {data.areas.map((area, idx) => (
                <button
                  key={area.areaId}
                  onClick={() => setSelectedArea(selectedArea === area.areaId ? null : area.areaId)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedArea === area.areaId 
                      ? 'bg-slate-700 text-white' 
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center text-xs">
                      {idx + 1}.
                    </span>
                    <span className="truncate">{area.area.split(' ').slice(0, 2).join(' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${getScoreColor(area.score)}`}>
                      {area.score.toFixed(1)}
                    </span>
                    <div className={`w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden`}>
                      <div 
                        className={`h-full rounded-full ${
                          area.score >= 4 ? 'bg-green-500' :
                          area.score >= 3 ? 'bg-blue-500' :
                          area.score >= 2 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(area.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-500">
            {dashboard.totalAvaliadores} avaliador(es)
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-slate-400" />
              <span className="text-white font-medium">{dashboard.empresa.nome}</span>
              <ChevronRight className="w-4 h-4 text-slate-600" />
              <span className="text-slate-400">{dashboard.projeto.nome}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${dashboard.progresso}%` }}
                  />
                </div>
                <span className="text-white text-sm">{dashboard.progresso}%</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(dashboard.scoreGeral)} ${getScoreColor(dashboard.scoreGeral)} border`}>
                {dashboard.scoreGeral.toFixed(1)} {dashboard.classificacao}
              </span>
              {/* Dropdown de Exportação do Relatório */}
              <div className="relative" ref={exportMenuRef}>
                <button 
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  disabled={generatingReport}
                  className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-all ${
                    generatingReport 
                      ? 'bg-green-700 cursor-wait' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
                  }`}
                >
                  {generatingReport ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  {generatingReport ? 'Gerando...' : 'Relatório de Maturidade'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {exportMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-[80vh] overflow-y-auto">
                    {/* SEÇÃO: Relatório Completo */}
                    <div className="px-4 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-slate-700">
                      <p className="text-xs text-blue-300 uppercase tracking-wider font-semibold flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        Relatório Completo de Maturidade
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">16 seções + apêndices metodológicos</p>
                    </div>
                    
                    <button
                      onClick={() => handleDownloadReport('word')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-700 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <File className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Word Completo</p>
                        <p className="text-[10px] text-slate-400">Documento técnico detalhado</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleDownloadReport('md')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-700 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <FileCode className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Markdown Completo</p>
                        <p className="text-[10px] text-slate-400">Formato .md para desenvolvedores</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleDownloadReport('pdf')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-700 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <Printer className="w-3.5 h-3.5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">PDF Completo</p>
                        <p className="text-[10px] text-slate-400">Imprimir ou salvar como PDF</p>
                      </div>
                    </button>
                    
                    {/* SEÇÃO: Relatório Executivo */}
                    <div className="px-4 py-2 bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-t border-b border-slate-700 mt-1">
                      <p className="text-xs text-amber-300 uppercase tracking-wider font-semibold flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        Relatório Executivo (C-Level)
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Resumo estratégico para liderança</p>
                    </div>
                    
                    <button
                      onClick={() => handleDownloadReport('exec-word')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-700 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <File className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Word Executivo</p>
                        <p className="text-[10px] text-slate-400">Visão geral para decisores</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleDownloadReport('exec-md')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-700 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <FileCode className="w-3.5 h-3.5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Markdown Executivo</p>
                        <p className="text-[10px] text-slate-400">Formato .md resumido</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleDownloadReport('exec-pdf')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-700 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center">
                        <Printer className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">PDF Executivo</p>
                        <p className="text-[10px] text-slate-400">Abre página de impressão</p>
                      </div>
                    </button>

                    {/* SEÇÃO: Relatórios IA validados pelo MIT */}
                    <div className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-emerald-600/20 border-t border-b border-slate-700 mt-1">
                      <p className="text-xs text-purple-300 uppercase tracking-wider font-semibold flex items-center gap-2">
                        <Brain className="w-3 h-3" />
                        Relatórios IA · MIT CISR
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Gerados pela IA com metodologia MIT CISR</p>
                    </div>

                    <button
                      onClick={() => handleDownloadReport('mit-ia')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-700 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/30 to-fuchsia-500/30 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">Estratégico C-Level (IA)</p>
                        <p className="text-[10px] text-slate-400">Resumo executivo · 5 seções · ~30-60s</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDownloadReport('mit-ia-completo')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-700 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center">
                        <Brain className="w-3.5 h-3.5 text-emerald-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">Book de Trabalho Completo (IA)</p>
                        <p className="text-[10px] text-slate-400">Profundo · 1 chamada/dimensão + blocos · típico 1h+</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDownloadReport('mit-ia-completo-rapido')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-700 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/25 to-teal-500/30 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">Book modo rápido (IA)</p>
                        <p className="text-[10px] text-slate-400">Mesma estrutura enxuta · meta típica até ~30 min</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm border-t border-slate-700/80 pt-3">
            <span className="text-slate-400 shrink-0">Prioridade no consolidado de maturidade:</span>
            <select
              value={filtroNivelMapeamentoMaturidade}
              onChange={(e) => setFiltroNivelMapeamentoMaturidade(parseInt(e.target.value, 10))}
              className="bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-sm max-w-xl"
            >
              <option value={1}>Até nível 1 (somente avaliadores cadastrados como prioridade 1)</option>
              <option value={2}>Até nível 2 (prioridades 1 e 2)</option>
              <option value={3}>Até nível 3 (prioridades 1, 2 e 3 — padrão)</option>
            </select>
            <span className="text-xs text-slate-500">
              Defina o nível de cada usuário em Usuários. Fora do filtro, a avaliação finalizada não entra neste
              consolidado.
            </span>
            <button
              type="button"
              onClick={() => handleDownloadReport('mit-ia-completo')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/25"
              title="Abre o Book completo com o filtro de prioridade selecionado"
            >
              <Brain className="h-3.5 w-3.5" />
              Abrir Book completo
            </button>
            <button
              type="button"
              onClick={() => handleDownloadReport('mit-ia-completo-rapido')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-amber-500/25"
              title="Abre o Book modo rápido com o filtro de prioridade selecionado"
            >
              <Zap className="h-3.5 w-3.5" />
              Abrir Book rápido
            </button>
          </div>
        </header>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">
              Blueprint Estratégico de IA — Dashboard
            </h1>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-medium border border-blue-500/30">
              SysMap Solutions
            </span>
            {dashboard.projetoVersao && (
              <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/15 text-emerald-200 px-2 py-1 rounded-full font-medium border border-emerald-500/30">
                <GitBranch className="h-3 w-3" />
                {dashboard.projetoVersao.titulo} · {dashboard.projetoVersao.status}
              </span>
            )}
            <Link
              to={`/dashboard/projeto/${id}/plano-acao${dashboard.projetoVersao?.id ? `?versaoId=${dashboard.projetoVersao.id}` : ''}`}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/25"
            >
              <Lightbulb className="h-4 w-4" />
              Plano de ação
            </Link>
            <Link
              to={`/dashboard/projeto/${id}/evolucao`}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/15 px-3 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/25"
            >
              <TrendingUp className="h-4 w-4" />
              Evolução
            </Link>
          </div>
          <p className="text-slate-400 mb-6">{dashboard.projeto.nome}</p>

          {/* Score Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Score Geral</div>
              <div className={`text-3xl font-bold ${getScoreColor(dashboard.scoreGeral)}`}>
                {dashboard.scoreGeral.toFixed(1)}
              </div>
              <div className="text-slate-500 text-sm">/5.0</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Classificação</div>
              <div className={`text-2xl font-bold ${getScoreColor(dashboard.scoreGeral)}`}>
                {dashboard.classificacao}
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Progresso</div>
              <div className="text-3xl font-bold text-white">
                {dashboard.progresso}%
              </div>
              <div className="text-slate-500 text-sm">respondido</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Etapas Avaliadas</div>
              <div className="text-3xl font-bold text-white">
                {dashboard.etapasAvaliadas}
              </div>
              <div className="text-slate-500 text-sm">de {dashboard.totalEtapas}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
            <div className={`rounded-xl border p-4 ${prazoColor}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider opacity-75">Prazo da avaliação</div>
                  <div className="mt-1 text-xl font-bold">{prazoLabel}</div>
                  <p className="mt-1 text-sm opacity-80">
                    {prazoAvaliacao.dataLimite
                      ? `Data limite: ${new Date(`${prazoAvaliacao.dataLimite}T12:00:00`).toLocaleDateString('pt-BR')}`
                      : `Sugestão: ${prazoAvaliacao.prazoSugerido || 'definir na descrição do projeto'}`}
                  </p>
                </div>
                <Activity className="w-5 h-5 opacity-80" />
              </div>
              {prazoAvaliacao.diasRestantes != null && (
                <p className="mt-3 text-xs opacity-75">
                  {prazoAvaliacao.diasRestantes >= 0
                    ? `${prazoAvaliacao.diasRestantes} dia(s) restante(s)`
                    : `${Math.abs(prazoAvaliacao.diasRestantes)} dia(s) em atraso`}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-blue-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-blue-300">Evolução entre avaliações</div>
                  <div className="mt-1 text-xl font-bold">
                    {comparativoAvaliacoes.disponivel
                      ? `${comparativoAvaliacoes.delta > 0 ? '+' : ''}${comparativoAvaliacoes.delta?.toFixed?.(2) ?? comparativoAvaliacoes.delta}`
                      : 'Sem histórico suficiente'}
                  </div>
                  <p className="mt-1 text-sm text-blue-200">
                    {comparativoAvaliacoes.disponivel
                      ? `Tendência: ${comparativoAvaliacoes.tendencia}`
                      : comparativoAvaliacoes.mensagem}
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-blue-300" />
              </div>
            </div>

            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-purple-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-purple-300">Comentários dos avaliadores</div>
                  <div className="mt-1 text-xl font-bold">{resumoComentarios.totalComentarios}</div>
                  <p className="mt-1 text-sm text-purple-200">
                    {resumoComentarios.totalComentarios > 0
                      ? 'Resumo gerado por regras locais, sem API externa.'
                      : 'Nenhum comentário textual registrado.'}
                  </p>
                </div>
                <FileText className="w-5 h-5 text-purple-300" />
              </div>
            </div>
          </div>

          {(planoAcao.length > 0 || resumoComentarios.areas.length > 0) && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              {planoAcao.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                    Plano de ação automático por dimensão
                  </h3>
                  <div className="space-y-4">
                    {planoAcao.slice(0, 4).map((item) => (
                      <div key={item.areaId} className="rounded-lg bg-slate-700/50 p-4 border border-slate-600/60">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">{item.area}</p>
                            <p className="text-xs text-slate-400">
                              Score {Number(item.score).toFixed(1)} · Responsável: {item.responsavelSugerido}
                            </p>
                          </div>
                          <span className="rounded-full bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-200">
                            {item.criticidade}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase text-slate-400">30 dias</p>
                            <ul className="mt-1 space-y-1 text-sm text-slate-300">
                              {item.acoes30Dias.slice(0, 2).map((acao) => <li key={acao}>- {acao}</li>)}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase text-slate-400">90 dias</p>
                            <ul className="mt-1 space-y-1 text-sm text-slate-300">
                              {item.acoes90Dias.slice(0, 2).map((acao) => <li key={acao}>- {acao}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resumoComentarios.areas.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Resumo inteligente dos comentários
                  </h3>
                  <div className="space-y-4">
                    {resumoComentarios.areas.map((area) => (
                      <div key={area.area} className="rounded-lg bg-slate-700/50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-white">{area.area}</p>
                          <span className="text-xs text-slate-400">{area.totalComentarios} comentário(s)</span>
                        </div>
                        {area.temas.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {area.temas.map((tema) => (
                              <span key={tema} className="rounded-full bg-purple-500/15 px-2 py-1 text-xs text-purple-200">
                                {tema}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="mt-2 line-clamp-2 text-sm text-slate-300">
                          {area.exemplos[0]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Category Scores */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {Object.entries(categoriasComScores).map(([categoria, data]) => (
              <div key={categoria} className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">{categoria}</div>
                <div className={`text-3xl font-bold ${getScoreColor(data.score)}`}>
                  {data.score.toFixed(1)}
                </div>
              </div>
            ))}
          </div>

          {/* MIT CISR Maturity Level */}
          {(() => {
            const currentLevel = getMaturityLevelFromScore(dashboard.scoreGeral);
            const levelInfo = MIT_CISR_LEVELS[currentLevel];
            const vertical = dashboard.projeto?.vertical;
            const verticalInfo = VERTICAIS.find(v => v.id === vertical);
            const causasEfeitos = vertical && CAUSAS_EFEITOS_POR_VERTICAL[vertical] 
              ? CAUSAS_EFEITOS_POR_VERTICAL[vertical] 
              : null;
            
            const gaugeData = {
              datasets: [{
                data: [dashboard.scoreGeral, 5 - dashboard.scoreGeral],
                backgroundColor: [levelInfo.color, 'rgba(148, 163, 184, 0.2)'],
                borderWidth: 0,
                circumference: 180,
                rotation: 270,
              }]
            };
            
            const gaugeOptions = {
              plugins: { legend: { display: false }, tooltip: { enabled: false } },
              cutout: '75%',
              maintainAspectRatio: false,
            };

            return (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-blue-400" />
                  <h3 className="text-white font-semibold">
                    Maturidade em IA — referência MIT CISR (4 estágios) + escala operacional Blueprint (1–5)
                  </h3>
                  {verticalInfo && (
                    <span className={`ml-auto text-xs px-2 py-1 rounded-full bg-slate-700 ${verticalInfo.color} flex items-center gap-1`}>
                      <verticalInfo.icon className="w-3 h-3" />
                      {verticalInfo.nome}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  {/* Gauge Chart */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-48 h-28">
                      <Doughnut data={gaugeData} options={gaugeOptions} />
                      <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                        <span className={`text-4xl font-bold`} style={{ color: levelInfo.color }}>
                          {dashboard.scoreGeral.toFixed(1)}
                        </span>
                        <span className="text-slate-400 text-xs">de 5.0</span>
                      </div>
                    </div>
                    <div className="text-center mt-4">
                      <div className={`text-lg font-bold`} style={{ color: levelInfo.color }}>
                        {levelInfo.name}
                      </div>
                      <div className="text-slate-400 text-sm mt-1">{levelInfo.focus}</div>
                      <div className="text-slate-500 text-xs mt-2">
                        {levelInfo.percentage} das empresas estão neste nível
                      </div>
                    </div>
                  </div>

                  {/* Level Legend - All 5 Levels */}
                  <div className="col-span-2">
                    <h4 className="text-slate-300 text-sm font-medium mb-3">Escala de Maturidade em IA (1-5)</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(MIT_CISR_LEVELS).map(([level, info]) => (
                        <div 
                          key={level} 
                          className={`p-3 rounded-lg border transition-all ${
                            parseInt(level) === currentLevel 
                              ? 'border-2 bg-slate-700/50' 
                              : 'border-slate-600/50 opacity-60 hover:opacity-80'
                          }`}
                          style={{ borderColor: parseInt(level) === currentLevel ? info.color : undefined }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${info.bgColor} flex items-center justify-center flex-shrink-0`}>
                              <span className="text-white font-bold text-sm">{level}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-white text-sm font-medium">{info.name}</span>
                                {parseInt(level) === currentLevel && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">Atual</span>
                                )}
                              </div>
                              <p className="text-slate-400 text-xs truncate">{info.description}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className={`text-xs ${info.performance.growth.includes('+') ? 'text-green-400' : info.performance.growth.includes('-') ? 'text-red-400' : 'text-slate-400'}`}>
                                Crescimento: {info.performance.growth}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-slate-500 text-xs mt-3 italic">
                      O modelo oficial MIT CISR descreve <strong>quatro estágios empresariais</strong> de maturidade em IA. Este painel usa uma <strong>escala 1–5</strong> SysMap Blueprint IA por dimensões, compatível com o relatório do projeto. Distribuições globais de empresas por estágio: MIT CISR 2022 Future Ready Survey (N=721) e 2025 Real-Time Business Survey (N=152); ver briefing de atualização em cisr.mit.edu (ago/2025).
                    </p>
                  </div>
                </div>

                {/* Descrição Detalhada e Performance do Nível */}
                <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Diagnóstico: {levelInfo.name}
                  </h4>
                  <p className="text-slate-300 text-sm mb-4">{levelInfo.descriptionExtended}</p>
                  
                  {/* Métricas de Performance */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                      <div className="text-xs text-slate-400 mb-1">Crescimento vs. Mercado</div>
                      <div className={`text-lg font-bold ${
                        levelInfo.performance.growth.includes('+') ? 'text-green-400' : 
                        levelInfo.performance.growth.includes('-') ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {levelInfo.performance.growth}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                      <div className="text-xs text-slate-400 mb-1">Lucratividade</div>
                      <div className="text-lg font-bold text-slate-200">{levelInfo.performance.profit}</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                      <div className="text-xs text-slate-400 mb-1">ROI Típico</div>
                      <div className="text-lg font-bold text-blue-400">{levelInfo.performance.roi}</div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                      <div className="text-xs text-slate-400 mb-1">Time to Value</div>
                      <div className="text-lg font-bold text-purple-400">{levelInfo.performance.timeToValue}</div>
                    </div>
                  </div>

                  {/* Impacto de Mercado */}
                  <div className="p-3 bg-slate-800/30 rounded-lg border-l-4 border-amber-500">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-amber-400 text-sm font-medium">Impacto Competitivo: </span>
                        <span className="text-slate-300 text-sm">{levelInfo.marketImpact}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Características do Nível Atual */}
                <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    Características do {levelInfo.name}
                  </h4>
                  <ul className="grid grid-cols-2 gap-2">
                    {levelInfo.characteristics.map((char, idx) => (
                      <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        {char}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recomendações para Evolução */}
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <h4 className="text-green-400 font-medium mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Recomendações para Evoluir ao Próximo Nível
                  </h4>
                  <ul className="grid grid-cols-2 gap-2">
                    {levelInfo.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Causas e Efeitos por Vertical */}
                {causasEfeitos && (
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <h4 className="text-red-400 font-medium mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Causas de estar no Nível {currentLevel} ({verticalInfo?.nome || 'Geral'})
                      </h4>
                      <ul className="space-y-2">
                        {(causasEfeitos.causas[currentLevel] || []).map((causa, idx) => (
                          <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                            <span className="text-red-400 mt-1">→</span>
                            {causa}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <h4 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Efeitos de estar no Nível {currentLevel} ({verticalInfo?.nome || 'Geral'})
                      </h4>
                      <ul className="space-y-2">
                        {(causasEfeitos.efeitos[currentLevel] || []).map((efeito, idx) => (
                          <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                            <span className="text-blue-400 mt-1">→</span>
                            {efeito}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Referência MIT CISR */}
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-slate-300 space-y-1">
                      <p>
                        <span className="font-medium text-blue-400">Referência:</span>{' '}
                        MIT CISR Enterprise AI Maturity Model — Weill, Woerner & Sebastian (Research Briefing, dez/2024); atualização Woerner et al. (ago/2025). Pesquisas citadas nos briefings incluem N=721 (2022) e N=152 (2025). Desempenho financeiro vs média da indústria varia por estágio; o maior salto típico reportado é ao escalar do estágio 2 para o 3.
                      </p>
                      <p>
                        <a href="https://cisr.mit.edu/publication/2024_1201_EnterpriseAIMaturityModel_WeillWoernerSebastian" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Building Enterprise AI Maturity (2024)</a>
                        {' · '}
                        <a href="https://cisr.mit.edu/publication/2025_0801_EnterpriseAIMaturityUpdate_WoernerSebastianWeillKaganer" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Grow Enterprise AI Maturity (2025)</a>
                        {' · '}
                        <a href="https://cisr.mit.edu/page/cisr-publication-copyright-policy" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:underline">Política de copyright MIT CISR</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Benchmarking Competitivo */}
          {(() => {
            const vertical = dashboard.projeto?.vertical;
            const benchmark = vertical ? BENCHMARKING_POR_VERTICAL[vertical] : null;
            const currentLevel = getMaturityLevelFromScore(dashboard.scoreGeral);
            const fatP = dashboard.projeto?.faturamentoAnualProjeto;
            let projecao = PROJECAO_FINANCEIRA[currentLevel];
            let hintFat = null;
            if (fatP != null && Number(fatP) > 0) {
              const m = multiplicadorRoiPorFaturamento(Number(fatP));
              const pct = percentualReferenciaRoi(Number(fatP));
              const raw = String(projecao.roi);
              const roiNum = raw.includes('+') ? 700 : (parseInt(raw.replace(/\D/g, ''), 10) || 0);
              const roiNew = Math.round(roiNum * m);
              projecao = {
                ...projecao,
                roi: raw.includes('+') ? `${roiNew}%+` : `${roiNew}%`,
                crescimento: `${Math.round(parseFloat(projecao.crescimento) * m)}%`,
                custos: `${Math.round(parseFloat(projecao.custos) * m)}%`
              };
              hintFat = `Calibração: ${pct}% ref. ROI · Faturamento anual projeto R$ ${Number(fatP).toLocaleString('pt-BR')}`;
            }
            
            if (!benchmark) return null;
            
            return (
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Benchmarking */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    <h3 className="text-white font-semibold">Benchmarking Competitivo</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className={`p-3 rounded-lg text-center ${dashboard.scoreGeral >= benchmark.mediaSetor ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                      <div className="text-xs text-slate-400 mb-1">Sua Empresa</div>
                      <div className={`text-2xl font-bold ${dashboard.scoreGeral >= benchmark.mediaSetor ? 'text-green-400' : 'text-red-400'}`}>
                        {dashboard.scoreGeral.toFixed(1)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/50 text-center">
                      <div className="text-xs text-slate-400 mb-1">Média Setor</div>
                      <div className="text-2xl font-bold text-blue-400">{benchmark.mediaSetor}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-700/50 text-center">
                      <div className="text-xs text-slate-400 mb-1">Top 25%</div>
                      <div className="text-2xl font-bold text-purple-400">{benchmark.top25}</div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${dashboard.scoreGeral >= benchmark.mediaSetor ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <p className={`text-sm ${dashboard.scoreGeral >= benchmark.mediaSetor ? 'text-green-400' : 'text-red-400'}`}>
                      {dashboard.scoreGeral >= benchmark.top25 
                        ? '✓ Você está entre os top 25% do setor!'
                        : dashboard.scoreGeral >= benchmark.mediaSetor 
                          ? `✓ Acima da média. Gap para top 25%: ${(benchmark.top25 - dashboard.scoreGeral).toFixed(1)} pontos`
                          : `⚠ ${(benchmark.mediaSetor - dashboard.scoreGeral).toFixed(1)} pontos abaixo da média do setor`
                      }
                    </p>
                  </div>
                </div>

                {/* Projeção Financeira */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <h3 className="text-white font-semibold">Projeção de Impacto Financeiro</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                      <div className="text-xs text-slate-400 mb-1">Crescimento Receita</div>
                      <div className="text-xl font-bold text-green-400">{projecao.crescimento}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                      <div className="text-xs text-slate-400 mb-1">Redução Custos</div>
                      <div className="text-xl font-bold text-blue-400">{projecao.custos}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                      <div className="text-xs text-slate-400 mb-1">ROI Esperado</div>
                      <div className="text-xl font-bold text-yellow-400">{projecao.roi}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
                      <div className="text-xs text-slate-400 mb-1">Tempo p/ ROI</div>
                      <div className="text-xl font-bold text-purple-400">{projecao.tempo}</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-500 text-center">
                    Baseado no Nível {currentLevel} de maturidade
                  </div>
                  {hintFat && (
                    <p className="text-[10px] text-slate-400 text-center mt-2">{hintFat}</p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Indicadores de Saúde */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="text-white font-semibold">Indicadores de Saúde da Iniciativa de IA</h3>
            </div>
            
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(INDICADORES_SAUDE).map(([key, indicador]) => {
                const scoresRelacionados = dashboard.scoresPorArea?.filter(a => indicador.areas.includes(a.areaId)) || [];
                const scoreMedia = scoresRelacionados.length > 0 
                  ? scoresRelacionados.reduce((acc, a) => acc + a.score, 0) / scoresRelacionados.length 
                  : 0;
                const status = scoreMedia >= indicador.thresholds.saudavel ? 'saudavel' 
                  : scoreMedia >= indicador.thresholds.atencao ? 'atencao' 
                  : 'critico';
                const statusConfig = {
                  saudavel: { cor: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', emoji: '✓' },
                  atencao: { cor: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', emoji: '⚠' },
                  critico: { cor: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', emoji: '✗' }
                };
                
                return (
                  <div key={key} className={`p-3 rounded-lg ${statusConfig[status].bg} border ${statusConfig[status].border} text-center`}>
                    <div className="text-lg mb-1">{statusConfig[status].emoji}</div>
                    <div className="text-xs text-slate-400 mb-1">{indicador.nome}</div>
                    <div className={`text-xl font-bold ${statusConfig[status].cor}`}>
                      {scoreMedia.toFixed(1)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Eficácia MIT CISR - 3 Dimensões */}
          {dashboard.mitCISR && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Eficácia Total de IA — MIT CISR</h3>
                <span className="ml-auto text-xs text-slate-400">
                  Total AI Effectiveness: {dashboard.mitCISR.eficacia?.totalAIEffectiveness?.toFixed(1) || 0}%
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-4">
                {/* Eficácia em Operações */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="text-xs text-slate-400 mb-2">Eficácia em OPERAÇÕES</div>
                  <div className="text-3xl font-bold text-blue-400">
                    {dashboard.mitCISR.eficacia?.eficaciaOperacoes?.toFixed(1) || 0}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {dashboard.mitCISR.eficacia?.eficaciaOperacoesPercent?.toFixed(0) || 0}% efetividade
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(dashboard.mitCISR.eficacia?.eficaciaOperacoesPercent || 0)}%` }}
                    />
                  </div>
                </div>
                
                {/* Eficácia em Experiência do Cliente */}
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="text-xs text-slate-400 mb-2">Eficácia em CLIENTE</div>
                  <div className="text-3xl font-bold text-green-400">
                    {dashboard.mitCISR.eficacia?.eficaciaCliente?.toFixed(1) || 0}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {dashboard.mitCISR.eficacia?.eficaciaClientePercent?.toFixed(0) || 0}% efetividade
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(dashboard.mitCISR.eficacia?.eficaciaClientePercent || 0)}%` }}
                    />
                  </div>
                </div>
                
                {/* Eficácia em Ecossistema */}
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="text-xs text-slate-400 mb-2">Eficácia em ECOSSISTEMA</div>
                  <div className="text-3xl font-bold text-purple-400">
                    {dashboard.mitCISR.eficacia?.eficaciaEcossistema?.toFixed(1) || 0}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {dashboard.mitCISR.eficacia?.eficaciaEcossistemaPercent?.toFixed(0) || 0}% efetividade
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${(dashboard.mitCISR.eficacia?.eficaciaEcossistemaPercent || 0)}%` }}
                    />
                  </div>
                </div>
                
                {/* Estágio MIT (4 estágios oficiais; inferido a partir do score médio) */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="text-xs text-slate-400 mb-2">ESTÁGIO MIT CISR (1–4)</div>
                  <div className="text-3xl font-bold text-amber-400">
                    {dashboard.mitCISR.estagio?.estagio || '-'}
                  </div>
                  <div className="text-xs text-amber-300 mt-1 font-medium leading-snug">
                    {dashboard.mitCISR.estagio?.nome || '-'}
                  </div>
                  {dashboard.mitCISR.estagio?.nomePt && (
                    <div className="text-[11px] text-slate-400 mt-0.5">{dashboard.mitCISR.estagio.nomePt}</div>
                  )}
                  <div className="text-[11px] text-slate-500 mt-2">
                    Alinhamento por score (proxy 0–100%):{' '}
                    <strong className="text-slate-300">
                      {dashboard.mitCISR.estagio?.totalAIEffectivenessPercent ?? '—'}%
                    </strong>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    % empresas no mesmo estágio (pesquisa MIT 2025):{' '}
                    <strong>{dashboard.mitCISR.estagio?.percentualEmpresas2025 ?? '—'}%</strong>
                    {dashboard.mitCISR.estagio?.percentualEmpresas2022 != null && (
                      <span> (2022: {dashboard.mitCISR.estagio.percentualEmpresas2022}%)</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Detalhes do Estágio */}
              {dashboard.mitCISR.estagio && (
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Foco Principal</div>
                      <div className="text-white text-sm">{dashboard.mitCISR.estagio.foco}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Performance Financeira Típica</div>
                      <div className="flex gap-4">
                        <span className={`text-sm ${dashboard.mitCISR.estagio.crescimento?.includes('+') ? 'text-green-400' : 'text-red-400'}`}>
                          Crescimento: {dashboard.mitCISR.estagio.crescimento}
                        </span>
                        <span className={`text-sm ${dashboard.mitCISR.estagio.lucro?.includes('+') ? 'text-green-400' : 'text-red-400'}`}>
                          Lucro: {dashboard.mitCISR.estagio.lucro}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    {dashboard.mitCISR.estagio.descricao}
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-xs text-slate-500 text-center space-y-1">
                <p>{dashboard.mitCISR.referencia?.fonte || 'MIT CISR Enterprise AI Maturity Model'}</p>
                <p className="italic">{dashboard.mitCISR.referencia?.notaAdaptacao}</p>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-white font-semibold mb-4">Radar de Maturidade</h3>
              <div className="aspect-square max-w-sm mx-auto">
                <Radar data={radarData} options={radarOptions} />
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-white font-semibold mb-4">Score por Etapa</h3>
              <div className="h-80">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>

          {/* Avaliadores */}
          {dashboard.avaliadores.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Avaliadores ({dashboard.totalAvaliadores})
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {dashboard.avaliadores.map((avaliador) => (
                  <div key={avaliador.id} className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-white font-medium">{avaliador.nome}</p>
                    <p className="text-slate-400 text-sm">{avaliador.email}</p>
                    <p className="text-slate-500 text-xs mt-2">
                      {avaliador.areasSelecionadas?.length || 0} áreas avaliadas
                    </p>
                    <div className="flex flex-col gap-2 mt-3">
                      <Link 
                        to={`/relatorios/${avaliador.avaliacaoId}`}
                        className="text-blue-400 text-sm hover:underline"
                      >
                        Ver avaliação individual
                      </Link>
                      <button
                        onClick={() => downloadUserReport({
                          nome: avaliador.nome,
                          email: avaliador.email,
                          areasSelecionadas: avaliador.areasSelecionadas,
                          dataAvaliacao: avaliador.dataAvaliacao || new Date(),
                          respostas: avaliador.respostas || []
                        }, dashboard)}
                        className="flex items-center gap-1.5 text-purple-400 text-sm hover:text-purple-300 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Exportar avaliação
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

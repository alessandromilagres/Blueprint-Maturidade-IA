import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { Download, Building2, FolderKanban, ArrowLeft, ChevronRight, FileText, Target, TrendingUp, AlertTriangle, Lightbulb, BookOpen, BarChart3, Activity, DollarSign, Loader2, Moon, Sun, Package, RefreshCw, Trophy, Sparkles } from 'lucide-react';
import { dashboardApi } from '../services/api';
import { downloadWordDocument } from '../utils/generateReport';
import { VERTICAIS } from './Projetos';
import { useTheme } from '../contexts/ThemeContext';

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
  }
};

function getMaturityLevelFromScore(score) {
  if (score < 1.5) return 1;
  if (score < 2.5) return 2;
  if (score < 3.5) return 3;
  if (score < 4.5) return 4;
  return 5;
}

const categoriasAgrupadas = {
  'ESTRATÉGIA': ['Estratégia e Liderança'],
  'PLANEJAMENTO': ['Valor de Negócio e ROI'],
  'EXECUÇÃO': ['Dados e Tecnologia', 'Operações e Processos', 'Inovação e Experimentação'],
  'PESSOAS': ['Pessoas e Cultura'],
  'GOVERNANÇA': ['Governança e Risco', 'Ecossistema e Parcerias'],
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
  estrategia: { nome: 'Estratégica', areas: [1], thresholds: { critico: 2.0, atencao: 3.0, saudavel: 4.0 } },
  execucao: { nome: 'Execução', areas: [2, 5], thresholds: { critico: 1.8, atencao: 2.8, saudavel: 3.8 } },
  pessoas: { nome: 'Pessoas', areas: [4], thresholds: { critico: 2.0, atencao: 3.0, saudavel: 4.0 } },
  governanca: { nome: 'Governança', areas: [3], thresholds: { critico: 1.8, atencao: 2.8, saudavel: 3.8 } },
  valor: { nome: 'Valor', areas: [7], thresholds: { critico: 1.8, atencao: 2.8, saudavel: 3.8 } }
};

export default function DashboardEmpresa() {
  const { id } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [prioridades, setPrioridades] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroNivelMapeamentoMaturidade, setFiltroNivelMapeamentoMaturidade] = useState(3);
  const [loadingPrioridades, setLoadingPrioridades] = useState(false);
  const [recalculando, setRecalculando] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();

  async function handleDownloadReport() {
    setGeneratingReport(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      downloadWordDocument(dashboard);
    } finally {
      setTimeout(() => setGeneratingReport(false), 500);
    }
  }

  useEffect(() => {
    loadPrioridades();
  }, [id]);

  useEffect(() => {
    loadDashboard();
  }, [id, filtroNivelMapeamentoMaturidade]);

  async function loadDashboard() {
    try {
      setLoading(true);
      const data = await dashboardApi.empresa(id, {
        nivelPrioridadeMapeamentoMaturidade: filtroNivelMapeamentoMaturidade
      });
      setDashboard(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPrioridades() {
    try {
      setLoadingPrioridades(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/dashboard/empresa-prioridades/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPrioridades(data);
      }
    } catch (error) {
      console.error('Erro ao carregar prioridades:', error);
    } finally {
      setLoadingPrioridades(false);
    }
  }

  async function recalcularPrioridades() {
    try {
      setRecalculando(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/empresas/${id}/recalcular-prioridades`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await loadPrioridades();
      }
    } catch (error) {
      console.error('Erro ao recalcular prioridades:', error);
    } finally {
      setRecalculando(false);
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
          <Link to="/empresas" className="text-blue-400 hover:underline mt-2 inline-block">
            Voltar para empresas
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
      backgroundColor: 'rgba(34, 197, 94, 0.3)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(34, 197, 94, 1)',
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

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <Link to="/empresas" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-3">
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
            to={`/dashboard/empresa/${id}`}
            className="flex items-center gap-2 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm font-medium"
          >
            Dashboard Empresa
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
            {dashboard.totalProjetos} projeto(s) • {dashboard.totalAvaliadores} avaliação(ões)
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-slate-400" />
              <span className="text-white font-medium">{dashboard.empresa.nome}</span>
              <span className="text-slate-500 text-sm">• Visão Consolidada</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${dashboard.progresso}%` }}
                  />
                </div>
                <span className="text-white text-sm">{dashboard.progresso}%</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(dashboard.scoreGeral)} ${getScoreColor(dashboard.scoreGeral)} border`}>
                {dashboard.scoreGeral.toFixed(1)} {dashboard.classificacao}
              </span>
              <button 
                onClick={handleDownloadReport}
                disabled={generatingReport}
                className={`flex items-center gap-2 px-3 py-1.5 text-white rounded-lg text-sm transition-all ${
                  generatingReport 
                    ? 'bg-green-700 cursor-wait' 
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                {generatingReport ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {generatingReport ? 'Gerando...' : 'Relatório Word'}
              </button>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
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
              <option value={1}>Até nível 1 (somente avaliadores prioridade 1)</option>
              <option value={2}>Até nível 2 (prioridades 1 e 2)</option>
              <option value={3}>Até nível 3 (prioridades 1, 2 e 3 — padrão)</option>
            </select>
            <span className="text-xs text-slate-500">
              Consolida avaliações finalizadas por projeto conforme o nível cadastrado em cada usuário.
            </span>
          </div>
        </header>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">
              Maturidade em IA — Dashboard Empresa
            </h1>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium border border-green-500/30">
              SysMap Solutions
            </span>
          </div>
          <p className="text-slate-400 mb-6">{dashboard.empresa.nome} - Consolidado de {dashboard.totalProjetos} projeto(s)</p>

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
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Projetos</div>
              <div className="text-3xl font-bold text-white">
                {dashboard.totalProjetos}
              </div>
              <div className="text-slate-500 text-sm">avaliados</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Avaliações</div>
              <div className="text-3xl font-bold text-white">
                {dashboard.totalAvaliadores}
              </div>
              <div className="text-slate-500 text-sm">realizadas</div>
            </div>
          </div>

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

          {/* Projeção Financeira + Indicadores de Saúde */}
          {(() => {
            const currentLevel = getMaturityLevelFromScore(dashboard.scoreGeral);
            const projecao = PROJECAO_FINANCEIRA[currentLevel];
            
            return (
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Projeção Financeira */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <h3 className="text-white font-semibold">Projeção de Impacto Financeiro</h3>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                      <div className="text-xs text-slate-400 mb-1">Crescimento</div>
                      <div className="text-xl font-bold text-green-400">{projecao.crescimento}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                      <div className="text-xs text-slate-400 mb-1">Custos</div>
                      <div className="text-xl font-bold text-blue-400">{projecao.custos}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
                      <div className="text-xs text-slate-400 mb-1">ROI</div>
                      <div className="text-xl font-bold text-yellow-400">{projecao.roi}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
                      <div className="text-xs text-slate-400 mb-1">Tempo ROI</div>
                      <div className="text-xl font-bold text-purple-400">{projecao.tempo}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 text-center mt-3">
                    Baseado no Nível {currentLevel} de maturidade (MIT CISR)
                  </div>
                </div>

                {/* Indicadores de Saúde */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-white font-semibold">Indicadores de Saúde</h3>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
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
                        <div key={key} className={`p-2 rounded-lg ${statusConfig[status].bg} border ${statusConfig[status].border} text-center`}>
                          <div className="text-sm mb-0.5">{statusConfig[status].emoji}</div>
                          <div className="text-[10px] text-slate-400 mb-0.5">{indicador.nome}</div>
                          <div className={`text-lg font-bold ${statusConfig[status].cor}`}>
                            {scoreMedia.toFixed(1)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

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

          {/* MIT CISR Maturity Level Section */}
          {(() => {
            const currentLevel = getMaturityLevelFromScore(dashboard.scoreGeral);
            const levelInfo = MIT_CISR_LEVELS[currentLevel];
            
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
                  <Target className="w-5 h-5 text-green-400" />
                  <h3 className="text-white font-semibold">
                    Maturidade em IA — referência MIT CISR (4 estágios) + escala operacional Blueprint (1–5)
                  </h3>
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
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">Atual</span>
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
                  </div>
                </div>

                {/* Características do Nível Atual */}
                <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    Características do {levelInfo.name}
                  </h4>
                  <ul className="grid grid-cols-2 gap-2">
                    {levelInfo.characteristics.map((char, idx) => (
                      <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        {char}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Referência MIT CISR */}
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-slate-300 space-y-1">
                      <p>
                        <span className="font-medium text-blue-400">Referência:</span>{' '}
                        MIT CISR Enterprise AI Maturity Model — Weill, Woerner & Sebastian (dez/2024); atualização Woerner et al. (ago/2025). O modelo público define quatro estágios empresariais; esta escala 1–5 é operacional Blueprint IA.
                      </p>
                      <p>
                        <a href="https://cisr.mit.edu/publication/2024_1201_EnterpriseAIMaturityModel_WeillWoernerSebastian" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Building Enterprise AI Maturity (2024)</a>
                        {' · '}
                        <a href="https://cisr.mit.edu/publication/2025_0801_EnterpriseAIMaturityUpdate_WoernerSebastianWeillKaganer" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Grow Enterprise AI Maturity (2025)</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Projetos com análise por vertical */}
          {dashboard.projetos.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <FolderKanban className="w-5 h-5" />
                Projetos ({dashboard.totalProjetos})
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {dashboard.projetos.map((projeto) => {
                  const projetoLevel = getMaturityLevelFromScore(projeto.score);
                  const projetoLevelInfo = MIT_CISR_LEVELS[projetoLevel];
                  const vertical = projeto.vertical;
                  const verticalInfo = VERTICAIS.find(v => v.id === vertical);
                  const causasEfeitos = vertical && CAUSAS_EFEITOS_POR_VERTICAL[vertical] 
                    ? CAUSAS_EFEITOS_POR_VERTICAL[vertical] 
                    : null;

                  return (
                    <div key={projeto.id} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{projeto.nome}</p>
                            {verticalInfo && (
                              <span className={`text-xs px-2 py-0.5 rounded-full bg-slate-600 ${verticalInfo.color} flex items-center gap-1`}>
                                <verticalInfo.icon className="w-3 h-3" />
                                {verticalInfo.nome.split(' ')[0]}
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 text-sm">{projeto.avaliacoes} avaliações</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className={`text-2xl font-bold`} style={{ color: projetoLevelInfo.color }}>
                              {projeto.score.toFixed(1)}
                            </span>
                            <p className="text-xs text-slate-400">Nível {projetoLevel}</p>
                          </div>
                          <div 
                            className={`w-10 h-10 rounded-full ${projetoLevelInfo.bgColor} flex items-center justify-center`}
                          >
                            <span className="text-white font-bold">{projetoLevel}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Causas e Efeitos por Vertical */}
                      {causasEfeitos && (
                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-600">
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <h5 className="text-red-400 text-xs font-medium mb-2 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Causas do Nível {projetoLevel}
                            </h5>
                            <ul className="space-y-1">
                              {(causasEfeitos.causas[projetoLevel] || []).slice(0, 2).map((causa, idx) => (
                                <li key={idx} className="text-slate-300 text-xs flex items-start gap-1">
                                  <span className="text-red-400">→</span>
                                  {causa}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <h5 className="text-blue-400 text-xs font-medium mb-2 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Efeitos do Nível {projetoLevel}
                            </h5>
                            <ul className="space-y-1">
                              {(causasEfeitos.efeitos[projetoLevel] || []).slice(0, 2).map((efeito, idx) => (
                                <li key={idx} className="text-slate-300 text-xs flex items-start gap-1">
                                  <span className="text-blue-400">→</span>
                                  {efeito}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      <Link 
                        to={`/dashboard/projeto/${projeto.id}`}
                        className="text-blue-400 text-sm hover:underline mt-3 inline-block"
                      >
                        Ver dashboard completo do projeto →
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEÇÃO DE PRIORIDADES ESTRATÉGICAS */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Prioridades Estratégicas de Produtos
              </h3>
              <button
                onClick={recalcularPrioridades}
                disabled={recalculando}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  recalculando 
                    ? 'bg-slate-600 text-slate-400 cursor-wait' 
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${recalculando ? 'animate-spin' : ''}`} />
                {recalculando ? 'Recalculando...' : 'Recalcular Prioridades'}
              </button>
            </div>

            {/* Explicação da fórmula */}
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg mb-4">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-slate-300">
                  <span className="font-medium text-purple-400">Fórmula:</span> Prioridade Estratégica = (Score Produto × 60%) + (Score Blueprint × 40%)
                  <br />
                  <span className="text-slate-400">Produtos em projetos com maior maturidade em IA têm prioridade mais alta.</span>
                </div>
              </div>
            </div>

            {loadingPrioridades ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
            ) : prioridades && prioridades.produtosOrdenadosPorPrioridade?.length > 0 ? (
              <>
                {/* Métricas */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-slate-700/50 text-center">
                    <div className="text-xs text-slate-400 mb-1">Total Produtos</div>
                    <div className="text-xl font-bold text-white">{prioridades.metricas.totalProdutos}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/50 text-center">
                    <div className="text-xs text-slate-400 mb-1">Avaliados</div>
                    <div className="text-xl font-bold text-green-400">{prioridades.metricas.produtosAvaliados}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/50 text-center">
                    <div className="text-xs text-slate-400 mb-1">Com Blueprint</div>
                    <div className="text-xl font-bold text-blue-400">{prioridades.metricas.produtosComBlueprintAvaliado}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-700/50 text-center">
                    <div className="text-xs text-slate-400 mb-1">Média Prioridade</div>
                    <div className="text-xl font-bold text-purple-400">{prioridades.metricas.mediaPrioridadeEstrategica.toFixed(2)}</div>
                  </div>
                </div>

                {/* Lista de Produtos Ordenada */}
                <div className="space-y-2">
                  {prioridades.produtosOrdenadosPorPrioridade.map((produto, index) => (
                    <div 
                      key={produto.id} 
                      className={`p-4 rounded-lg border transition-all ${
                        produto.classificacaoEmpresa === 1 
                          ? 'bg-yellow-500/10 border-yellow-500/30' 
                          : produto.classificacaoEmpresa <= 3 
                            ? 'bg-green-500/10 border-green-500/20' 
                            : 'bg-slate-700/50 border-slate-600/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Posição */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            produto.classificacaoEmpresa === 1 
                              ? 'bg-yellow-500 text-black' 
                              : produto.classificacaoEmpresa === 2 
                                ? 'bg-slate-400 text-black' 
                                : produto.classificacaoEmpresa === 3 
                                  ? 'bg-amber-700 text-white' 
                                  : 'bg-slate-600 text-white'
                          }`}>
                            {produto.classificacaoEmpresa || '-'}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{produto.nome}</span>
                              {produto.vertical && (
                                <span className="text-xs px-2 py-0.5 rounded bg-slate-600 text-slate-300">
                                  {produto.vertical.nome?.split(' ')[0] || produto.vertical.icone}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">
                              Projeto: {produto.projetoNome}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {/* Scores */}
                          <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">Produto</div>
                            <div className={`font-bold ${
                              produto.scoreRelevancia >= 4 ? 'text-green-400' :
                              produto.scoreRelevancia >= 3 ? 'text-blue-400' :
                              produto.scoreRelevancia >= 2 ? 'text-yellow-400' :
                              'text-slate-400'
                            }`}>
                              {produto.scoreRelevancia?.toFixed(2) || '-'}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">Blueprint</div>
                            <div className={`font-bold ${
                              produto.scoreBlueprint >= 4 ? 'text-green-400' :
                              produto.scoreBlueprint >= 3 ? 'text-blue-400' :
                              produto.scoreBlueprint >= 2 ? 'text-yellow-400' :
                              'text-slate-400'
                            }`}>
                              {produto.scoreBlueprint?.toFixed(2) || '-'}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-xs text-purple-400 mb-1">Prioridade</div>
                            <div className="text-xl font-bold text-purple-400">
                              {produto.scorePrioridadeEstrategica?.toFixed(2) || '-'}
                            </div>
                          </div>

                          {/* ROI */}
                          {produto.roi > 0 && (
                            <div className="text-center">
                              <div className="text-xs text-slate-400 mb-1">ROI</div>
                              <div className="font-bold text-emerald-400">
                                {produto.roi.toFixed(0)}%
                              </div>
                            </div>
                          )}

                          <Link
                            to={`/dashboard/produto/${produto.id}`}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Ver →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum produto encontrado nesta empresa.</p>
                <p className="text-sm mt-1">Cadastre produtos nos projetos para ver as prioridades.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

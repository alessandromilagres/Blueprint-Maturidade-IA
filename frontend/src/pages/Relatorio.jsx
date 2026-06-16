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
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import { 
  ArrowLeft, Building2, FolderKanban, User, Calendar, Download, FileText, Briefcase,
  Target, Zap, Shield, Users, TrendingUp, Clock, CheckCircle, AlertTriangle, 
  ArrowRight, GitBranch, BookOpen, BarChart3, Cpu, DollarSign, Activity, List
} from 'lucide-react';
import { relatoriosApi, exportarApi } from '../services/api';
import { downloadWordFromRelatorio } from '../utils/generateReport';
import { projecaoFinanceiraRelatorio } from '../utils/roiPorFaturamento';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Recomendações contextualizadas por vertical/setor
const ACOES_POR_VERTICAL = {
  'tecnologia': {
    'Estratégia e Liderança': ['Criar roadmap de IA como produto', 'Integrar IA no ciclo de desenvolvimento', 'Definir métricas de adoção técnica'],
    'Dados e Tecnologia': ['Implementar feature stores', 'Adotar MLOps nível 2+', 'Criar pipelines de dados em tempo real'],
    'Valor de Negócio e ROI': ['Medir impacto em velocity do time', 'Calcular custo de retrabalho evitado', 'ROI em automação de testes'],
    'Governança e Risco': ['Implementar model cards', 'Auditoria de código gerado por IA', 'Políticas de uso de LLMs'],
    'Pessoas e Cultura': ['Hackathons de IA internos', 'Certificações em ML/AI', 'Comunidade de prática de IA'],
    'Operações e Processos': ['Automação de code review', 'CI/CD com gates de qualidade IA', 'Monitoramento de drift']
  },
  'financeiro': {
    'Estratégia e Liderança': ['Roadmap de IA alinhado a compliance BACEN', 'Comitê de IA com participação de compliance', 'Budget específico para RegTech'],
    'Dados e Tecnologia': ['Data lake com governança PCI-DSS', 'Modelos de detecção de fraude', 'APIs abertas (Open Banking)'],
    'Valor de Negócio e ROI': ['ROI em redução de fraudes', 'Economia em processos manuais', 'Aumento de conversão com IA'],
    'Governança e Risco': ['Auditoria de modelos de crédito', 'Explicabilidade obrigatória', 'Compliance com LGPD e BACEN'],
    'Pessoas e Cultura': ['Capacitação em IA ética', 'Treinamento em regulações', 'Especialistas em IA para finanças'],
    'Operações e Processos': ['Automação de KYC/AML', 'Análise de crédito automatizada', 'Chatbots com compliance']
  },
  'saude': {
    'Estratégia e Liderança': ['Roadmap de IA clínica e administrativa', 'Comitê de ética médica em IA', 'Parcerias com instituições de pesquisa'],
    'Dados e Tecnologia': ['Interoperabilidade HL7/FHIR', 'Anonimização de dados de pacientes', 'Modelos validados clinicamente'],
    'Valor de Negócio e ROI': ['ROI em diagnósticos precoces', 'Redução de reinternações', 'Otimização de leitos'],
    'Governança e Risco': ['Compliance ANVISA/FDA', 'Validação clínica obrigatória', 'Consentimento informado para IA'],
    'Pessoas e Cultura': ['Treinamento médico em IA', 'Integração IA-profissional', 'Cultura de evidências'],
    'Operações e Processos': ['Triagem automatizada', 'Agendamento inteligente', 'Monitoramento remoto de pacientes']
  },
  'varejo': {
    'Estratégia e Liderança': ['IA como diferencial competitivo', 'Personalização como estratégia', 'Omnichannel com IA'],
    'Dados e Tecnologia': ['CDP (Customer Data Platform)', 'Recomendação em tempo real', 'Visão computacional para estoque'],
    'Valor de Negócio e ROI': ['Aumento de ticket médio', 'Redução de ruptura de estoque', 'CAC otimizado com IA'],
    'Governança e Risco': ['Consentimento para personalização', 'Transparência em preços dinâmicos', 'Proteção de dados de consumo'],
    'Pessoas e Cultura': ['Treinamento de vendedores', 'Cultura data-driven', 'Equipes de CRM com IA'],
    'Operações e Processos': ['Previsão de demanda', 'Precificação dinâmica', 'Logística otimizada']
  },
  'industria': {
    'Estratégia e Liderança': ['Indústria 4.0 como norte', 'Gêmeos digitais', 'IA para sustentabilidade'],
    'Dados e Tecnologia': ['IoT e sensores inteligentes', 'Edge computing para latência', 'Manutenção preditiva'],
    'Valor de Negócio e ROI': ['Redução de paradas não planejadas', 'OEE otimizado', 'Economia de energia'],
    'Governança e Risco': ['Segurança de OT (Operational Tech)', 'Normas de segurança industrial', 'Rastreabilidade de produção'],
    'Pessoas e Cultura': ['Capacitação de operadores', 'Integração TI-OT', 'Cultura de melhoria contínua'],
    'Operações e Processos': ['Controle de qualidade visual', 'Otimização de processos', 'Supply chain inteligente']
  },
  'default': {
    'Estratégia e Liderança': ['Definir visão de IA para 3 anos', 'Nomear sponsor executivo', 'Criar comitê de IA'],
    'Dados e Tecnologia': ['Assessment de qualidade de dados', 'Infraestrutura cloud para ML', 'Catálogo de dados'],
    'Valor de Negócio e ROI': ['Identificar quick wins', 'Framework de priorização', 'Métricas de valor'],
    'Governança e Risco': ['Políticas de uso de IA', 'Avaliação de riscos', 'Compliance LGPD'],
    'Pessoas e Cultura': ['Programa de capacitação', 'Identificar champions', 'Comunicação sobre IA'],
    'Operações e Processos': ['Mapear processos candidatos', 'Pilotos controlados', 'Métricas de automação']
  }
};

// Estrutura recomendada por porte
const ESTRUTURA_POR_PORTE = {
  'startup': {
    equipe: 'Squad dedicado (2-4 pessoas)',
    abordagem: 'Lean AI - MVPs rápidos',
    investimento: '5-15% do budget tech',
    foco: 'Product-market fit com IA',
    governanca: 'Leve, baseada em princípios'
  },
  'pequena': {
    equipe: 'Célula de IA (3-5 pessoas)',
    abordagem: 'Pilotos focados em ROI',
    investimento: '3-8% do budget tech',
    foco: 'Automação de processos core',
    governanca: 'Políticas básicas + compliance'
  },
  'media': {
    equipe: 'Centro de Excelência (6-12 pessoas)',
    abordagem: 'Escala com governança',
    investimento: '5-10% do budget tech',
    foco: 'Plataforma e reuso',
    governanca: 'Framework completo + auditoria'
  },
  'grande': {
    equipe: 'CoE + squads distribuídos',
    abordagem: 'Federado com governança central',
    investimento: '3-7% do budget tech',
    foco: 'Transformação enterprise',
    governanca: 'Governance Board + políticas globais'
  }
};

// Normalizadores
function normalizarVertical(vertical) {
  if (!vertical) return 'default';
  const v = vertical.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (v.includes('tecnologia') || v.includes('software') || v.includes('ti')) return 'tecnologia';
  if (v.includes('financ') || v.includes('banco') || v.includes('fintech') || v.includes('seguro')) return 'financeiro';
  if (v.includes('saude') || v.includes('hospital') || v.includes('farma') || v.includes('medic')) return 'saude';
  if (v.includes('varejo') || v.includes('retail') || v.includes('comercio') || v.includes('e-commerce')) return 'varejo';
  if (v.includes('industria') || v.includes('manufatura') || v.includes('fabrica')) return 'industria';
  return 'default';
}

function normalizarPorte(porte) {
  if (!porte) return 'media';
  const p = porte.toLowerCase();
  if (p.includes('startup') || p.includes('micro')) return 'startup';
  if (p.includes('pequen') || p.includes('1-50') || p.includes('51-200')) return 'pequena';
  if (p.includes('medi') || p.includes('201-1000')) return 'media';
  if (p.includes('grand') || p.includes('1000') || p.includes('enterprise')) return 'grande';
  return 'media';
}

// Função para gerar gaps ordenados por criticidade
function calcularGapsOrdenados(scoresPorArea) {
  const MEDIA_IDEAL = 3.5;
  return scoresPorArea
    .map(area => ({
      ...area,
      gap: MEDIA_IDEAL - area.score,
      criticidade: area.score < 2 ? 'Crítico' : area.score < 3 ? 'Alto' : area.score < 3.5 ? 'Médio' : 'Baixo'
    }))
    .filter(a => a.gap > 0)
    .sort((a, b) => b.gap - a.gap);
}

// Função para gerar ações contextualizadas
function gerarAcoesContextualizadas(area, vertical, porte) {
  const verticalNorm = normalizarVertical(vertical);
  const porteNorm = normalizarPorte(porte);
  
  const acoesVertical = ACOES_POR_VERTICAL[verticalNorm]?.[area] || ACOES_POR_VERTICAL['default'][area] || [];
  const estrutura = ESTRUTURA_POR_PORTE[porteNorm] || ESTRUTURA_POR_PORTE['media'];
  
  return {
    acoes: acoesVertical,
    estrutura
  };
}

// KPIs específicos por área
const KPIS_POR_AREA = {
  'Estratégia e Liderança': [
    { kpi: 'NPS Executivo em IA', meta: '> 70', unidade: 'pontos' },
    { kpi: 'Budget aprovado para IA', meta: '> 3%', unidade: '% faturamento' },
    { kpi: 'Reuniões C-Level sobre IA', meta: '> 2/mês', unidade: 'frequência' }
  ],
  'Dados e Tecnologia': [
    { kpi: 'Qualidade de dados (DQI)', meta: '> 85%', unidade: '%' },
    { kpi: 'Cobertura Data Catalog', meta: '> 80%', unidade: '% fontes' },
    { kpi: 'Uptime infraestrutura ML', meta: '> 99.5%', unidade: '%' }
  ],
  'Valor de Negócio e ROI': [
    { kpi: 'ROI médio projetos IA', meta: '> 150%', unidade: '%' },
    { kpi: 'Time-to-Value', meta: '< 6 meses', unidade: 'meses' },
    { kpi: 'Projetos com ROI positivo', meta: '> 70%', unidade: '%' }
  ],
  'Governança e Risco': [
    { kpi: 'Cobertura políticas IA', meta: '100%', unidade: '%' },
    { kpi: 'Incidentes compliance', meta: '0', unidade: 'qtd/ano' },
    { kpi: 'Modelos auditados', meta: '> 90%', unidade: '%' }
  ],
  'Pessoas e Cultura': [
    { kpi: 'Colaboradores capacitados', meta: '> 50%', unidade: '%' },
    { kpi: 'Retenção talentos IA', meta: '> 85%', unidade: '%' },
    { kpi: 'eNPS área de IA', meta: '> 50', unidade: 'pontos' }
  ],
  'Operações e Processos': [
    { kpi: 'Processos automatizados', meta: '> 40%', unidade: '%' },
    { kpi: 'Redução tempo ciclo', meta: '> 30%', unidade: '%' },
    { kpi: 'Taxa erro humano', meta: '< 2%', unidade: '%' }
  ],
  'default': [
    { kpi: 'Score de maturidade', meta: '> 3.5', unidade: 'pontos' },
    { kpi: 'Evolução trimestral', meta: '> 0.3', unidade: 'pontos' },
    { kpi: 'Gaps endereçados', meta: '> 80%', unidade: '%' }
  ]
};

// Matriz de dependências
const MATRIZ_DEPENDENCIAS = [
  { area: 'Estratégia e Liderança', depende: [], habilita: ['Governança', 'Dados', 'Valor'], prioridade: 1 },
  { area: 'Governança e Risco', depende: ['Estratégia'], habilita: ['Dados', 'Operações'], prioridade: 2 },
  { area: 'Pessoas e Cultura', depende: ['Estratégia'], habilita: ['Operações', 'Inovação'], prioridade: 2 },
  { area: 'Dados e Tecnologia', depende: ['Estratégia', 'Governança'], habilita: ['Operações', 'Inovação'], prioridade: 3 },
  { area: 'Operações e Processos', depende: ['Dados', 'Pessoas'], habilita: ['Valor'], prioridade: 4 },
  { area: 'Valor de Negócio e ROI', depende: ['Operações'], habilita: ['Inovação'], prioridade: 5 },
  { area: 'Inovação e Experimentação', depende: ['Dados', 'Valor'], habilita: [], prioridade: 6 }
];

// Roadmap 12 meses
const ROADMAP_12_MESES = [
  { trimestre: 'T1', titulo: 'Fundação', cor: 'amber', entregas: ['Estratégia de IA aprovada', 'Comitê de governança', 'Assessment de dados', 'Quick wins identificados'], marco: 'Sponsor nomeado' },
  { trimestre: 'T2', titulo: 'Capacitação', cor: 'blue', entregas: ['Programa upskilling', 'Políticas publicadas', 'Plataforma dados MVP', 'Pilotos em execução'], marco: '3 pilotos validados' },
  { trimestre: 'T3', titulo: 'Escala', cor: 'purple', entregas: ['MLOps implementado', 'Catálogo de modelos', 'Expansão áreas', 'Framework ROI'], marco: 'ROI comprovado' },
  { trimestre: 'T4', titulo: 'Otimização', cor: 'green', entregas: ['Automação escala', 'IA em produção', 'CoE maduro', 'Inovação contínua'], marco: 'Nível Gerenciado' }
];

// Frameworks metodológicos
const FRAMEWORKS = {
  mitcisr: {
    nome: 'MIT CISR', subtitulo: 'Enterprise AI Maturity Model',
    descricao: 'Framework do MIT Center for Information Systems Research para avaliar maturidade empresarial em IA.',
    referencia: 'Weill, Woerner & Sebastian (2024)'
  },
  dora: {
    nome: 'DORA', subtitulo: 'DevOps Research & Assessment',
    metricas: [
      { nome: 'Lead Time', elite: '< 1h', high: '1d-1sem' },
      { nome: 'Deploy Freq', elite: 'Múltiplos/dia', high: '1x/dia' },
      { nome: 'MTTR', elite: '< 1h', high: '< 1 dia' },
      { nome: 'Change Fail', elite: '0-15%', high: '16-30%' }
    ]
  },
  mlops: {
    nome: 'MLOps', subtitulo: 'ML Operations Maturity',
    niveis: [
      { n: 0, nome: 'Manual', desc: 'Notebooks sem pipeline' },
      { n: 1, nome: 'Pipeline', desc: 'Treinamento automatizado' },
      { n: 2, nome: 'CI/CD', desc: 'Deploy contínuo' },
      { n: 3, nome: 'Full', desc: 'Monitoramento e retreino' }
    ]
  },
  finops: {
    nome: 'FinOps', subtitulo: 'Cloud Financial Management',
    pilares: ['Visibilidade (tagging, dashboards)', 'Otimização (right-sizing, spots)', 'Governança (budgets, alertas)']
  }
};

function getStatusColor(score) {
  if (score >= 4) return { bg: 'bg-green-500', text: 'text-green-400', light: 'bg-green-500/10', border: 'border-green-500/30', status: 'Saudável' };
  if (score >= 3) return { bg: 'bg-blue-500', text: 'text-blue-400', light: 'bg-blue-500/10', border: 'border-blue-500/30', status: 'Adequado' };
  if (score >= 2) return { bg: 'bg-amber-500', text: 'text-amber-400', light: 'bg-amber-500/10', border: 'border-amber-500/30', status: 'Atenção' };
  return { bg: 'bg-red-500', text: 'text-red-400', light: 'bg-red-500/10', border: 'border-red-500/30', status: 'Crítico' };
}

function getNivelColor(nivel) {
  const cores = { 'Inicial': 'red', 'Oportunista': 'orange', 'Estruturado': 'amber', 'Gerenciado': 'blue', 'Otimizado': 'green' };
  return cores[nivel] || 'slate';
}

function criterioDaPontuacao(resposta) {
  if (resposta?.pontuacao == null || !resposta?.pergunta?.criterios) return '';
  const linhas = String(resposta.pergunta.criterios)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return linhas[Number(resposta.pontuacao) - 1] || '';
}

function respostasAgrupadasPorArea(respostas = []) {
  const grupos = new Map();
  [...respostas]
    .sort((a, b) => {
      const areaA = a.pergunta?.area?.ordem ?? a.pergunta?.areaId ?? 0;
      const areaB = b.pergunta?.area?.ordem ?? b.pergunta?.areaId ?? 0;
      if (areaA !== areaB) return areaA - areaB;
      return (a.pergunta?.numero ?? 0) - (b.pergunta?.numero ?? 0);
    })
    .forEach((resposta) => {
      const area = resposta.pergunta?.area?.nome || 'Sem dimensão';
      if (!grupos.has(area)) grupos.set(area, []);
      grupos.get(area).push(resposta);
    });
  return [...grupos.entries()].map(([area, itens]) => ({ area, itens }));
}

export default function Relatorio() {
  const { id } = useParams();
  const [relatorio, setRelatorio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRelatorio(); }, [id]);

  async function loadRelatorio() {
    try {
      const data = await relatoriosApi.buscar(id);
      setRelatorio(data);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!relatorio) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Relatório não encontrado</h2>
          <Link to="/avaliacoes" className="text-blue-400 hover:underline">Voltar</Link>
        </div>
      </div>
    );
  }

  const radarData = {
    labels: relatorio.scoresPorArea.map((a) => a.area.split(' ').slice(0, 2).join(' ')),
    datasets: [{
      label: 'Score',
      data: relatorio.scoresPorArea.map((a) => a.score),
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
    }]
  };

  const radarOptions = {
    scales: {
      r: {
        min: 0, max: 5, ticks: { stepSize: 1, color: '#64748b', font: { size: 8 } },
        pointLabels: { font: { size: 9 }, color: '#94a3b8' },
        grid: { color: 'rgba(100, 116, 139, 0.2)' },
      }
    },
    plugins: { legend: { display: false } },
  };

  const corNivel = getNivelColor(relatorio.nivelGeral);

  const indice = [
    { num: '1', titulo: 'Sumário Executivo', page: 1 },
    { num: '2', titulo: 'Top 5 Gaps Prioritários', page: 2 },
    { num: '3', titulo: 'Plano de Ação Contextualizado', page: 3 },
    { num: '4', titulo: 'Projeção de Impacto Financeiro', page: 4 },
    { num: '5', titulo: 'Detalhamento por Dimensão', page: 5 },
    { num: '6', titulo: 'Respostas Detalhadas do Avaliador', page: 6 },
    { num: '7', titulo: 'KPIs Específicos por Área', page: 7 },
    { num: '8', titulo: 'Matriz de Dependências', page: 8 },
    { num: '9', titulo: 'Roadmap Estratégico 12 Meses', page: 9 },
    { num: '10', titulo: 'Apêndices Metodológicos', page: 10 },
  ];

  // Calcular dados contextualizados
  const vertical = relatorio.projeto?.vertical || '';
  const porte = relatorio.empresa?.porte || '';
  const gapsOrdenados = calcularGapsOrdenados(relatorio.scoresPorArea);
  const top5Gaps = gapsOrdenados.slice(0, 5);
  
  const fin = projecaoFinanceiraRelatorio({
    faturamentoAnualProjeto: relatorio.projeto?.faturamentoAnualProjeto,
    scoreGeral: relatorio.scoreGeral
  });
  const cenarios = fin.cenarios;
  const baseInvestimento = fin.usaFaturamento ? fin.investimentoAnualReferencia : fin.baseInvestimento;
  const respostasPorArea = respostasAgrupadasPorArea(relatorio.respostas);
  const totalComNota = (relatorio.respostas || []).filter((r) => r.pontuacao != null).length;
  const totalSemInformacao = (relatorio.respostas || []).filter((r) => r.semInformacao === true).length;

  return (
    <div className="min-h-screen bg-slate-900 text-white print:bg-white print:text-slate-900">
      {/* Header - não imprime */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/projetos/${relatorio.projeto.id}`} className="p-1.5 hover:bg-slate-700 rounded-lg">
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-blue-400">Relatório Técnico Completo</h1>
              <p className="text-xs text-slate-400">
                {relatorio.empresa.nome}
                {relatorio.projetoVersao?.titulo ? ` · ${relatorio.projetoVersao.titulo}` : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/relatorios/${id}/executivo`} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded text-xs font-medium">
              <Briefcase className="w-3.5 h-3.5" /> Executivo
            </Link>
            <button onClick={() => exportarApi.download(exportarApi.relatorio(id), `relatorio-tecnico.md`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs">
              <FileText className="w-3.5 h-3.5" /> MD
            </button>
            <button onClick={() => downloadWordFromRelatorio(relatorio)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs">
              <FileText className="w-3.5 h-3.5" /> Word
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium">
              <Download className="w-3.5 h-3.5" /> Exportar PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 print:px-0 print:py-0">
        
        {/* ============================================ */}
        {/* CAPA */}
        {/* ============================================ */}
        <section className="print:h-screen print:flex print:flex-col print:justify-center mb-8 print:mb-0">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 print:from-slate-100 print:to-white rounded-xl print:rounded-none p-8 print:p-12 print:border print:border-slate-200">
            <div className="text-center mb-8">
              <p className="text-xs text-slate-400 print:text-slate-500 uppercase tracking-widest mb-2">Relatório Técnico</p>
              <h1 className="text-2xl font-bold text-blue-400 print:text-blue-600 mb-2">Maturidade em Inteligência Artificial</h1>
              <p className="text-sm text-slate-400 print:text-slate-500">Assessment Completo • MIT CISR Framework</p>
            </div>

            <div className="grid grid-cols-2 gap-4 print:gap-3 mb-8 print:mb-6">
              <div className="bg-slate-800/50 print:bg-slate-50 rounded-lg p-4 print:p-3 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid' }}>
                <p className="text-[10px] print:text-[9px] text-slate-400 uppercase mb-1">Empresa</p>
                <p className="text-sm print:text-xs font-semibold text-white print:text-slate-900">{relatorio.empresa.nome}</p>
              </div>
              <div className="bg-slate-800/50 print:bg-slate-50 rounded-lg p-4 print:p-3 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid' }}>
                <p className="text-[10px] print:text-[9px] text-slate-400 uppercase mb-1">Projeto</p>
                <p className="text-sm print:text-xs font-semibold text-white print:text-slate-900">{relatorio.projeto.nome}</p>
              </div>
              <div className="bg-slate-800/50 print:bg-slate-50 rounded-lg p-4 print:p-3 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid' }}>
                <p className="text-[10px] print:text-[9px] text-slate-400 uppercase mb-1">Versão da pesquisa</p>
                <p className="text-sm print:text-xs font-semibold text-white print:text-slate-900">{relatorio.projetoVersao?.titulo || 'Versão 1'}</p>
              </div>
              <div className="bg-slate-800/50 print:bg-slate-50 rounded-lg p-4 print:p-3 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid' }}>
                <p className="text-[10px] print:text-[9px] text-slate-400 uppercase mb-1">Avaliador</p>
                <p className="text-sm print:text-xs font-semibold text-white print:text-slate-900">{relatorio.usuario.nome}</p>
              </div>
              <div className="bg-slate-800/50 print:bg-slate-50 rounded-lg p-4 print:p-3 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid' }}>
                <p className="text-[10px] print:text-[9px] text-slate-400 uppercase mb-1">Data</p>
                <p className="text-sm print:text-xs font-semibold text-white print:text-slate-900">{new Date(relatorio.avaliacao.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className={`bg-${corNivel}-500/10 print:bg-${corNivel}-50 border border-${corNivel}-500/30 print:border-${corNivel}-200 rounded-xl p-6 text-center`}>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Resultado da Avaliação</p>
              <p className={`text-3xl font-bold text-${corNivel}-400 print:text-${corNivel}-600`}>{relatorio.scoreGeral.toFixed(2)}</p>
              <p className={`text-lg font-semibold text-${corNivel}-400 print:text-${corNivel}-600`}>{relatorio.nivelGeral}</p>
            </div>
          </div>

          {/* Índice */}
          <div className="bg-slate-800 print:bg-white rounded-xl print:rounded-none p-6 mt-6 print:mt-8 print:border print:border-slate-200">
            <h2 className="text-sm font-bold text-white print:text-slate-900 mb-4 flex items-center gap-2">
              <List className="w-4 h-4" /> Índice
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {indice.map((item) => (
                <div key={item.num} className="flex items-center justify-between text-xs py-1 border-b border-slate-700 print:border-slate-200">
                  <span className="text-slate-300 print:text-slate-700">{item.num}. {item.titulo}</span>
                  <span className="text-slate-500">p. {item.page}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 1. SUMÁRIO EXECUTIVO */}
        {/* ============================================ */}
        <section className="print:break-before-page mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">1</div>
            <h2 className="text-sm font-bold text-white print:text-slate-900">Sumário Executivo</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 print:gap-3 mb-4 print:mb-3">
            {/* Radar */}
            <div className="bg-slate-800 print:bg-slate-50 rounded-lg p-4 print:p-3 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid' }}>
              <h3 className="text-[10px] print:text-[9px] text-slate-400 uppercase tracking-wider mb-3 print:mb-2">Radar de Maturidade</h3>
              <div className="max-w-[220px] print:max-w-[180px] mx-auto">
                <Radar data={radarData} options={radarOptions} />
              </div>
            </div>

            {/* Scores */}
            <div className="bg-slate-800 print:bg-slate-50 rounded-lg p-4 print:p-3 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid' }}>
              <h3 className="text-[10px] print:text-[9px] text-slate-400 uppercase tracking-wider mb-3 print:mb-2">Score por Dimensão</h3>
              <div className="space-y-1.5 print:space-y-1">
                {relatorio.scoresPorArea.map((area) => {
                  const status = getStatusColor(area.score);
                  return (
                    <div key={area.area} className="flex items-center gap-2 print:gap-1">
                      <div className={`w-2 h-2 print:w-1.5 print:h-1.5 rounded-full ${status.bg}`}></div>
                      <span className="text-[10px] print:text-[8px] text-slate-400 print:text-slate-600 flex-1 truncate">{area.area}</span>
                      <span className={`text-[10px] print:text-[9px] font-semibold ${status.text} print:text-slate-900`}>{area.score.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Escala MIT CISR */}
          <div className="bg-slate-800 print:bg-slate-50 rounded-lg p-4 print:p-3 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid' }}>
            <h3 className="text-[10px] print:text-[9px] text-slate-400 uppercase tracking-wider mb-3 print:mb-2">Escala de Maturidade MIT CISR</h3>
            <div className="grid grid-cols-5 gap-2 print:gap-1">
              {[
                { nivel: 'Inicial', score: '1.0-1.5', cor: 'red' },
                { nivel: 'Oportunista', score: '1.5-2.5', cor: 'orange' },
                { nivel: 'Estruturado', score: '2.5-3.5', cor: 'amber' },
                { nivel: 'Gerenciado', score: '3.5-4.5', cor: 'blue' },
                { nivel: 'Otimizado', score: '4.5-5.0', cor: 'green' },
              ].map((n) => (
                <div key={n.nivel} className={`p-2 print:p-1.5 rounded text-center ${relatorio.nivelGeral === n.nivel ? `bg-${n.cor}-500/20 print:bg-${n.cor}-100 border border-${n.cor}-500/50` : 'bg-slate-900/50 print:bg-slate-100'}`}>
                  <p className={`text-[10px] print:text-[8px] font-bold ${relatorio.nivelGeral === n.nivel ? `text-${n.cor}-400 print:text-${n.cor}-600` : 'text-slate-400'}`}>{n.nivel}</p>
                  <p className="text-[9px] print:text-[7px] text-slate-500">{n.score}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 2. TOP 5 GAPS PRIORITÁRIOS */}
        {/* ============================================ */}
        <section className="print:break-before-page mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">2</div>
            <h2 className="text-sm font-bold text-white print:text-slate-900">Top 5 Gaps Prioritários</h2>
          </div>

          <div className="bg-slate-800 print:bg-slate-50 rounded-lg p-4 print:p-3 print:border print:border-slate-200 mb-4" style={{ pageBreakInside: 'avoid' }}>
            <p className="text-[10px] print:text-[9px] text-slate-400 mb-3">
              Gaps calculados pela distância do score ideal (3.5), ordenados por criticidade. 
              {vertical && <span className="text-blue-400 print:text-blue-600"> Vertical: {vertical}.</span>}
              {porte && <span className="text-purple-400 print:text-purple-600"> Porte: {porte}.</span>}
            </p>
            
            <div className="space-y-3 print:space-y-2">
              {top5Gaps.map((gap, index) => {
                const corCriticidade = gap.criticidade === 'Crítico' ? 'red' : gap.criticidade === 'Alto' ? 'orange' : 'amber';
                const { acoes } = gerarAcoesContextualizadas(gap.area, vertical, porte);
                
                return (
                  <div key={gap.area} className={`bg-${corCriticidade}-500/10 print:bg-${corCriticidade}-50 border border-${corCriticidade}-500/30 print:border-${corCriticidade}-200 rounded-lg p-3 print:p-2`} style={{ pageBreakInside: 'avoid' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 print:w-5 print:h-5 rounded bg-${corCriticidade}-500 flex items-center justify-center`}>
                          <span className="text-[10px] print:text-[9px] font-bold text-white">#{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="text-xs print:text-[10px] font-semibold text-white print:text-slate-900">{gap.area}</h4>
                          <span className={`text-[9px] print:text-[8px] px-1.5 py-0.5 rounded bg-${corCriticidade}-500/20 text-${corCriticidade}-400 print:bg-${corCriticidade}-100 print:text-${corCriticidade}-700`}>
                            {gap.criticidade}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg print:text-base font-bold text-${corCriticidade}-400 print:text-${corCriticidade}-600`}>{gap.score.toFixed(1)}</p>
                        <p className="text-[9px] print:text-[8px] text-slate-500">Gap: -{gap.gap.toFixed(1)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-slate-700/50 print:border-slate-200">
                      <p className="text-[9px] print:text-[8px] text-slate-400 uppercase tracking-wider mb-1">Ações Recomendadas</p>
                      <div className="grid grid-cols-3 gap-1">
                        {acoes.slice(0, 3).map((acao, i) => (
                          <div key={i} className="flex items-start gap-1 text-[9px] print:text-[8px]">
                            <CheckCircle className={`w-2.5 h-2.5 text-${corCriticidade}-400 print:text-${corCriticidade}-600 mt-0.5 flex-shrink-0`} />
                            <span className="text-slate-300 print:text-slate-700">{acao}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 3. PLANO DE AÇÃO CONTEXTUALIZADO */}
        {/* ============================================ */}
        <section className="print:break-before-page mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">3</div>
            <h2 className="text-sm font-bold text-white print:text-slate-900">Plano de Ação Contextualizado (90 dias)</h2>
          </div>

          {/* Info de contexto */}
          <div className="grid grid-cols-2 gap-3 print:gap-2 mb-4">
            <div className="bg-blue-500/10 print:bg-blue-50 border border-blue-500/30 print:border-blue-200 rounded-lg p-3 print:p-2" style={{ pageBreakInside: 'avoid' }}>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-blue-400 print:text-blue-600" />
                <h4 className="text-xs print:text-[10px] font-semibold text-white print:text-slate-900">Contexto da Empresa</h4>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] print:text-[9px] text-slate-300 print:text-slate-700">
                  <span className="text-slate-500">Vertical:</span> {vertical || 'Geral'}
                </p>
                <p className="text-[10px] print:text-[9px] text-slate-300 print:text-slate-700">
                  <span className="text-slate-500">Porte:</span> {porte || 'Médio'}
                </p>
                <p className="text-[10px] print:text-[9px] text-slate-300 print:text-slate-700">
                  <span className="text-slate-500">Nível Atual:</span> {relatorio.nivelGeral}
                </p>
              </div>
            </div>
            
            <div className="bg-purple-500/10 print:bg-purple-50 border border-purple-500/30 print:border-purple-200 rounded-lg p-3 print:p-2" style={{ pageBreakInside: 'avoid' }}>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-400 print:text-purple-600" />
                <h4 className="text-xs print:text-[10px] font-semibold text-white print:text-slate-900">Estrutura Recomendada</h4>
              </div>
              {(() => {
                const estrutura = ESTRUTURA_POR_PORTE[normalizarPorte(porte)] || ESTRUTURA_POR_PORTE['media'];
                return (
                  <div className="space-y-1">
                    <p className="text-[10px] print:text-[9px] text-slate-300 print:text-slate-700">
                      <span className="text-slate-500">Equipe:</span> {estrutura.equipe}
                    </p>
                    <p className="text-[10px] print:text-[9px] text-slate-300 print:text-slate-700">
                      <span className="text-slate-500">Investimento:</span> {estrutura.investimento}
                    </p>
                    <p className="text-[10px] print:text-[9px] text-slate-300 print:text-slate-700">
                      <span className="text-slate-500">Foco:</span> {estrutura.foco}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Plano por fase */}
          <div className="grid grid-cols-3 gap-3 print:gap-2">
            {[
              { fase: 'Semana 1-4', titulo: 'Quick Wins', cor: 'amber', icon: Zap },
              { fase: 'Semana 5-8', titulo: 'Fundação', cor: 'blue', icon: Target },
              { fase: 'Semana 9-12', titulo: 'Escala', cor: 'green', icon: TrendingUp }
            ].map((periodo, periodoIdx) => (
              <div key={periodo.fase} className={`bg-${periodo.cor}-500/10 print:bg-${periodo.cor}-50 border border-${periodo.cor}-500/30 print:border-${periodo.cor}-200 rounded-lg p-3 print:p-2`} style={{ pageBreakInside: 'avoid' }}>
                <div className="flex items-center gap-2 mb-2">
                  <periodo.icon className={`w-4 h-4 text-${periodo.cor}-400 print:text-${periodo.cor}-600`} />
                  <div>
                    <p className={`text-[9px] print:text-[8px] text-${periodo.cor}-400 print:text-${periodo.cor}-600 uppercase`}>{periodo.fase}</p>
                    <h4 className="text-xs print:text-[10px] font-semibold text-white print:text-slate-900">{periodo.titulo}</h4>
                  </div>
                </div>
                
                <div className="space-y-1.5 print:space-y-1">
                  {top5Gaps.slice(0, 2).map((gap, gapIdx) => {
                    const { acoes } = gerarAcoesContextualizadas(gap.area, vertical, porte);
                    const acaoIdx = periodoIdx < acoes.length ? periodoIdx : 0;
                    return (
                      <div key={gap.area} className="bg-slate-900/30 print:bg-slate-100 rounded p-1.5 print:p-1">
                        <p className="text-[9px] print:text-[8px] font-medium text-slate-300 print:text-slate-700 truncate">{gap.area.split(' ').slice(0, 2).join(' ')}</p>
                        <p className="text-[8px] print:text-[7px] text-slate-400 print:text-slate-600">{acoes[acaoIdx] || 'Definir ações específicas'}</p>
                      </div>
                    );
                  })}
                </div>
                
                <div className={`mt-2 pt-2 border-t border-${periodo.cor}-500/20 print:border-${periodo.cor}-200`}>
                  <p className="text-[8px] print:text-[7px] text-slate-500">Responsável: Líder de IA</p>
                  <p className="text-[8px] print:text-[7px] text-slate-500">KPI: Score +0.3 pts</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================ */}
        {/* 4. PROJEÇÃO DE IMPACTO FINANCEIRO */}
        {/* ============================================ */}
        <section className="print:break-before-page mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">4</div>
            <h2 className="text-sm font-bold text-white print:text-slate-900">Projeção de Impacto Financeiro</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 print:gap-2 mb-4">
            {[
              { cenario: 'Conservador', dados: cenarios.conservador, cor: 'amber' },
              { cenario: 'Base', dados: cenarios.base, cor: 'blue' },
              { cenario: 'Agressivo', dados: cenarios.agressivo, cor: 'green' }
            ].map((c) => (
              <div key={c.cenario} className={`bg-${c.cor}-500/10 print:bg-${c.cor}-50 border border-${c.cor}-500/30 print:border-${c.cor}-200 rounded-lg p-4 print:p-3 text-center`} style={{ pageBreakInside: 'avoid' }}>
                <p className={`text-[10px] print:text-[9px] text-${c.cor}-400 print:text-${c.cor}-600 uppercase tracking-wider mb-2`}>{c.cenario}</p>
                <p className={`text-2xl print:text-xl font-bold text-${c.cor}-400 print:text-${c.cor}-600`}>{c.dados.roi}x</p>
                <p className="text-[10px] print:text-[9px] text-slate-400 mb-3">ROI Esperado</p>
                
                <div className="space-y-2 print:space-y-1 text-left">
                  <div className="flex justify-between text-[10px] print:text-[9px]">
                    <span className="text-slate-400">Payback:</span>
                    <span className="text-white print:text-slate-900 font-medium">{c.dados.payback} meses</span>
                  </div>
                  <div className="flex justify-between text-[10px] print:text-[9px]">
                    <span className="text-slate-400">Economia anual:</span>
                    <span className="text-white print:text-slate-900 font-medium">R$ {(c.dados.economia / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="bg-slate-800 print:bg-slate-50 rounded-lg p-3 print:p-2 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid' }}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 print:text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] print:text-[9px] font-medium text-white print:text-slate-900 mb-1">Premissas da Projeção</p>
                <p className="text-[9px] print:text-[8px] text-slate-400 print:text-slate-600">
                  Valores baseados em benchmarks de mercado para empresas no nível {relatorio.nivelGeral} de maturidade.
                  {fin.usaFaturamento ? (
                    <> Faturamento anual do projeto: R$ {Number(fin.faturamentoAnualProjeto).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}. Percentual de referência para ROI: {fin.percentualReferenciaRoi}%. </>
                  ) : (
                    <> Investimento base considerado: R$ {(baseInvestimento / 1000).toFixed(0)}k. </>
                  )}
                  ROI calculado considerando ganhos de eficiência, redução de custos operacionais e aumento de receita por projetos de IA.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 5. DETALHAMENTO POR DIMENSÃO */}
        {/* ============================================ */}
        <section className="print:break-before-page mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">5</div>
            <h2 className="text-sm font-bold text-white print:text-slate-900">Detalhamento por Dimensão</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 print:gap-2">
            {relatorio.scoresPorArea.map((area) => {
              const status = getStatusColor(area.score);
              return (
                <div key={area.area} className={`rounded-lg p-3 print:p-2 ${status.light} print:bg-slate-50 border ${status.border} print:border-slate-200`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div className="flex items-start justify-between mb-2 print:mb-1">
                    <div>
                      <h4 className="text-xs print:text-[10px] font-semibold text-white print:text-slate-900">{area.area}</h4>
                      <p className="text-[9px] print:text-[8px] text-slate-400">{area.respondidas}/{area.total} perguntas</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg print:text-base font-bold ${status.text} print:text-slate-900`}>{area.score.toFixed(1)}</p>
                      <span className={`text-[9px] print:text-[8px] px-1.5 py-0.5 rounded ${status.light} ${status.text} print:bg-slate-200 print:text-slate-700`}>{area.nivel}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 print:bg-slate-200 rounded-full h-1">
                    <div className={`h-1 rounded-full ${status.bg}`} style={{ width: `${(area.score / 5) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================ */}
        {/* 6. RESPOSTAS DETALHADAS */}
        {/* ============================================ */}
        <section className="print:break-before-page mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">6</div>
            <h2 className="text-sm font-bold text-white print:text-slate-900">Respostas Detalhadas do Avaliador</h2>
          </div>

          <div className="bg-slate-800 print:bg-slate-50 rounded-lg p-4 print:p-3 print:border print:border-slate-200 mb-4" style={{ pageBreakInside: 'avoid' }}>
            <p className="text-[10px] print:text-[9px] text-slate-400 print:text-slate-600">
              Este bloco mostra o que o avaliador marcou em cada pergunta. Perguntas indicadas como
              <strong> “sem informação” </strong>
              ficam sem nota e não entram na média da dimensão nem no score geral.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded bg-slate-900/50 print:bg-white p-2 print:border print:border-slate-200">
                <p className="text-[9px] text-slate-500 uppercase">Com nota</p>
                <p className="text-lg font-bold text-blue-400 print:text-blue-600">{totalComNota}</p>
              </div>
              <div className="rounded bg-slate-900/50 print:bg-white p-2 print:border print:border-slate-200">
                <p className="text-[9px] text-slate-500 uppercase">Sem informação</p>
                <p className="text-lg font-bold text-amber-400 print:text-amber-600">{totalSemInformacao}</p>
              </div>
              <div className="rounded bg-slate-900/50 print:bg-white p-2 print:border print:border-slate-200">
                <p className="text-[9px] text-slate-500 uppercase">Total de perguntas</p>
                <p className="text-lg font-bold text-white print:text-slate-900">{relatorio.respostas?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {respostasPorArea.map(({ area, itens }) => (
              <div key={area} className="bg-slate-800 print:bg-slate-50 rounded-lg p-4 print:p-3 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid' }}>
                <h3 className="text-xs print:text-[10px] font-bold text-blue-300 print:text-blue-700 mb-3">{area}</h3>
                <div className="space-y-3">
                  {itens.map((resposta) => {
                    const semInfo = resposta.semInformacao === true;
                    const criterio = criterioDaPontuacao(resposta);
                    return (
                      <div key={resposta.id} className="rounded-lg border border-slate-700 print:border-slate-200 bg-slate-900/40 print:bg-white p-3" style={{ pageBreakInside: 'avoid' }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] print:text-[9px] text-slate-500 uppercase">
                              Pergunta {resposta.pergunta?.numero ?? '-'}
                            </p>
                            <p className="mt-1 text-xs print:text-[10px] font-medium text-white print:text-slate-900">
                              {resposta.pergunta?.texto || 'Pergunta não encontrada'}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            {semInfo ? (
                              <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-300 print:bg-amber-100 print:text-amber-700">
                                Sem informação
                              </span>
                            ) : resposta.pontuacao != null ? (
                              <span className="inline-flex rounded-full bg-blue-500/15 px-2 py-1 text-[10px] font-semibold text-blue-300 print:bg-blue-100 print:text-blue-700">
                                Nota {resposta.pontuacao}
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-300 print:bg-slate-100 print:text-slate-600">
                                Não respondida
                              </span>
                            )}
                          </div>
                        </div>

                        {criterio && !semInfo ? (
                          <div className="mt-2 rounded bg-blue-500/10 print:bg-blue-50 px-2 py-1.5 text-[10px] print:text-[9px] text-blue-100 print:text-blue-900">
                            <strong>Critério selecionado:</strong> {criterio}
                          </div>
                        ) : null}

                        {resposta.observacoes ? (
                          <div className="mt-2 rounded bg-slate-800 print:bg-slate-100 px-2 py-1.5 text-[10px] print:text-[9px] text-slate-300 print:text-slate-700">
                            <strong>Observação/evidência:</strong> {resposta.observacoes}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================ */}
        {/* 7. KPIs ESPECÍFICOS */}
        {/* ============================================ */}
        <section className="print:break-before-page mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">7</div>
            <h2 className="text-sm font-bold text-white print:text-slate-900">KPIs Específicos por Área</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 print:gap-2">
            {Object.entries(KPIS_POR_AREA).filter(([k]) => k !== 'default').map(([area, kpis]) => {
              const areaData = relatorio.scoresPorArea.find(a => a.area === area);
              const status = areaData ? getStatusColor(areaData.score) : getStatusColor(3);
              return (
                <div key={area} className="bg-slate-800 print:bg-slate-50 rounded-lg p-3 print:p-2 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div className="flex items-center justify-between mb-2 print:mb-1">
                    <h4 className="text-[10px] print:text-[9px] font-semibold text-white print:text-slate-900 truncate">{area.split(' ').slice(0, 2).join(' ')}</h4>
                    <span className={`text-xs print:text-[10px] font-bold ${status.text} print:text-slate-700`}>{areaData?.score.toFixed(1) || '-'}</span>
                  </div>
                  <div className="space-y-1.5 print:space-y-1">
                    {kpis.map((kpi, i) => (
                      <div key={i} className="bg-slate-900/50 print:bg-slate-100 rounded p-1.5 print:p-1">
                        <p className="text-[9px] print:text-[8px] text-slate-300 print:text-slate-700">{kpi.kpi}</p>
                        <p className="text-[9px] print:text-[8px] text-blue-400 print:text-blue-600">Meta: {kpi.meta}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================ */}
        {/* 8. MATRIZ DE DEPENDÊNCIAS */}
        {/* ============================================ */}
        <section className="print:break-before-page mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">8</div>
            <h2 className="text-sm font-bold text-white print:text-slate-900">Matriz de Dependências e Sequência</h2>
          </div>

          <div className="bg-slate-800 print:bg-slate-50 rounded-lg p-4 print:p-3 print:border print:border-slate-200 mb-4 print:mb-3" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <h3 className="text-[10px] print:text-[9px] text-slate-400 uppercase tracking-wider mb-3 print:mb-2">Ordem de Implementação</h3>
            <div className="space-y-2 print:space-y-1">
              {MATRIZ_DEPENDENCIAS.sort((a, b) => a.prioridade - b.prioridade).map((item, index) => {
                const areaData = relatorio.scoresPorArea.find(a => a.area.includes(item.area.split(' ')[0]));
                const status = areaData ? getStatusColor(areaData.score) : getStatusColor(0);
                return (
                  <div key={item.area} className="flex items-center gap-3 print:gap-2 bg-slate-900/30 print:bg-slate-100 rounded p-2 print:p-1.5" style={{ pageBreakInside: 'avoid' }}>
                    <div className={`w-6 h-6 print:w-5 print:h-5 rounded ${status.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-[10px] print:text-[9px] font-bold text-white">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] print:text-[10px] font-medium text-white print:text-slate-900">{item.area}</p>
                      <div className="flex gap-3 print:gap-2 text-[9px] print:text-[8px]">
                        {item.depende.length > 0 && <span className="text-slate-500">Depende: {item.depende.join(', ')}</span>}
                        {item.habilita.length > 0 && <span className="text-blue-400 print:text-blue-600">→ {item.habilita.join(', ')}</span>}
                      </div>
                    </div>
                    <span className={`text-xs print:text-[10px] font-semibold ${status.text} print:text-slate-700`}>{areaData?.score.toFixed(1) || '-'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fluxo Visual */}
          <div className="bg-slate-800 print:bg-slate-50 rounded-lg p-4 print:p-3 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <h3 className="text-[10px] print:text-[9px] text-slate-400 uppercase tracking-wider mb-3 print:mb-2">Fluxo de Implementação</h3>
            <div className="flex items-center justify-between">
              {['Estratégia', 'Governança', 'Dados', 'Operações', 'Valor', 'Inovação'].map((fase, i, arr) => (
                <div key={fase} className="flex items-center">
                  <div className="text-center">
                    <div className="w-10 h-10 print:w-8 print:h-8 rounded-lg bg-blue-500/20 print:bg-blue-100 border border-blue-500/50 print:border-blue-300 flex items-center justify-center mb-1">
                      <span className="text-[10px] print:text-[9px] font-bold text-blue-400 print:text-blue-600">{i + 1}</span>
                    </div>
                    <p className="text-[9px] print:text-[8px] text-slate-400 print:text-slate-600">{fase}</p>
                  </div>
                  {i < arr.length - 1 && <ArrowRight className="w-3 h-3 print:w-2 print:h-2 text-slate-600 mx-1 print:mx-0.5" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 9. ROADMAP 12 MESES */}
        {/* ============================================ */}
        <section className="print:break-before-page mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">9</div>
            <h2 className="text-sm font-bold text-white print:text-slate-900">Roadmap Estratégico de 12 Meses</h2>
          </div>

          <div className="grid grid-cols-4 gap-3 print:gap-2 mb-4 print:mb-3">
            {ROADMAP_12_MESES.map((t) => (
              <div key={t.trimestre} className={`bg-${t.cor}-500/10 print:bg-${t.cor}-50 border border-${t.cor}-500/30 print:border-${t.cor}-200 rounded-lg p-3 print:p-2`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div className="flex items-center gap-2 print:gap-1 mb-2 print:mb-1">
                  <span className={`text-[10px] print:text-[9px] font-bold text-${t.cor}-400 print:text-${t.cor}-600 bg-${t.cor}-500/20 print:bg-${t.cor}-100 px-1.5 py-0.5 rounded`}>{t.trimestre}</span>
                  <span className="text-[10px] print:text-[9px] font-semibold text-white print:text-slate-900">{t.titulo}</span>
                </div>
                <div className="space-y-1 print:space-y-0.5 mb-2 print:mb-1">
                  {t.entregas.map((e, i) => (
                    <div key={i} className="flex items-start gap-1 text-[9px] print:text-[8px]">
                      <CheckCircle className={`w-2.5 h-2.5 print:w-2 print:h-2 text-${t.cor}-400 print:text-${t.cor}-600 mt-0.5 flex-shrink-0`} />
                      <span className="text-slate-300 print:text-slate-700">{e}</span>
                    </div>
                  ))}
                </div>
                <div className={`pt-2 print:pt-1 border-t border-${t.cor}-500/20 print:border-${t.cor}-200`}>
                  <p className="text-[8px] print:text-[7px] text-slate-500">Marco:</p>
                  <p className={`text-[9px] print:text-[8px] font-semibold text-${t.cor}-400 print:text-${t.cor}-600`}>{t.marco}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="bg-slate-800 print:bg-slate-50 rounded-lg p-4 print:p-3 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div className="relative">
              <div className="absolute top-3 print:top-2.5 left-0 right-0 h-1 print:h-0.5 bg-gradient-to-r from-amber-500 via-blue-500 to-green-500 rounded-full"></div>
              <div className="flex justify-between relative z-10">
                {['Início', 'Mês 3', 'Mês 6', 'Mês 9', 'Mês 12'].map((m, i) => (
                  <div key={m} className="text-center">
                    <div className="w-6 h-6 print:w-5 print:h-5 rounded-full bg-slate-800 print:bg-white border-2 print:border border-blue-500 flex items-center justify-center mb-1">
                      <span className="text-[8px] print:text-[7px] font-bold text-white print:text-slate-900">{i === 0 ? '→' : i === 4 ? '★' : '•'}</span>
                    </div>
                    <p className="text-[9px] print:text-[8px] text-slate-400 print:text-slate-600">{m}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 10. APÊNDICES METODOLÓGICOS */}
        {/* ============================================ */}
        <section className="print:break-before-page mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">10</div>
            <h2 className="text-sm font-bold text-white print:text-slate-900">Apêndices Metodológicos</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 print:gap-2">
            {/* MIT CISR */}
            <div className="bg-slate-800 print:bg-slate-50 rounded-lg p-3 print:p-2 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div className="flex items-center gap-2 print:gap-1 mb-2 print:mb-1">
                <div className="p-1 rounded bg-blue-500/20 print:bg-blue-100"><Target className="w-3 h-3 print:w-2.5 print:h-2.5 text-blue-400 print:text-blue-600" /></div>
                <div>
                  <h3 className="text-[10px] print:text-[9px] font-bold text-white print:text-slate-900">{FRAMEWORKS.mitcisr.nome}</h3>
                  <p className="text-[8px] print:text-[7px] text-slate-400">{FRAMEWORKS.mitcisr.subtitulo}</p>
                </div>
              </div>
              <p className="text-[9px] print:text-[8px] text-slate-300 print:text-slate-700 mb-1">{FRAMEWORKS.mitcisr.descricao}</p>
              <p className="text-[8px] print:text-[7px] text-slate-500">Ref: {FRAMEWORKS.mitcisr.referencia}</p>
            </div>

            {/* DORA */}
            <div className="bg-slate-800 print:bg-slate-50 rounded-lg p-3 print:p-2 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div className="flex items-center gap-2 print:gap-1 mb-2 print:mb-1">
                <div className="p-1 rounded bg-purple-500/20 print:bg-purple-100"><Zap className="w-3 h-3 print:w-2.5 print:h-2.5 text-purple-400 print:text-purple-600" /></div>
                <div>
                  <h3 className="text-[10px] print:text-[9px] font-bold text-white print:text-slate-900">{FRAMEWORKS.dora.nome}</h3>
                  <p className="text-[8px] print:text-[7px] text-slate-400">{FRAMEWORKS.dora.subtitulo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {FRAMEWORKS.dora.metricas.map((m) => (
                  <div key={m.nome} className="bg-slate-900/50 print:bg-slate-100 rounded p-1">
                    <p className="text-[8px] print:text-[7px] font-medium text-white print:text-slate-900">{m.nome}</p>
                    <p className="text-[7px] print:text-[6px] text-green-400 print:text-green-600">Elite: {m.elite}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* MLOps */}
            <div className="bg-slate-800 print:bg-slate-50 rounded-lg p-3 print:p-2 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div className="flex items-center gap-2 print:gap-1 mb-2 print:mb-1">
                <div className="p-1 rounded bg-green-500/20 print:bg-green-100"><Cpu className="w-3 h-3 print:w-2.5 print:h-2.5 text-green-400 print:text-green-600" /></div>
                <div>
                  <h3 className="text-[10px] print:text-[9px] font-bold text-white print:text-slate-900">{FRAMEWORKS.mlops.nome}</h3>
                  <p className="text-[8px] print:text-[7px] text-slate-400">{FRAMEWORKS.mlops.subtitulo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {FRAMEWORKS.mlops.niveis.map((n) => (
                  <div key={n.n} className="bg-slate-900/50 print:bg-slate-100 rounded p-1">
                    <p className="text-[8px] print:text-[7px] font-bold text-green-400 print:text-green-600">Nível {n.n}: {n.nome}</p>
                    <p className="text-[7px] print:text-[6px] text-slate-400 print:text-slate-600">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FinOps */}
            <div className="bg-slate-800 print:bg-slate-50 rounded-lg p-3 print:p-2 print:border print:border-slate-200" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div className="flex items-center gap-2 print:gap-1 mb-2 print:mb-1">
                <div className="p-1 rounded bg-amber-500/20 print:bg-amber-100"><DollarSign className="w-3 h-3 print:w-2.5 print:h-2.5 text-amber-400 print:text-amber-600" /></div>
                <div>
                  <h3 className="text-[10px] print:text-[9px] font-bold text-white print:text-slate-900">{FRAMEWORKS.finops.nome}</h3>
                  <p className="text-[8px] print:text-[7px] text-slate-400">{FRAMEWORKS.finops.subtitulo}</p>
                </div>
              </div>
              <div className="space-y-1">
                {FRAMEWORKS.finops.pilares.map((p, i) => (
                  <div key={i} className="bg-slate-900/50 print:bg-slate-100 rounded p-1">
                    <p className="text-[8px] print:text-[7px] text-slate-300 print:text-slate-700">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FOOTER */}
        {/* ============================================ */}
        <footer className="border-t border-slate-700 print:border-slate-200 pt-4 mt-8">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 print:text-slate-600">Blueprint IA • Relatório Técnico de Maturidade em Inteligência Artificial</p>
            <p className="text-[10px] text-slate-500 print:text-slate-600">{relatorio.empresa.nome} • {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
            <p className="text-[9px] text-slate-600 print:text-slate-500 mt-1">Baseado no MIT CISR Enterprise AI Maturity Model</p>
          </div>
        </footer>

      </main>

      {/* Print Styles - Otimizado para PDF */}
      <style>{`
        @media print {
          @page { 
            size: A4; 
            margin: 15mm 12mm; 
          }
          
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Quebras de página controladas */
          .print\\:break-before-page { 
            page-break-before: always !important; 
            break-before: page !important;
          }
          
          .print\\:hidden { 
            display: none !important; 
          }
          
          /* Evitar quebras dentro de elementos */
          section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Cards e boxes não devem ser cortados */
          .rounded-lg, .rounded-xl, .rounded {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Títulos nunca devem ficar órfãos */
          h1, h2, h3, h4 {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          
          /* Grids de cards */
          .grid > div {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Tabelas */
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          thead {
            display: table-header-group;
          }
          
          /* Seções principais - garantir espaço suficiente */
          section[class*="print:break-before-page"] {
            padding-top: 10px !important;
          }
          
          /* Evitar páginas quase vazias */
          .mb-8 {
            margin-bottom: 16px !important;
          }
          
          /* Footer sempre no fim */
          footer {
            page-break-before: auto;
            margin-top: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}

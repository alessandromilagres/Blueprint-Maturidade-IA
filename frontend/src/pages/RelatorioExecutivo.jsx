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
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Radar, Doughnut, Bar } from 'react-chartjs-2';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  Users,
  Shield,
  Zap,
  ArrowRight,
  Download,
  FileText,
  Building2,
  Calendar,
  Briefcase,
  BarChart3,
  AlertCircle,
  ChevronRight,
  BookOpen,
  Info
} from 'lucide-react';
import { relatoriosApi } from '../services/api';
import { projecaoFinanceiraRelatorio } from '../utils/roiPorFaturamento';
import { faixaRoiLiquidoMitNivel, formatarMoedaCompacta } from '../utils/metodologiaRoiFinanceiro';
import NotaMetodologiaRoi from '../components/NotaMetodologiaRoi';
import EmpresaLogoRelatorio from '../components/EmpresaLogoRelatorio';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement
);

// Dados financeiros por nível
const NIVEL_FINANCEIRO = {
  1: { crescimento: '-15% a -10%', roi: 'Negativo', investimento: '0.5-1%', tempoROI: '18-24', risco: 'Crítico' },
  2: { crescimento: '-10% a -5%', roi: '50-100%', investimento: '1-2%', tempoROI: '12-18', risco: 'Alto' },
  3: { crescimento: '0% a +5%', roi: '100-200%', investimento: '2-4%', tempoROI: '9-12', risco: 'Moderado' },
  4: { crescimento: '+5% a +15%', roi: '200-400%', investimento: '4-7%', tempoROI: '6-9', risco: 'Baixo' },
  5: { crescimento: '+15% ou mais', roi: '400-800%+', investimento: '7-12%', tempoROI: '3-6', risco: 'Gerenciado' }
};

const BENCHMARK_SETOR = {
  fintech: 3.2, saude: 2.6, tecnologia: 3.5, ecommerce: 3.1, manufatura: 2.4,
  legaltech: 2.3, edtech: 2.8, aifirst: 3.8, agrovert: 2.2, default: 2.8
};

// Diagnósticos em linguagem de negócio
const DIAGNOSTICO_NEGOCIO = {
  'Estratégia e Liderança': {
    baixo: 'Falta visão executiva sobre IA, gerando decisões reativas e risco de investimentos desalinhados.',
    medio: 'Interesse executivo presente, mas sem roadmap estruturado conectado à estratégia.',
    alto: 'Liderança engajada com estratégia de IA clara e governança estabelecida.'
  },
  'Dados e Tecnologia': {
    baixo: 'Dados em silos com qualidade desconhecida. Infraestrutura inadequada para IA.',
    medio: 'Dados parcialmente organizados, infraestrutura básica com gaps de escalabilidade.',
    alto: 'Data lake estruturado, dados governados, infraestrutura cloud pronta para ML.'
  },
  'Valor de Negócio e ROI': {
    baixo: 'Sem métricas de ROI para IA. Investimentos vistos como custo, não valor.',
    medio: 'ROI calculado pontualmente, falta metodologia padronizada de tracking.',
    alto: 'Framework de ROI robusto com business cases e tracking de valor capturado.'
  },
  'Governança e Risco': {
    baixo: 'Sem políticas de IA, exposição a riscos éticos, regulatórios e de segurança.',
    medio: 'Políticas iniciais sem enforcement técnico, consciência de riscos crescente.',
    alto: 'Framework completo de governança com políticas, auditoria e controles.'
  },
  'Pessoas e Cultura': {
    baixo: 'Resistência à mudança, medo de IA, falta de competências e capacitação.',
    medio: 'Abertura moderada, programas de capacitação iniciados com cobertura limitada.',
    alto: 'Cultura de inovação, programa de upskilling robusto, talentos retidos.'
  },
  'Operações e Processos': {
    baixo: 'Processos não documentados, conhecimento tácito, impossível automatizar.',
    medio: 'Processos core documentados sem métricas, automação pontual.',
    alto: 'Processos mapeados com dados rastreáveis, automação inteligente em escala.'
  },
  'default': {
    baixo: 'Área com maturidade inicial necessitando atenção prioritária.',
    medio: 'Fundamentos estabelecidos com oportunidades claras de melhoria.',
    alto: 'Área madura contribuindo positivamente para a transformação.'
  }
};

const PLANO_90_DIAS = [
  {
    fase: 'Sem 1-2', titulo: 'Alinhamento Executivo', cor: 'amber',
    acoes: [
      { acao: 'Workshop de visão de IA com C-Level', responsavel: 'CEO', kpi: '100% participação' },
      { acao: 'Definir sponsor executivo de IA', responsavel: 'CEO', kpi: 'Sponsor nomeado' },
      { acao: 'Aprovar orçamento Fase 1', responsavel: 'CFO', kpi: 'Budget aprovado' }
    ]
  },
  {
    fase: 'Sem 3-4', titulo: 'Governança', cor: 'blue',
    acoes: [
      { acao: 'Estabelecer Comitê de IA', responsavel: 'Sponsor', kpi: 'Comitê formado' },
      { acao: 'Priorizar 5 casos de uso', responsavel: 'Inovação', kpi: '5 casos com ROI' },
      { acao: 'Política de IA generativa', responsavel: 'CISO', kpi: 'Política publicada' }
    ]
  },
  {
    fase: 'Sem 5-8', titulo: 'Fundação Técnica', cor: 'purple',
    acoes: [
      { acao: 'Inventário de dados', responsavel: 'Head Dados', kpi: '80% fontes mapeadas' },
      { acao: 'Arquitetura de referência', responsavel: 'CTO', kpi: 'Arquitetura aprovada' },
      { acao: 'Selecionar plataforma/parceiro', responsavel: 'Inovação', kpi: 'Contrato assinado' }
    ]
  },
  {
    fase: 'Sem 9-12', titulo: 'Pilotos', cor: 'green',
    acoes: [
      { acao: 'Iniciar piloto #1', responsavel: 'PM IA', kpi: 'Piloto em execução' },
      { acao: 'Capacitar 50 colaboradores', responsavel: 'RH', kpi: '50 certificados' },
      { acao: 'Review executivo Go/No-Go', responsavel: 'Sponsor', kpi: 'Decisão documentada' }
    ]
  }
];

function getNivelNumerico(nivel) {
  const mapa = { 'Inicial': 1, 'Oportunista': 2, 'Estruturado': 3, 'Gerenciado': 4, 'Otimizado': 5 };
  return mapa[nivel] || 1;
}

function getStatusColor(score) {
  if (score >= 4) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50', status: 'Saudável', icon: CheckCircle };
  if (score >= 3) return { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', status: 'Adequado', icon: CheckCircle };
  if (score >= 2) return { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', status: 'Atenção', icon: AlertCircle };
  return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', status: 'Crítico', icon: AlertTriangle };
}

function getDiagnostico(area, score) {
  const diag = DIAGNOSTICO_NEGOCIO[area] || DIAGNOSTICO_NEGOCIO['default'];
  if (score < 2.5) return diag.baixo;
  if (score < 3.5) return diag.medio;
  return diag.alto;
}

export default function RelatorioExecutivo() {
  const { id } = useParams();
  const [relatorio, setRelatorio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRelatorio();
  }, [id]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!relatorio) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-bold mb-4">Relatório não encontrado</h2>
          <Link to="/avaliacoes" className="text-amber-400 hover:underline">Voltar</Link>
        </div>
      </div>
    );
  }

  const nivelAtual = getNivelNumerico(relatorio.nivelGeral);
  const nivelMeta = Math.min(nivelAtual + 1, 5);
  const dadosAtuais = NIVEL_FINANCEIRO[nivelAtual];
  const dadosMeta = NIVEL_FINANCEIRO[nivelMeta];
  const finProj = projecaoFinanceiraRelatorio({
    faturamentoAnualProjeto: relatorio.projeto?.faturamentoAnualProjeto,
    scoreGeral: relatorio.scoreGeral
  });
  const benchmark = BENCHMARK_SETOR[relatorio.projeto?.vertical] || BENCHMARK_SETOR.default;
  const gap = (benchmark - relatorio.scoreGeral).toFixed(1);

  // Top 5 gaps
  const top5Gaps = relatorio.scoresPorArea
    .slice().sort((a, b) => a.score - b.score).slice(0, 5)
    .map((area, i) => ({ ...area, rank: i + 1, status: getStatusColor(area.score), diag: getDiagnostico(area.area, area.score) }));

  const cenarios = finProj.usaFaturamento
    ? [
        { nome: 'Conservador', cor: 'amber', destaque: false, ...finProj.cenarios.conservador },
        { nome: 'Base', cor: 'blue', destaque: true, ...finProj.cenarios.base },
        { nome: 'Agressivo', cor: 'green', destaque: false, ...finProj.cenarios.agressivo }
      ]
    : [
        { nome: 'Conservador', cor: 'amber', roiLiquidoPct: Math.round(parseFloat(dadosMeta.roi) * 0.6) || 30, payback: parseInt(dadosMeta.tempoROI, 10) + 6, destaque: false },
        { nome: 'Base', cor: 'blue', roiLiquidoPct: Math.round(parseFloat(dadosMeta.roi)) || 100, payback: parseInt(dadosMeta.tempoROI, 10), destaque: true },
        { nome: 'Agressivo', cor: 'green', roiLiquidoPct: Math.round(parseFloat(dadosMeta.roi) * 1.5) || 150, payback: Math.max(3, parseInt(dadosMeta.tempoROI, 10) - 3), destaque: false }
      ];
  const roiLiquidoBase = finProj.cenarios?.base?.roiLiquidoPct;

  // Radar data
  const radarData = {
    labels: relatorio.scoresPorArea.slice(0, 8).map(a => a.area.split(' ')[0]),
    datasets: [{
      label: 'Score',
      data: relatorio.scoresPorArea.slice(0, 8).map(a => a.score),
      backgroundColor: 'rgba(251, 191, 36, 0.2)',
      borderColor: 'rgba(251, 191, 36, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(251, 191, 36, 1)',
    }, {
      label: 'Benchmark',
      data: relatorio.scoresPorArea.slice(0, 8).map(() => benchmark),
      backgroundColor: 'transparent',
      borderColor: 'rgba(100, 116, 139, 0.5)',
      borderWidth: 1,
      borderDash: [4, 4],
      pointRadius: 0,
    }]
  };

  const radarOptions = {
    scales: {
      r: {
        min: 0, max: 5,
        ticks: { stepSize: 1, color: '#64748b', font: { size: 9 } },
        pointLabels: { font: { size: 9 }, color: '#94a3b8' },
        grid: { color: 'rgba(100, 116, 139, 0.2)' },
      }
    },
    plugins: { legend: { display: false } },
    maintainAspectRatio: true,
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white print:bg-white print:text-slate-900">
      {/* Header - não imprime */}
      <header className="bg-slate-800 border-b border-slate-700 print:hidden sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/relatorios/${id}`} className="p-1.5 hover:bg-slate-700 rounded-lg">
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-amber-400">Relatório Executivo</h1>
              <p className="text-xs text-slate-400">
                {relatorio.empresa.nome}
                {relatorio.projetoVersao?.titulo ? ` · ${relatorio.projetoVersao.titulo}` : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <Link to={`/relatorios/${id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded text-xs font-medium">
              <FileText className="w-3.5 h-3.5" /> Completo
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6 print:space-y-4 print:py-0 print:px-8">
        
        {/* PÁGINA 1: Capa + Executive Summary */}
        <section className="print:page-break-after">
          {/* Capa */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 mb-6 print:bg-gradient-to-br print:from-slate-100 print:to-white print:border print:border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-400 print:text-slate-500 uppercase tracking-wider mb-1">Relatório Executivo</p>
                <h1 className="text-xl font-bold text-amber-400 print:text-amber-600">Maturidade em IA</h1>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                {relatorio.empresaLogoDisponivel && relatorio.empresaId && (
                  <EmpresaLogoRelatorio
                    empresaId={relatorio.empresaId}
                    empresaLogoDisponivel={relatorio.empresaLogoDisponivel}
                    className="max-h-14 max-w-[180px] print:max-h-16"
                    alt={`Logo ${relatorio.empresa.nome}`}
                  />
                )}
                <p className="text-sm font-semibold text-white print:text-slate-900">{relatorio.empresa.nome}</p>
                <p className="text-xs text-slate-400">{relatorio.projeto.nome}</p>
                <p className="text-[11px] text-amber-300 print:text-amber-700">{relatorio.projetoVersao?.titulo || 'Versão 1'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 print:text-slate-500">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(relatorio.avaliacao.createdAt).toLocaleDateString('pt-BR')}</span>
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {relatorio.projeto?.vertical || 'Tecnologia'}</span>
            </div>
          </div>

          {/* Executive Summary - Cards */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {/* Score Atual */}
            <div className="bg-slate-800 print:bg-slate-50 print:border print:border-slate-200 rounded-lg p-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Score Atual</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white print:text-slate-900">{relatorio.scoreGeral.toFixed(1)}</span>
                <span className="text-xs text-slate-400">/5.0</span>
              </div>
              <p className="text-xs font-medium text-amber-400 print:text-amber-600 mt-0.5">{relatorio.nivelGeral}</p>
            </div>

            {/* Benchmark */}
            <div className="bg-slate-800 print:bg-slate-50 print:border print:border-slate-200 rounded-lg p-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Benchmark</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white print:text-slate-900">{benchmark.toFixed(1)}</span>
                <span className="text-xs text-slate-400">/5.0</span>
              </div>
              <p className={`text-xs font-medium mt-0.5 ${parseFloat(gap) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {parseFloat(gap) > 0 ? `Gap: -${gap}` : `Acima: +${Math.abs(parseFloat(gap))}`}
              </p>
            </div>

            {/* ROI líquido (cenário base) */}
            <div className="bg-slate-800 print:bg-slate-50 print:border print:border-slate-200 rounded-lg p-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">ROI líquido (base)</p>
              <p className="text-2xl font-bold text-green-400 print:text-green-600">
                {finProj.usaFaturamento && roiLiquidoBase != null
                  ? `${roiLiquidoBase.toFixed(0)}%`
                  : dadosMeta.roi}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {finProj.usaFaturamento ? 'ganho líquido ÷ investimento' : `benchmark MIT nível ${nivelMeta}`}
              </p>
            </div>

            {/* Investimento */}
            <div className="bg-amber-500/10 print:bg-amber-50 border border-amber-500/30 print:border-amber-200 rounded-lg p-4">
              <p className="text-[10px] text-amber-400 print:text-amber-600 uppercase tracking-wider mb-1">Investimento</p>
              <p className="text-2xl font-bold text-white print:text-slate-900">
                {finProj.usaFaturamento
                  ? `${((finProj.investimentoAnualReferencia / finProj.faturamentoAnualProjeto) * 100).toFixed(1)}%`
                  : dadosMeta.investimento}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {finProj.usaFaturamento ? 'do faturamento anual do projeto' : 'do faturamento'}
              </p>
            </div>
          </div>

          {/* Radar + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 print:bg-slate-50 print:border print:border-slate-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-slate-300 print:text-slate-700 mb-3 uppercase tracking-wider">Mapa de Maturidade</h3>
              <div className="w-full max-w-[200px] mx-auto">
                <Radar data={radarData} options={radarOptions} />
              </div>
            </div>

            <div className="bg-slate-800 print:bg-slate-50 print:border print:border-slate-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-slate-300 print:text-slate-700 mb-3 uppercase tracking-wider">Indicadores de Saúde</h3>
              <div className="space-y-2">
                {relatorio.scoresPorArea.slice(0, 6).map((area) => {
                  const status = getStatusColor(area.score);
                  return (
                    <div key={area.area} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${status.bg}`}></div>
                      <span className="text-[11px] text-slate-300 print:text-slate-600 flex-1 truncate">{area.area}</span>
                      <span className={`text-[11px] font-semibold ${status.text}`}>{area.score.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-700 print:border-slate-200">
                <div className="flex items-center gap-1 text-[10px]"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-slate-400">Saudável</span></div>
                <div className="flex items-center gap-1 text-[10px]"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-slate-400">Atenção</span></div>
                <div className="flex items-center gap-1 text-[10px]"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-slate-400">Crítico</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* PÁGINA 2: Top 5 Gaps */}
        <section className="print:page-break-before print:page-break-after">
          <div className="bg-slate-800 print:bg-white print:border print:border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-bold text-white print:text-slate-900">Top 5 Gaps Prioritários</h2>
              <span className="text-[10px] text-slate-400 ml-1">Diagnóstico executivo</span>
            </div>

            <div className="space-y-3">
              {top5Gaps.map((gap) => (
                <div key={gap.area} className={`rounded-lg p-3 border ${gap.status.light} print:bg-opacity-50 border-slate-700 print:border-slate-200`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg ${gap.status.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xs font-bold text-white">#{gap.rank}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-semibold text-white print:text-slate-900 truncate">{gap.area}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${gap.status.text}`}>{gap.score.toFixed(1)}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${gap.status.light} ${gap.status.text} print:bg-opacity-50`}>
                            {gap.status.status}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-700 print:bg-slate-200 rounded-full h-1 mb-2">
                        <div className={`h-1 rounded-full ${gap.status.bg}`} style={{ width: `${(gap.score / 5) * 100}%` }} />
                      </div>
                      <p className="text-[11px] text-slate-300 print:text-slate-600 leading-relaxed">{gap.diag}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PÁGINA 3: Cenários Financeiros */}
        <section className="print:page-break-before print:page-break-after">
          <div className="bg-slate-800 print:bg-white print:border print:border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-green-400" />
              <h2 className="text-sm font-bold text-white print:text-slate-900">Projeção de Impacto Financeiro</h2>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {cenarios.map((c) => (
                <div 
                  key={c.nome} 
                  className={`rounded-lg p-4 border ${
                    c.destaque 
                      ? `bg-${c.cor}-500/10 border-${c.cor}-500/50 ring-1 ring-${c.cor}-500/30` 
                      : `bg-slate-900/50 print:bg-slate-50 border-slate-700 print:border-slate-200`
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className={`w-2 h-2 rounded-full bg-${c.cor}-500`}></div>
                    <span className={`text-xs font-semibold text-${c.cor}-400 print:text-${c.cor}-600`}>{c.nome}</span>
                    {c.destaque && <span className="text-[9px] bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded ml-1">Recomendado</span>}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-slate-400">ROI líquido</p>
                      <p className={`text-xl font-bold text-${c.cor}-400 print:text-${c.cor}-600`}>
                        {c.roiLiquidoPct != null ? `${Math.round(c.roiLiquidoPct)}%` : '—'}
                      </p>
                    </div>
                    {finProj.usaFaturamento && (
                      <>
                        <div>
                          <p className="text-[10px] text-slate-400">Benefício bruto 12m</p>
                          <p className="text-sm font-medium text-white print:text-slate-900">
                            {formatarMoedaCompacta(c.beneficioBrutoAnual)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">Ganho líquido 12m</p>
                          <p className="text-sm font-medium text-white print:text-slate-900">
                            {formatarMoedaCompacta(c.ganhoLiquidoAnual)}
                          </p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-[10px] text-slate-400">Payback</p>
                      <p className="text-sm font-medium text-white print:text-slate-900">{c.payback} meses</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900/50 print:bg-slate-50 rounded-lg p-3 mb-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Comparativo ROI líquido</p>
              <div className="space-y-1.5">
                {cenarios.map((c) => {
                  const roi = c.roiLiquidoPct ?? 0;
                  const maxRoi = Math.max(...cenarios.map((x) => x.roiLiquidoPct ?? 0), 1);
                  return (
                  <div key={c.nome} className="flex items-center gap-2">
                    <span className="w-20 text-[10px] text-slate-400">{c.nome}</span>
                    <div className="flex-1 bg-slate-700 print:bg-slate-200 rounded-full h-4 overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r from-${c.cor}-600 to-${c.cor}-400 flex items-center justify-end pr-2`}
                        style={{ width: `${Math.min(100, (roi / maxRoi) * 100)}%` }}
                      >
                        <span className="text-[10px] font-bold text-white">{Math.round(roi)}%</span>
                      </div>
                    </div>
                  </div>
                );})}
              </div>
            </div>

            <NotaMetodologiaRoi className="mb-4" />
            <div className="bg-blue-500/5 print:bg-blue-50 border border-blue-500/20 print:border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-blue-400 print:text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-blue-400 print:text-blue-700 uppercase tracking-wider mb-2">Metodologia e Fontes</p>
                  
                  <div className="space-y-2 text-[9px] text-slate-400 print:text-slate-600">
                    <p>
                      <span className="font-medium text-slate-300 print:text-slate-700">Consultoria e metodologia:</span> Relatório produzido pela{' '}
                      <span className="text-blue-400 print:text-blue-600">SysMap Solutions</span> com a metodologia{' '}
                      <span className="text-blue-400 print:text-blue-600">SysMap Blueprint IA</span>, que integra referências públicas reconhecidas.
                    </p>
                    <p>
                      <span className="font-medium text-slate-300 print:text-slate-700">Fontes dos benchmarks:</span> As faixas de ROI e crescimento são baseadas em estudos publicados pelo 
                      <span className="text-blue-400 print:text-blue-600"> MIT CISR - Center for Information Systems Research</span> (Weill, Woerner & Sebastian, 2024) e 
                      <span className="text-blue-400 print:text-blue-600"> McKinsey Global Institute</span> "The State of AI in 2024". 
                      Dados complementares do <span className="text-blue-400 print:text-blue-600">Gartner AI Maturity Model</span> e pesquisas setoriais específicas.
                    </p>
                    
                    <p>
                      <span className="font-medium text-slate-300 print:text-slate-700">Conversão do score:</span> O score de maturidade (1-5) é mapeado para faixas de impacto financeiro 
                      conforme a progressão típica observada nos estudos. Nível {nivelAtual} corresponde a empresas em fase de {nivelAtual <= 2 ? 'experimentação' : nivelAtual <= 3 ? 'estruturação' : 'industrialização'}, 
                      com {dadosAtuais.crescimento} vs. mercado e {faixaRoiLiquidoMitNivel(nivelAtual) || `ROI típico de ${dadosAtuais.roi}`}.
                    </p>
                    
                    <p className="italic border-t border-slate-700 print:border-slate-200 pt-2 mt-2">
                      <span className="font-medium text-amber-400 print:text-amber-700">⚠ Nota importante:</span> As projeções apresentadas são <span className="font-medium">referenciais baseados em benchmarks de mercado</span>, 
                      não constituem promessas contratuais. Resultados reais dependem de fatores como execução, contexto setorial, investimento e maturidade organizacional.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PÁGINA 4: Plano 90 Dias */}
        <section className="print:page-break-before print:page-break-after">
          <div className="bg-slate-800 print:bg-white print:border print:border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white print:text-slate-900">Plano de Ação 90 Dias</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PLANO_90_DIAS.map((fase) => (
                <div key={fase.fase} className={`bg-${fase.cor}-500/5 print:bg-${fase.cor}-50 border border-${fase.cor}-500/20 print:border-${fase.cor}-200 rounded-lg p-3`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold text-${fase.cor}-400 print:text-${fase.cor}-600 bg-${fase.cor}-500/20 px-1.5 py-0.5 rounded`}>
                      {fase.fase}
                    </span>
                    <span className="text-xs font-semibold text-white print:text-slate-900">{fase.titulo}</span>
                  </div>
                  <div className="space-y-1.5">
                    {fase.acoes.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px]">
                        <ChevronRight className={`w-3 h-3 text-${fase.cor}-400 mt-0.5 flex-shrink-0`} />
                        <div className="flex-1">
                          <p className="text-slate-300 print:text-slate-700">{a.acao}</p>
                          <p className="text-slate-500 print:text-slate-500">{a.responsavel} • {a.kpi}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PÁGINA 5: Roadmap + Call to Action */}
        <section className="print:page-break-before">
          {/* Roadmap */}
          <div className="bg-slate-800 print:bg-white print:border print:border-slate-200 rounded-xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white print:text-slate-900">Roadmap 12 Meses</h2>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { fase: '0-3m', titulo: 'Fundação', cor: 'amber', itens: ['Estratégia', 'Governança', 'Quick wins'] },
                { fase: '3-6m', titulo: 'Pilotos', cor: 'blue', itens: ['POCs', 'Validação ROI', 'Capacitação'] },
                { fase: '6-12m', titulo: 'Escala', cor: 'purple', itens: ['Industrialização', 'MLOps', 'Expansão'] },
                { fase: '12m+', titulo: 'Inovação', cor: 'green', itens: ['Inovação contínua', 'Diferencial', 'Liderança'] }
              ].map((f, i) => (
                <div key={f.fase} className="text-center">
                  <div className={`w-10 h-10 rounded-xl bg-${f.cor}-500 mx-auto mb-2 flex items-center justify-center`}>
                    <span className="text-sm font-bold text-white">{i + 1}</span>
                  </div>
                  <p className={`text-[10px] font-bold text-${f.cor}-400`}>{f.titulo}</p>
                  <p className="text-[9px] text-slate-400 mb-1">{f.fase}</p>
                  <div className="space-y-0.5">
                    {f.itens.map((item) => (
                      <p key={item} className="text-[9px] text-slate-400">{item}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 print:from-amber-50 print:to-amber-100 border border-amber-500/20 print:border-amber-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-amber-400 print:text-amber-600">Os 3 Pedidos para o C-Level</h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: CheckCircle, titulo: 'Patrocínio', desc: 'Aprovação do roadmap e comunicação oficial', cor: 'amber' },
                { icon: DollarSign, titulo: 'Orçamento', desc: `${dadosMeta.investimento} para Fases 1-2, ROI em ${dadosMeta.tempoROI}m`, cor: 'green' },
                { icon: Shield, titulo: 'Governança', desc: 'Indicação de líderes para comitê de IA', cor: 'blue' }
              ].map((p) => (
                <div key={p.titulo} className="bg-slate-800/80 print:bg-white print:border print:border-slate-200 rounded-lg p-3">
                  <p.icon className={`w-5 h-5 text-${p.cor}-400 mb-2`} />
                  <p className="text-xs font-bold text-white print:text-slate-900 mb-1">{p.titulo}</p>
                  <p className="text-[10px] text-slate-400 print:text-slate-600">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t border-slate-700 print:border-slate-200">
            <p className="text-[10px] text-slate-500">Blueprint IA · SysMap Solutions · Referência MIT CISR</p>
            <p className="text-[10px] text-slate-500">{relatorio.empresa.nome} • {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })}</p>
          </div>
        </section>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:page-break-before { page-break-before: always; }
          .print\\:page-break-after { page-break-after: always; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

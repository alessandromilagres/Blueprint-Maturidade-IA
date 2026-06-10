import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut, Radar, Line } from 'react-chartjs-2';
import { 
  FolderKanban, Package, Building2, ArrowLeft, Trophy, Target,
  Zap, Users, CheckCircle, TrendingUp, ChevronDown, ChevronUp, 
  BarChart3, Activity, Award, Eye, Moon, Sun, Bot, Layers,
  AlertCircle, ThumbsUp, Clock, Star, Sparkles, DollarSign, Calendar, Percent
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

function formatCurrency(value) {
  if (!value) return 'R$ 0';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

const STATUS_CONSTRUCAO_CONFIG = {
  planejado: { label: '📋 Planejado', color: 'bg-gray-500', textColor: 'text-gray-400' },
  em_construcao: { label: '🔧 Em Construção', color: 'bg-blue-500', textColor: 'text-blue-400' },
  em_teste: { label: '🧪 Em Teste', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  ativo: { label: '✅ Ativo', color: 'bg-green-500', textColor: 'text-green-400' },
  suspenso: { label: '⏸️ Suspenso', color: 'bg-red-500', textColor: 'text-red-400' },
  cancelado: { label: '❌ Cancelado', color: 'bg-gray-400', textColor: 'text-gray-300' },
};

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement, 
  RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend
);

const FAROL_COLORS = {
  gray: { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400', solid: 'bg-gray-500', hex: '#6b7280' },
  red: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', solid: 'bg-red-500', hex: '#ef4444' },
  orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400', solid: 'bg-orange-500', hex: '#f97316' },
  yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', solid: 'bg-yellow-500', hex: '#eab308' },
  green: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', solid: 'bg-green-500', hex: '#22c55e' },
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', solid: 'bg-emerald-500', hex: '#10b981' },
};

function FarolIndicador({ farol, label, size = 'md', showLabel = true }) {
  const colors = FAROL_COLORS[farol?.cor] || FAROL_COLORS.gray;
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg'
  };
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className={`${sizeClasses[size]} rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center`}
        title={`${label}: ${farol?.nivel || 'N/A'}`}
      >
        <span>{farol?.emoji || '⚪'}</span>
      </div>
      {showLabel && label && <span className={`text-[10px] ${colors.text} font-medium text-center`}>{label}</span>}
    </div>
  );
}

function ScoreGauge({ score, label, size = 'md' }) {
  const getColor = () => {
    if (score >= 4) return { text: 'text-emerald-400', bg: 'rgba(16, 185, 129, 0.8)' };
    if (score >= 3) return { text: 'text-green-400', bg: 'rgba(34, 197, 94, 0.8)' };
    if (score >= 2) return { text: 'text-yellow-400', bg: 'rgba(234, 179, 8, 0.8)' };
    if (score > 0) return { text: 'text-orange-400', bg: 'rgba(249, 115, 22, 0.8)' };
    return { text: 'text-gray-400', bg: 'rgba(107, 114, 128, 0.8)' };
  };
  
  const colors = getColor();
  const percentage = (score / 5) * 100;
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24'
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className={`${sizeClasses[size]} relative`}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="#334155"
            strokeWidth="8"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke={colors.bg}
            strokeWidth="8"
            strokeDasharray={`${percentage * 2.83} 283`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${colors.text}`}>{score?.toFixed(1) || '0'}</span>
        </div>
      </div>
      {label && <span className="text-xs text-slate-400 mt-1">{label}</span>}
    </div>
  );
}

function RankingBadge({ posicao, size = 'md' }) {
  if (!posicao) return null;
  
  const badges = {
    1: { bg: 'bg-gradient-to-br from-yellow-400 to-amber-600', icon: '🥇', shadow: 'shadow-amber-500/30' },
    2: { bg: 'bg-gradient-to-br from-gray-300 to-gray-500', icon: '🥈', shadow: 'shadow-gray-400/30' },
    3: { bg: 'bg-gradient-to-br from-amber-600 to-amber-800', icon: '🥉', shadow: 'shadow-amber-600/30' },
  };
  
  const badge = badges[posicao] || { bg: 'bg-slate-600', icon: `#${posicao}`, shadow: '' };
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };
  
  return (
    <div className={`${sizeClasses[size]} rounded-full ${badge.bg} flex items-center justify-center text-white font-bold shadow-lg ${badge.shadow}`}>
      {typeof badge.icon === 'string' && badge.icon.startsWith('#') 
        ? <span className="text-xs">{badge.icon}</span>
        : <span>{badge.icon}</span>
      }
    </div>
  );
}

function ProdutoDetalhadoCard({ produto, perguntasObrigatorias }) {
  const [expanded, setExpanded] = useState(false);
  
  const getScoreColor = (score) => {
    if (!score || score === 0) return 'text-gray-400';
    if (score >= 4) return 'text-emerald-400';
    if (score >= 3) return 'text-green-400';
    if (score >= 2) return 'text-yellow-400';
    return 'text-orange-400';
  };
  
  const getScoreBgColor = (score) => {
    if (!score || score === 0) return 'bg-gray-500';
    if (score >= 4) return 'bg-emerald-500';
    if (score >= 3) return 'bg-green-500';
    if (score >= 2) return 'bg-yellow-500';
    return 'bg-orange-500';
  };
  
  const radarData = produto.scoresPorVertical?.filter(v => v.score > 0).length > 0 ? {
    labels: produto.scoresPorVertical.filter(v => v.score > 0).map(v => v.nome.split('(')[0].trim().substring(0, 12)),
    datasets: [{
      label: 'Score',
      data: produto.scoresPorVertical.filter(v => v.score > 0).map(v => v.score),
      backgroundColor: 'rgba(168, 85, 247, 0.2)',
      borderColor: 'rgba(168, 85, 247, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(168, 85, 247, 1)',
    }]
  } : null;
  
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <div 
        className="p-5 cursor-pointer hover:bg-slate-700/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          <RankingBadge posicao={produto.classificacao} size="lg" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-semibold text-lg">{produto.nome}</h3>
                <p className="text-slate-400 text-sm line-clamp-1">{produto.descricao || 'Sem descrição'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-bold ${getScoreColor(produto.scoreRelevancia)}`}>
                  {produto.scoreRelevancia?.toFixed(1) || '0.0'}
                </span>
                <span className="text-slate-500 text-sm">/5</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <FarolIndicador farol={produto.farois?.transformacao} label="Transform." size="md" />
                <FarolIndicador farol={produto.farois?.potencial} label="Potencial" size="md" />
                <FarolIndicador farol={produto.farois?.maturidade} label="Maturidade" size="md" />
                <FarolIndicador farol={produto.farois?.urgencia} label="Urgência" size="md" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-indigo-400">
                    <Bot className="w-4 h-4" />
                    <span>Transform: {produto.scoreObrigatorio?.toFixed(1) || '0'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-purple-400">
                    <Layers className="w-4 h-4" />
                    <span>Verticais: {produto.scoreVerticais?.toFixed(1) || '0'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>{produto.totalAvaliacoes} avaliação(ões)</span>
                  </div>
                </div>
              </div>
              
              <button className="p-2 hover:bg-slate-600 rounded-lg transition-colors">
                {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-700">
          <div className="grid grid-cols-3 gap-6 pt-5">
            {/* Scores das Perguntas Obrigatórias */}
            <div className="col-span-2">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                Score de Transformação Agêntica (8 Perguntas)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {produto.scoresPorPerguntaObrigatoria?.map((pergunta) => (
                  <div key={pergunta.perguntaId} className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                        {pergunta.categoria}
                      </span>
                      <span className={`text-lg font-bold ${getScoreColor(pergunta.score)}`}>
                        {pergunta.score?.toFixed(1) || '0'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{pergunta.texto}</p>
                    <div className="w-full h-1.5 bg-slate-600 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getScoreBgColor(pergunta.score)}`}
                        style={{ width: `${(pergunta.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Radar das Verticais */}
            <div>
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                Verticais Avaliadas
              </h4>
              {radarData ? (
                <div className="h-48">
                  <Radar 
                    data={radarData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          beginAtZero: true,
                          max: 5,
                          ticks: { stepSize: 1, color: '#64748b', font: { size: 8 } },
                          pointLabels: { color: '#94a3b8', font: { size: 9 } },
                          grid: { color: 'rgba(148, 163, 184, 0.1)' },
                          angleLines: { color: 'rgba(148, 163, 184, 0.1)' }
                        }
                      },
                      plugins: { legend: { display: false } }
                    }} 
                  />
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
                  Nenhuma vertical avaliada
                </div>
              )}
              
              {/* Lista de Verticais */}
              <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                {produto.scoresPorVertical?.filter(v => v.score > 0).map((vertical) => (
                  <div key={vertical.verticalId} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate">{vertical.icone} {vertical.nome.split('(')[0].trim()}</span>
                    <span className={`font-medium ${getScoreColor(vertical.score)}`}>{vertical.score?.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Avaliadores */}
          {produto.avaliadores?.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-700">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Avaliadores ({produto.totalAvaliacoes})
              </h4>
              <div className="grid grid-cols-4 gap-3">
                {produto.avaliadores.map((av, idx) => (
                  <div key={idx} className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-white text-sm font-medium truncate">{av.nome}</p>
                    <p className="text-slate-400 text-xs truncate">{av.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-sm font-bold ${getScoreColor(av.scoreRelevancia)}`}>
                        {av.scoreRelevancia?.toFixed(1) || '-'}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {new Date(av.dataAvaliacao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Link para Dashboard Completo */}
          <div className="mt-4 flex justify-end">
            <Link 
              to={`/dashboard/produto/${produto.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Eye className="w-4 h-4" />
              Ver Dashboard Completo do Produto
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardProjetoProdutos() {
  const { id } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [financeiro, setFinanceiro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFinanceiro, setShowFinanceiro] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    loadDashboard();
  }, [id]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [dashData, finData] = await Promise.all([
        dashboardApi.projetoProdutos(id),
        dashboardApi.projetoFinanceiro(id)
      ]);
      setDashboard(dashData);
      setFinanceiro(finData);
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
          <h2 className="text-xl font-semibold">Projeto não encontrado</h2>
          <Link to="/dashboard/projetos-ranking" className="text-blue-400 hover:underline mt-2 inline-block">
            Voltar para Dashboard de Projetos
          </Link>
        </div>
      </div>
    );
  }

  const { projeto, empresa, metricas, produtos, analises, perguntasObrigatorias, verticais } = dashboard;

  const getScoreColor = (score) => {
    if (!score || score === 0) return 'text-gray-400';
    if (score >= 4) return 'text-emerald-400';
    if (score >= 3) return 'text-green-400';
    if (score >= 2) return 'text-yellow-400';
    return 'text-orange-400';
  };

  // Gráfico de barras comparativo de produtos
  const produtosChartData = {
    labels: produtos.slice(0, 10).map(p => p.nome.substring(0, 20) + (p.nome.length > 20 ? '...' : '')),
    datasets: [
      {
        label: 'Transformação',
        data: produtos.slice(0, 10).map(p => p.scoreObrigatorio),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderRadius: 4,
      },
      {
        label: 'Verticais',
        data: produtos.slice(0, 10).map(p => p.scoreVerticais),
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
        borderRadius: 4,
      },
      {
        label: 'Relevância',
        data: produtos.slice(0, 10).map(p => p.scoreRelevancia),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderRadius: 4,
      }
    ]
  };

  // Gráfico de análise por pergunta obrigatória
  const perguntasChartData = {
    labels: analises.scoresMediosPorPergunta.map(p => p.categoria.substring(0, 15)),
    datasets: [{
      label: 'Score Médio',
      data: analises.scoresMediosPorPergunta.map(p => p.scoreMedio),
      backgroundColor: analises.scoresMediosPorPergunta.map(p => {
        if (p.scoreMedio >= 4) return 'rgba(16, 185, 129, 0.7)';
        if (p.scoreMedio >= 3) return 'rgba(34, 197, 94, 0.7)';
        if (p.scoreMedio >= 2) return 'rgba(234, 179, 8, 0.7)';
        return 'rgba(249, 115, 22, 0.7)';
      }),
      borderRadius: 6,
    }]
  };

  // Radar de verticais do projeto
  const verticaisComScore = analises.scoresMediosPorVertical.filter(v => v.scoreMedio > 0);
  const verticaisRadarData = verticaisComScore.length > 0 ? {
    labels: verticaisComScore.map(v => v.nome.split('(')[0].trim().substring(0, 12)),
    datasets: [{
      label: 'Score Médio do Projeto',
      data: verticaisComScore.map(v => v.scoreMedio),
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
    }]
  } : null;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard/projetos-ranking" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                  <Building2 className="w-4 h-4" />
                  <span>{empresa?.nome}</span>
                </div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <FolderKanban className="w-6 h-6 text-purple-400" />
                  {projeto?.nome}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{metricas?.scoreMedio?.toFixed(1) || '0.0'}</p>
                  <p className="text-xs text-slate-400">Score Médio</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">{metricas?.produtosAvaliados || 0}</p>
                  <p className="text-xs text-slate-400">Avaliados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{metricas?.totalProdutos || 0}</p>
                  <p className="text-xs text-slate-400">Produtos</p>
                </div>
              </div>
              
              <div className="w-24">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Progresso</span>
                  <span>{metricas?.progressoAvaliacao || 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ width: `${metricas?.progressoAvaliacao || 0}%` }}
                  />
                </div>
              </div>
              
              <Link
                to={`/dashboard/projeto-financeiro/${id}`}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                Dashboard Financeiro
              </Link>
              
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Cards de Métricas Rápidas */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${getScoreColor(metricas?.scoreMedio)}`}>
                  {metricas?.scoreMedio?.toFixed(1) || '0.0'}
                </p>
                <p className="text-xs text-slate-400">Score Médio</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-400">
                  {(produtos.reduce((acc, p) => acc + (p.scoreObrigatorio || 0), 0) / Math.max(produtos.filter(p => p.scoreObrigatorio > 0).length, 1)).toFixed(1)}
                </p>
                <p className="text-xs text-slate-400">Transformação</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Layers className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">
                  {(produtos.reduce((acc, p) => acc + (p.scoreVerticais || 0), 0) / Math.max(produtos.filter(p => p.scoreVerticais > 0).length, 1)).toFixed(1)}
                </p>
                <p className="text-xs text-slate-400">Verticais</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Star className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">
                  {produtos.filter(p => p.scoreRelevancia >= 4).length}
                </p>
                <p className="text-xs text-slate-400">Top Performers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-400">
                  {produtos.filter(p => p.scoreRelevancia > 0 && p.scoreRelevancia < 3).length}
                </p>
                <p className="text-xs text-slate-400">Atenção</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Dashboard Financeiro Consolidado */}
        {financeiro && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <button
              onClick={() => setShowFinanceiro(!showFinanceiro)}
              className="w-full p-5 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold">Dashboard Financeiro do Projeto</h3>
                  <p className="text-slate-400 text-sm">Custos, ROI, Payback e Projeção de Retornos</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(financeiro.metricas?.retornoAnualTotal)}</p>
                  <p className="text-xs text-slate-400">Retorno Anual Projetado</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-400">{financeiro.metricas?.roiProjetado?.toFixed(0) || 0}%</p>
                  <p className="text-xs text-slate-400">ROI Médio</p>
                </div>
                {showFinanceiro ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
            </button>
            
            {showFinanceiro && (
              <div className="p-5 border-t border-slate-700 space-y-6">
                {/* Cards de Métricas Financeiras */}
                <div className="grid grid-cols-5 gap-4">
                  <div className="bg-slate-700/50 rounded-xl p-4 border border-red-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-red-400" />
                      <span className="text-xs text-slate-400">Custo Total</span>
                    </div>
                    <p className="text-xl font-bold text-red-400">{formatCurrency(financeiro.metricas?.custoTotalEstimado)}</p>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-xl p-4 border border-green-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-slate-400">Retorno Anual</span>
                    </div>
                    <p className="text-xl font-bold text-green-400">{formatCurrency(financeiro.metricas?.retornoAnualTotal)}</p>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-xl p-4 border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-slate-400">ROI Projetado</span>
                    </div>
                    <p className="text-xl font-bold text-blue-400">{financeiro.metricas?.roiProjetado?.toFixed(0) || 0}%</p>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-xl p-4 border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-slate-400">Payback</span>
                    </div>
                    <p className="text-xl font-bold text-purple-400">
                      {financeiro.metricas?.paybackMeses ? `${financeiro.metricas.paybackMeses} meses` : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-xl p-4 border border-cyan-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-slate-400">Retorno Mensal</span>
                    </div>
                    <p className="text-xl font-bold text-cyan-400">{formatCurrency(financeiro.metricas?.retornoMensalMedio)}</p>
                  </div>
                </div>
                
                {/* Status de Construção por Quantidade */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      Status de Construção
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(financeiro.statusCounts || {}).map(([status, count]) => {
                        const config = STATUS_CONSTRUCAO_CONFIG[status] || STATUS_CONSTRUCAO_CONFIG.planejado;
                        return (
                          <div key={status} className="bg-slate-700/50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-white">{count}</p>
                            <p className={`text-xs ${config.textColor}`}>{config.label}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      Custo por Status
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(financeiro.custoPorStatus || {}).filter(([_, custo]) => custo > 0).map(([status, custo]) => {
                        const config = STATUS_CONSTRUCAO_CONFIG[status] || STATUS_CONSTRUCAO_CONFIG.planejado;
                        return (
                          <div key={status} className="bg-slate-700/50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-white">{formatCurrency(custo)}</p>
                            <p className={`text-xs ${config.textColor}`}>{config.label}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Gráfico de Projeção Mensal */}
                {financeiro.projecaoMensal && financeiro.projecaoMensal.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      Projeção Financeira (24 meses)
                    </h4>
                    <div className="h-64">
                      <Line
                        data={{
                          labels: financeiro.projecaoMensal.slice(0, 24).map(m => m.mesLabel),
                          datasets: [
                            {
                              label: 'Custo Mensal',
                              data: financeiro.projecaoMensal.slice(0, 24).map(m => m.custo),
                              borderColor: 'rgba(239, 68, 68, 0.8)',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              fill: true,
                              tension: 0.3,
                            },
                            {
                              label: 'Retorno Mensal',
                              data: financeiro.projecaoMensal.slice(0, 24).map(m => m.retorno),
                              borderColor: 'rgba(34, 197, 94, 0.8)',
                              backgroundColor: 'rgba(34, 197, 94, 0.1)',
                              fill: true,
                              tension: 0.3,
                            },
                            {
                              label: 'Saldo Acumulado',
                              data: financeiro.projecaoMensal.slice(0, 24).map(m => m.saldoAcumulado),
                              borderColor: 'rgba(59, 130, 246, 0.8)',
                              backgroundColor: 'transparent',
                              borderWidth: 2,
                              borderDash: [5, 5],
                              tension: 0.3,
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              ticks: {
                                color: '#94a3b8',
                                callback: (value) => formatCurrency(value)
                              },
                              grid: { color: 'rgba(148, 163, 184, 0.1)' }
                            },
                            x: {
                              ticks: { color: '#94a3b8', font: { size: 9 } },
                              grid: { display: false }
                            }
                          },
                          plugins: {
                            legend: {
                              labels: { color: '#94a3b8', font: { size: 10 } }
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                              }
                            }
                          }
                        }}
                      />
                    </div>
                    
                    {/* Ponto de Break-even */}
                    {financeiro.projecaoMensal.some(m => m.saldoAcumulado > 0) && (
                      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-sm text-green-400">
                          📈 <strong>Break-even estimado:</strong>{' '}
                          {financeiro.projecaoMensal.find(m => m.saldoAcumulado > 0)?.mesLabel || 'Em análise'}
                          {' '}- Momento em que o retorno acumulado supera o investimento total.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Timeline dos Produtos */}
                {financeiro.timeline && financeiro.timeline.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      Timeline de Produtos
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {financeiro.timeline.map((item) => {
                        const statusConfig = STATUS_CONSTRUCAO_CONFIG[item.statusConstrucao] || STATUS_CONSTRUCAO_CONFIG.planejado;
                        return (
                          <div key={item.id} className="bg-slate-700/50 rounded-lg p-3 flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${statusConfig.color}`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{item.nome}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span>Início: {item.dataInicio ? new Date(item.dataInicio).toLocaleDateString('pt-BR') : 'N/A'}</span>
                                <span>Fim: {item.dataFim ? new Date(item.dataFim).toLocaleDateString('pt-BR') : 'N/A'}</span>
                                <span>Ativação: {item.dataAtivacao ? new Date(item.dataAtivacao).toLocaleDateString('pt-BR') : 'N/A'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-400">{formatCurrency(item.retornoAnualEsperado)}/ano</p>
                              <p className="text-xs text-red-400">{formatCurrency(item.custoEstimado)} custo</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Gráficos Analíticos */}
        <div className="grid grid-cols-3 gap-6">
          {/* Comparativo de Produtos */}
          <div className="col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Comparativo de Scores por Produto
            </h3>
            <div className="h-64">
              <Bar 
                data={produtosChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { 
                      max: 5, 
                      beginAtZero: true,
                      ticks: { color: '#94a3b8' },
                      grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: { 
                      ticks: { color: '#94a3b8', font: { size: 9 } },
                      grid: { display: false }
                    }
                  },
                  plugins: { 
                    legend: { 
                      position: 'top',
                      labels: { color: '#94a3b8', font: { size: 10 }, padding: 15 }
                    } 
                  }
                }} 
              />
            </div>
          </div>
          
          {/* Radar de Verticais */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Performance por Vertical
            </h3>
            {verticaisRadarData ? (
              <div className="h-56">
                <Radar 
                  data={verticaisRadarData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 5,
                        ticks: { stepSize: 1, color: '#64748b', font: { size: 8 } },
                        pointLabels: { color: '#94a3b8', font: { size: 9 } },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' },
                        angleLines: { color: 'rgba(148, 163, 184, 0.1)' }
                      }
                    },
                    plugins: { legend: { display: false } }
                  }} 
                />
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-slate-500">
                Nenhuma vertical avaliada
              </div>
            )}
          </div>
        </div>
        
        {/* Análise por Pergunta Obrigatória */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Score Médio por Categoria de Transformação Agêntica
          </h3>
          <div className="h-48">
            <Bar 
              data={perguntasChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                  x: { 
                    max: 5, 
                    beginAtZero: true,
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                  },
                  y: { 
                    ticks: { color: '#94a3b8', font: { size: 10 } },
                    grid: { display: false }
                  }
                },
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>
        
        {/* Lista de Produtos Detalhados */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Ranking Detalhado de Produtos ({produtos.length})
          </h2>
          
          <div className="space-y-4">
            {produtos.length > 0 ? (
              produtos.map((produto) => (
                <ProdutoDetalhadoCard 
                  key={produto.id} 
                  produto={produto} 
                  perguntasObrigatorias={perguntasObrigatorias}
                />
              ))
            ) : (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-white font-semibold mb-2">Nenhum produto cadastrado</h3>
                <p className="text-slate-400 text-sm">
                  Adicione produtos a este projeto para começar as avaliações
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

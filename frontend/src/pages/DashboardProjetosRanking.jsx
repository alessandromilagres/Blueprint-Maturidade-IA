import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  FolderKanban, Package, Building2, ArrowLeft, Trophy, Target,
  Zap, Users, AlertTriangle, CheckCircle, Clock, TrendingUp,
  Filter, ChevronDown, ChevronUp, BarChart3, Activity, Flame,
  Star, Award, Rocket, Eye, Search, Moon, Sun
} from 'lucide-react';
import { dashboardApi, empresasApi } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const FAROL_COLORS = {
  gray: { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400', solid: 'bg-gray-500' },
  red: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', solid: 'bg-red-500' },
  orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400', solid: 'bg-orange-500' },
  yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', solid: 'bg-yellow-500' },
  green: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', solid: 'bg-green-500' },
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', solid: 'bg-emerald-500' },
};

function FarolIndicador({ farol, label, size = 'md' }) {
  const colors = FAROL_COLORS[farol.cor] || FAROL_COLORS.gray;
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className={`${sizeClasses[size]} rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center`}
        title={`${label}: ${farol.nivel}`}
      >
        <span>{farol.emoji}</span>
      </div>
      {label && <span className={`text-[10px] ${colors.text} font-medium`}>{label}</span>}
    </div>
  );
}

function ScoreBar({ score, maxScore = 5 }) {
  const percentage = (score / maxScore) * 100;
  const getColor = () => {
    if (score >= 4) return 'bg-emerald-500';
    if (score >= 3) return 'bg-green-500';
    if (score >= 2) return 'bg-yellow-500';
    if (score > 0) return 'bg-orange-500';
    return 'bg-gray-500';
  };
  
  return (
    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
      <div 
        className={`h-full ${getColor()} rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function RankingBadge({ posicao }) {
  if (!posicao) return null;
  
  const badges = {
    1: { bg: 'bg-gradient-to-br from-yellow-400 to-amber-600', icon: '🥇', shadow: 'shadow-amber-500/30' },
    2: { bg: 'bg-gradient-to-br from-gray-300 to-gray-500', icon: '🥈', shadow: 'shadow-gray-400/30' },
    3: { bg: 'bg-gradient-to-br from-amber-600 to-amber-800', icon: '🥉', shadow: 'shadow-amber-600/30' },
  };
  
  const badge = badges[posicao] || { bg: 'bg-slate-600', icon: `#${posicao}`, shadow: '' };
  
  return (
    <div className={`w-10 h-10 rounded-full ${badge.bg} flex items-center justify-center text-white font-bold shadow-lg ${badge.shadow}`}>
      {typeof badge.icon === 'string' && badge.icon.startsWith('#') 
        ? <span className="text-sm">{badge.icon}</span>
        : <span className="text-lg">{badge.icon}</span>
      }
    </div>
  );
}

function ProdutoCard({ produto, projetoId }) {
  const [expanded, setExpanded] = useState(false);
  
  const getScoreColor = (score) => {
    if (!score || score === 0) return 'text-gray-400';
    if (score >= 4) return 'text-emerald-400';
    if (score >= 3) return 'text-green-400';
    if (score >= 2) return 'text-yellow-400';
    return 'text-orange-400';
  };
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-all">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <RankingBadge posicao={produto.classificacao} />
            <div>
              <h4 className="text-white font-semibold text-sm">{produto.nome}</h4>
              <p className="text-slate-400 text-xs line-clamp-1">{produto.descricao || 'Sem descrição'}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold ${getScoreColor(produto.scoreRelevancia)}`}>
              {produto.scoreRelevancia?.toFixed(1) || '0.0'}
            </span>
            <p className="text-slate-500 text-xs">Relevância</p>
          </div>
        </div>
        
        <ScoreBar score={produto.scoreRelevancia} />
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <FarolIndicador farol={produto.farois.transformacao} label="Transform." size="sm" />
            <FarolIndicador farol={produto.farois.potencial} label="Potencial" size="sm" />
            <FarolIndicador farol={produto.farois.maturidade} label="Maturidade" size="sm" />
            <FarolIndicador farol={produto.farois.urgencia} label="Urgência" size="sm" />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {produto.totalAvaliacoes}
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-slate-700 rounded"
            >
              {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-700/50">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-2 bg-slate-700/30 rounded-lg">
              <p className="text-[10px] text-slate-400 mb-1">Score Transformação</p>
              <p className={`text-lg font-bold ${getScoreColor(produto.scoreObrigatorio)}`}>
                {produto.scoreObrigatorio?.toFixed(1) || '0.0'}
              </p>
            </div>
            <div className="p-2 bg-slate-700/30 rounded-lg">
              <p className="text-[10px] text-slate-400 mb-1">Prioridade</p>
              <p className={`text-sm font-medium ${FAROL_COLORS[produto.farois.urgencia.cor]?.text || 'text-gray-400'}`}>
                {produto.farois.urgencia.emoji} {produto.farois.urgencia.nivel}
              </p>
            </div>
          </div>
          
          {produto.avaliadores?.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-slate-400 mb-1">Avaliadores:</p>
              <div className="flex flex-wrap gap-1">
                {produto.avaliadores.map((av, idx) => (
                  <span key={idx} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                    {av.nome.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <Link 
            to={`/dashboard/produto/${produto.id}`}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-medium transition-colors"
          >
            <Eye className="w-3 h-3" />
            Ver Dashboard Completo
          </Link>
        </div>
      )}
    </div>
  );
}

function ProjetoSection({ projeto }) {
  const [collapsed, setCollapsed] = useState(false);
  
  const statusColors = {
    gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
  };
  
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to={`/dashboard/projeto-produtos/${projeto.id}`}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
              title="Ver dashboard detalhado"
            >
              <FolderKanban className="w-6 h-6 text-white" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link 
                  to={`/dashboard/projeto-produtos/${projeto.id}`}
                  className="text-white font-semibold text-lg hover:text-blue-400 transition-colors"
                >
                  {projeto.nome}
                </Link>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[projeto.status.cor]}`}>
                  {projeto.status.emoji} {projeto.status.texto}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {projeto.empresa?.nome}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {projeto.metricas.totalProdutos} produtos
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {projeto.metricas.produtosAvaliados} avaliados
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{projeto.metricas.scoreMedio?.toFixed(1) || '0.0'}</p>
              <p className="text-xs text-slate-400">Score Médio</p>
            </div>
            
            <div className="w-20">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Progresso</span>
                <span>{projeto.metricas.progressoAvaliacao}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${projeto.metricas.progressoAvaliacao}%` }}
                />
              </div>
            </div>
            
            <Link 
              to={`/dashboard/projeto-produtos/${projeto.id}`}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg text-xs font-medium transition-colors border border-purple-500/30"
            >
              <Eye className="w-3 h-3" />
              Detalhes
            </Link>
            
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {collapsed ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>
      
      {!collapsed && projeto.produtos.length > 0 && (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-slate-300">Ranking de Produtos por Relevância</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projeto.produtos.map((produto) => (
              <ProdutoCard key={produto.id} produto={produto} projetoId={projeto.id} />
            ))}
          </div>
          
          {projeto.produtos.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum produto cadastrado neste projeto</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardProjetosRanking() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [empresas, setEmpresas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { darkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    loadEmpresas();
    loadDashboard();
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [selectedEmpresa]);

  async function loadEmpresas() {
    try {
      const data = await empresasApi.listar();
      setEmpresas(data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  }

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await dashboardApi.projetosRanking(selectedEmpresa || null);
      setDashboard(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProjetos = dashboard?.projetos?.filter(projeto => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return projeto.nome.toLowerCase().includes(term) ||
           projeto.empresa?.nome?.toLowerCase().includes(term) ||
           projeto.produtos.some(p => p.nome.toLowerCase().includes(term));
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const totais = dashboard?.totais || { projetos: 0, produtos: 0, produtosAvaliados: 0, avaliacoesProduto: 0 };

  const chartData = {
    labels: filteredProjetos.slice(0, 8).map(p => p.nome.substring(0, 15) + (p.nome.length > 15 ? '...' : '')),
    datasets: [{
      label: 'Score Médio',
      data: filteredProjetos.slice(0, 8).map(p => p.metricas.scoreMedio),
      backgroundColor: filteredProjetos.slice(0, 8).map(p => {
        const score = p.metricas.scoreMedio;
        if (score >= 4) return 'rgba(16, 185, 129, 0.7)';
        if (score >= 3) return 'rgba(34, 197, 94, 0.7)';
        if (score >= 2) return 'rgba(234, 179, 8, 0.7)';
        return 'rgba(249, 115, 22, 0.7)';
      }),
      borderRadius: 8,
    }]
  };

  const statusDistribution = {
    labels: ['Completo', 'Em Andamento', 'Aguardando', 'Sem Produtos'],
    datasets: [{
      data: [
        filteredProjetos.filter(p => p.status.cor === 'green').length,
        filteredProjetos.filter(p => p.status.cor === 'yellow').length,
        filteredProjetos.filter(p => p.status.cor === 'orange').length,
        filteredProjetos.filter(p => p.status.cor === 'gray').length,
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(100, 116, 139, 0.8)',
      ],
      borderWidth: 0,
    }]
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/projetos" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                  Dashboard de Projetos
                </h1>
                <p className="text-slate-400 text-sm">Ranking de produtos por relevância em IA</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar projeto ou produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-purple-500 w-64"
                />
              </div>
              
              <select
                value={selectedEmpresa}
                onChange={(e) => setSelectedEmpresa(e.target.value)}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">Todas as Empresas</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
              
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
      
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <FolderKanban className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totais.projetos}</p>
                <p className="text-xs text-slate-400">Projetos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totais.produtos}</p>
                <p className="text-xs text-slate-400">Produtos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totais.produtosAvaliados}</p>
                <p className="text-xs text-slate-400">Avaliados</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totais.avaliacoesProduto}</p>
                <p className="text-xs text-slate-400">Avaliações</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Legenda dos Faróis de Relevância
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs">⚡</div>
                <span className="text-sm font-medium text-white">Transformação Agêntica</span>
              </div>
              <p className="text-xs text-slate-400">Mede o nível de automação com agentes de IA autônomos. Baseado nas 8 perguntas universais.</p>
            </div>
            
            <div className="p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs">🚀</div>
                <span className="text-sm font-medium text-white">Potencial de Mercado</span>
              </div>
              <p className="text-xs text-slate-400">Avalia ROI, redução de custos e APIs. Score das verticais específicas do produto.</p>
            </div>
            
            <div className="p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs">✅</div>
                <span className="text-sm font-medium text-white">Maturidade de Avaliação</span>
              </div>
              <p className="text-xs text-slate-400">Indica quantas avaliações foram feitas. Mais avaliadores = dados mais confiáveis.</p>
            </div>
            
            <div className="p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-xs">🔥</div>
                <span className="text-sm font-medium text-white">Urgência de Ação</span>
              </div>
              <p className="text-xs text-slate-400">Priorização baseada em score + avaliações. Indica produtos prontos para próxima fase.</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Score Médio por Projeto
            </h3>
            <div className="h-64">
              <Bar 
                data={chartData} 
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
                      ticks: { color: '#94a3b8', font: { size: 10 } },
                      grid: { display: false }
                    }
                  },
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Status dos Projetos
            </h3>
            <div className="h-48 flex items-center justify-center">
              <Doughnut 
                data={statusDistribution} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { 
                      position: 'bottom',
                      labels: { color: '#94a3b8', font: { size: 10 }, padding: 8 }
                    } 
                  },
                  cutout: '60%'
                }} 
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Projetos e Ranking de Produtos ({filteredProjetos.length})
            </h2>
          </div>
          
          {filteredProjetos.length > 0 ? (
            filteredProjetos.map((projeto) => (
              <ProjetoSection key={projeto.id} projeto={projeto} />
            ))
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
              <FolderKanban className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-white font-semibold mb-2">Nenhum projeto encontrado</h3>
              <p className="text-slate-400 text-sm mb-4">
                {searchTerm ? 'Tente outra busca ou limpe os filtros' : 'Crie um projeto e adicione produtos para começar'}
              </p>
              <Link 
                to="/projetos" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Rocket className="w-4 h-4" />
                Ir para Projetos
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

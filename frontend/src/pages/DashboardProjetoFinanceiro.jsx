import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { 
  FolderKanban, Package, Building2, ArrowLeft, DollarSign, Calendar,
  TrendingUp, Clock, Percent, ChevronDown, ChevronUp, Moon, Sun,
  AlertCircle, CheckCircle, PlayCircle, PauseCircle, XCircle, Target
} from 'lucide-react';
import { dashboardApi, timelineApi } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement, 
  PointElement, LineElement, Filler, Tooltip, Legend
);

const STATUS_CONFIG = {
  planejado: { label: 'Planejado', color: '#6b7280', icon: Calendar, bg: 'bg-gray-500' },
  em_construcao: { label: 'Em Construção', color: '#3b82f6', icon: PlayCircle, bg: 'bg-blue-500' },
  em_teste: { label: 'Em Teste', color: '#f59e0b', icon: AlertCircle, bg: 'bg-yellow-500' },
  ativo: { label: 'Ativo', color: '#22c55e', icon: CheckCircle, bg: 'bg-green-500' },
  suspenso: { label: 'Suspenso', color: '#ef4444', icon: PauseCircle, bg: 'bg-red-500' },
  cancelado: { label: 'Cancelado', color: '#9ca3af', icon: XCircle, bg: 'bg-gray-400' },
};

function formatCurrency(value) {
  if (!value) return 'R$ 0';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

function GanttChart({ tasks }) {
  if (!tasks || tasks.length === 0) return null;
  
  const today = new Date();
  const allDates = tasks.flatMap(t => [
    t.start ? new Date(t.start) : null,
    t.end ? new Date(t.end) : null,
    t.activationDate ? new Date(t.activationDate) : null
  ]).filter(Boolean);
  
  if (allDates.length === 0) return null;
  
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())) - 30 * 24 * 60 * 60 * 1000);
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())) + 60 * 24 * 60 * 60 * 1000);
  const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
  
  const getPosition = (date) => {
    if (!date) return 0;
    const d = new Date(date);
    const days = Math.ceil((d - minDate) / (1000 * 60 * 60 * 24));
    return (days / totalDays) * 100;
  };
  
  const getWidth = (start, end) => {
    if (!start || !end) return 5;
    const s = new Date(start);
    const e = new Date(end);
    const days = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    return Math.max((days / totalDays) * 100, 2);
  };
  
  const todayPosition = getPosition(today);
  
  const months = [];
  let currentMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (currentMonth <= maxDate) {
    months.push({
      label: currentMonth.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      position: getPosition(currentMonth)
    });
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-400" />
        Timeline de Construção (Gantt)
      </h3>
      
      <div className="relative">
        {/* Header com meses */}
        <div className="relative h-8 mb-2 border-b border-slate-600">
          {months.map((month, idx) => (
            <div
              key={idx}
              className="absolute text-xs text-slate-400 transform -translate-x-1/2"
              style={{ left: `${month.position}%` }}
            >
              {month.label}
            </div>
          ))}
        </div>
        
        {/* Linha do tempo com hoje */}
        <div className="relative" style={{ minHeight: `${tasks.length * 48 + 20}px` }}>
          {/* Linha de hoje */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
            style={{ left: `${todayPosition}%` }}
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-red-400 whitespace-nowrap">
              Hoje
            </div>
          </div>
          
          {/* Tasks */}
          {tasks.map((task, idx) => {
            const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.planejado;
            const left = getPosition(task.start);
            const width = getWidth(task.start, task.end);
            
            return (
              <div
                key={task.id}
                className="absolute flex items-center h-10 group"
                style={{ top: `${idx * 48}px`, left: 0, right: 0 }}
              >
                {/* Nome do produto */}
                <div className="absolute left-0 w-48 pr-2 truncate text-sm text-slate-300 z-20 bg-slate-800">
                  {task.name}
                </div>
                
                {/* Barra do Gantt */}
                <div
                  className="absolute h-8 rounded-lg flex items-center px-2 cursor-pointer transition-all hover:opacity-80"
                  style={{ 
                    left: `calc(${left}% + 200px)`,
                    width: `${width}%`,
                    minWidth: '20px',
                    backgroundColor: config.color
                  }}
                  title={`${task.name}\nInício: ${formatDate(task.start)}\nFim: ${formatDate(task.end)}\nStatus: ${config.label}`}
                >
                  <span className="text-xs text-white font-medium truncate">{task.progress}%</span>
                </div>
                
                {/* Marcador de ativação */}
                {task.activationDate && (
                  <div
                    className="absolute w-3 h-3 rounded-full bg-green-400 border-2 border-white z-10"
                    style={{ left: `calc(${getPosition(task.activationDate)}% + 200px)` }}
                    title={`Ativação: ${formatDate(task.activationDate)}`}
                  />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Legenda */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-700">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: config.color }}></div>
              <span className="text-slate-400">{config.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-400 border-2 border-white"></div>
            <span className="text-slate-400">Data Ativação</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardProjetoFinanceiro() {
  const { id } = useParams();
  const [financeiro, setFinanceiro] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const { darkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [finData, timeData] = await Promise.all([
        dashboardApi.projetoFinanceiro(id),
        timelineApi.projeto(id)
      ]);
      setFinanceiro(finData);
      setTimeline(timeData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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

  if (!financeiro) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Projeto não encontrado</h2>
          <Link to="/projetos" className="text-blue-400 hover:underline mt-2 inline-block">
            Voltar para projetos
          </Link>
        </div>
      </div>
    );
  }

  const { projeto, empresa, metricas, statusCounts, custoPorStatus, projecaoMensal, produtos } = financeiro;

  const statusChartData = {
    labels: Object.entries(statusCounts).filter(([_, v]) => v > 0).map(([k]) => STATUS_CONFIG[k]?.label || k),
    datasets: [{
      data: Object.entries(statusCounts).filter(([_, v]) => v > 0).map(([_, v]) => v),
      backgroundColor: Object.entries(statusCounts).filter(([_, v]) => v > 0).map(([k]) => STATUS_CONFIG[k]?.color || '#6b7280'),
      borderWidth: 0,
    }]
  };

  const roiPorProdutoData = {
    labels: produtos.filter(p => p.roiIndividual > 0).slice(0, 10).map(p => p.nome.substring(0, 15)),
    datasets: [{
      label: 'ROI %',
      data: produtos.filter(p => p.roiIndividual > 0).slice(0, 10).map(p => p.roiIndividual),
      backgroundColor: produtos.filter(p => p.roiIndividual > 0).slice(0, 10).map(p => 
        p.roiIndividual >= 200 ? 'rgba(16, 185, 129, 0.7)' :
        p.roiIndividual >= 100 ? 'rgba(34, 197, 94, 0.7)' :
        p.roiIndividual >= 50 ? 'rgba(234, 179, 8, 0.7)' :
        'rgba(239, 68, 68, 0.7)'
      ),
      borderRadius: 6,
    }]
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/dashboard/projeto-produtos/${id}`} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                  <Building2 className="w-4 h-4" />
                  <span>{empresa?.nome}</span>
                </div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-green-400" />
                  Dashboard Financeiro: {projeto?.nome}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
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
        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm">Custo Total</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metricas.custoTotalEstimado)}</p>
            <p className="text-xs opacity-70 mt-1">{metricas.totalProdutos} produtos</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">Retorno Anual</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metricas.retornoAnualTotal)}</p>
            <p className="text-xs opacity-70 mt-1">{formatCurrency(metricas.retornoMensalMedio)}/mês</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <Percent className="w-5 h-5" />
              <span className="text-sm">ROI Projetado</span>
            </div>
            <p className="text-2xl font-bold">{metricas.roiProjetado?.toFixed(0) || 0}%</p>
            <p className="text-xs opacity-70 mt-1">ao ano</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <Clock className="w-5 h-5" />
              <span className="text-sm">Payback</span>
            </div>
            <p className="text-2xl font-bold">{metricas.paybackMeses || '-'}</p>
            <p className="text-xs opacity-70 mt-1">meses</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-slate-400">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm">Ativos</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{statusCounts.ativo || 0}</p>
            <p className="text-xs text-slate-500 mt-1">produtos em produção</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-slate-400">
              <PlayCircle className="w-5 h-5 text-blue-400" />
              <span className="text-sm">Em Construção</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{statusCounts.em_construcao || 0}</p>
            <p className="text-xs text-slate-500 mt-1">sendo desenvolvidos</p>
          </div>
        </div>
        
        {/* Gráfico de Projeção Financeira */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Projeção Financeira (24 meses)
          </h3>
          <div className="h-80">
            <Line
              data={{
                labels: projecaoMensal.slice(0, 24).map(m => m.mesLabel),
                datasets: [
                  {
                    label: 'Custo Mensal',
                    data: projecaoMensal.slice(0, 24).map(m => m.custo),
                    borderColor: 'rgba(239, 68, 68, 0.8)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.3,
                  },
                  {
                    label: 'Retorno Mensal',
                    data: projecaoMensal.slice(0, 24).map(m => m.retorno),
                    borderColor: 'rgba(34, 197, 94, 0.8)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.3,
                  },
                  {
                    label: 'Saldo Acumulado',
                    data: projecaoMensal.slice(0, 24).map(m => m.saldoAcumulado),
                    borderColor: 'rgba(59, 130, 246, 0.8)',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    borderDash: [5, 5],
                    tension: 0.3,
                    yAxisID: 'y1',
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: {
                      color: '#94a3b8',
                      callback: (value) => formatCurrency(value)
                    },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: {
                      color: '#3b82f6',
                      callback: (value) => formatCurrency(value)
                    },
                    grid: { drawOnChartArea: false }
                  },
                  x: {
                    ticks: { color: '#94a3b8', font: { size: 10 } },
                    grid: { display: false }
                  }
                },
                plugins: {
                  legend: {
                    labels: { color: '#94a3b8', font: { size: 11 } }
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
          
          {/* Indicadores de Break-even */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-700">
            {projecaoMensal.some(m => m.saldoAcumulado > 0) && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400 font-medium">Break-even Estimado</p>
                <p className="text-xl font-bold text-green-400 mt-1">
                  {projecaoMensal.find(m => m.saldoAcumulado > 0)?.mesLabel}
                </p>
              </div>
            )}
            
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400 font-medium">Saldo em 12 meses</p>
              <p className="text-xl font-bold text-blue-400 mt-1">
                {formatCurrency(projecaoMensal[11]?.saldoAcumulado)}
              </p>
            </div>
            
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-400 font-medium">Saldo em 24 meses</p>
              <p className="text-xl font-bold text-purple-400 mt-1">
                {formatCurrency(projecaoMensal[23]?.saldoAcumulado)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Gantt Chart */}
        {timeline?.tasks && timeline.tasks.length > 0 && (
          <GanttChart tasks={timeline.tasks} />
        )}
        
        {/* Grid de Análises */}
        <div className="grid grid-cols-2 gap-6">
          {/* Status por Quantidade */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-400" />
              Distribuição por Status
            </h3>
            <div className="h-64">
              <Doughnut
                data={statusChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: { color: '#94a3b8', font: { size: 11 } }
                    }
                  }
                }}
              />
            </div>
          </div>
          
          {/* ROI por Produto */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-blue-400" />
              Top 10 Produtos por ROI
            </h3>
            <div className="h-64">
              <Bar
                data={roiPorProdutoData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  scales: {
                    x: {
                      ticks: { color: '#94a3b8', callback: (v) => `${v}%` },
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
        </div>
        
        {/* Tabela de Produtos */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-700">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-purple-400" />
              Detalhamento Financeiro por Produto
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr className="text-left text-sm text-slate-400">
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Custo</th>
                  <th className="px-4 py-3 font-medium text-right">Retorno/Ano</th>
                  <th className="px-4 py-3 font-medium text-right">ROI</th>
                  <th className="px-4 py-3 font-medium text-right">Payback</th>
                  <th className="px-4 py-3 font-medium">Início</th>
                  <th className="px-4 py-3 font-medium">Ativação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {produtos.map((produto) => {
                  const statusConfig = STATUS_CONFIG[produto.statusConstrucao] || STATUS_CONFIG.planejado;
                  return (
                    <tr key={produto.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link 
                          to={`/dashboard/produto/${produto.id}`}
                          className="text-white hover:text-blue-400 font-medium"
                        >
                          {produto.nome}
                        </Link>
                        {produto.classificacao && (
                          <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                            #{produto.classificacao}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white ${statusConfig.bg}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-red-400 font-medium">
                        {formatCurrency(produto.custoEstimado)}
                      </td>
                      <td className="px-4 py-3 text-right text-green-400 font-medium">
                        {formatCurrency(produto.retornoAnualEsperado)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${
                          produto.roiIndividual >= 200 ? 'text-emerald-400' :
                          produto.roiIndividual >= 100 ? 'text-green-400' :
                          produto.roiIndividual >= 50 ? 'text-yellow-400' :
                          produto.roiIndividual > 0 ? 'text-red-400' : 'text-slate-500'
                        }`}>
                          {produto.roiIndividual > 0 ? `${produto.roiIndividual.toFixed(0)}%` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-purple-400">
                        {produto.paybackMeses ? `${produto.paybackMeses}m` : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        {formatDate(produto.dataInicioConstrucao)}
                      </td>
                      <td className="px-4 py-3 text-green-400 text-sm">
                        {formatDate(produto.dataAtivacaoProducao)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-700/50 border-t border-slate-600">
                <tr className="text-white font-medium">
                  <td className="px-4 py-3" colSpan="2">Total</td>
                  <td className="px-4 py-3 text-right text-red-400">{formatCurrency(metricas.custoTotalEstimado)}</td>
                  <td className="px-4 py-3 text-right text-green-400">{formatCurrency(metricas.retornoAnualTotal)}</td>
                  <td className="px-4 py-3 text-right text-blue-400">{metricas.roiProjetado?.toFixed(0)}%</td>
                  <td className="px-4 py-3 text-right text-purple-400">{metricas.paybackMeses}m</td>
                  <td className="px-4 py-3" colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        {/* Link de volta */}
        <div className="flex justify-center gap-4">
          <Link 
            to={`/dashboard/projeto-produtos/${id}`}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Voltar ao Dashboard de Produtos
          </Link>
          <Link 
            to={`/projetos/${id}`}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            Ver Detalhes do Projeto
          </Link>
        </div>
      </main>
    </div>
  );
}

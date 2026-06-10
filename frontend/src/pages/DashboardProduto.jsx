import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Target, Package, ArrowLeft, Building2, Folder, Users, 
  Award, TrendingUp, BarChart3, Trophy, Zap, Info, Calculator,
  ChevronDown, ChevronUp, Bot, DollarSign, Calendar, Clock, Percent,
  Sparkles, FileText, Layers
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar, Radar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement);

const STATUS_CONSTRUCAO_LABELS = {
  planejado: { label: '📋 Planejado', color: 'bg-gray-500', textColor: 'text-gray-500' },
  em_construcao: { label: '🔧 Em Construção', color: 'bg-blue-500', textColor: 'text-blue-500' },
  em_teste: { label: '🧪 Em Teste', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  ativo: { label: '✅ Ativo', color: 'bg-green-500', textColor: 'text-green-500' },
  suspenso: { label: '⏸️ Suspenso', color: 'bg-red-500', textColor: 'text-red-500' },
  cancelado: { label: '❌ Cancelado', color: 'bg-gray-400', textColor: 'text-gray-400' },
};

function formatCurrency(value) {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('pt-BR');
}

export default function DashboardProduto() {
  const { id } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFormulas, setShowFormulas] = useState(false);
  const [showTransformacaoDetails, setShowTransformacaoDetails] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [id]);

  async function loadDashboard() {
    try {
      const data = await dashboardApi.produto(id);
      setDashboard(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const getScoreColor = (score) => {
    if (!score) return 'text-gray-400';
    if (score >= 4) return 'text-green-500';
    if (score >= 3) return 'text-blue-500';
    if (score >= 2) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score) => {
    if (!score) return 'bg-gray-200';
    if (score >= 4) return 'bg-green-500';
    if (score >= 3) return 'bg-blue-500';
    if (score >= 2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCategoriaColor = (categoria) => {
    if (categoria?.includes('ROI')) return { bg: 'rgba(34, 197, 94, 0.7)', border: 'rgb(34, 197, 94)' };
    if (categoria?.includes('Automação')) return { bg: 'rgba(59, 130, 246, 0.7)', border: 'rgb(59, 130, 246)' };
    if (categoria?.includes('APIs')) return { bg: 'rgba(168, 85, 247, 0.7)', border: 'rgb(168, 85, 247)' };
    return { bg: 'rgba(156, 163, 175, 0.7)', border: 'rgb(156, 163, 175)' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard não encontrado</h2>
          <Link to="/produtos" className="text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
            Voltar para produtos
          </Link>
        </div>
      </div>
    );
  }

  const { 
    produto, projeto, empresa, totalAvaliadores, scoreRelevancia, 
    scoreObrigatorio, scoreVerticais, nivelRelevancia, nivelTransformacao,
    scoresPorPerguntaObrigatoria, scoresPorVertical, scoresPorCategoria, 
    avaliadores, ranking, perguntasObrigatorias
  } = dashboard;

  const gaugeData = {
    datasets: [{
      data: [scoreRelevancia || 0, 5 - (scoreRelevancia || 0)],
      backgroundColor: [
        scoreRelevancia >= 4 ? '#22c55e' : scoreRelevancia >= 3 ? '#3b82f6' : scoreRelevancia >= 2 ? '#eab308' : '#ef4444',
        '#e5e7eb'
      ],
      borderWidth: 0,
      cutout: '80%',
      rotation: -90,
      circumference: 180
    }]
  };

  const categoriasChartData = {
    labels: scoresPorCategoria?.map(c => c.categoria) || [],
    datasets: [{
      label: 'Score',
      data: scoresPorCategoria?.map(c => c.score) || [],
      backgroundColor: scoresPorCategoria?.map(c => getCategoriaColor(c.categoria).bg) || [],
      borderColor: scoresPorCategoria?.map(c => getCategoriaColor(c.categoria).border) || [],
      borderWidth: 1,
      borderRadius: 8
    }]
  };

  const verticaisChartData = scoresPorVertical && scoresPorVertical.length > 0 ? {
    labels: scoresPorVertical.map(v => v.nome.split('(')[0].trim().substring(0, 15)),
    datasets: [{
      label: 'Score por Vertical',
      data: scoresPorVertical.map(v => v.score),
      backgroundColor: 'rgba(168, 85, 247, 0.2)',
      borderColor: 'rgba(168, 85, 247, 1)',
      pointBackgroundColor: 'rgba(168, 85, 247, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(168, 85, 247, 1)'
    }]
  } : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/produtos/${produto.id}`} className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                <Building2 className="w-4 h-4" />
                <span>{empresa?.nome}</span>
                <span>›</span>
                <Folder className="w-4 h-4" />
                <span>{projeto?.nome}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Package className="w-7 h-7 text-orange-500" />
                Dashboard: {produto.nome}
              </h1>
            </div>
          </div>
        </div>

        {/* Ranking no Projeto */}
        {ranking && ranking.totalProdutos > 0 && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold opacity-90">Posição no Ranking do Projeto</h2>
                  <p className="text-amber-100 text-sm">{projeto?.nome}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">
                    {ranking.posicao > 0 ? `#${ranking.posicao}` : '-'}
                  </span>
                  <span className="text-xl opacity-80">/ {ranking.totalProdutos}</span>
                </div>
                <p className="text-amber-100 text-sm mt-1">
                  {ranking.posicao === 1 ? '🏆 Melhor produto!' : ranking.posicao === 2 ? '🥈 Segundo lugar' : ranking.posicao === 3 ? '🥉 Terceiro lugar' : 'produtos avaliados'}
                </p>
              </div>
            </div>
            
            {/* Mini ranking */}
            {ranking.outrosProdutos && ranking.outrosProdutos.length > 1 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs font-medium opacity-80 mb-2">Comparativo com outros produtos:</p>
                <div className="flex flex-wrap gap-2">
                  {ranking.outrosProdutos.slice(0, 5).map((p, idx) => (
                    <div 
                      key={p.id}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        p.isAtual 
                          ? 'bg-white text-amber-600' 
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      #{idx + 1} {p.nome.substring(0, 15)}{p.nome.length > 15 ? '...' : ''} ({p.scoreRelevancia?.toFixed(1)})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Card de Prioridade Estratégica */}
        {(produto.scoreBlueprint > 0 || produto.scorePrioridadeEstrategica > 0) && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Prioridade Estratégica</h2>
                <p className="text-purple-200 text-sm">Correlação Produto + Blueprint</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Score do Produto */}
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Package className="w-4 h-4 opacity-80" />
                  <span className="text-xs opacity-80">Score Produto</span>
                </div>
                <p className="text-3xl font-bold">{produto.scoreRelevancia?.toFixed(2) || scoreRelevancia?.toFixed(2) || '0'}</p>
                <p className="text-xs opacity-60 mt-1">60% do cálculo</p>
              </div>
              
              {/* Score do Blueprint */}
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FileText className="w-4 h-4 opacity-80" />
                  <span className="text-xs opacity-80">Score Blueprint</span>
                </div>
                <p className="text-3xl font-bold">{produto.scoreBlueprint?.toFixed(2) || '0'}</p>
                <p className="text-xs opacity-60 mt-1">40% do cálculo</p>
              </div>
              
              {/* Prioridade Final */}
              <div className="bg-white/20 rounded-xl p-4 text-center border-2 border-white/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-medium">Prioridade Final</span>
                </div>
                <p className="text-4xl font-bold">{produto.scorePrioridadeEstrategica?.toFixed(2) || '0'}</p>
                <p className="text-xs opacity-80 mt-1">
                  Classificação: #{produto.classificacao || '-'}
                </p>
              </div>
            </div>
            
            {/* Fórmula explicativa */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 opacity-70" />
                <div className="text-xs opacity-80">
                  <strong>Fórmula:</strong> Prioridade = (Score Produto × 60%) + (Score Blueprint × 40%)
                  <br />
                  <span className="opacity-70">
                    Produtos em projetos com maior maturidade em IA (Blueprint) têm prioridade mais alta para execução.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Gauge Card - Score Final */}
          <div className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Score de Relevância Final</h2>
              <div className="relative w-48 h-24 mx-auto">
                <Doughnut data={gaugeData} options={{
                  plugins: { legend: { display: false }, tooltip: { enabled: false } },
                  maintainAspectRatio: false
                }} />
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                  <span className={`text-4xl font-bold ${getScoreColor(scoreRelevancia)}`}>
                    {scoreRelevancia?.toFixed(1) || '0'}
                  </span>
                  <span className="text-gray-400 text-lg">/5</span>
                </div>
              </div>
              <p className={`text-lg font-semibold mt-4 ${getScoreColor(scoreRelevancia)}`}>
                {nivelRelevancia}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Baseado em {totalAvaliadores} avaliação(ões)
              </p>
              
              {/* Breakdown dos scores */}
              <div className="mt-4 pt-4 border-t dark:border-gray-700 grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400">Transformação Agêntica</p>
                  <p className={`text-xl font-bold ${getScoreColor(scoreObrigatorio)}`}>
                    {scoreObrigatorio?.toFixed(1) || '0'} <span className="text-xs text-gray-400">(60%)</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400">Verticais</p>
                  <p className={`text-xl font-bold ${getScoreColor(scoreVerticais)}`}>
                    {scoreVerticais?.toFixed(1) || '0'} <span className="text-xs text-gray-400">(40%)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Score Transformação Agêntica */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Transformação Agêntica</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">
                {scoreObrigatorio?.toFixed(1) || '0'}
              </span>
              <span className="opacity-70">/5</span>
            </div>
            <p className="text-sm mt-2 opacity-80">
              {nivelTransformacao}
            </p>
            <p className="text-xs mt-1 opacity-60">
              8 perguntas universais ponderadas
            </p>
          </div>

          {/* Verticais avaliadas */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-3">
              <Target className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium">Verticais</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-purple-600">
                {scoresPorVertical?.filter(v => v.score > 0).length || 0}
              </span>
              <span className="text-gray-400">/ {scoresPorVertical?.length || 9}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              com respostas
            </p>
          </div>
        </div>

        {/* Indicadores Financeiros e Cronograma */}
        {(produto.custoEstimado || produto.retornoAnualEsperado || produto.dataInicioConstrucao) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Indicadores Financeiros e Cronograma
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Métricas Financeiras */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Investimento e Retorno</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Custo Estimado</span>
                    </div>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(produto.custoEstimado)}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Retorno Anual</span>
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(produto.retornoAnualEsperado)}
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Percent className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">ROI Projetado</span>
                    </div>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {produto.roiIndividual ? `${produto.roiIndividual}%` : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Payback</span>
                    </div>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {produto.paybackMeses ? `${produto.paybackMeses} meses` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Cronograma */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Cronograma do Projeto</h4>
                
                {/* Status de Construção */}
                <div className="mb-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${STATUS_CONSTRUCAO_LABELS[produto.statusConstrucao]?.color || 'bg-gray-500'} text-white`}>
                    <span className="text-sm font-medium">
                      {STATUS_CONSTRUCAO_LABELS[produto.statusConstrucao]?.label || produto.statusConstrucao}
                    </span>
                  </div>
                </div>
                
                {/* Timeline Visual */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Início Construção</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(produto.dataInicioConstrucao)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-1.5 w-0.5 h-4 bg-gray-300 dark:bg-gray-600"></div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fim Construção</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(produto.dataFimConstrucao)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-1.5 w-0.5 h-4 bg-gray-300 dark:bg-gray-600"></div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ativação em Produção</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(produto.dataAtivacaoProducao)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Observações do Cronograma */}
                {produto.observacoesCronograma && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Observações</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{produto.observacoesCronograma}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score por Categoria */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Score por Categoria (média de todas verticais)
            </h3>
            {scoresPorCategoria && scoresPorCategoria.length > 0 ? (
              <div className="h-64">
                <Bar 
                  data={categoriasChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                      x: { max: 5, beginAtZero: true },
                      y: { ticks: { font: { size: 11 } } }
                    },
                    plugins: { legend: { display: false } }
                  }} 
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Nenhuma avaliação encontrada
              </div>
            )}
          </div>

          {/* Radar Chart - Verticais */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Score por Vertical
            </h3>
            {verticaisChartData ? (
              <div className="h-64">
                <Radar 
                  data={verticaisChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 5,
                        ticks: { stepSize: 1 }
                      }
                    },
                    plugins: { legend: { display: false } }
                  }} 
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Nenhuma vertical avaliada
              </div>
            )}
          </div>
        </div>

        {/* Score por Categoria - Detalhes */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Detalhes por Categoria
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scoresPorCategoria?.map((cat, index) => {
              const colors = getCategoriaColor(cat.categoria);
              return (
                <div key={index} className="border dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900 dark:text-white">{cat.categoria}</span>
                    <span className={`text-2xl font-bold ${getScoreColor(cat.score)}`}>
                      {cat.score?.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ width: `${(cat.score || 0) * 20}%`, backgroundColor: colors.border }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {cat.nivel} • {cat.totalVerticais} verticais avaliadas
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score de Transformação Agêntica - Detalhes */}
        {scoresPorPerguntaObrigatoria && scoresPorPerguntaObrigatoria.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <button
              onClick={() => setShowTransformacaoDetails(!showTransformacaoDetails)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-500" />
                🎯 Score de Transformação Agêntica (8 Perguntas Universais)
              </h3>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${getScoreColor(scoreObrigatorio)}`}>
                  {scoreObrigatorio?.toFixed(1)}/5
                </span>
                {showTransformacaoDetails ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
            
            {showTransformacaoDetails && (
              <div className="mt-6 space-y-4">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    Estas 8 perguntas avaliam a capacidade de <strong>Transformação Agêntica</strong> - 
                    uso de Multi-Agent Systems (Agentes de IA autônomos) para automatizar processos complexos.
                    O score é calculado usando <strong>pesos diferenciados</strong> por pergunta.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scoresPorPerguntaObrigatoria.map((pergunta) => (
                    <div key={pergunta.perguntaId} className="border dark:border-gray-700 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                              {pergunta.categoria}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded-full">
                              Peso: {(pergunta.peso * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <span className={`text-2xl font-bold ${getScoreColor(pergunta.score)}`}>
                          {pergunta.score?.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{pergunta.texto}</p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                        <div 
                          className={`h-2 rounded-full ${getScoreBgColor(pergunta.score)}`}
                          style={{ width: `${(pergunta.score || 0) * 20}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fórmulas e Metodologia */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <button
            onClick={() => setShowFormulas(!showFormulas)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-500" />
              📊 Fórmulas e Metodologia de Cálculo
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Ver detalhes</span>
              {showFormulas ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </button>
          
          {showFormulas && (
            <div className="mt-6 space-y-6">
              {/* Fórmula Principal */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
                  <span className="text-xl">🎯</span> Score de Relevância Final
                </h4>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg font-mono text-sm mb-3">
                  <code className="text-emerald-700 dark:text-emerald-400">
                    Score Final = (Score Transformação × 0.60) + (Score Verticais × 0.40)
                  </code>
                </div>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  <strong>Seu cálculo:</strong> ({scoreObrigatorio?.toFixed(2)} × 0.60) + ({scoreVerticais?.toFixed(2)} × 0.40) = <strong>{scoreRelevancia?.toFixed(2)}</strong>
                </p>
              </div>

              {/* Score Transformação Agêntica */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2">
                  <span className="text-xl">⚡</span> Score de Transformação Agêntica (60% do total)
                </h4>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg font-mono text-sm mb-3">
                  <code className="text-indigo-700 dark:text-indigo-400">
                    Score = Σ(Pontuação × Peso) / Σ(Peso)
                  </code>
                </div>
                <p className="text-sm text-indigo-700 dark:text-indigo-400 mb-3">
                  Baseado em <strong>8 perguntas universais</strong> com pesos diferenciados:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded">
                    <span className="font-medium">Maturidade Agentes:</span> 20%
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded">
                    <span className="font-medium">Redução Custos:</span> 15%
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded">
                    <span className="font-medium">ROI e Receita:</span> 20%
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded">
                    <span className="font-medium">Integração APIs:</span> 15%
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded">
                    <span className="font-medium">Escalabilidade:</span> 10%
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded">
                    <span className="font-medium">Governança:</span> 10%
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded">
                    <span className="font-medium">Aprendizado:</span> 5%
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded">
                    <span className="font-medium">Experiência UX:</span> 5%
                  </div>
                </div>
              </div>

              {/* Score Verticais */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                  <span className="text-xl">🎯</span> Score de Verticais (40% do total)
                </h4>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg font-mono text-sm mb-3">
                  <code className="text-purple-700 dark:text-purple-400">
                    Score = Média(Scores das Verticais avaliadas)
                  </code>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-400">
                  Cada vertical tem 3 perguntas (ROI, Automação, APIs). A média das verticais com respostas forma este score.
                </p>
              </div>

              {/* Interpretação */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-800 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="text-xl">📈</span> Interpretação do Score de Transformação Agêntica
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span>❌</span>
                    <span><strong>&lt; 2.0:</strong> Não é um projeto de Transformação Agêntica</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <span>🟡</span>
                    <span><strong>2.0-3.0:</strong> Elementos agênticos básicos</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <span>🟠</span>
                    <span><strong>3.0-4.0:</strong> Transformação Agêntica moderada</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span>🟢</span>
                    <span><strong>4.0-4.5:</strong> Transformação Agêntica significativa</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg col-span-1 md:col-span-2">
                    <span>🚀</span>
                    <span><strong>4.5-5.0:</strong> Transformação Agêntica transformacional</span>
                  </div>
                </div>
              </div>

              {/* Ranking */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5 rounded-xl border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                  <span className="text-xl">🏆</span> Ranking no Projeto
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  O ranking é determinado pelo <strong>Score de Relevância Final</strong> em ordem decrescente. 
                  Produtos com maior score aparecem primeiro. A posição é atualizada automaticamente quando uma avaliação é finalizada.
                </p>
              </div>

              {/* Prioridade Estratégica */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                  <span className="text-xl">✨</span> Prioridade Estratégica (Correlação Blueprint)
                </h4>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg font-mono text-sm mb-3">
                  <code className="text-purple-700 dark:text-purple-400">
                    Prioridade = (Score Produto × 0.60) + (Score Blueprint × 0.40)
                  </code>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-400 mb-3">
                  <strong>Objetivo:</strong> Priorizar produtos em projetos com maior maturidade em IA.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <span>📦</span>
                    <div>
                      <strong>Score Produto (60%):</strong>
                      <br />
                      <span className="text-xs opacity-70">Avaliação direta do produto (Transformação Agêntica + Verticais)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <span>📋</span>
                    <div>
                      <strong>Score Blueprint (40%):</strong>
                      <br />
                      <span className="text-xs opacity-70">Maturidade em IA do projeto (avaliação do Blueprint)</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-3 opacity-80">
                  💡 Isso significa que um produto com score 4.0 em um projeto com Blueprint 5.0 terá prioridade maior 
                  que um produto com score 4.5 em um projeto com Blueprint 2.0.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Detalhes das Verticais */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            Detalhes por Vertical
          </h3>
          <div className="space-y-4">
            {scoresPorVertical?.map((vertical) => (
              <div key={vertical.verticalId} className="border dark:border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{vertical.icone}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{vertical.nome}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{vertical.foco}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${getScoreColor(vertical.score)}`}>
                      {vertical.score?.toFixed(1)}
                    </span>
                    <span className="text-gray-400">/5</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{vertical.nivel}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {vertical.perguntas?.map((pergunta) => {
                    const catColor = getCategoriaColor(pergunta.categoria);
                    return (
                      <div key={pergunta.perguntaId} className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {pergunta.categoria?.replace(' e Redução de Custos', '').replace(' e Aceleradores', '')}
                        </p>
                        <p className={`text-lg font-bold ${getScoreColor(pergunta.score)}`}>
                          {pergunta.score?.toFixed(1) || '-'}
                        </p>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-1">
                          <div 
                            className="h-1 rounded-full"
                            style={{ width: `${(pergunta.score || 0) * 20}%`, backgroundColor: catColor.border }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Avaliadores */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Avaliadores ({totalAvaliadores})
          </h3>
          {avaliadores && avaliadores.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                    <th className="pb-3 font-medium">Avaliador</th>
                    <th className="pb-3 font-medium">Score</th>
                    <th className="pb-3 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {avaliadores.map((avaliador) => (
                    <tr key={avaliador.avaliacaoId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{avaliador.nome}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{avaliador.email}</p>
                      </td>
                      <td className="py-3">
                        <span className={`text-xl font-bold ${getScoreColor(avaliador.scoreRelevancia)}`}>
                          {avaliador.scoreRelevancia?.toFixed(1) || '-'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400 text-sm">
                        {new Date(avaliador.dataAvaliacao).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Nenhum avaliador encontrado
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="flex justify-center">
          <Link 
            to={`/produtos/${produto.id}`} 
            className="btn btn-secondary"
          >
            Voltar ao Produto
          </Link>
        </div>
      </div>
    </div>
  );
}

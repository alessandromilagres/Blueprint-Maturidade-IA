import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, Plus, Search, FolderKanban, BarChart3, Trash2, Award, DollarSign, Calendar, TrendingUp, Edit2 } from 'lucide-react';
import { produtosApi, projetosApi, verticaisApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const STATUS_CONSTRUCAO = [
  { value: 'planejado', label: '📋 Planejado', color: 'bg-gray-500' },
  { value: 'em_construcao', label: '🔧 Em Construção', color: 'bg-blue-500' },
  { value: 'em_teste', label: '🧪 Em Teste', color: 'bg-yellow-500' },
  { value: 'ativo', label: '✅ Ativo', color: 'bg-green-500' },
  { value: 'suspenso', label: '⏸️ Suspenso', color: 'bg-red-500' },
  { value: 'cancelado', label: '❌ Cancelado', color: 'bg-gray-400' },
];

function formatCurrency(value) {
  if (!value) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

export default function Produtos() {
  const [searchParams] = useSearchParams();
  const projetoIdParam = searchParams.get('projetoId');
  
  const [produtos, setProdutos] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [verticais, setVerticais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProjeto, setFilterProjeto] = useState(projetoIdParam || '');
  const [filterStatusConstrucao, setFilterStatusConstrucao] = useState('');

  useEffect(() => {
    loadData();
  }, [projetoIdParam]);

  async function loadData() {
    try {
      const [produtosData, projetosData, verticaisData] = await Promise.all([
        produtosApi.listar(projetoIdParam),
        projetosApi.listar(),
        verticaisApi.listar()
      ]);
      setProdutos(produtosData);
      setProjetos(projetosData);
      setVerticais(verticaisData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(produto) {
    if (confirm(`Deseja excluir o produto "${produto.nome}"?`)) {
      try {
        await produtosApi.excluir(produto.id);
        loadData();
      } catch (error) {
        alert('Erro ao excluir: ' + error.message);
      }
    }
  }

  const filteredProdutos = produtos.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) ||
                       p.descricao?.toLowerCase().includes(search.toLowerCase());
    const matchProjeto = !filterProjeto || p.projetoId === parseInt(filterProjeto);
    const matchStatus =
      !filterStatusConstrucao || p.statusConstrucao === filterStatusConstrucao;
    return matchSearch && matchProjeto && matchStatus;
  });

  const getScoreColor = (score) => {
    if (!score) return 'text-gray-400';
    if (score >= 4) return 'text-green-500';
    if (score >= 3) return 'text-blue-500';
    if (score >= 2) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 dark:bg-orange-900/50 p-3 rounded-xl">
            <Package className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Produtos IA-First</h1>
            <p className="text-gray-600 dark:text-gray-400">Módulo de Validação por Vertical (MIT CISR)</p>
          </div>
        </div>
        <Link 
          to={filterProjeto ? `/produtos/novo?projetoId=${filterProjeto}` : '/produtos/novo'} 
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </Link>
      </div>

      <div className="card">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input w-64"
            value={filterProjeto}
            onChange={(e) => setFilterProjeto(e.target.value)}
          >
            <option value="">Todos os Projetos</option>
            {projetos.map((projeto) => (
              <option key={projeto.id} value={projeto.id}>
                {projeto.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 items-center mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">Status de construção:</span>
          <button
            type="button"
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filterStatusConstrucao === ''
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => setFilterStatusConstrucao('')}
          >
            Todos
          </button>
          {STATUS_CONSTRUCAO.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filterStatusConstrucao === s.value
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() =>
                setFilterStatusConstrucao((prev) => (prev === s.value ? '' : s.value))
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        {filteredProdutos.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Crie seu primeiro produto para começar a avaliar a relevância por vertical
            </p>
            <Link to="/produtos/novo" className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Criar Produto
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProdutos.map((produto) => (
              <div
                key={produto.id}
                className="border dark:border-gray-700 rounded-xl p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-lg">
                      <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <Link
                        to={`/produtos/${produto.id}`}
                        className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        {produto.nome}
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <FolderKanban className="w-3 h-3" />
                        {produto.projeto?.nome}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={produto.status} />
                </div>

                {produto.descricao && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {produto.descricao}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {produto.statusConstrucao && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      STATUS_CONSTRUCAO.find(s => s.value === produto.statusConstrucao)?.color || 'bg-gray-500'
                    } text-white`}>
                      {STATUS_CONSTRUCAO.find(s => s.value === produto.statusConstrucao)?.label || produto.statusConstrucao}
                    </span>
                  )}
                  {produto.vertical && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                      {produto.vertical.icone} {produto.vertical.nome}
                    </span>
                  )}
                  {produto.classificacao && (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      #{produto.classificacao}
                    </span>
                  )}
                </div>

                {/* Informações Financeiras */}
                {(produto.custoEstimado || produto.retornoAnualEsperado) && (
                  <div className="grid grid-cols-2 gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-red-500" />
                      <span className="text-gray-500">Custo:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(produto.custoEstimado)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-gray-500">Retorno/ano:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(produto.retornoAnualEsperado)}</span>
                    </div>
                    {produto.custoEstimado && produto.retornoAnualEsperado && (
                      <>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">ROI:</span>
                          <span className="font-bold text-green-600">
                            {((produto.retornoAnualEsperado / produto.custoEstimado) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Payback:</span>
                          <span className="font-medium text-blue-600">
                            {Math.ceil(produto.custoEstimado / (produto.retornoAnualEsperado / 12))} meses
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Datas do Cronograma */}
                {(produto.dataInicioConstrucao || produto.dataFimConstrucao || produto.dataAtivacaoProducao) && (
                  <div className="flex flex-wrap gap-2 mb-3 text-xs">
                    {produto.dataInicioConstrucao && (
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        Início: {formatDate(produto.dataInicioConstrucao)}
                      </span>
                    )}
                    {produto.dataAtivacaoProducao && (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Calendar className="w-3 h-3" />
                        Ativação: {formatDate(produto.dataAtivacaoProducao)}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t dark:border-gray-700">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Score:</span>
                      <span className={`ml-1 font-bold ${getScoreColor(produto.scoreRelevancia)}`}>
                        {produto.scoreRelevancia ? produto.scoreRelevancia.toFixed(1) : '-'}
                      </span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {produto._count?.avaliacoes || 0} avaliações
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/produtos/${produto.id}/editar`}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/produtos/${produto.id}`}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Detalhes"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(produto)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

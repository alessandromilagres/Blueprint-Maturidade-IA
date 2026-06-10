import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Building2, 
  User, 
  Calendar, 
  Clock, 
  TrendingUp,
  Search,
  Filter,
  Eye,
  Trash2,
  ChevronDown,
  BarChart3,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

const CORES_NIVEL = {
  'Iniciante': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-500' },
  'Explorador': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-500' },
  'Praticante': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', badge: 'bg-yellow-500' },
  'Avançado': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', badge: 'bg-blue-500' },
  'Líder': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', badge: 'bg-green-500' }
};

const CORES_STATUS = {
  'em_andamento': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Em Andamento' },
  'finalizado': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Finalizado' }
};

export default function DiagnosticosLista() {
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState('recentes');

  useEffect(() => {
    loadDiagnosticos();
  }, []);

  async function loadDiagnosticos() {
    setLoading(true);
    try {
      const data = await api.get('/diagnostico');
      setDiagnosticos(data || []);
    } catch (error) {
      console.error('Erro ao carregar diagnósticos:', error);
      setDiagnosticos([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleExcluir(id) {
    if (!confirm('Tem certeza que deseja excluir este diagnóstico?')) return;
    
    try {
      await api.delete(`/diagnostico/${id}`);
      setDiagnosticos(diagnosticos.filter(d => d.id !== id));
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir diagnóstico');
    }
  }

  function formatarData(data) {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Filtrar e ordenar
  const diagnosticosFiltrados = diagnosticos
    .filter(d => {
      // Filtro por status
      if (filtro === 'finalizados' && d.status !== 'finalizado') return false;
      if (filtro === 'andamento' && d.status !== 'em_andamento') return false;
      
      // Filtro por busca
      if (busca) {
        const termo = busca.toLowerCase();
        return (
          d.nomeEmpresa?.toLowerCase().includes(termo) ||
          d.nomeResponsavel?.toLowerCase().includes(termo) ||
          d.setorEmpresa?.toLowerCase().includes(termo) ||
          d.conduzidoPor?.toLowerCase().includes(termo)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (ordenacao === 'recentes') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (ordenacao === 'antigos') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (ordenacao === 'score') {
        return (b.scoreGeral || 0) - (a.scoreGeral || 0);
      }
      if (ordenacao === 'empresa') {
        return (a.nomeEmpresa || '').localeCompare(b.nomeEmpresa || '');
      }
      return 0;
    });

  const totalFinalizados = diagnosticos.filter(d => d.status === 'finalizado').length;
  const totalAndamento = diagnosticos.filter(d => d.status === 'em_andamento').length;
  const mediaScore = diagnosticos
    .filter(d => d.scoreGeral)
    .reduce((acc, d, _, arr) => acc + d.scoreGeral / arr.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-7 h-7 text-amber-500" />
            Diagnósticos Rápidos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Histórico de diagnósticos de maturidade em IA realizados
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={loadDiagnosticos}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <Link
            to="/diagnostico-rapido"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
          >
            <Zap className="w-4 h-4" />
            Novo Diagnóstico
          </Link>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{diagnosticos.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Finalizados</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalFinalizados}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Em Andamento</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalAndamento}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score Médio</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {mediaScore > 0 ? mediaScore.toFixed(1) : '-'}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por empresa, responsável, setor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro Status */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="finalizados">Finalizados</option>
              <option value="andamento">Em Andamento</option>
            </select>
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-2">
            <ChevronDown className="w-4 h-4 text-gray-400" />
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="recentes">Mais Recentes</option>
              <option value="antigos">Mais Antigos</option>
              <option value="score">Maior Score</option>
              <option value="empresa">Empresa (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Diagnósticos */}
      {diagnosticosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <Zap className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum diagnóstico encontrado
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {busca || filtro !== 'todos' 
              ? 'Tente ajustar os filtros de busca' 
              : 'Inicie um novo diagnóstico rápido para aparecer aqui'}
          </p>
          <Link
            to="/diagnostico-rapido"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600"
          >
            <Zap className="w-4 h-4" />
            Iniciar Diagnóstico
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Empresa / Responsável
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Setor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Score / Nível
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Conduzido Por
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {diagnosticosFiltrados.map((diagnostico) => {
                  const statusConfig = CORES_STATUS[diagnostico.status] || CORES_STATUS['em_andamento'];
                  const nivelConfig = CORES_NIVEL[diagnostico.nivelMaturidade] || {};
                  
                  return (
                    <tr 
                      key={diagnostico.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {diagnostico.nomeEmpresa?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {diagnostico.nomeEmpresa || 'Não informado'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {diagnostico.nomeResponsavel}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {diagnostico.setorEmpresa || '-'}
                        </span>
                      </td>
                      
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          {diagnostico.status === 'finalizado' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {statusConfig.label}
                        </span>
                      </td>
                      
                      <td className="px-4 py-4">
                        {diagnostico.scoreGeral ? (
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${nivelConfig.badge || 'bg-gray-400'}`}></div>
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {diagnostico.scoreGeral.toFixed(1)}
                              </span>
                              <span className="text-gray-400 text-xs">/5</span>
                              <p className={`text-xs ${nivelConfig.text || 'text-gray-500'}`}>
                                {diagnostico.nivelMaturidade}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {diagnostico.conduzidoPor || '-'}
                        </span>
                      </td>
                      
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatarData(diagnostico.createdAt)}
                          </div>
                          {diagnostico.duracaoMinutos && (
                            <div className="flex items-center gap-1 text-xs mt-0.5">
                              <Clock className="w-3 h-3" />
                              {diagnostico.duracaoMinutos} min
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {diagnostico.status === 'finalizado' ? (
                            <Link
                              to={`/diagnostico-rapido/${diagnostico.id}/relatorio`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-sm font-medium transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Ver Relatório
                            </Link>
                          ) : (
                            <Link
                              to={`/diagnostico-rapido/${diagnostico.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-sm font-medium transition-colors"
                            >
                              <Zap className="w-4 h-4" />
                              Continuar
                            </Link>
                          )}
                          <button
                            onClick={() => handleExcluir(diagnostico.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Excluir diagnóstico"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Footer com total */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando <span className="font-medium text-gray-900 dark:text-white">{diagnosticosFiltrados.length}</span> de{' '}
              <span className="font-medium text-gray-900 dark:text-white">{diagnosticos.length}</span> diagnósticos
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

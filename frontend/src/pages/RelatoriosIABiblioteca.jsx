import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, BookOpen, Sparkles, Eye, Trash2, ExternalLink, Search, Filter, Calendar, Building2, Cpu, Zap, Library, ChevronDown, AlertTriangle, Layers, Clock, FileText } from 'lucide-react';
import { relatoriosIAApi, empresasApi } from '../services/api';
import { queryVersaoBibliotecaRelatorioIA } from '../utils/filtroNivelMaturidade';

const TIPO_CONFIG = {
  executivo: {
    label: 'Estratégico C-Level',
    icon: Sparkles,
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-700',
    accentColor: 'text-purple-600',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    chipColor: 'bg-gradient-to-br from-purple-500 to-fuchsia-600'
  },
  completo: {
    label: 'Book de Trabalho',
    icon: BookOpen,
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-700',
    accentColor: 'text-emerald-600',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    chipColor: 'bg-gradient-to-br from-emerald-500 to-teal-600'
  },
  completo_rapido: {
    label: 'Book modo rápido',
    icon: Zap,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-800',
    accentColor: 'text-amber-600',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    chipColor: 'bg-gradient-to-br from-amber-500 to-teal-600'
  }
};

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTimeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  if (hr < 24) return `há ${hr}h`;
  if (day < 30) return `há ${day} dia${day > 1 ? 's' : ''}`;
  return formatDate(date);
}

export default function RelatoriosIABiblioteca() {
  const [loading, setLoading] = useState(true);
  const [relatorios, setRelatorios] = useState([]);
  const [stats, setStats] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [empresas, setEmpresas] = useState([]);
  const [excluindoId, setExcluindoId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setLoading(true);
    try {
      const [lista, estatisticas, listaEmpresas] = await Promise.all([
        relatoriosIAApi.listar({ limit: 200 }),
        relatoriosIAApi.estatisticas(),
        empresasApi.listar()
      ]);
      setRelatorios(lista || []);
      setStats(estatisticas);
      setEmpresas(listaEmpresas || []);
    } catch (err) {
      console.error('Erro ao carregar biblioteca:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExcluir(id) {
    if (!confirm('Tem certeza que deseja excluir esta versão? Esta ação não pode ser desfeita.')) return;
    setExcluindoId(id);
    try {
      await relatoriosIAApi.excluir(id);
      setRelatorios(prev => prev.filter(r => r.id !== id));
      // recalcula stats
      const estatisticas = await relatoriosIAApi.estatisticas();
      setStats(estatisticas);
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setExcluindoId(null);
    }
  }

  function visualizar(r) {
    const path = r.tipo === 'executivo'
      ? `/relatorios/${r.projetoId}/mit-ia`
      : `/relatorios/${r.projetoId}/mit-ia-completo`;
    navigate(`${path}?${queryVersaoBibliotecaRelatorioIA(r)}`);
  }

  const filtrados = relatorios.filter(r => {
    if (filtroTipo !== 'todos' && r.tipo !== filtroTipo) return false;
    if (filtroEmpresa && String(r.projeto?.empresa?.id) !== String(filtroEmpresa)) return false;
    if (busca) {
      const q = busca.toLowerCase();
      return (
        r.titulo?.toLowerCase().includes(q) ||
        r.projeto?.nome?.toLowerCase().includes(q) ||
        r.projeto?.empresa?.nome?.toLowerCase().includes(q) ||
        r.setor?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900/40 to-emerald-900/30 rounded-2xl p-8 text-white shadow-xl border border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
            <Library className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-300 font-semibold">Biblioteca de IA</p>
            <h1 className="text-3xl font-bold">Relatórios Gerados por IA</h1>
          </div>
        </div>
        <p className="text-slate-300 text-sm max-w-3xl">
          Versões persistidas dos relatórios <strong className="text-purple-200">Estratégico C-Level</strong> e{' '}
          <strong className="text-emerald-200">Book de Trabalho Completo</strong> estruturados pela metodologia SysMap Blueprint IA (referência MIT CISR).
          Cada geração cria uma nova versão consultável aqui.
        </p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 uppercase font-semibold">Total</span>
              <Library className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-1">relatórios persistidos</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-700 uppercase font-semibold">Executivos</span>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {stats.porTipo?.find(t => t.tipo === 'executivo')?.count || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">resumos C-Level</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-emerald-700 uppercase font-semibold">Books</span>
              <BookOpen className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-700">
              {(stats.porTipo?.find(t => t.tipo === 'completo')?.count || 0) +
                (stats.porTipo?.find(t => t.tipo === 'completo_rapido')?.count || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">books (completo + rápido)</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-amber-700 uppercase font-semibold">Tokens IA</span>
              <Cpu className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-700">
              {((stats.tokens?.entrada + stats.tokens?.saida) / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-slate-500 mt-1">consumidos no total</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por empresa, projeto, setor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="todos">Todos os tipos</option>
            <option value="executivo">Estratégico C-Level</option>
            <option value="completo">Book completo</option>
            <option value="completo_rapido">Book modo rápido</option>
          </select>

          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Todas as empresas</option>
            {empresas.map(e => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>

          <div className="text-sm text-slate-600 ml-auto">
            <strong>{filtrados.length}</strong> de {relatorios.length} relatórios
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3"></div>
          <p className="text-slate-600">Carregando relatórios...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-xl p-16 shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {relatorios.length === 0 ? 'Nenhum relatório IA gerado ainda' : 'Nenhum relatório corresponde aos filtros'}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {relatorios.length === 0
              ? 'Acesse o dashboard de um projeto e gere o primeiro relatório IA.'
              : 'Tente ajustar os filtros acima.'}
          </p>
          {relatorios.length === 0 && (
            <Link
              to="/projetos"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition"
            >
              Ver Projetos
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map(r => {
            const cfg = TIPO_CONFIG[r.tipo] || TIPO_CONFIG.completo;
            const Icon = cfg.icon;
            return (
              <div
                key={r.id}
                className={`bg-white rounded-xl shadow-sm border ${cfg.borderColor} hover:shadow-lg transition-all overflow-hidden flex flex-col`}
              >
                {/* Header colorido */}
                <div className={`${cfg.bgColor} px-4 py-3 border-b ${cfg.borderColor} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${cfg.chipColor} flex items-center justify-center shadow`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.textColor}`}>
                        {cfg.label}
                      </span>
                      <p className="text-[10px] text-slate-500 -mt-0.5">v{r.versao}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.badgeColor}`}>
                    {r.tipo === 'executivo'
                      ? '5 seções'
                      : r.tipo === 'completo_rapido'
                        ? 'Modo rápido'
                        : '13 seções'}
                  </span>
                </div>

                {/* Corpo */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start gap-2 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                      {r.projeto?.empresa?.nome || '—'}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 mb-3 line-clamp-1 pl-5">
                    {r.projeto?.nome || '—'}
                  </p>

                  {/* Métricas */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div className="bg-slate-50 rounded-md py-1.5 px-1">
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider">Score</p>
                      <p className="text-sm font-bold text-slate-800">{r.scoreGeral?.toFixed(2) || '—'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-md py-1.5 px-1">
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider">Nível</p>
                      <p className="text-sm font-bold text-slate-800">{r.nivel || '—'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-md py-1.5 px-1">
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider">Setor</p>
                      <p className="text-[10px] font-semibold text-slate-700 capitalize line-clamp-1">{r.setor || '—'}</p>
                    </div>
                  </div>

                  {/* Info IA */}
                  <div className="flex flex-wrap gap-1.5 mb-3 text-[10px]">
                    {r.provider && (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                        {r.provider}
                      </span>
                    )}
                    {r.tokensSaida && (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-medium">
                        {(r.tokensSaida / 1000).toFixed(1)}k tok
                      </span>
                    )}
                    {r.totalChunks && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        {r.chunksGerados}/{r.totalChunks}
                      </span>
                    )}
                    {r.tempoGeracaoMs && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {(r.tempoGeracaoMs / 1000).toFixed(0)}s
                      </span>
                    )}
                  </div>

                  {/* Footer com data/autor */}
                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-500 mt-auto">
                    <span title={formatDate(r.createdAt)} className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatTimeAgo(r.createdAt)}
                    </span>
                    {r.geradoPor?.nome && (
                      <span className="line-clamp-1">por {r.geradoPor.nome}</span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="border-t border-slate-100 grid grid-cols-2 divide-x divide-slate-100">
                  <button
                    onClick={() => visualizar(r)}
                    className={`px-3 py-2.5 text-xs font-medium ${cfg.textColor} hover:${cfg.bgColor} transition flex items-center justify-center gap-1.5`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Visualizar
                  </button>
                  <button
                    onClick={() => handleExcluir(r.id)}
                    disabled={excluindoId === r.id}
                    className="px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {excluindoId === r.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

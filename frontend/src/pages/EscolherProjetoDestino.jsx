/**
 * Seletor de projeto para destinos por-projeto (Roadmap, Executive Dashboard, Command Center).
 * Acessado pelo menu "Execução"; pede o projeto antes de abrir a tela específica.
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Search, ArrowRight, GitBranch, BarChart3, Target, Loader2, FolderKanban, TrendingUp } from 'lucide-react';
import { projetosApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const DESTINOS = {
  roadmap: {
    titulo: 'Roadmap de Iniciativas',
    descricao: 'Escolha o projeto para abrir a timeline de iniciativas (lente dimensão, produto ou portfólio).',
    icon: GitBranch,
    cor: 'text-indigo-600',
    path: (id) => `/dashboard/projeto/${id}/roadmap`
  },
  'executive-dashboard': {
    titulo: 'Executive Dashboard',
    descricao: 'Escolha o projeto para abrir o painel executivo consolidado (C-Level).',
    icon: BarChart3,
    cor: 'text-emerald-600',
    path: (id) => `/dashboard/projeto/${id}/executive-dashboard`
  },
  'produtos-command-center': {
    titulo: 'Produtos IA-First — Command Center',
    descricao: 'Escolha o projeto para abrir o Command Center de produtos (matriz, economia, regulatório).',
    icon: Target,
    cor: 'text-blue-600',
    path: (id) => `/dashboard/projeto/${id}/produtos-command-center`
  },
  'roadmap-produtos': {
    titulo: 'Classificação & Roadmap de Produtos',
    descricao:
      'Escolha o projeto para classificar os produtos (modelo tradicional ou engenharia de valor), ver o ranking, o cronograma de execução e abrir o dashboard de cada produto.',
    icon: TrendingUp,
    cor: 'text-fuchsia-600',
    path: (id) => `/dashboard/projeto/${id}/roadmap-produtos`
  }
};

export default function EscolherProjetoDestino() {
  const { destino } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const config = DESTINOS[destino];

  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (!config) return;
    setLoading(true);
    projetosApi
      .listar()
      .then((p) => setProjetos(Array.isArray(p) ? p : []))
      .catch((e) => toast.error(e.message || 'Erro ao carregar projetos'))
      .finally(() => setLoading(false));
  }, [destino]);

  const filtrados = useMemo(() => {
    if (!busca) return projetos;
    const t = busca.toLowerCase();
    return projetos.filter(
      (p) => `${p.nome} ${p.empresa?.nome || ''}`.toLowerCase().includes(t)
    );
  }, [projetos, busca]);

  if (!config) return <Navigate to="/" replace />;

  const Icon = config.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-7 h-7 ${config.cor}`} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{config.titulo}</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{config.descricao}</p>

      <div className="card">
        <div className="relative mb-4">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar projeto ou empresa..."
            className="input pl-10"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            autoFocus
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-10">Nenhum projeto encontrado.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtrados.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(config.path(p.id))}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors text-left group"
              >
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <FolderKanban className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{p.nome}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.empresa?.nome || 'Sem empresa'}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

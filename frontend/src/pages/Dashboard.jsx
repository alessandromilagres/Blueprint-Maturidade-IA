import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, FolderKanban, ClipboardCheck, TrendingUp, ArrowRight } from 'lucide-react';
import { empresasApi, projetosApi, avaliacoesApi, produtosApi } from '../services/api';
import ScoreBadge from '../components/ScoreBadge';
import StatusBadge from '../components/StatusBadge';
import OnboardingChecklist from '../components/OnboardingChecklist';

export default function Dashboard() {
  const [stats, setStats] = useState({
    empresas: 0,
    projetos: 0,
    avaliacoes: 0,
    produtos: 0,
    avaliacoesFinalizadas: 0,
  });
  const [recentAvaliacoes, setRecentAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoadError(null);
      try {
        const [empresas, projetos, avaliacoes, produtos] = await Promise.all([
          empresasApi.listar(),
          projetosApi.listar(),
          avaliacoesApi.listar(),
          produtosApi.listar(),
        ]);

        setStats({
          empresas: empresas.length,
          projetos: projetos.length,
          avaliacoes: avaliacoes.length,
          produtos: produtos.length,
          avaliacoesFinalizadas: avaliacoes.filter(a => a.status === 'finalizada').length,
        });

        setRecentAvaliacoes(avaliacoes.slice(0, 5));
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setLoadError(error?.message || 'Não foi possível carregar o dashboard.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const statCards = [
    { label: 'Empresas', value: stats.empresas, icon: Building2, color: 'bg-blue-500', link: '/empresas' },
    { label: 'Projetos', value: stats.projetos, icon: FolderKanban, color: 'bg-purple-500', link: '/projetos' },
    { label: 'Avaliações', value: stats.avaliacoes, icon: ClipboardCheck, color: 'bg-orange-500', link: '/avaliacoes' },
    { label: 'Finalizadas', value: stats.avaliacoesFinalizadas, icon: TrendingUp, color: 'bg-green-500', link: '/avaliacoes' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">Não foi possível carregar os dados do dashboard</p>
        <p className="mt-2 text-sm opacity-90">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">SysMap</span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Blueprint IA — Assessment de Maturidade em Inteligência Artificial</p>
      </div>

      <OnboardingChecklist
        empresasCount={stats.empresas}
        projetosCount={stats.projetos}
        produtosCount={stats.produtos}
        avaliacoesCount={stats.avaliacoes}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`${color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Avaliações Recentes</h2>
          <Link to="/avaliacoes" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium flex items-center gap-1">
            Ver todas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentAvaliacoes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma avaliação encontrada</p>
            <Link to="/avaliacoes" className="text-primary-600 hover:underline text-sm dark:text-primary-400">
              Criar primeira avaliação
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                  <th className="pb-3 font-medium">Projeto</th>
                  <th className="pb-3 font-medium">Empresa</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {recentAvaliacoes.map((avaliacao) => (
                  <tr key={avaliacao.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{avaliacao.projeto.nome}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{avaliacao.projeto.empresa.nome}</td>
                    <td className="py-3">
                      <StatusBadge status={avaliacao.status} />
                    </td>
                    <td className="py-3">
                      {avaliacao.scoreGeral ? (
                        <ScoreBadge score={avaliacao.scoreGeral} nivel={avaliacao.nivelGeral} size="sm" />
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">Não calculado</span>
                      )}
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(avaliacao.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 text-right">
                      {avaliacao.status === 'finalizada' ? (
                        <Link
                          to={`/relatorios/${avaliacao.id}`}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                        >
                          Ver Relatório
                        </Link>
                      ) : (
                        <Link
                          to={`/avaliacoes/${avaliacao.id}`}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                        >
                          Continuar
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

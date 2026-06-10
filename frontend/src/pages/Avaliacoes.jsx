import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, FileText, Trash2 } from 'lucide-react';
import { avaliacoesApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ScoreBadge from '../components/ScoreBadge';
import { useAuth } from '../contexts/AuthContext';

export default function Avaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { usuario, isAdmin, isAvaliador } = useAuth();
  const ehAvaliador = isAvaliador();

  useEffect(() => {
    if (!usuario?.id) return;
    loadAvaliacoes();
  }, [usuario?.id, usuario?.role]);

  async function loadAvaliacoes() {
    try {
      const data = await avaliacoesApi.listar();
      const avaliacoesFiltradas = isAdmin()
        ? data
        : data.filter(
            (avaliacao) =>
              Number(avaliacao.usuario?.id) === Number(usuario?.id)
          );
      setAvaliacoes(avaliacoesFiltradas);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(avaliacao) {
    if (confirm('Deseja excluir esta avaliação?')) {
      try {
        await avaliacoesApi.excluir(avaliacao.id);
        loadAvaliacoes();
      } catch (error) {
        alert('Erro ao excluir avaliação: ' + error.message);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Avaliações</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Todas as avaliações de maturidade em IA</p>
      </div>

      {avaliacoes.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma avaliação encontrada</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {ehAvaliador
              ? 'Quando houver uma avaliação de maturidade para você, ela aparecerá aqui.'
              : 'Crie uma avaliação a partir de um projeto'}
          </p>
          {!ehAvaliador && (
            <Link to="/projetos" className="btn btn-primary">
              Ir para Projetos
            </Link>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                  <th className="px-6 py-3 font-medium">Projeto</th>
                  <th className="px-6 py-3 font-medium">Empresa</th>
                  <th className="px-6 py-3 font-medium">Avaliador</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Score</th>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {avaliacoes.map((avaliacao) => (
                  <tr key={avaliacao.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      {ehAvaliador ? (
                        <span className="font-medium text-gray-900 dark:text-white">
                          {avaliacao.projeto.nome}
                        </span>
                      ) : (
                        <Link
                          to={`/projetos/${avaliacao.projeto.id}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          {avaliacao.projeto.nome}
                        </Link>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {ehAvaliador ? (
                        <span className="text-gray-600 dark:text-gray-400">
                          {avaliacao.projeto.empresa.nome}
                        </span>
                      ) : (
                        <Link
                          to={`/empresas/${avaliacao.projeto.empresa.id}`}
                          className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          {avaliacao.projeto.empresa.nome}
                        </Link>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 dark:text-white">{avaliacao.usuario.nome}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{avaliacao.usuario.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={avaliacao.status} />
                    </td>
                    <td className="px-6 py-4">
                      {avaliacao.scoreGeral ? (
                        <ScoreBadge score={avaliacao.scoreGeral} nivel={avaliacao.nivelGeral} size="sm" />
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(avaliacao.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {avaliacao.status === 'finalizada' ? (
                          ehAvaliador ? (
                            <Link
                              to={`/avaliacao-concluida/${avaliacao.id}`}
                              className="btn btn-secondary text-sm py-1.5"
                            >
                              Ver conclusão
                            </Link>
                          ) : (
                          <Link
                            to={`/relatorios/${avaliacao.id}`}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Ver Relatório"
                          >
                            <FileText className="w-5 h-5" />
                          </Link>
                          )
                        ) : (
                          <Link
                            to={`/avaliacoes/${avaliacao.id}`}
                            className="btn btn-primary text-sm py-1.5"
                          >
                            Continuar
                          </Link>
                        )}
                        {!ehAvaliador && (
                          <button
                            onClick={() => handleDelete(avaliacao)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

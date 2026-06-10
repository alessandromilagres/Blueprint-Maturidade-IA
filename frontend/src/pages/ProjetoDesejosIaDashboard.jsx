import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { projetosApi, exportarApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function ProjetoDesejosIaDashboard() {
  const { id } = useParams();
  const toast = useToast();
  const { isGestor, isAvaliador } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const podeConsolidado = isGestor();

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const d = await projetosApi.desejosIaDashboard(id);
      setData(d);
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function baixarIndividual(avaliacaoId) {
    try {
      await exportarApi.download(
        exportarApi.avaliacaoDesejosIaDocx(avaliacaoId),
        `desejos-ia-avaliacao-${avaliacaoId}.docx`
      );
    } catch (e) {
      toast.error(e.message || 'Falha ao exportar');
    }
  }

  async function baixarConsolidado() {
    try {
      await exportarApi.download(exportarApi.projetoDesejosIaDocx(id), `desejos-ia-projeto-${id}.docx`);
    } catch (e) {
      toast.error(e.message || 'Falha ao exportar');
    }
  }

  function toggleExpand(avaliacaoId) {
    setExpanded((prev) => ({ ...prev, [avaliacaoId]: !prev[avaliacaoId] }));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!data?.projeto) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Não foi possível carregar os dados.</p>
        <Link to={`/projetos/${id}`} className="text-primary-600 hover:underline mt-2 inline-block">
          Voltar ao projeto
        </Link>
      </div>
    );
  }

  const comResposta = data.avaliacoes.filter((a) => a.temDesejosIA).length;
  const persistOk = data.meta?.desejosIaPersistenciaDisponivel !== false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link to={`/projetos/${id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mt-1">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-teal-600 dark:text-teal-400" />
              Desejos IA — roadmap
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {data.projeto.nome} · {data.projeto.empresa?.nome}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-3xl">
              Conteúdo do bloco opcional “Desejos IA” por avaliador. Estas respostas{' '}
              <strong>não entram</strong> no cálculo do score de maturidade; servem para apoiar discussões de roadmap com a
              SysMap e a liderança.
            </p>
          </div>
        </div>
        {podeConsolidado && (
          <button
            type="button"
            onClick={baixarConsolidado}
            disabled={comResposta === 0}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
            title={comResposta === 0 ? 'Nenhuma avaliação com Desejos IA preenchido' : 'Word com todos os avaliadores'}
          >
            <Download className="w-4 h-4" />
            Word — todos os avaliadores
          </button>
        )}
      </div>

      {!persistOk && (
        <div className="text-sm text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg px-4 py-3">
          <strong>Atenção:</strong> neste ambiente a tabela de persistência dos Desejos IA ainda não está disponível no
          banco de dados. O painel abre, mas <strong>não é possível listar respostas salvas</strong>. Peça para rodar as
          migrações Prisma (ou o fluxo <code className="text-xs">migrate-schema</code>) que criam{' '}
          <code className="text-xs">AvaliacaoDesejosIA</code>, depois refaça o teste preenchendo o bloco na avaliação e
          salvando.
        </div>
      )}

      {isAvaliador() && (
        <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/25 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
          Como avaliador, você vê apenas as suas avaliações neste projeto.
        </p>
      )}

      {persistOk && (
        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2">
          O botão <strong>Detalhes</strong> só fica ativo quando há texto do bloco Desejos IA <strong>gravado no
          servidor</strong> (use <strong>Salvar</strong> na avaliação, aba &quot;Desejos IA&quot;). Se você preencheu
          apenas no navegador sem salvar, nada aparece aqui.
        </p>
      )}

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {data.avaliacoes.length} avaliação(ões) listada(s) · {comResposta} com Desejos IA preenchido
          </span>
        </div>
        <div className="divide-y dark:divide-gray-700">
          {data.avaliacoes.length === 0 ? (
            <p className="p-6 text-gray-500 dark:text-gray-400 text-sm">Nenhuma avaliação encontrada.</p>
          ) : (
            data.avaliacoes.map((row) => (
              <div key={row.avaliacaoId} className="bg-white dark:bg-gray-900/30">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {row.usuario?.nome || '—'}{' '}
                      <span className="text-gray-500 dark:text-gray-400 font-normal text-sm">
                        ({row.usuario?.email || '—'})
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Avaliação #{row.avaliacaoId} · {row.status}
                      {row.temDesejosIA ? (
                        <span className="ml-2 text-teal-700 dark:text-teal-300">· Com respostas Desejos IA</span>
                      ) : (
                        <span className="ml-2">· Sem respostas neste bloco</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
                    {(row.linhas?.length ?? 0) === 0 && (
                      <Link
                        to={`/avaliacoes/${row.avaliacaoId}`}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
                      >
                        Abrir avaliação
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleExpand(row.avaliacaoId)}
                      className="btn btn-secondary text-sm py-1.5 px-3 flex items-center gap-1"
                      disabled={(row.linhas?.length ?? 0) === 0}
                      title={
                        (row.linhas?.length ?? 0) === 0
                          ? 'Não há respostas do bloco Desejos IA gravadas para esta avaliação'
                          : 'Ver texto das respostas'
                      }
                    >
                      {expanded[row.avaliacaoId] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      Detalhes
                    </button>
                    <button
                      type="button"
                      onClick={() => baixarIndividual(row.avaliacaoId)}
                      disabled={(row.linhas?.length ?? 0) === 0}
                      className="btn btn-secondary text-sm py-1.5 px-3 flex items-center gap-1 disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4" />
                      Word individual
                    </button>
                  </div>
                </div>
                {expanded[row.avaliacaoId] && row.linhas?.length > 0 && (
                  <div className="px-4 pb-4 pt-0 space-y-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/40">
                    {row.linhas.map((ln, idx) => (
                      <div key={idx} className="text-sm">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{ln.pergunta}</p>
                        <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{ln.textoResposta}</p>
                        {ln.observacoes && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs">
                            <span className="font-medium">Comentários:</span> {ln.observacoes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Scale,
  Layers,
  TrendingUp,
  CalendarRange,
  Trophy,
  ArrowRightLeft,
  AlertTriangle
} from 'lucide-react';
import { engenhariaValorApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import GanttChart from '../components/GanttChart';

const MODELOS = {
  tradicional: {
    id: 'tradicional',
    label: 'Modelo tradicional',
    descricao: '60% relevância do produto + 40% maturidade do Blueprint',
    icone: Layers,
    cor: 'purple'
  },
  valor: {
    id: 'valor',
    label: 'Engenharia de valor',
    descricao: 'Drivers do Blueprint (nota inversa) × impacto, peso Fibonacci',
    icone: Scale,
    cor: 'indigo'
  }
};

// statusConstrucao do produto → status visual do Gantt
const STATUS_CONSTRUCAO_GANTT = {
  planejado: { status: 'planejada', progresso: 0 },
  em_construcao: { status: 'em_andamento', progresso: 50 },
  em_teste: { status: 'em_andamento', progresso: 80 },
  ativo: { status: 'concluida', progresso: 100 },
  suspenso: { status: 'backlog', progresso: 0 },
  cancelado: { status: 'cancelada', progresso: 0 }
};

function scoreDoModelo(produto, modelo) {
  return modelo === 'valor'
    ? produto.valor.scoreValorNormalizado
    : produto.tradicional.scorePrioridadeEstrategica;
}

function posicaoDoModelo(produto, modelo) {
  return modelo === 'valor' ? produto.valor.posicao : produto.tradicional.posicao;
}

function corPosicao(pos) {
  if (pos === 1) return 'bg-amber-400 text-amber-950';
  if (pos === 2) return 'bg-slate-300 text-slate-800';
  if (pos === 3) return 'bg-orange-300 text-orange-900';
  return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
}

export default function RoadmapProdutos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [modelo, setModelo] = useState('tradicional');

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const res = await engenhariaValorApi.roadmapProjeto(id);
      setData(res);
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar roadmap de produtos');
    } finally {
      setLoading(false);
    }
  }

  // Ranking ordenado pelo modelo selecionado.
  const ranking = useMemo(() => {
    if (!data?.produtos) return [];
    return [...data.produtos].sort(
      (a, b) =>
        (posicaoDoModelo(a, modelo) ?? 9999) - (posicaoDoModelo(b, modelo) ?? 9999)
    );
  }, [data, modelo]);

  const maxScore = useMemo(() => {
    if (!ranking.length) return 1;
    return Math.max(1, ...ranking.map((p) => scoreDoModelo(p, modelo)));
  }, [ranking, modelo]);

  // Gantt: produtos com datas, ordenados por data de início (ordem de execução).
  const gruposGantt = useMemo(() => {
    if (!data?.produtos) return [];
    const comDatas = data.produtos
      .map((p) => {
        const ini = p.cronograma.dataInicioConstrucao;
        const fim = p.cronograma.dataAtivacaoProducao || p.cronograma.dataFimConstrucao;
        if (!ini && !fim) return null;
        const mapa = STATUS_CONSTRUCAO_GANTT[p.statusConstrucao] || STATUS_CONSTRUCAO_GANTT.planejado;
        const pos = posicaoDoModelo(p, modelo);
        return {
          id: p.id,
          titulo: `${pos ? `#${pos} ` : ''}${p.nome}`,
          responsavel: `Prioridade ${MODELOS[modelo].label.toLowerCase()}`,
          dataInicio: ini,
          dataFimPrevista: fim,
          status: mapa.status,
          progresso: mapa.progresso,
          _ini: ini ? new Date(ini).getTime() : Number.MAX_SAFE_INTEGER
        };
      })
      .filter(Boolean)
      .sort((a, b) => a._ini - b._ini);

    if (!comDatas.length) return [];
    return [
      {
        chave: 'execucao',
        rotulo: 'Ordem de execução (por data de início)',
        critico: false,
        iniciativas: comDatas
      }
    ];
  }, [data, modelo]);

  const semDatas = useMemo(() => {
    if (!data?.produtos) return [];
    return data.produtos.filter(
      (p) =>
        !p.cronograma.dataInicioConstrucao &&
        !p.cronograma.dataFimConstrucao &&
        !p.cronograma.dataAtivacaoProducao
    );
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-center text-gray-600">
        Roadmap de produtos indisponível.
      </div>
    );
  }

  const ModeloIcone = MODELOS[modelo].icone;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/projeto/${id}`)}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-indigo-600" />
              Roadmap de produtos IA-First
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.projeto?.nome}
              {data.projeto?.empresa ? ` · ${data.projeto.empresa}` : ''}
            </p>
          </div>
        </div>

        {/* Alternador de modelo */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700 dark:text-gray-200">
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
            Modelo de priorização
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(MODELOS).map((m) => {
              const Icone = m.icone;
              const ativo = modelo === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModelo(m.id)}
                  className={`text-left rounded-xl border p-4 transition-colors ${
                    ativo
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                    <Icone className={`w-5 h-5 ${ativo ? 'text-indigo-600' : 'text-gray-400'}`} />
                    {m.label}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{m.descricao}</p>
                </button>
              );
            })}
          </div>
          {modelo === 'valor' && data.configuradosValor < data.total && (
            <p className="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {data.total - data.configuradosValor} de {data.total} produto(s) ainda sem engenharia de valor
              configurada (score 0). Configure em cada produto para o ranking refletir os drivers.
            </p>
          )}
        </div>

        {/* Ranking de prioridade */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 px-5 py-3">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Prioridade dos produtos — {MODELOS[modelo].label}
            </h2>
          </div>

          {ranking.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">Nenhum produto neste projeto.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {ranking.map((p) => {
                const pos = posicaoDoModelo(p, modelo);
                const score = scoreDoModelo(p, modelo);
                const pct = Math.round((score / maxScore) * 100);
                const posOutro =
                  modelo === 'valor' ? p.tradicional.posicao : p.valor.posicao;
                const subiu = posOutro != null && pos != null && pos < posOutro;
                const desceu = posOutro != null && pos != null && pos > posOutro;
                return (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-3">
                    <span
                      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${corPosicao(
                        pos
                      )}`}
                    >
                      {pos ?? '-'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/dashboard/produto/${p.id}`}
                          className="font-medium text-gray-900 dark:text-white truncate hover:underline"
                        >
                          {p.nome}
                        </Link>
                        {posOutro != null && (subiu || desceu) && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              subiu
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                            }`}
                            title={`Posição no outro modelo: #${posOutro}`}
                          >
                            {subiu ? `▲ sobe vs #${posOutro}` : `▼ desce vs #${posOutro}`}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            modelo === 'valor' ? 'bg-indigo-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {modelo === 'valor' ? `${score}%` : score.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {modelo === 'valor' ? 'valor normalizado' : 'prioridade estratégica'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Link
                        to={`/dashboard/produto/${p.id}/engenharia-valor`}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-indigo-300 dark:border-indigo-700 px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                      >
                        <Scale className="w-3 h-3" />
                        Classificar
                      </Link>
                      <Link
                        to={`/dashboard/produto/${p.id}`}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-2.5 py-1 text-[11px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                      >
                        <Layers className="w-3 h-3" />
                        Dashboard
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gráfico de execução por datas */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 px-5 py-3">
            <CalendarRange className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Ordem de execução por datas
            </h2>
            <span className="ml-auto text-xs text-gray-400">
              início → ativação em produção
            </span>
          </div>
          <div className="p-4">
            {gruposGantt.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500">
                Nenhum produto com datas de cronograma. Defina início/fim de construção ou ativação nos
                produtos para visualizar a linha do tempo.
              </p>
            ) : (
              <GanttChart grupos={gruposGantt} onSelecionar={(it) => navigate(`/dashboard/produto/${it.id}`)} />
            )}
          </div>
          {semDatas.length > 0 && (
            <div className="px-5 pb-4 text-xs text-gray-500 dark:text-gray-400">
              Sem datas ({semDatas.length}): {semDatas.map((p) => p.nome).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, Download, Minus, Printer, TrendingDown, TrendingUp } from 'lucide-react';
import { dashboardApi, projetosApi } from '../services/api';
import { ORDEM_DIMENSOES_FRAMEWORK } from '../constants/ordemDimensoesFramework.js';

function baixarCsv(nomeArquivo, linhas) {
  const csv = linhas
    .map((linha) => linha.map((valor) => `"${String(valor ?? '').replaceAll('"', '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

function formatData(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function tendenciaStyle(tendencia) {
  if (tendencia === 'evoluiu') return 'text-emerald-700 bg-emerald-100 dark:text-emerald-100 dark:bg-emerald-900/40';
  if (tendencia === 'regrediu') return 'text-red-700 bg-red-100 dark:text-red-100 dark:bg-red-900/40';
  return 'text-slate-700 bg-slate-100 dark:text-slate-100 dark:bg-slate-800';
}

function calcularComparativoVersoes(historicoVersoes, versaoBaseId, versaoComparadaId) {
  if (historicoVersoes.length < 2) {
    return {
      disponivel: false,
      mensagem: 'É necessário ter ao menos duas versões com avaliações finalizadas no projeto.',
      historico: historicoVersoes,
      dimensoes: []
    };
  }

  const base = historicoVersoes.find((item) => String(item.versaoId) === String(versaoBaseId)) || historicoVersoes[0];
  const comparada = historicoVersoes.find((item) => String(item.versaoId) === String(versaoComparadaId))
    || historicoVersoes[historicoVersoes.length - 1];

  if (!base || !comparada || String(base.versaoId) === String(comparada.versaoId)) {
    return {
      disponivel: false,
      mensagem: 'Selecione duas versões diferentes para comparar.',
      historico: historicoVersoes,
      dimensoes: [],
      base,
      comparada
    };
  }

  const delta = Number(comparada.score || 0) - Number(base.score || 0);
  const basePorArea = new Map((base.scoresPorArea || []).map((area) => [area.area, area]));
  const comparadaPorArea = new Map((comparada.scoresPorArea || []).map((area) => [area.area, area]));
  const dimensoes = ORDEM_DIMENSOES_FRAMEWORK.map((nome, idx) => {
    const anterior = basePorArea.get(nome);
    const atual = comparadaPorArea.get(nome);
    const scoreInicial = Number(anterior?.score || 0);
    const scoreFinal = Number(atual?.score || 0);
    const deltaArea = scoreFinal - scoreInicial;
    return {
      ordemFramework: idx + 1,
      areaId: atual?.areaId ?? anterior?.areaId ?? idx + 1,
      area: nome,
      scoreInicial,
      scoreFinal,
      delta: parseFloat(deltaArea.toFixed(2)),
      tendencia: deltaArea > 0.15 ? 'evoluiu' : deltaArea < -0.15 ? 'regrediu' : 'estavel',
      semDadosInicial: scoreInicial <= 0,
      semDadosFinal: scoreFinal <= 0
    };
  });

  return {
    disponivel: true,
    base,
    comparada,
    delta: parseFloat(delta.toFixed(2)),
    tendencia: delta > 0.15 ? 'evoluiu' : delta < -0.15 ? 'regrediu' : 'estavel',
    historico: historicoVersoes,
    dimensoes
  };
}

export default function EvolucaoProjeto() {
  const { id } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [historicoVersoes, setHistoricoVersoes] = useState([]);
  const [versaoBaseId, setVersaoBaseId] = useState('');
  const [versaoComparadaId, setVersaoComparadaId] = useState('');
  const [filtroNivel, setFiltroNivel] = useState(3);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function carregar() {
      try {
        setLoading(true);
        setErro('');
        const versoesData = await projetosApi.versoes(id);
        const dashboards = await Promise.all(
          (versoesData.versoes || []).map(async (versao) => ({
            versao,
            dashboard: await dashboardApi.projeto(id, {
              nivelPrioridadeMapeamentoMaturidade: filtroNivel,
              projetoVersaoId: versao.id
            })
          }))
        );
        const historico = dashboards
          .map(({ versao, dashboard: d }) => ({
            avaliacaoId: `versao-${versao.id}`,
            versaoId: versao.id,
            avaliador: versao.titulo,
            data: versao.fechadaEm || versao.ultimaAvaliacaoEm || versao.iniciadaEm,
            score: d.scoreGeral,
            nivel: d.nivelGeral,
            status: versao.status,
            scoresPorArea: d.scoresPorArea || []
          }))
          .filter((item) => Number(item.score) > 0);

        if (!cancelled) {
          setHistoricoVersoes(historico);
          setVersaoBaseId((atual) => {
            if (atual && historico.some((item) => String(item.versaoId) === String(atual))) return atual;
            return historico[0]?.versaoId ? String(historico[0].versaoId) : '';
          });
          setVersaoComparadaId((atual) => {
            if (atual && historico.some((item) => String(item.versaoId) === String(atual))) return atual;
            return historico[historico.length - 1]?.versaoId ? String(historico[historico.length - 1].versaoId) : '';
          });
          setDashboard({
            projeto: versoesData.projeto,
            empresa: versoesData.empresa,
            totalAvaliadores: dashboards[dashboards.length - 1]?.dashboard?.totalAvaliadores || 0
          });
        }
      } catch (error) {
        if (!cancelled) setErro(error.message || 'Não foi possível carregar a evolução.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    carregar();
    return () => {
      cancelled = true;
    };
  }, [id, filtroNivel]);

  const comparativo = useMemo(
    () => calcularComparativoVersoes(historicoVersoes, versaoBaseId, versaoComparadaId),
    [historicoVersoes, versaoBaseId, versaoComparadaId]
  );
  const historico = comparativo.historico || [];
  const dimensoes = comparativo.dimensoes || [];
  const versaoBase = comparativo.base;
  const versaoComparada = comparativo.comparada;
  const melhores = useMemo(() => [...dimensoes].sort((a, b) => b.delta - a.delta).slice(0, 3), [dimensoes]);
  const atencao = useMemo(() => dimensoes.filter((item) => item.delta < -0.15).slice(0, 3), [dimensoes]);

  function exportarCsv() {
    baixarCsv(`evolucao-${dashboard?.projeto?.nome || id}.csv`, [
      ['Comparativo', versaoBase?.avaliador || '-', '→', versaoComparada?.avaliador || '-', '', '', ''],
      ['Tipo', 'Nome', 'Data', 'Score inicial', 'Score final', 'Delta', 'Tendência'],
      ...historico.map((item) => [
        'Versão',
        item.avaliador,
        formatData(item.data),
        '',
        item.score,
        '',
        item.nivel
      ]),
      ...dimensoes.map((item) => [
        'Dimensão',
        item.area,
        '',
        item.scoreInicial,
        item.scoreFinal,
        item.delta,
        item.tendencia
      ])
    ]);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">Erro ao carregar evolução</p>
        <p className="mt-1 text-sm">{erro}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between print:hidden">
        <div>
          <Link to={`/projetos/${id}`} className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao projeto
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <BarChart3 className="h-7 w-7 text-blue-600" />
            Evolução do Projeto
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {dashboard?.projeto?.nome} · {dashboard?.empresa?.nome}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={versaoBaseId}
            onChange={(e) => setVersaoBaseId(e.target.value)}
            className="input max-w-xs"
            disabled={historico.length < 2}
          >
            {historico.map((item) => (
              <option key={`base-${item.versaoId}`} value={String(item.versaoId)}>
                Base: {item.avaliador}
              </option>
            ))}
          </select>
          <select
            value={versaoComparadaId}
            onChange={(e) => setVersaoComparadaId(e.target.value)}
            className="input max-w-xs"
            disabled={historico.length < 2}
          >
            {historico.map((item) => (
              <option key={`comp-${item.versaoId}`} value={String(item.versaoId)}>
                Comparar: {item.avaliador}
              </option>
            ))}
          </select>
          <select
            value={filtroNivel}
            onChange={(e) => setFiltroNivel(parseInt(e.target.value, 10))}
            className="input max-w-xs"
          >
            <option value={1}>Prioridade 1</option>
            <option value={2}>Prioridades 1 e 2</option>
            <option value={3}>Prioridades 1, 2 e 3</option>
          </select>
          <button type="button" onClick={exportarCsv} className="btn btn-secondary inline-flex items-center gap-2" disabled={historico.length === 0}>
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button type="button" onClick={() => window.print()} className="btn btn-secondary inline-flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Imprimir/PDF
          </button>
        </div>
      </div>

      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">Evolução do Projeto</h1>
        <p>{dashboard?.projeto?.nome} · {dashboard?.empresa?.nome}</p>
        {versaoBase && versaoComparada && (
          <p>Comparativo: {versaoBase.avaliador} → {versaoComparada.avaliador}</p>
        )}
      </div>

      {!comparativo.disponivel ? (
        <div className="card text-center">
          <p className="font-medium text-gray-900 dark:text-white">Histórico insuficiente para comparação.</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{comparativo.mensagem}</p>
        </div>
      ) : (
        <>
          <div className="card border border-blue-200 bg-blue-50/40 dark:border-blue-900/50 dark:bg-blue-950/20 print:hidden">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Comparando <strong>{versaoBase?.avaliador}</strong> com <strong>{versaoComparada?.avaliador}</strong>
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Escolha explicitamente quais versões deseja comparar.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Score da versão base</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{Number(versaoBase?.score || 0).toFixed(1)}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{versaoBase?.avaliador}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Score da versão comparada</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{Number(versaoComparada?.score || 0).toFixed(1)}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{versaoComparada?.avaliador}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Variação</p>
              <div className="mt-1 flex items-center gap-2">
                {comparativo.delta >= 0 ? <TrendingUp className="h-7 w-7 text-emerald-500" /> : <TrendingDown className="h-7 w-7 text-red-500" />}
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {comparativo.delta > 0 ? '+' : ''}{Number(comparativo.delta || 0).toFixed(2)}
                </p>
              </div>
              <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${tendenciaStyle(comparativo.tendencia)}`}>
                {comparativo.tendencia}
              </span>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Histórico de versões</h2>
              <div className="space-y-3">
                {historico.map((item, index) => (
                  <div key={item.avaliacaoId} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{index + 1}. {item.avaliador}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatData(item.data)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{Number(item.score || 0).toFixed(1)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.nivel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Destaques por dimensão</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Maiores avanços</p>
                  <div className="mt-2 space-y-2">
                    {melhores.map((item) => (
                      <div key={item.areaId} className="flex justify-between rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-950/30">
                        <span className="text-gray-900 dark:text-white">{item.area}</span>
                        <strong className="text-emerald-700 dark:text-emerald-300">+{Number(item.delta).toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">Pontos de atenção</p>
                  <div className="mt-2 space-y-2">
                    {atencao.length === 0 ? (
                      <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        Nenhuma dimensão regrediu de forma relevante.
                      </p>
                    ) : atencao.map((item) => (
                      <div key={item.areaId} className="flex justify-between rounded-lg bg-red-50 p-3 text-sm dark:bg-red-950/30">
                        <span className="text-gray-900 dark:text-white">{item.area}</span>
                        <strong className="text-red-700 dark:text-red-300">{Number(item.delta).toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Comparativo por dimensão</h2>
            <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dimensoes.map((item) => {
                const Icone = item.tendencia === 'evoluiu' ? TrendingUp : item.tendencia === 'regrediu' ? TrendingDown : Minus;
                const cor = item.tendencia === 'evoluiu'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                  : item.tendencia === 'regrediu'
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200';
                return (
                  <div key={`card-${item.areaId}`} className={`rounded-xl border p-4 ${cor}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.area}</p>
                        <p className="mt-1 text-xs opacity-80">
                          {Number(item.scoreInicial).toFixed(1)} → {Number(item.scoreFinal).toFixed(1)}
                        </p>
                      </div>
                      <Icone className="h-5 w-5 shrink-0" />
                    </div>
                    <p className="mt-3 text-2xl font-bold">
                      {item.delta > 0 ? '+' : ''}{Number(item.delta).toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide opacity-80">
                      {item.tendencia === 'evoluiu' ? 'Subiu' : item.tendencia === 'regrediu' ? 'Caiu' : 'Estável'}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <th className="pb-3 font-medium">Dimensão</th>
                    <th className="pb-3 font-medium">{versaoBase?.avaliador || 'Base'}</th>
                    <th className="pb-3 font-medium">{versaoComparada?.avaliador || 'Comparada'}</th>
                    <th className="pb-3 font-medium">Delta</th>
                    <th className="pb-3 font-medium">Tendência</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {dimensoes.map((item) => (
                    <tr key={item.areaId}>
                      <td className="py-3 font-medium text-gray-900 dark:text-white">
                        {item.area}
                        {(item.semDadosInicial || item.semDadosFinal) && (
                          <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                            {item.semDadosInicial && item.semDadosFinal
                              ? '(sem dados nas duas versões)'
                              : item.semDadosFinal
                                ? '(sem dados na versão comparada)'
                                : '(sem dados na versão base)'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-gray-700 dark:text-gray-300">
                        {item.semDadosInicial ? '0,0' : Number(item.scoreInicial).toFixed(1)}
                      </td>
                      <td className="py-3 text-gray-700 dark:text-gray-300">
                        {item.semDadosFinal ? '0,0' : Number(item.scoreFinal).toFixed(1)}
                      </td>
                      <td className={`py-3 font-semibold ${item.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {item.delta > 0 ? '+' : ''}{Number(item.delta).toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tendenciaStyle(item.tendencia)}`}>
                          {item.tendencia}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

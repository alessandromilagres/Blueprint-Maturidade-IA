/**
 * Comparativo entre unidades organizacionais (Fase 4).
 * Score enterprise, ranking por unidade, matriz de dimensões e importação de gaps no roadmap.
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Building2, AlertTriangle, Loader2, TrendingUp, TrendingDown,
  Target, Sparkles, GitBranch, Minus
} from 'lucide-react';
import { dashboardApi, iniciativasApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { podeGerenciarExecucao } from '../constants/perfisGestaoExecucao';
import EmpresaLogoRelatorio from '../components/EmpresaLogoRelatorio';
import {
  filtroNivelMapeamentoFromSearchParams,
  labelFiltroNivelMapeamento,
  queryNivelMapeamentoMaturidade
} from '../utils/filtroNivelMaturidade';

function corHeatmapScore(score) {
  if (score == null || !Number.isFinite(Number(score))) {
    return 'bg-gray-100 dark:bg-gray-800 text-gray-400';
  }
  const s = Number(score);
  if (s < 2) return 'bg-red-500/85 text-white';
  if (s < 3) return 'bg-orange-400/85 text-white';
  if (s < 4) return 'bg-yellow-400/90 text-gray-900';
  if (s < 4.5) return 'bg-lime-500/75 text-gray-900';
  return 'bg-emerald-500/85 text-white';
}

function fmtDelta(delta) {
  if (delta == null || !Number.isFinite(Number(delta))) return '—';
  const n = Number(delta);
  const prefix = n > 0 ? '+' : '';
  return `${prefix}${n.toFixed(2)}`;
}

function DeltaIcon({ delta }) {
  const n = Number(delta);
  if (!Number.isFinite(n) || n === 0) return <Minus className="w-4 h-4 text-gray-400" />;
  if (n > 0) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
  return <TrendingDown className="w-4 h-4 text-red-500" />;
}

function buildRoadmapLink(projetoId, versaoId, unidadeId, filtroNivel) {
  const p = new URLSearchParams();
  if (versaoId) p.set('versaoId', String(versaoId));
  if (unidadeId) p.set('empresaUnidadeId', String(unidadeId));
  p.set('nivelPrioridadeMapeamentoMaturidade', String(filtroNivel === 0 ? 0 : filtroNivel));
  return `/dashboard/projeto/${projetoId}/roadmap?${p.toString()}`;
}

export default function ComparativoUnidadesProjeto() {
  const { id } = useParams();
  const projetoId = Number(id);
  const [searchParams] = useSearchParams();
  const versaoId = searchParams.get('versaoId');
  const filtroNivel = filtroNivelMapeamentoFromSearchParams(searchParams);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [importandoId, setImportandoId] = useState(null);
  const toast = useToast();
  const { usuario } = useAuth();
  const podeEditar = podeGerenciarExecucao(usuario?.role);

  useEffect(() => {
    setLoading(true);
    dashboardApi
      .comparativoUnidades(projetoId, {
        versaoId: versaoId || undefined,
        nivelPrioridadeMapeamentoMaturidade: filtroNivel
      })
      .then((d) => { setData(d); setErro(null); })
      .catch((e) => setErro(e.message || 'Erro ao carregar comparativo'))
      .finally(() => setLoading(false));
  }, [projetoId, versaoId, filtroNivel]);

  const unidades = data?.unidades || [];
  const enterprise = data?.enterprise;
  const matriz = data?.matrizDimensoes || [];

  const versaoLabel = data?.projetoVersao?.titulo || (versaoId ? `Versão #${versaoId}` : null);

  async function importarGaps(unidade) {
    if (!unidade?.id) return;
    setImportandoId(unidade.id);
    try {
      const body = {
        projetoId,
        empresaUnidadeId: unidade.id,
        nivelPrioridadeMapeamentoMaturidade: filtroNivel
      };
      if (versaoId) body.projetoVersaoId = Number(versaoId);
      const r = await iniciativasApi.importarGapsUnidade(body);
      toast.success(
        `${r.criadas} iniciativa(s) importada(s) para ${unidade.nome}${r.ignoradas ? ` (${r.ignoradas} já existiam)` : ''}`
      );
    } catch (e) {
      toast.error(e.message || 'Erro ao importar gaps');
    } finally {
      setImportandoId(null);
    }
  }

  const queryExtras = useMemo(() => {
    const parts = [queryNivelMapeamentoMaturidade(filtroNivel)];
    if (versaoId) parts.unshift(`versaoId=${versaoId}`);
    return parts.join('&');
  }, [filtroNivel, versaoId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-950 text-center p-6">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-gray-600 dark:text-gray-300">{erro}</p>
        <Link to={`/dashboard/projeto/${projetoId}`} className="text-blue-600 hover:underline">
          Voltar ao dashboard
        </Link>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <Link
            to={`/dashboard/projeto/${projetoId}${versaoId ? `?versaoId=${versaoId}` : ''}`}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {data.empresa?.id && <EmpresaLogoRelatorio empresaId={data.empresa.id} className="h-10" />}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              Comparativo por Unidade
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.projeto?.nome} · {data.empresa?.nome}
              {versaoLabel ? ` · ${versaoLabel}` : ''}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{labelFiltroNivelMapeamento(filtroNivel)}</p>
          </div>
          <div className="ml-auto">
            <Link
              to={buildRoadmapLink(projetoId, versaoId, null, filtroNivel)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
            >
              <GitBranch className="w-4 h-4" /> Roadmap
            </Link>
          </div>
        </div>

        {/* Enterprise baseline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 md:col-span-1">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Score enterprise (consolidado)</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {Number(enterprise?.scoreGeral || 0).toFixed(2)}
              </span>
              <span className="text-sm text-gray-400 mb-1">/ 5,0</span>
            </div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
              Nível {enterprise?.nivel || '—'} — {enterprise?.nivelLabel || '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {data.totalAvaliadoresVersao ?? enterprise?.totalAvaliadores ?? 0} avaliador(es) na versão
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 md:col-span-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              {unidades.length} unidade(s) com dados de avaliação
            </p>
            {unidades.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhuma unidade organizacional (além da geral) possui avaliadores finalizados nesta versão.
                Cadastre unidades em Empresa e vincule avaliadores a elas.
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ranking abaixo compara cada unidade ao baseline enterprise. Delta positivo indica maturidade acima da média.
              </p>
            )}
          </div>
        </div>

        {/* Ranking table */}
        {unidades.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 overflow-x-auto">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Ranking de unidades</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Unidade</th>
                  <th className="py-2 px-2">Score</th>
                  <th className="py-2 px-2">Nível</th>
                  <th className="py-2 px-2">Δ vs enterprise</th>
                  <th className="py-2 px-2">Avaliadores</th>
                  <th className="py-2 px-2 print:hidden">Ações</th>
                </tr>
              </thead>
              <tbody>
                {unidades.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-50 dark:border-gray-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                  >
                    <td className="py-2 px-2 text-gray-400">{u.rank}</td>
                    <td className="py-2 px-2 font-medium text-gray-800 dark:text-gray-100">
                      {u.nome}
                      {u.codigo ? <span className="ml-1 text-xs text-gray-400">({u.codigo})</span> : null}
                    </td>
                    <td className="py-2 px-2 font-semibold">{Number(u.scoreGeral).toFixed(2)}</td>
                    <td className="py-2 px-2">{u.nivelLabel || u.nivel}</td>
                    <td className="py-2 px-2">
                      <span className="inline-flex items-center gap-1">
                        <DeltaIcon delta={u.deltaVsEnterprise} />
                        <span
                          className={
                            u.deltaVsEnterprise > 0
                              ? 'text-emerald-600'
                              : u.deltaVsEnterprise < 0
                                ? 'text-red-600'
                                : 'text-gray-500'
                          }
                        >
                          {fmtDelta(u.deltaVsEnterprise)}
                        </span>
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-500">{u.totalAvaliadores}</td>
                    <td className="py-2 px-2 print:hidden">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={buildRoadmapLink(projetoId, versaoId, u.id, filtroNivel)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Roadmap
                        </Link>
                        {podeEditar && (
                          <button
                            type="button"
                            onClick={() => importarGaps(u)}
                            disabled={importandoId === u.id}
                            className="text-xs text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            {importandoId === u.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            Importar gaps
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Heatmap matriz dimensões */}
        {matriz.length > 0 && unidades.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 overflow-x-auto">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Matriz de dimensões por unidade
            </h2>
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 px-2 text-left text-gray-500 sticky left-0 bg-white dark:bg-gray-900 min-w-[180px]">
                    Dimensão
                  </th>
                  {unidades.map((u) => (
                    <th key={u.id} className="py-2 px-1 text-center text-gray-500 font-normal max-w-[72px]">
                      <span className="line-clamp-2">{u.nome}</span>
                    </th>
                  ))}
                  <th className="py-2 px-2 text-center text-gray-500">Spread</th>
                </tr>
              </thead>
              <tbody>
                {matriz.map((row) => (
                  <tr key={row.area} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-1 px-2 text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-900 text-left">
                      {row.area}
                    </td>
                    {unidades.map((u) => {
                      const score = row.porUnidade?.[String(u.id)];
                      return (
                        <td key={u.id} className="py-1 px-1 text-center">
                          <div
                            className={`rounded px-1 py-1 font-medium tabular-nums ${corHeatmapScore(score)}`}
                            title={score != null ? `${row.area} · ${u.nome}: ${Number(score).toFixed(2)}` : 'Sem dado'}
                          >
                            {score != null ? Number(score).toFixed(1) : '—'}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-1 px-2 text-center text-gray-500 tabular-nums">
                      {row.spread != null ? row.spread.toFixed(2) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detalhe por unidade: gaps e fortes */}
        {unidades.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {unidades.map((u) => (
              <div
                key={u.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{u.nome}</h3>
                    <p className="text-xs text-gray-400">
                      Score {Number(u.scoreGeral).toFixed(2)} · {fmtDelta(u.deltaVsEnterprise)} vs enterprise
                    </p>
                  </div>
                  <div className="flex gap-2 print:hidden">
                    <Link
                      to={buildRoadmapLink(projetoId, versaoId, u.id, filtroNivel)}
                      className="text-xs px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      Ver roadmap
                    </Link>
                    {podeEditar && (
                      <button
                        type="button"
                        onClick={() => importarGaps(u)}
                        disabled={importandoId === u.id}
                        className="text-xs px-2 py-1 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-700 dark:text-purple-300 disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        {importandoId === u.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        Importar gaps
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
                      <Target className="w-3 h-3" /> Top gaps
                    </p>
                    <ul className="space-y-1.5">
                      {(u.gaps || []).length === 0 ? (
                        <li className="text-xs text-gray-400">—</li>
                      ) : (
                        u.gaps.map((g) => (
                          <li key={g.area} className="text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-medium">{g.area}</span>
                            <span className="text-red-500 ml-1">{Number(g.score).toFixed(2)}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                      <TrendingUp className="w-3 h-3" /> Pontos fortes
                    </p>
                    <ul className="space-y-1.5">
                      {(u.fortes || []).length === 0 ? (
                        <li className="text-xs text-gray-400">—</li>
                      ) : (
                        u.fortes.map((g) => (
                          <li key={g.area} className="text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-medium">{g.area}</span>
                            <span className="text-emerald-600 ml-1">{Number(g.score).toFixed(2)}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {unidades.length === 0 && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
            Ajuste o filtro de prioridade ou aguarde avaliações finalizadas por unidade.
            {queryExtras ? (
              <>
                {' '}
                <Link
                  to={`/dashboard/projeto/${projetoId}/comparativo-unidades?${queryExtras}`}
                  className="text-blue-600 hover:underline"
                >
                  Recarregar
                </Link>
              </>
            ) : null}
          </p>
        )}
      </div>
    </div>
  );
}

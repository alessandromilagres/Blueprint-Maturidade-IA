import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUp, ArrowDown, Save, RotateCcw, Scale, Sigma, TrendingDown } from 'lucide-react';
import { engenhariaValorApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];

function pesoFibonacciPorPosicao(posicao, total) {
  if (!total || total <= 0) return 0;
  const seq = FIBONACCI.slice(0, total);
  const idx = total - posicao;
  return seq[Math.max(0, Math.min(seq.length - 1, idx))];
}

function podeEditarValor(role) {
  const r = String(role || '').trim().toLowerCase();
  return ['admin', 'gestor', 'sysmap', 'negocios', 'ti', 'executivo'].includes(r);
}

function corNota(score) {
  if (score >= 3.5) return 'text-emerald-600';
  if (score >= 2.5) return 'text-blue-600';
  if (score >= 1.5) return 'text-amber-600';
  return 'text-red-600';
}

export default function EngenhariaValorProduto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { usuario } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState(null);
  const [drivers, setDrivers] = useState([]);

  const podeEditar = podeEditarValor(usuario?.role);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const data = await engenhariaValorApi.obterProduto(id);
      setMeta(data);
      setDrivers(ordenar(data.drivers || []));
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar engenharia de valor');
    } finally {
      setLoading(false);
    }
  }

  function ordenar(lista) {
    return [...lista]
      .sort((a, b) => (a.ordem || 9999) - (b.ordem || 9999))
      .map((d, i) => ({ ...d, ordem: i + 1 }));
  }

  function mover(index, delta) {
    setDrivers((prev) => {
      const arr = [...prev];
      const j = index + delta;
      if (j < 0 || j >= arr.length) return prev;
      [arr[index], arr[j]] = [arr[j], arr[index]];
      return arr.map((d, i) => ({ ...d, ordem: i + 1 }));
    });
  }

  function ordenarPorNota() {
    setDrivers((prev) =>
      [...prev]
        .sort((a, b) => (a.score || 0) - (b.score || 0))
        .map((d, i) => ({ ...d, ordem: i + 1 }))
    );
  }

  function setImpacto(index, valor) {
    setDrivers((prev) =>
      prev.map((d, i) => (i === index ? { ...d, impacto: Math.max(0, Math.min(5, Number(valor) || 0)) } : d))
    );
  }

  function setAtivo(index, ativo) {
    setDrivers((prev) => prev.map((d, i) => (i === index ? { ...d, ativo } : d)));
  }

  // Pesos calculados sobre os drivers ativos, na ordem atual.
  const driversComPeso = useMemo(() => {
    const ativos = drivers.filter((d) => d.ativo !== false);
    const total = ativos.length;
    let posicao = 0;
    return drivers.map((d) => {
      if (d.ativo === false) return { ...d, pesoFibonacci: 0 };
      posicao += 1;
      return { ...d, pesoFibonacci: pesoFibonacciPorPosicao(posicao, total) };
    });
  }, [drivers]);

  const resumo = useMemo(() => {
    let soma = 0;
    let max = 0;
    const parcelas = [];
    for (const d of driversComPeso) {
      if (d.ativo === false) continue;
      const impacto = Number(d.impacto) || 0;
      const contribuicao = d.pesoFibonacci * impacto;
      soma += contribuicao;
      max += d.pesoFibonacci * 5;
      parcelas.push({ area: d.area, peso: d.pesoFibonacci, impacto, contribuicao });
    }
    return {
      scoreValor: Math.round(soma * 100) / 100,
      scoreValorNormalizado: max > 0 ? Math.round((soma / max) * 100 * 100) / 100 : 0,
      max,
      parcelas
    };
  }, [driversComPeso]);

  async function salvar() {
    if (!podeEditar) return;
    setSaving(true);
    try {
      const payload = {
        drivers: drivers.map((d) => ({
          areaId: d.areaId,
          area: d.area,
          ordem: d.ordem,
          impacto: Number(d.impacto) || 0,
          ativo: d.ativo !== false
        }))
      };
      const data = await engenhariaValorApi.salvarProduto(id, payload);
      setMeta(data);
      setDrivers(ordenar(data.drivers || []));
      toast.success('Engenharia de valor salva com sucesso');
    } catch (e) {
      toast.error(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-center text-gray-600">
        Engenharia de valor indisponível para este produto.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/produto/${id}`)}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Scale className="w-7 h-7 text-indigo-600" />
              Engenharia de valor — classificação
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {meta.produto?.nome}
              {meta.projeto?.nome ? ` · Blueprint: ${meta.projeto.nome}` : ''}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/20 p-4 text-sm text-indigo-900 dark:text-indigo-200">
          <p className="flex items-start gap-2">
            <TrendingDown className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Os <strong>drivers de valor</strong> são as dimensões do Blueprint de maturidade do projeto. A ordem
              sugerida prioriza a <strong>menor nota</strong> (o que mais derruba a nota geral). O peso de cada driver
              segue a sequência de <strong>Fibonacci</strong> pela ordem (topo = maior peso). Informe o
              <strong> impacto (0–5)</strong> do produto em cada driver para calcular a prioridade.
            </span>
          </p>
        </div>

        {/* Resumo do score */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">Score de valor</p>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{resumo.scoreValor}</p>
            <p className="text-xs text-gray-500 mt-1">Σ peso Fibonacci × impacto</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">Normalizado</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{resumo.scoreValorNormalizado}%</p>
            <p className="text-xs text-gray-500 mt-1">do máximo possível</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <p className="text-xs uppercase tracking-wider text-gray-500">Drivers ativos</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {drivers.filter((d) => d.ativo !== false).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">de {drivers.length} dimensões</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 px-5 py-3">
            <div className="flex items-center gap-2">
              <Sigma className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Drivers de valor (ordem = prioridade)</h2>
            </div>
            {podeEditar && (
              <button
                type="button"
                onClick={ordenarPorNota}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reordenar pela nota (gargalo no topo)
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-3 py-2 w-12">#</th>
                  <th className="px-3 py-2">Dimensão (driver)</th>
                  <th className="px-3 py-2 w-28 text-center">Nota Blueprint</th>
                  <th className="px-3 py-2 w-24 text-center">Peso (Fib.)</th>
                  <th className="px-3 py-2 w-28 text-center">Impacto 0–5</th>
                  <th className="px-3 py-2 w-32 text-center">Contribuição</th>
                  <th className="px-3 py-2 w-24 text-center">Ativo</th>
                  <th className="px-3 py-2 w-24 text-center">Ordenar</th>
                </tr>
              </thead>
              <tbody>
                {driversComPeso.map((d, index) => (
                  <tr
                    key={d.areaId ?? d.area}
                    className={`border-b border-gray-50 dark:border-gray-700/50 ${
                      d.ativo === false ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-3 py-2 font-bold text-gray-400">{index + 1}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-900 dark:text-white">{d.area}</p>
                      {d.semDadosConsolidados && (
                        <p className="text-[10px] text-amber-600">sem avaliação consolidada</p>
                      )}
                    </td>
                    <td className={`px-3 py-2 text-center font-semibold ${corNota(d.score)}`}>
                      {Number(d.score || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {d.pesoFibonacci}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        value={Number(d.impacto) || 0}
                        disabled={!podeEditar || d.ativo === false}
                        onChange={(e) => setImpacto(index, e.target.value)}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm disabled:opacity-50"
                      >
                        {[0, 1, 2, 3, 4, 5].map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {d.ativo === false ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          <span className="font-mono">{d.pesoFibonacci}</span>
                          <span className="text-gray-400"> × </span>
                          <span className="font-mono">{Number(d.impacto) || 0}</span>
                          <span className="text-gray-400"> = </span>
                          <span className="font-semibold text-gray-900 dark:text-white font-mono">
                            {d.pesoFibonacci * (Number(d.impacto) || 0)}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={d.ativo !== false}
                        disabled={!podeEditar}
                        onChange={(e) => setAtivo(index, e.target.checked)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          disabled={!podeEditar || index === 0}
                          onClick={() => mover(index, -1)}
                          className="p-1 rounded border border-gray-200 dark:border-gray-600 disabled:opacity-30"
                          aria-label="Subir"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={!podeEditar || index === driversComPeso.length - 1}
                          onClick={() => mover(index, 1)}
                          className="p-1 rounded border border-gray-200 dark:border-gray-600 disabled:opacity-30"
                          aria-label="Descer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Memória de cálculo (visível ao usuário) */}
          <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Sigma className="w-4 h-4 text-indigo-600" />
              Memória de cálculo
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Score de valor = Σ (peso Fibonacci × impacto) dos drivers ativos, na ordem definida.
            </p>

            {resumo.parcelas.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum driver ativo com impacto para calcular.</p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 overflow-x-auto">
                  <p className="text-xs font-mono leading-relaxed text-gray-700 dark:text-gray-200">
                    {resumo.parcelas.map((p, i) => (
                      <span key={p.area}>
                        {i > 0 && <span className="text-gray-400"> + </span>}
                        <span title={p.area}>
                          ({p.peso}×{p.impacto})
                        </span>
                      </span>
                    ))}
                    <span className="text-gray-400"> = </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{resumo.scoreValor}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                    <p className="text-gray-500">Score de valor (Σ)</p>
                    <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-base">
                      {resumo.scoreValor}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                    <p className="text-gray-500">Máximo possível (Σ peso × 5)</p>
                    <p className="font-mono font-bold text-gray-900 dark:text-white text-base">{resumo.max}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                    <p className="text-gray-500">Normalizado ({resumo.scoreValor} ÷ {resumo.max} × 100)</p>
                    <p className="font-mono font-bold text-gray-900 dark:text-white text-base">
                      {resumo.scoreValorNormalizado}%
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Pesos de Fibonacci usados ({resumo.parcelas.length} drivers ativos, do topo para a base):{' '}
                  <span className="font-mono">
                    {[...resumo.parcelas].map((p) => p.peso).join(', ')}
                  </span>
                </p>
              </div>
            )}
          </div>

          {podeEditar && (
            <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={salvar}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar classificação de valor'}
              </button>
              <button
                type="button"
                onClick={load}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm"
              >
                Recarregar
              </button>
              {meta.atualizadoEm && (
                <span className="text-xs text-gray-500">
                  Última atualização: {new Date(meta.atualizadoEm).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
          )}

          {!podeEditar && (
            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 text-sm text-amber-700 dark:text-amber-300">
              Apenas gestores e consultores podem editar a engenharia de valor.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

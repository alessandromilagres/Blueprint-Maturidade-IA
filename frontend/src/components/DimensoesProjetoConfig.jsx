import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, RefreshCw, Save, Scale, AlertTriangle } from 'lucide-react';
import { projetosApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

function nivelLabel(score) {
  const s = Number(score) || 0;
  if (s <= 0) return 'sem dado';
  if (s < 1.5) return 'Inicial';
  if (s < 2.5) return 'Em desenvolvimento';
  if (s < 3.5) return 'Definido';
  if (s < 4.5) return 'Gerenciado';
  return 'Otimizado';
}

export default function DimensoesProjetoConfig({ projetoId, editable = false }) {
  const toast = useToast();
  const [dims, setDims] = useState([]);
  const [setorRegulado, setSetorRegulado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    projetosApi
      .dimensoes(projetoId)
      .then((data) => {
        if (cancelled) return;
        setDims((data?.dimensoes || []).map((d) => ({ ...d })));
        setSetorRegulado(data?.setorRegulado === true);
        setDirty(false);
      })
      .catch(() => {
        if (!cancelled) setDims([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projetoId]);

  const ativasNaMedia = useMemo(
    () => dims.filter((d) => d.ativa && !d.foraDaMediaGeral),
    [dims]
  );
  const somaPesos = useMemo(
    () => round2(ativasNaMedia.reduce((acc, d) => acc + (Number(d.peso) || 0), 0)),
    [ativasNaMedia]
  );
  const somaOk = Math.abs(somaPesos - 100) <= 0.05 && ativasNaMedia.length > 0;
  const isSatf = dims.some((d) => d.foraDaMediaGeral);

  function toggleAtiva(areaId) {
    const alvo = dims.find((d) => d.areaId === areaId);
    if (alvo?.obrigatoria && alvo.ativa) {
      toast.info('D11 é obrigatória em projetos SATF de setor regulado.');
      return;
    }
    setDirty(true);
    setDims((prev) =>
      prev.map((d) =>
        d.areaId === areaId
          ? { ...d, ativa: !d.ativa, peso: !d.ativa ? d.peso : 0 }
          : d
      )
    );
  }

  function setPeso(areaId, valor) {
    setDirty(true);
    const peso = Math.max(0, round2(valor));
    setDims((prev) => prev.map((d) => (d.areaId === areaId ? { ...d, peso } : d)));
  }

  function aplicarPesosDefault(regulatorio = false) {
    const alvo = dims.filter((d) => d.ativa && !d.foraDaMediaGeral);
    if (alvo.length === 0) {
      toast.info('Selecione ao menos uma dimensão para redistribuir.');
      return;
    }
    const brutos = alvo.map((d) => {
      const cod = d.codigoFramework;
      const reforco = regulatorio && ['D2', 'D7', 'D11'].includes(cod);
      return { areaId: d.areaId, bruto: reforco ? 2 : 1 };
    });
    const total = brutos.reduce((acc, x) => acc + x.bruto, 0);
    const mapa = new Map(
      brutos.map((x) => [x.areaId, round2((x.bruto / total) * 100)])
    );
    let soma = round2([...mapa.values()].reduce((a, b) => a + b, 0));
    const resto = round2(100 - soma);
    if (resto !== 0) {
      const first = brutos[0].areaId;
      mapa.set(first, round2((mapa.get(first) || 0) + resto));
    }
    setDirty(true);
    setDims((prev) =>
      prev.map((d) => {
        if (!d.ativa || d.foraDaMediaGeral) return { ...d, peso: 0 };
        return { ...d, peso: mapa.get(d.areaId) ?? d.peso };
      })
    );
  }

  function redistribuir() {
    aplicarPesosDefault(setorRegulado);
  }

  async function salvar() {
    if (!somaOk) {
      toast.error(`A soma dos pesos das dimensões ativas deve ser 100% (atual: ${somaPesos}%).`);
      return;
    }
    try {
      setSaving(true);
      const payload = dims.map((d) => ({
        areaId: d.areaId,
        ativa: d.ativa,
        peso: d.foraDaMediaGeral ? 0 : d.ativa ? d.peso : 0
      }));
      const data = await projetosApi.salvarDimensoes(projetoId, payload);
      setDims((data?.dimensoes || []).map((d) => ({ ...d })));
      setDirty(false);
      toast.success('Configuração de dimensões salva.');
    } catch (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="card border border-fuchsia-200 bg-fuchsia-50/40 dark:border-fuchsia-900/50 dark:bg-fuchsia-950/20">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <SlidersHorizontal className="h-5 w-5 text-fuchsia-600 dark:text-fuchsia-400" />
            Dimensões avaliadas
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
            {isSatf
              ? setorRegulado
                ? 'Setor regulado: D2, D7 e D11 entram com peso 2× na média geral (D1–D9 e D11 somam 100%). D11 é obrigatória. D10 fica fora da média.'
                : 'Dimensões SATF TI: pesos das ativas na média geral (D1–D9 e D11) devem somar 100%. D10 (Fábrica Agêntica) é avaliada com score próprio e fica fora da média.'
              : 'Escolha quais dimensões do Blueprint serão avaliadas neste projeto e o peso de cada uma. As ativas viram o padrão dos convites e o score consolidado passa a ser média ponderada por esses pesos. A soma das ativas deve ser 100%.'}
          </p>
          {isSatf && setorRegulado && (
            <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-200">
              Ponderação regulatória ativa (finanças, saúde, telecom, energia).
            </p>
          )}
        </div>
        {editable && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={redistribuir}
              className="inline-flex items-center gap-2 rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/15 px-3 py-2 text-sm font-medium text-fuchsia-700 transition hover:bg-fuchsia-500/25 dark:text-fuchsia-200"
            >
              <RefreshCw className="h-4 w-4" />
              {setorRegulado ? 'Pesos regulatórios (2×)' : 'Redistribuir pesos'}
            </button>
            {isSatf && setorRegulado && (
              <button
                type="button"
                onClick={() => aplicarPesosDefault(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
              >
                Pesos iguais
              </button>
            )}
            <button
              type="button"
              onClick={salvar}
              disabled={saving || !dirty || !somaOk}
              className="inline-flex items-center gap-2 rounded-lg bg-fuchsia-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-200">
          <Scale className="h-4 w-4 text-fuchsia-500" />
          {ativasNaMedia.length} dimensão(ões) na média geral
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${
            somaOk
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100'
          }`}
        >
          {!somaOk && <AlertTriangle className="h-4 w-4" />}
          Soma dos pesos: {somaPesos}%
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <th className="py-2 pr-3 font-semibold">Avaliar</th>
              <th className="py-2 pr-3 font-semibold">Dimensão</th>
              <th className="py-2 pr-3 text-right font-semibold">Nota atual</th>
              <th className="py-2 pr-3 font-semibold">Nível</th>
              <th className="py-2 pr-3 text-right font-semibold">Peso (%)</th>
            </tr>
          </thead>
          <tbody>
            {dims.map((d) => (
              <tr
                key={d.areaId}
                className={`border-b border-gray-100 dark:border-gray-800 ${
                  d.ativa ? '' : 'opacity-50'
                }`}
              >
                <td className="py-2 pr-3">
                  <input
                    type="checkbox"
                    checked={d.ativa}
                    disabled={!editable || d.obrigatoria}
                    onChange={() => toggleAtiva(d.areaId)}
                    className="h-4 w-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500"
                  />
                </td>
                <td className="py-2 pr-3 font-medium text-gray-900 dark:text-white">
                  <span className="text-xs text-gray-400">D{String(d.ordem).padStart(2, '0')} · </span>
                  {d.area}
                  {d.foraDaMediaGeral && (
                    <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
                      Fora da média
                    </span>
                  )}
                  {d.pesoReforcoRegulatorio && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
                      2× regulatório
                    </span>
                  )}
                  {d.obrigatoria && (
                    <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose-800 dark:bg-rose-900/40 dark:text-rose-100">
                      Obrigatória
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-gray-700 dark:text-gray-200">
                  {Number(d.notaAtual) > 0 ? Number(d.notaAtual).toFixed(2) : '—'}
                </td>
                <td className="py-2 pr-3 text-xs text-gray-500 dark:text-gray-400">
                  {nivelLabel(d.notaAtual)}
                </td>
                <td className="py-2 pr-3 text-right">
                  {d.foraDaMediaGeral ? (
                    <span className="text-xs text-violet-600 dark:text-violet-300">Score próprio</span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={d.ativa ? d.peso : 0}
                      disabled={!editable || !d.ativa}
                      onChange={(e) => setPeso(d.areaId, e.target.value)}
                      className="w-24 rounded-lg border border-gray-300 bg-white px-2 py-1 text-right tabular-nums text-gray-900 focus:border-fuchsia-500 focus:ring-fuchsia-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!editable && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Apenas gestores/consultores podem alterar a configuração de dimensões.
        </p>
      )}
    </div>
  );
}

/**
 * Executive Dashboard (Item Crítico 2) — "single pane of glass" para C-Level.
 * Consolida num só painel: score + nível, radar, top gaps, status regulatório, ROI e próximos passos.
 * Link público assinado foi adiado (decisão do produto): por ora, somente com login.
 */
import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler,
  Tooltip, Legend, CategoryScale, LinearScale
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck,
  DollarSign, Target, Presentation, Loader2, ListChecks, Map, Download, Printer
} from 'lucide-react';
import { executiveDashboardApi, exportarApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import EmpresaLogoRelatorio from '../components/EmpresaLogoRelatorio';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale);

const fmtMoeda = (v) =>
  v == null || !Number.isFinite(Number(v)) ? '—' : `R$ ${Math.round(Number(v)).toLocaleString('pt-BR')}`;
const fmtPct = (v) => (v == null || !Number.isFinite(Number(v)) ? '—' : `${Number(v).toFixed(0)}%`);

export default function ExecutiveDashboard() {
  const { id } = useParams();
  const projetoId = Number(id);
  const [searchParams] = useSearchParams();
  const versaoId = searchParams.get('versaoId');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [apresentacao, setApresentacao] = useState(false);
  const [exportando, setExportando] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    executiveDashboardApi
      .obter(projetoId, versaoId ? { versaoId } : {})
      .then((d) => { setData(d); setErro(null); })
      .catch((e) => setErro(e.message || 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [projetoId, versaoId]);

  function toggleApresentacao() {
    const novo = !apresentacao;
    setApresentacao(novo);
    try {
      if (novo && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
      else if (!novo && document.fullscreenElement) document.exitFullscreen();
    } catch { /* fullscreen opcional */ }
  }

  async function exportarMarkdown() {
    setExportando(true);
    try {
      const nome = (data?.projeto?.nome || 'projeto').replace(/\s+/g, '-');
      await exportarApi.download(
        exportarApi.executiveDashboardMd(projetoId, versaoId || undefined),
        `executive-dashboard-${nome}.md`
      );
    } catch (e) {
      toast.error(e.message || 'Erro ao exportar');
    } finally {
      setExportando(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }
  if (erro) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-950 text-center p-6">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-gray-600 dark:text-gray-300">{erro}</p>
        <Link to={`/dashboard/projeto/${projetoId}`} className="text-blue-600 hover:underline">Voltar ao dashboard</Link>
      </div>
    );
  }
  if (!data) return null;

  const dimensoesNoEscopo = (data.scoresPorArea || []).filter((s) => !s.foraDeEscopo);
  const radarLabels = dimensoesNoEscopo.map((s) => s.area);
  const radarValores = dimensoesNoEscopo.map((s) => s.score);
  const radarData = {
    labels: radarLabels,
    datasets: [{
      label: 'Score atual',
      data: radarValores,
      backgroundColor: 'rgba(37, 99, 235, 0.18)',
      borderColor: 'rgba(37, 99, 235, 0.9)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(37, 99, 235, 1)',
      pointRadius: 2
    }]
  };
  const radarOptions = {
    scales: { r: { min: 0, max: 5, ticks: { stepSize: 1, display: false }, pointLabels: { font: { size: 9 } } } },
    plugins: { legend: { display: false } },
    maintainAspectRatio: false
  };

  const reg = data.statusRegulatorio;
  const roi = data.roi;
  const comp = data.comparativoVersao;

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 ${apresentacao ? 'p-8' : 'p-4 md:p-6'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {!apresentacao && (
            <Link to={`/dashboard/projeto/${projetoId}`} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          {data.empresa?.id && <EmpresaLogoRelatorio empresaId={data.empresa.id} className="h-10" />}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{data.projeto?.nome}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.empresa?.nome} · Executive Dashboard
              {data.projetoVersao ? ` · ${data.projetoVersao.titulo}` : ''}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 print:hidden">
            {!apresentacao && (
              <Link
                to={`/dashboard/projeto/${projetoId}/roadmap${versaoId ? `?versaoId=${versaoId}` : ''}`}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <Map className="w-4 h-4" /> Roadmap
              </Link>
            )}
            <button
              type="button"
              onClick={exportarMarkdown}
              disabled={exportando}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
            >
              <Download className="w-4 h-4" /> {exportando ? 'Exportando…' : 'MD'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
            >
              <Printer className="w-4 h-4" /> PDF
            </button>
            <button onClick={toggleApresentacao} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 text-white dark:bg-gray-700 rounded-lg">
              <Presentation className="w-4 h-4" /> {apresentacao ? 'Sair' : 'Apresentação'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bloco 1 — Score + nível + comparativo */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Maturidade consolidada</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-gray-900 dark:text-white">{Number(data.scoreGeral).toFixed(2)}</span>
              <span className="text-sm text-gray-400 mb-2">/ 5,0</span>
            </div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">Nível {data.nivel} — {data.nivelNome}</p>
            <p className="text-xs text-gray-400 mt-1">{data.totalAvaliadores} avaliador(es) na versão</p>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              {comp?.disponivel ? (
                <div className="flex items-center gap-2">
                  {comp.tendencia === 'evoluiu' ? <TrendingUp className="w-5 h-5 text-emerald-500" />
                    : comp.tendencia === 'regrediu' ? <TrendingDown className="w-5 h-5 text-red-500" />
                    : <Minus className="w-5 h-5 text-gray-400" />}
                  <span className={`text-sm font-semibold ${comp.delta > 0 ? 'text-emerald-600' : comp.delta < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {comp.delta > 0 ? '+' : ''}{Number(comp.delta).toFixed(2)} vs versão anterior
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Sem histórico para comparar versões.</p>
              )}
            </div>
          </div>

          {/* Bloco 2 — Radar */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 lg:col-span-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Radar de maturidade (16 dimensões)</p>
            <div style={{ height: 280 }}>
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>

          {/* Bloco 3 — Top gaps */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              <Target className="w-4 h-4 text-red-500" /> Top 5 lacunas
            </p>
            <div className="space-y-3">
              {(data.topGaps || []).length === 0 && <p className="text-xs text-gray-400">Sem lacunas relevantes.</p>}
              {(data.topGaps || []).map((g) => (
                <div key={g.areaId}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 dark:text-gray-200 truncate pr-2">{g.area}</span>
                    <span className="text-gray-400">{g.score.toFixed(2)} → {g.scoreAlvo.toFixed(1)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <div className="h-2 bg-red-400 rounded" style={{ width: `${Math.min(100, (g.score / 5) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloco 4 — Status regulatório */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              <ShieldCheck className="w-4 h-4 text-indigo-500" /> Conformidade regulatória
            </p>
            {reg && !reg.indisponivel && reg.kpis ? (
              <div className="grid grid-cols-2 gap-3 text-center">
                <Kpi valor={reg.kpis.totalProdutos} label="Produtos" />
                <Kpi valor={reg.kpis.altoRiscoPl} label="Alto risco (PL)" alerta={reg.kpis.altoRiscoPl > 0} />
                <Kpi valor={reg.kpis.aipdPendente} label="AIPD pendente" alerta={reg.kpis.aipdPendente > 0} />
                <Kpi valor={reg.kpis.validacaoPendente} label="Validação pendente" alerta={reg.kpis.validacaoPendente > 0} />
              </div>
            ) : (
              <p className="text-xs text-gray-400">{reg?.mensagem || 'Sem dados regulatórios para este projeto.'}</p>
            )}
            {!apresentacao && (
              <Link to={`/dashboard/projeto/${projetoId}/regulatorio${versaoId ? `?versaoId=${versaoId}` : ''}`} className="text-xs text-blue-600 hover:underline mt-3 inline-block">
                Ver dashboard regulatório →
              </Link>
            )}
          </div>

          {/* Bloco 5 — ROI */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              <DollarSign className="w-4 h-4 text-emerald-500" /> ROI projetado (líquido)
            </p>
            {roi?.cenarios ? (
              <div className="space-y-2">
                {[['conservador', 'Conservador'], ['base', 'Base'], ['agressivo', 'Agressivo']].map(([k, label]) => {
                  const c = roi.cenarios[k];
                  if (!c) return null;
                  return (
                    <div key={k} className="flex items-center justify-between text-xs border-b border-gray-50 dark:border-gray-800 pb-1.5">
                      <span className="text-gray-500 dark:text-gray-400">{label}</span>
                      <span className="text-gray-700 dark:text-gray-200">
                        Ganho {fmtMoeda(c.ganhoLiquidoAnual)} · ROI {fmtPct(c.roiLiquidoPct)}
                      </span>
                    </div>
                  );
                })}
                <p className="text-[10px] text-gray-400 pt-1">
                  ROI líquido = (benefício bruto − investimento) ÷ investimento. Faixas MIT são referência sobre investimento em IA.
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Sem projeção financeira disponível.</p>
            )}
          </div>

          {/* Bloco 6 — Próximos passos */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 lg:col-span-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              <ListChecks className="w-4 h-4 text-blue-500" /> Próximos passos (roadmap)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[['dias30', '30 dias'], ['dias60', '60 dias'], ['dias90', '90 dias']].map(([k, label]) => (
                <div key={k} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{label}</p>
                  {(data.proximosPassos?.[k] || []).length === 0 ? (
                    <p className="text-xs text-gray-400">—</p>
                  ) : (
                    <ul className="space-y-2">
                      {data.proximosPassos[k].map((p) => (
                        <li key={p.id} className="text-xs text-gray-700 dark:text-gray-200">
                          <span className="font-medium">{p.titulo}</span>
                          {p.contextoRotulo && <span className="text-gray-400"> · {p.contextoRotulo}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            {!apresentacao && (data.totalIniciativas === 0) && (
              <p className="text-xs text-gray-400 mt-3">
                Nenhuma iniciativa cadastrada ainda. Use o <Link to={`/dashboard/projeto/${projetoId}/roadmap`} className="text-blue-600 hover:underline">Roadmap</Link> para importar do diagnóstico.
              </p>
            )}
          </div>
        </div>

        {reg?.disclaimer && (
          <p className="text-[10px] text-gray-400 mt-4 max-w-3xl">{reg.disclaimer}</p>
        )}
      </div>
    </div>
  );
}

function Kpi({ valor, label, alerta }) {
  return (
    <div className={`rounded-lg p-2 ${alerta ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
      <p className={`text-2xl font-bold ${alerta ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>{valor ?? 0}</p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

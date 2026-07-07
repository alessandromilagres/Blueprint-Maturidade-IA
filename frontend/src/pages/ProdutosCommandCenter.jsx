/**
 * Command Center de Produtos IA-First.
 * Portfólio (KPIs + matriz de priorização configurável + ranking + economia + saúde regulatória)
 * e drill-down por produto (transformação agêntica, verticais, economia, risco, roadmap).
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler,
  Tooltip, Legend, CategoryScale, LinearScale, BarElement
} from 'chart.js';
import { Radar, Bar, Bubble } from 'react-chartjs-2';
import {
  ArrowLeft, Loader2, Package, DollarSign, ShieldAlert, TrendingUp,
  Sparkles, X, Target, AlertTriangle, Gauge, Download, Printer
} from 'lucide-react';
import { produtosCommandCenterApi, exportarApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { podeGerenciarExecucao } from '../constants/perfisGestaoExecucao';
import EmpresaLogoRelatorio from '../components/EmpresaLogoRelatorio';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const METRICAS_EIXO = [
  { id: 'relevancia', label: 'Relevância estratégica', max: 5 },
  { id: 'prontidaoAgentica', label: 'Prontidão agêntica', max: 5 },
  { id: 'potencialVertical', label: 'Potencial por vertical', max: 5 },
  { id: 'prioridadeEstrategica', label: 'Prioridade estratégica', max: 5 },
  { id: 'roi', label: 'ROI (%)', max: null },
  { id: 'custoAgentico', label: 'Custo agêntico (R$)', max: null },
  { id: 'prazoAgentico', label: 'Prazo agêntico (sem)', max: null },
  { id: 'riscoRegulatorioPeso', label: 'Risco regulatório', max: 4 }
];

const PRESETS = [
  { id: 'relev_prontidao', label: 'Relevância × Prontidão', x: 'relevancia', y: 'prontidaoAgentica' },
  { id: 'roi_risco', label: 'ROI × Risco', x: 'roi', y: 'riscoRegulatorioPeso' },
  { id: 'esforco_valor', label: 'Esforço × Valor', x: 'custoAgentico', y: 'relevancia' }
];

const PL_CORES = { 0: '#9ca3af', 1: '#10b981', 2: '#eab308', 3: '#f97316', 4: '#ef4444' };
const PL_LABEL = { MINIMO: 'Mínimo', BAIXO: 'Baixo', ALTO: 'Alto', INACEITAVEL: 'Inaceitável' };

const fmtMoeda = (v) => (v == null || !Number.isFinite(Number(v)) ? '—' : `R$ ${Math.round(Number(v)).toLocaleString('pt-BR')}`);
const fmtPct = (v) => (v == null || !Number.isFinite(Number(v)) ? '—' : `${Number(v).toFixed(0)}%`);

export default function ProdutosCommandCenter() {
  const { id } = useParams();
  const projetoId = Number(id);
  const toast = useToast();
  const { usuario } = useAuth();
  const podeEditar = podeGerenciarExecucao(usuario?.role);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eixoX, setEixoX] = useState('relevancia');
  const [eixoY, setEixoY] = useState('prontidaoAgentica');
  const [produtoSel, setProdutoSel] = useState(null);
  const [importando, setImportando] = useState(false);
  const [exportando, setExportando] = useState(false);

  useEffect(() => { carregar(); }, [projetoId]);

  async function carregar() {
    setLoading(true);
    try {
      setData(await produtosCommandCenterApi.obter(projetoId));
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }

  const labelEixo = (mid) => METRICAS_EIXO.find((m) => m.id === mid)?.label || mid;

  const bubbleData = useMemo(() => {
    if (!data) return null;
    const pts = (data.produtos || [])
      .filter((p) => p.scoreRelevancia > 0)
      .map((p) => ({
        x: p.metricas[eixoX] ?? 0,
        y: p.metricas[eixoY] ?? 0,
        r: Math.max(6, Math.min(28, 6 + (p.metricas.roi || 0) / 12)),
        produto: p
      }));
    return {
      datasets: [{
        label: 'Produtos',
        data: pts,
        backgroundColor: pts.map((pt) => `${PL_CORES[pt.produto.metricas.riscoRegulatorioPeso || 0]}cc`),
        borderColor: pts.map((pt) => PL_CORES[pt.produto.metricas.riscoRegulatorioPeso || 0]),
        borderWidth: 1.5
      }]
    };
  }, [data, eixoX, eixoY]);

  const bubbleOptions = useMemo(() => {
    const mx = METRICAS_EIXO.find((m) => m.id === eixoX)?.max;
    const my = METRICAS_EIXO.find((m) => m.id === eixoY)?.max;
    return {
      scales: {
        x: { title: { display: true, text: labelEixo(eixoX) }, min: 0, ...(mx ? { max: mx } : {}) },
        y: { title: { display: true, text: labelEixo(eixoY) }, min: 0, ...(my ? { max: my } : {}) }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const p = ctx.raw.produto;
              return `${p.nome} · ${labelEixo(eixoX)}: ${ctx.raw.x} · ${labelEixo(eixoY)}: ${ctx.raw.y} · ROI ${fmtPct(p.metricas.roi)}`;
            }
          }
        }
      },
      onClick: (_evt, els) => {
        if (els?.length) {
          const p = bubbleData.datasets[0].data[els[0].index]?.produto;
          if (p) setProdutoSel(p);
        }
      },
      maintainAspectRatio: false
    };
  }, [eixoX, eixoY, bubbleData]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }
  if (!data) return null;

  const k = data.kpis;

  async function importarIniciativas(produto) {
    setImportando(true);
    try {
      const r = await produtosCommandCenterApi.importarIniciativasProduto(produto.id, {});
      toast.success(`${r.criadas} iniciativa(s) criada(s) para ${produto.nome}${r.ignoradas ? `, ${r.ignoradas} já existiam` : ''}`);
      carregar();
    } catch (e) {
      toast.error(e.message || 'Erro ao importar');
    } finally {
      setImportando(false);
    }
  }

  async function exportarMarkdown() {
    setExportando(true);
    try {
      const nome = (data?.projeto?.nome || 'projeto').replace(/\s+/g, '-');
      await exportarApi.download(
        exportarApi.produtosCommandCenterMd(projetoId),
        `produtos-command-center-${nome}.md`
      );
    } catch (e) {
      toast.error(e.message || 'Erro ao exportar');
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <Link to={`/dashboard/projeto/${projetoId}`} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {data.empresa?.id && <EmpresaLogoRelatorio empresaId={data.empresa.id} className="h-10" />}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" /> Produtos IA-First
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{data.projeto?.nome} · {data.empresa?.nome}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 print:hidden">
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
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-5">
          <KpiCard icon={Package} label="Produtos" valor={k.totalProdutos} sub={`${k.produtosAvaliados} avaliados`} />
          <KpiCard icon={Gauge} label="Score médio" valor={k.scoreMedioRelevancia?.toFixed(2)} sub="relevância" />
          <KpiCard icon={TrendingUp} label="ROI agregado" valor={fmtPct(k.roiAgregado)} />
          <KpiCard icon={DollarSign} label="Custo agêntico" valor={fmtMoeda(k.custoTotalAgentico)} />
          <KpiCard icon={DollarSign} label="Economia ag." valor={fmtMoeda(k.economiaTotalAgentica)} sub="vs tradicional" />
          <KpiCard icon={ShieldAlert} label="Alto risco reg." valor={k.altoRiscoRegulatorio} alerta={k.altoRiscoRegulatorio > 0} />
        </div>

        {/* Matriz de priorização */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-5">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" /> Matriz de priorização
            </p>
            <div className="flex flex-wrap gap-1.5 ml-auto">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setEixoX(p.x); setEixoY(p.y); }}
                  className={`px-2.5 py-1 rounded-full text-xs border ${
                    eixoX === p.x && eixoY === p.y
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mb-3 text-xs">
            <label className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              Eixo X
              <select value={eixoX} onChange={(e) => setEixoX(e.target.value)} className="border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-gray-200">
                {METRICAS_EIXO.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              Eixo Y
              <select value={eixoY} onChange={(e) => setEixoY(e.target.value)} className="border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-gray-200">
                {METRICAS_EIXO.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </label>
            <span className="text-gray-400 self-center">Tamanho = ROI · Cor = risco regulatório (PL 2338)</span>
          </div>
          <div style={{ height: 360 }}>
            {bubbleData?.datasets[0].data.length > 0 ? (
              <Bubble data={bubbleData} options={bubbleOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                Nenhum produto avaliado para plotar. Finalize avaliações de produto primeiro.
              </div>
            )}
          </div>
        </div>

        {/* Ranking */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Ranking estratégico</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Produto</th>
                  <th className="py-2 px-2">Relevância</th>
                  <th className="py-2 px-2">Agêntico</th>
                  <th className="py-2 px-2">ROI</th>
                  <th className="py-2 px-2">Economia ag.</th>
                  <th className="py-2 px-2">Risco PL</th>
                  <th className="py-2 px-2">Urgência</th>
                </tr>
              </thead>
              <tbody>
                {(data.produtos || []).map((p) => (
                  <tr key={p.id} onClick={() => setProdutoSel(p)} className="border-b border-gray-50 dark:border-gray-800 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer">
                    <td className="py-2 px-2 text-gray-400">{p.classificacao || '—'}</td>
                    <td className="py-2 px-2 font-medium text-gray-800 dark:text-gray-100">{p.nome}</td>
                    <td className="py-2 px-2">{p.scoreRelevancia.toFixed(2)}</td>
                    <td className="py-2 px-2">{p.farois.transformacao.emoji} {p.scoreObrigatorio.toFixed(2)}</td>
                    <td className="py-2 px-2">{fmtPct(p.financeiro.roiIndividual)}</td>
                    <td className="py-2 px-2">{p.especificacao?.economiaPct != null ? `${p.especificacao.economiaPct}%` : '—'}</td>
                    <td className="py-2 px-2">
                      {p.regulatorio?.plRiscoNivel
                        ? <span className="px-2 py-0.5 rounded-full text-xs text-white" style={{ background: PL_CORES[p.regulatorio.plRiscoPeso] }}>{PL_LABEL[p.regulatorio.plRiscoNivel] || p.regulatorio.plRiscoNivel}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-2 px-2">{p.farois.urgencia.emoji} {p.farois.urgencia.nivel}</td>
                  </tr>
                ))}
                {(data.produtos || []).length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-gray-400">Nenhum produto neste projeto.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {produtoSel && (
        <ProdutoDetalhe
          produto={produtoSel}
          catalogo={data.catalogo}
          podeEditar={podeEditar}
          importando={importando}
          onImportar={importarIniciativas}
          projetoId={projetoId}
          onFechar={() => setProdutoSel(null)}
        />
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, valor, sub, alerta }) {
  return (
    <div className={`rounded-xl border p-3 ${alerta ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700'}`}>
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-xl font-bold ${alerta ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{valor ?? '—'}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}

function ProdutoDetalhe({ produto, catalogo, podeEditar, importando, onImportar, projetoId, onFechar }) {
  const obrig = produto.scoresPorPerguntaObrigatoria || [];
  const radarData = {
    labels: obrig.map((o) => `Q${o.numero}`),
    datasets: [{
      label: 'Transformação agêntica',
      data: obrig.map((o) => o.score),
      backgroundColor: 'rgba(37,99,235,0.18)',
      borderColor: 'rgba(37,99,235,0.9)',
      borderWidth: 2,
      pointRadius: 2
    }]
  };
  const radarOptions = {
    scales: { r: { min: 0, max: 5, ticks: { stepSize: 1, display: false } } },
    plugins: { legend: { display: false }, tooltip: { callbacks: { title: (i) => obrig[i[0].dataIndex]?.categoria } } },
    maintainAspectRatio: false
  };

  const verticaisComScore = (produto.scoresPorVertical || []).filter((v) => v.score > 0);
  const barData = {
    labels: verticaisComScore.map((v) => v.nome),
    datasets: [{ label: 'Score', data: verticaisComScore.map((v) => v.score), backgroundColor: 'rgba(16,185,129,0.7)' }]
  };
  const barOptions = {
    indexAxis: 'y',
    scales: { x: { min: 0, max: 5 } },
    plugins: { legend: { display: false } },
    maintainAspectRatio: false
  };

  const esp = produto.especificacao;
  const reg = produto.regulatorio;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onFechar} />
      <div className="relative w-full max-w-2xl h-full bg-white dark:bg-gray-900 shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{produto.nome}</h3>
            <p className="text-xs text-gray-400">
              {produto.vertical?.nome ? `${produto.vertical.nome} · ` : ''}{produto.faseAtual || 'sem fase'} · {produto.totalAvaliacoes} avaliador(es)
            </p>
          </div>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Scores resumo */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <MiniScore label="Relevância" valor={produto.scoreRelevancia} />
            <MiniScore label="Agêntico" valor={produto.scoreObrigatorio} />
            <MiniScore label="Verticais" valor={produto.scoreVerticais} />
            <MiniScore label="Prioridade" valor={produto.scorePrioridadeEstrategica} />
          </div>

          {/* Transformação agêntica */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Transformação agêntica (8 perguntas)</p>
            <div style={{ height: 240 }}>
              {obrig.length > 0 ? <Radar data={radarData} options={radarOptions} /> : <p className="text-xs text-gray-400">Sem dados.</p>}
            </div>
          </div>

          {/* Verticais */}
          {verticaisComScore.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Relevância por vertical</p>
              <div style={{ height: Math.max(120, verticaisComScore.length * 28) }}>
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          )}

          {/* Economia de construção */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Economia de construção (tradicional × agêntica)</p>
            {esp ? (
              <div className="grid grid-cols-2 gap-3">
                <EconomiaCard titulo="Tradicional" custo={esp.tradicional.custo} prazo={esp.tradicional.prazoSemanas} equipe={esp.tradicional.equipe} />
                <EconomiaCard titulo="Agêntica" custo={esp.agentica.custo} prazo={esp.agentica.prazoSemanas} equipe={esp.agentica.equipe} destaque />
                <div className="col-span-2 text-center text-sm">
                  {esp.economiaPct != null
                    ? <span className="text-emerald-600 font-semibold">Economia de {esp.economiaPct}% ({fmtMoeda(esp.economiaValor)})</span>
                    : <span className="text-gray-400">Gere a especificação para comparar custos.</span>}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                Sem especificação gerada. <Link to={`/produtos/${produto.id}/especificacao`} className="text-blue-600 hover:underline">Gerar agora</Link>.
              </p>
            )}
          </div>

          {/* ROI */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <MiniInfo label="Retorno anual" valor={fmtMoeda(produto.financeiro.retornoAnualEsperado)} />
            <MiniInfo label="ROI" valor={fmtPct(produto.financeiro.roiIndividual)} />
            <MiniInfo label="Payback" valor={produto.financeiro.paybackMeses != null ? `${produto.financeiro.paybackMeses} m` : '—'} />
          </div>

          {/* Regulatório */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-500" /> Risco regulatório
            </p>
            {reg ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <RegItem label="PL 2338" valor={PL_LABEL[reg.plRiscoNivel] || reg.plRiscoNivel} alerta={reg.plRiscoPeso >= 3} />
                <RegItem label="ISO 42001" valor={reg.isoConformidadePct != null ? `${Math.round(reg.isoConformidadePct)}%` : '—'} />
                <RegItem label="LGPD / RIPD" valor={reg.lgpdRipd ? 'RIPD necessário' : (reg.lgpdRiscoNivel || '—')} alerta={reg.lgpdRipd} />
                <RegItem label="AIPD" valor={reg.aipdObrigatoria ? `Obrigatória (${reg.aipdStatus})` : 'Não obrigatória'} alerta={reg.aipdObrigatoria && reg.aipdStatus !== 'concluida'} />
                {!reg.validadoConsultor && (
                  <div className="col-span-2 flex items-center gap-1.5 text-amber-600 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5" /> Pendente de validação do consultor
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Sem snapshot regulatório (finalize uma avaliação do produto).</p>
            )}
            <Link to={`/dashboard/produto/${produto.id}/regulatorio`} className="text-xs text-blue-600 hover:underline mt-2 inline-block">
              Abrir validação regulatória →
            </Link>
          </div>

          {/* Roadmap / próximas ações */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Próximas ações (roadmap)</p>
              {podeEditar && (
                <button
                  onClick={() => onImportar(produto)}
                  disabled={importando}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-purple-200 text-purple-700 dark:text-purple-300 rounded-lg disabled:opacity-50"
                >
                  {importando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Gerar dos gaps
                </button>
              )}
            </div>
            {(produto.iniciativas || []).length > 0 ? (
              <ul className="space-y-1.5">
                {produto.iniciativas.map((i) => (
                  <li key={i.id} className="text-xs text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {i.titulo} <span className="text-gray-400">· {i.status} · {i.progresso || 0}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">Nenhuma iniciativa para este produto ainda.</p>
            )}
            <Link to={`/dashboard/projeto/${projetoId}/roadmap`} className="text-xs text-blue-600 hover:underline mt-2 inline-block">
              Abrir roadmap →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniScore({ label, valor }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
      <p className="text-lg font-bold text-gray-900 dark:text-white">{Number(valor || 0).toFixed(2)}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}
function MiniInfo({ label, valor }) {
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-2">
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{valor}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}
function EconomiaCard({ titulo, custo, prazo, equipe, destaque }) {
  return (
    <div className={`rounded-lg p-3 ${destaque ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{titulo}</p>
      <p className="text-sm font-bold text-gray-900 dark:text-white">{fmtMoeda(custo)}</p>
      <p className="text-[10px] text-gray-400">{prazo ?? '—'} sem · {equipe ?? '—'} pessoas</p>
    </div>
  );
}
function RegItem({ label, valor, alerta }) {
  return (
    <div className={`rounded-lg p-2 ${alerta ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className={`text-xs font-medium ${alerta ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>{valor}</p>
    </div>
  );
}

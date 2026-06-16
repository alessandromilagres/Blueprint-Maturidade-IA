import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Download, Printer, Loader2, AlertCircle, AlertTriangle, CheckCircle2, Cpu, Zap, File, Layers, Library, Bookmark, ChevronUp, History, Clock, Ban } from 'lucide-react';
import { dashboardApi, relatoriosIAApi } from '../services/api';
import { mapRelatorioIASalvoToViewShape } from '../utils/relatorioIAViewModel';
import MarkdownRenderer from '../components/MarkdownRenderer';
import {
  downloadMarkdownAsDoc,
  buildMITBookCompletoMarkdownDocument,
  bookMITCompletoSafeBaseName
} from '../utils/markdownToDoc';
import { extrairEntradasIndiceMarkdown } from '../utils/markdownSlug';
import {
  filtroNivelMapeamentoFromSearchParams,
  labelFiltroNivelMapeamento,
  pathRelatorioMitIaCompleto,
  filtroNivelFromDadosUsados,
  carregarRelatorioSalvoSeCompativel,
  relatorioSalvoIdFromSearchParams
} from '../utils/filtroNivelMaturidade';
import { relatorioBookSecao3Completo } from '../constants/ordemDimensoesFramework.js';

function formatDurationMs(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m} min ${r} s`;
}

/** Estimativa linear pelo progresso % (melhora após ~5%). */
function estimateRemainingMs(job) {
  if (!job?.startedAt || job.progresso == null) return null;
  const p = Number(job.progresso);
  if (p < 3 || p >= 100) return null;
  const elapsed = Date.now() - new Date(job.startedAt).getTime();
  if (elapsed < 1000) return null;
  const totalPred = elapsed / (p / 100);
  const rem = totalPred - elapsed;
  return Number.isFinite(rem) && rem > 0 ? rem : null;
}

function labelStatusJob(status) {
  const m = {
    queued: 'Na fila',
    running: 'Em execução',
    completed: 'Concluído',
    failed: 'Falhou',
    cancelled: 'Cancelado'
  };
  return m[status] || status;
}

export default function RelatorioMITIACompleto() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const relatorioSalvoId = relatorioSalvoIdFromSearchParams(searchParams);
  const projetoVersaoId = searchParams.get('projetoVersaoId');
  const modoRapido = searchParams.get('modo') === 'rapido';
  const filtroNivelUrl = filtroNivelMapeamentoFromSearchParams(searchParams);
  const [filtroNivelSelecionado, setFiltroNivelSelecionado] = useState(filtroNivelUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [progresso, setProgresso] = useState(0);
  const [mensagemProgresso, setMensagemProgresso] = useState('Iniciando análise profunda...');
  const [showBackTop, setShowBackTop] = useState(false);
  const [jobBg, setJobBg] = useState(null);
  const [iniciandoBg, setIniciandoBg] = useState(false);
  const [cancelandoBg, setCancelandoBg] = useState(false);
  const [tickRelogio, setTickRelogio] = useState(0);
  const printRef = useRef(null);
  const pollingRef = useRef(null);
  const backgroundRunningRef = useRef(false);
  const geracaoIniciadaRef = useRef(false);
  const skipGeracaoEffectRef = useRef(false);
  const filtroNivelExibicao =
    data?.dadosUsados != null
      ? filtroNivelFromDadosUsados(data.dadosUsados)
      : filtroNivelUrl;
  const pathComProjetoVersao = (filtroNivel) =>
    `${pathRelatorioMitIaCompleto(id, { modoRapido, filtroNivel })}${
      projetoVersaoId ? `&projetoVersaoId=${projetoVersaoId}` : ''
    }`;

  useEffect(() => {
    if (skipGeracaoEffectRef.current) {
      skipGeracaoEffectRef.current = false;
      return;
    }
    geracaoIniciadaRef.current = false;
    gerarRelatorio();
  }, [id, relatorioSalvoId, projetoVersaoId, modoRapido, filtroNivelUrl]);

  useEffect(() => {
    setFiltroNivelSelecionado(filtroNivelUrl);
  }, [filtroNivelUrl]);

  useEffect(() => {
    const handleScroll = () => setShowBackTop(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (!jobBg || !['queued', 'running'].includes(jobBg.status)) return undefined;
    const t = setInterval(() => setTickRelogio((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [jobBg?.id, jobBg?.status]);

  useEffect(() => {
    if (!id || relatorioSalvoId || projetoVersaoId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const ativo = await obterJobAtivo();
        if (cancelled || !ativo) return;
        backgroundRunningRef.current = true;
        geracaoIniciadaRef.current = true;
        setJobBg((prev) => (prev?.id === ativo.id ? prev : ativo));
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [id, relatorioSalvoId, projetoVersaoId, modoRapido, filtroNivelUrl]);

  async function obterJobAtivo() {
    try {
      const jobs = await dashboardApi.listarRelatoriosIaJobs({
        projetoId: parseInt(id, 10),
        tipo: modoRapido ? 'completo_rapido' : 'completo',
        limit: 20
      });
      return (Array.isArray(jobs) ? jobs : []).find((j) =>
        ['queued', 'running'].includes(j.status)
      );
    } catch {
      return null;
    }
  }

  async function anexarJobAtivoSeExistir() {
    const ativo = await obterJobAtivo();
    if (!ativo) return false;
    backgroundRunningRef.current = true;
    setJobBg(ativo);
    setProgresso(Math.min(99, Math.max(10, Number(ativo.progresso) || 10)));
    setMensagemProgresso(ativo.etapa || 'Gerando book em background...');
    return true;
  }

  async function iniciarGeracaoAutomatica(filtroNivel = filtroNivelUrl) {
    if (geracaoIniciadaRef.current) return;
    if (await anexarJobAtivoSeExistir()) return;
    geracaoIniciadaRef.current = true;
    await iniciarGeracaoBackground(filtroNivel);
  }

  async function carregarRelatorioBiblioteca(salvoId) {
    const row = await relatoriosIAApi.buscar(salvoId);
    if (row.projetoId !== parseInt(id, 10)) {
      throw new Error('Este relatório não pertence a este projeto.');
    }
    if (row.tipo !== 'completo' && row.tipo !== 'completo_rapido') {
      throw new Error('Este item não é um Book de Trabalho (completo ou modo rápido).');
    }
    return mapRelatorioIASalvoToViewShape(row);
  }

  async function gerarRelatorio() {
    const carregandoBiblioteca = Boolean(relatorioSalvoId);
    setLoading(true);
    setError(null);
    setProgresso(3);
    setMensagemProgresso(
      carregandoBiblioteca ? 'Carregando versão da biblioteca...' : 'Procurando versão salva...'
    );

    const mensagens = [
      { p: 30, m: 'Buscando versão salva mais recente...' },
      { p: 70, m: 'Carregando book completo...' },
    ];

    let idx = 0;
    const intervalo = setInterval(() => {
      if (idx < mensagens.length) {
        setProgresso(mensagens[idx].p);
        setMensagemProgresso(mensagens[idx].m);
        idx++;
      }
    }, 600);

    try {
      if (relatorioSalvoId) {
        const salvoId = parseInt(relatorioSalvoId, 10);
        if (Number.isNaN(salvoId)) throw new Error('Identificador de relatório inválido.');
        const mapped = await carregarRelatorioBiblioteca(salvoId);
        clearInterval(intervalo);
        setProgresso(100);
        setMensagemProgresso('Versão da biblioteca carregada.');
        setData(mapped);
        return;
      }

      const salvo = await carregarRelatorioSalvoSeCompativel({
        relatoriosIAApi,
        projetoId: id,
        tipo: modoRapido ? 'completo_rapido' : 'completo',
        filtroNivel: filtroNivelUrl,
        projetoVersaoId
      });
      if (salvo) {
        clearInterval(intervalo);
        setProgresso(100);
        setMensagemProgresso('Versão salva carregada!');
        setData(mapRelatorioIASalvoToViewShape(salvo));
        return;
      }

      clearInterval(intervalo);
      await iniciarGeracaoAutomatica(filtroNivelUrl);
    } catch (err) {
      clearInterval(intervalo);
      setError(err.message || 'Erro ao gerar book de trabalho');
    } finally {
      clearInterval(intervalo);
      if (!backgroundRunningRef.current || relatorioSalvoId) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const jid = jobBg?.id;
    const st = jobBg?.status;
    if (!jid || !['queued', 'running'].includes(st)) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return undefined;
    }

    async function poll() {
      try {
        const status = await dashboardApi.statusRelatorioIABackground(jid);
        setJobBg(status);
        if (status.status === 'completed' || status.status === 'failed') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          if (status.status === 'completed') {
            backgroundRunningRef.current = false;
            const params = new URLSearchParams(window.location.search);
            const temSalvoNaUrl =
              params.get('relatorioSalvoId') || params.get('versaoId');
            if (temSalvoNaUrl) {
              navigate(pathComProjetoVersao(filtroNivelUrl), {
                replace: true
              });
            } else {
              await gerarRelatorio();
            }
          } else if (status.status === 'failed') {
            backgroundRunningRef.current = false;
            setError(status.erro || 'Falha ao gerar book em background.');
            setLoading(false);
          }
        }
      } catch (e) {
        console.error('Erro no polling do job em background:', e);
      }
    }

    poll();
    pollingRef.current = setInterval(poll, 2000);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [jobBg?.id, jobBg?.status, id, navigate, modoRapido, filtroNivelUrl]);

  async function iniciarGeracaoBackground(filtroNivelOverride = filtroNivelUrl) {
    try {
      setIniciandoBg(true);
      const res = await dashboardApi.iniciarRelatorioIABackground(
        id,
        modoRapido ? 'completo_rapido' : 'completo',
        {
          nivelPrioridadeMapeamentoMaturidade: filtroNivelOverride,
          versaoId: projetoVersaoId
        }
      );
      const job = res?.job;
      if (!job?.id) throw new Error('Não foi possível iniciar job em background');

      backgroundRunningRef.current = true;
      setJobBg(job);
    } catch (err) {
      alert(err.message || 'Erro ao iniciar geração em background');
    } finally {
      setIniciandoBg(false);
    }
  }

  async function handleRegenerarComNivelSelecionado() {
    const filtroNivel = Number(filtroNivelSelecionado);
    const nivelValido = filtroNivel === 0 || (filtroNivel >= 1 && filtroNivel <= 3);
    if (!nivelValido) return;
    if (
      !window.confirm(
        'Gerar uma nova versão do book? Isso consumirá tokens da IA. A versão anterior continuará na biblioteca.'
      )
    ) {
      return;
    }

    geracaoIniciadaRef.current = false;
    skipGeracaoEffectRef.current = true;
    if (relatorioSalvoId || filtroNivel !== filtroNivelUrl) {
      const base = pathComProjetoVersao(filtroNivel);
      navigate(relatorioSalvoId ? `${base}&relatorioSalvoId=${relatorioSalvoId}` : base, {
        replace: true
      });
    }
    await iniciarGeracaoAutomatica(filtroNivel);
  }

  async function handleGerarBackgroundPerguntandoNivel() {
    const filtroNivel = Number(filtroNivelSelecionado);
    const nivelValido = filtroNivel === 0 || (filtroNivel >= 1 && filtroNivel <= 3);
    if (!nivelValido) return;
    if (
      !window.confirm(
        'Gerar o book em background? Você pode continuar navegando. Isso consumirá tokens da IA.'
      )
    ) {
      return;
    }

    geracaoIniciadaRef.current = false;
    skipGeracaoEffectRef.current = true;
    const base = pathComProjetoVersao(filtroNivel);
    if (relatorioSalvoId || filtroNivel !== filtroNivelUrl) {
      navigate(base, { replace: true });
    }
    await iniciarGeracaoBackground(filtroNivel);
  }

  async function cancelarGeracaoBackground() {
    const jid = jobBg?.id;
    if (!jid) return;
    if (!window.confirm('Interromper a geração do book em background?')) return;
    try {
      setCancelandoBg(true);
      await dashboardApi.cancelarRelatorioIABackground(jid);
      const status = await dashboardApi.statusRelatorioIABackground(jid);
      setJobBg(status);
    } catch (err) {
      alert(err.message || 'Não foi possível cancelar');
    } finally {
      setCancelandoBg(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleDownloadMD() {
    if (!data) return;
    try {
      const markdownCompleto = buildMITBookCompletoMarkdownDocument(data);
      const blob = new Blob(['\ufeff', markdownCompleto], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Book_Maturidade_IA_${bookMITCompletoSafeBaseName(data)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Não foi possível gerar o Markdown. Recarregue a página e tente de novo.');
    }
  }

  function handleDownloadDoc() {
    if (!data) return;
    const rapid =
      modoRapido ||
      data?.modoGeracao === 'rapido' ||
      data?.tipoRelatorio === 'completo_rapido' ||
      data?.dadosUsados?.modoGeracao === 'rapido';
    const projectName = bookMITCompletoSafeBaseName(data);
    downloadMarkdownAsDoc(
      data.relatorio,
      `Book_Trabalho_Maturidade_IA_${projectName}`,
      {
        titulo: rapid
          ? 'Book de Trabalho (modo rápido) — Maturidade em IA'
          : 'Book de Trabalho — Maturidade em IA',
        subtitulo: rapid
          ? 'Versão condensada MIT CISR · Roadmap · KPIs'
          : 'Análise Aprofundada por Dimensão · Roadmap · KPIs · Governança',
        empresa: data.dadosUsados?.empresa ?? '',
        projeto: data.dadosUsados?.projeto ?? '',
        autor: 'BluePrint IA · Consultor Sênior MIT CISR',
        headerColor: '#0f766e',
        accentColor: '#14b8a6'
      }
    );
  }

  if (loading) {
    const carregandoBiblioteca = Boolean(relatorioSalvoId);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950 flex items-center justify-center p-6 print:hidden">
        <div className="max-w-2xl w-full">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-10 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full animate-pulse"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/50">
                  <BookOpen className="w-12 h-12 text-white animate-pulse" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-2">
                {carregandoBiblioteca
                  ? 'Carregando book da biblioteca'
                  : modoRapido
                    ? 'Construindo Book (modo rápido)'
                    : 'Construindo Book de Trabalho'}
              </h1>
              <p className="text-emerald-300 text-sm mb-1 font-medium">
                {carregandoBiblioteca
                  ? 'Abrindo versão salva — sem consumir tokens da IA'
                  : modoRapido
                    ? 'Versão condensada · mesma estrutura · menos chamadas à IA'
                    : 'Análise Aprofundada · Metodologia MIT CISR Completa'}
              </p>
              {!carregandoBiblioteca && (
              <p className="text-slate-400 text-sm mb-8">
                {modoRapido
                  ? 'Menos blocos que o book completo — meta típica até ~30 min (varia com provedor e fila).'
                  : 'A IA está realizando uma análise exaustiva por dimensão e construindo um documento de referência'}
              </p>
              )}
              {carregandoBiblioteca && <div className="mb-8" />}

              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden mb-3">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 ease-out shadow-lg shadow-emerald-500/50"
                  style={{ width: `${progresso}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between w-full text-xs">
                <span className="text-emerald-300 font-medium">{mensagemProgresso}</span>
                <span className="text-slate-400">{progresso}%</span>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full mt-8">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
                  <Layers className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Profundidade</p>
                  <p className="text-xs text-white font-semibold mt-0.5">
                    {carregandoBiblioteca ? 'Salvo' : '13 Seções'}
                  </p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
                  <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Tempo</p>
                  <p className="text-xs text-white font-semibold mt-0.5">
                    {modoRapido ? 'até ~30 min' : '1h+ típico'}
                  </p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
                  <Library className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Modo</p>
                  <p className="text-xs text-white font-semibold mt-0.5">
                    {modoRapido ? 'Rápido' : 'Multi-Chunk'}
                  </p>
                </div>
              </div>

              {!carregandoBiblioteca && (
              <div className="mt-8 w-full p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-left">
                <p className="text-[11px] text-emerald-300 font-semibold mb-2 uppercase tracking-wider">O que está sendo gerado:</p>
                <ul className="space-y-1 text-[11px] text-slate-400">
                  {modoRapido ? (
                    <>
                      <li>· Dimensões em blocos (texto mais curto por dimensão)</li>
                      <li>· Roadmap e dependências condensados</li>
                      <li>· Financeiro, governança, riscos e KPIs em menos páginas</li>
                      <li>· Apêndices essenciais + próximos passos</li>
                    </>
                  ) : (
                    <>
                      <li>· Análise diagnóstica por cada dimensão avaliada</li>
                      <li>· Roadmap detalhado de 12 meses com RACI</li>
                      <li>· Matriz de dependências e caminho crítico</li>
                      <li>· Projeção financeira em 3 cenários</li>
                      <li>· Estrutura de governança e Top 10 riscos</li>
                      <li>· Dashboard de KPIs (Negócio, DORA, MLOps, FinOps)</li>
                    </>
                  )}
                </ul>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Erro ao gerar book</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={gerarRelatorio}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-xs font-medium text-white transition hover:bg-emerald-700"
            >
              Tentar novamente
            </button>
            <Link
              to={`/dashboard/projeto/${id}`}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-700 px-4 text-xs font-medium text-white transition hover:bg-slate-600"
            >
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-600 rounded-2xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Nenhum conteúdo carregado</h2>
          <p className="text-slate-400 text-sm mb-6">
            O book não foi encontrado ou ainda não foi gerado para este projeto.
          </p>
          <button
            type="button"
            onClick={gerarRelatorio}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-xs font-medium text-white transition hover:bg-emerald-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const isBookRapido =
    modoRapido ||
    data?.modoGeracao === 'rapido' ||
    data?.tipoRelatorio === 'completo_rapido' ||
    data?.dadosUsados?.modoGeracao === 'rapido';

  const indice = extrairEntradasIndiceMarkdown(data?.relatorio || '');
  const statusSecao3 = data?.relatorio ? relatorioBookSecao3Completo(data.relatorio) : null;
  const secao3Incompleta = Boolean(statusSecao3 && !statusSecao3.ok);
  const headerBtn =
    'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium transition disabled:pointer-events-none disabled:opacity-60';

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Header com ações - oculto na impressão */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/dashboard/projeto/${id}`}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                  {isBookRapido ? 'Book modo rápido · IA' : 'Book de Trabalho · IA'}
                </p>
                <p className="text-sm text-slate-700 font-medium">{data?.dadosUsados?.projeto}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {labelFiltroNivelMapeamento(filtroNivelExibicao)}
                  {data?.dadosUsados?.projetoVersao?.titulo
                    ? ` · ${data.dadosUsados.projetoVersao.titulo}`
                    : ''}
                  {data?.dadosUsados?.comparativoVersoes?.disponivel
                    ? ` · Δ ${data.dadosUsados.comparativoVersoes.delta > 0 ? '+' : ''}${Number(data.dadosUsados.comparativoVersoes.delta).toFixed(2)} vs ${data.dadosUsados.comparativoVersoes.versaoBase?.titulo}`
                    : ''}
                  {data?.dadosUsados?.totalAvaliadores != null
                    ? ` · ${data.dadosUsados.totalAvaliadores} avaliador(es)`
                    : ''}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs text-emerald-900">
              <span className="hidden font-medium lg:inline">Nível dos avaliadores</span>
              <select
                value={filtroNivelSelecionado}
                onChange={(e) => setFiltroNivelSelecionado(Number(e.target.value))}
                disabled={iniciandoBg || (jobBg && ['queued', 'running'].includes(jobBg.status))}
                className="h-7 rounded-md border border-emerald-200 bg-white px-2 text-xs font-medium text-emerald-950 outline-none focus:border-emerald-500"
                title="Filtro cumulativo aplicado ao consolidado do book"
              >
                <option value={1}>Até nível 1</option>
                <option value={2}>Até nível 2</option>
                <option value={3}>Até nível 3</option>
                <option value={0}>Todos</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleRegenerarComNivelSelecionado}
              disabled={iniciandoBg || (jobBg && ['queued', 'running'].includes(jobBg.status))}
              className={`${headerBtn} border border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200`}
              title="Gera uma nova versão do book com o nível selecionado"
            >
              {iniciandoBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
              <span className="hidden lg:inline">Regenerar nível</span>
            </button>
            <button
              type="button"
              onClick={handleGerarBackgroundPerguntandoNivel}
              disabled={iniciandoBg || (jobBg && ['queued', 'running'].includes(jobBg.status))}
              className={`${headerBtn} border border-cyan-200 bg-cyan-100 text-cyan-800 hover:bg-cyan-200`}
              title="Executar geração em background e continuar navegando"
            >
              {iniciandoBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
              <span className="hidden lg:inline">Gerar em background</span>
            </button>
            {data?.versao && (
              <div
                className={`hidden h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium md:flex ${data.fromCache ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-teal-200 bg-teal-50 text-teal-700'}`}
              >
                <History className="h-3.5 w-3.5" />
                <span>v{data.versao}</span>
                {data.fromCache && (
                  <span className="text-[10px] uppercase tracking-wider">
                    {data.historicoBiblioteca ? 'histórico' : 'salva'}
                  </span>
                )}
              </div>
            )}
            <Link
              to="/biblioteca-ia"
              className={`${headerBtn} border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200`}
              title="Ir para a biblioteca de relatórios IA"
            >
              <Library className="h-4 w-4" />
              <span className="hidden lg:inline">Biblioteca</span>
            </Link>
            <button
              type="button"
              onClick={handleDownloadMD}
              className={`${headerBtn} border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200`}
              title="Baixar como Markdown"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Markdown</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadDoc}
              className={`${headerBtn} bg-blue-600 text-white shadow-md shadow-blue-600/30 hover:bg-blue-700`}
              title="Baixar como Word (.doc)"
            >
              <File className="h-4 w-4" />
              <span className="hidden sm:inline">Word</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className={`${headerBtn} bg-emerald-600 text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700`}
              title="Imprimir como PDF"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {data?.historicoBiblioteca && (
        <div className="border-b border-indigo-200 bg-indigo-50 print:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-2.5 text-xs text-indigo-950 sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="font-semibold">Biblioteca · histórico</span>
              {' · '}
              Você está vendo a versão <strong>v{data.versao}</strong> salva na biblioteca (não necessariamente a mais recente do projeto).
            </p>
            <button
              type="button"
              onClick={() =>
                navigate(
                  pathComProjetoVersao(filtroNivelUrl),
                  { replace: true }
                )
              }
              className={`${headerBtn} shrink-0 border border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-100`}
            >
              Ver versão mais recente
            </button>
          </div>
        </div>
      )}

      {/* Dados de avaliação mais recentes que o book — evita decisão com relatório defasado */}
      {data?.dadosDesatualizados && (
        <div className="border-b border-amber-200 bg-amber-50 print:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-2 text-amber-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">Dados mudaram desde v{data.versao}</p>
                <p className="mt-0.5 text-amber-900/90">
                  Há avaliação finalizada após a geração deste book
                  {data.ultimaAvaliacaoFinalizadaEm
                    ? ` (${new Date(data.ultimaAvaliacaoFinalizadaEm).toLocaleString('pt-BR')})`
                    : ''}
                  . Gere em background para alinhar o texto às avaliações atuais.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGerarBackgroundPerguntandoNivel}
              disabled={iniciandoBg || (jobBg && ['queued', 'running'].includes(jobBg.status))}
              className={`${headerBtn} shrink-0 border border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-200`}
            >
              {iniciandoBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
              Gerar em background
            </button>
          </div>
        </div>
      )}

      {/* Banner de versão salva (não imprime) */}
      {data?.fromCache && data?.dataGeracao && (
        <div className="bg-emerald-50 border-b border-emerald-200 print:hidden">
          <div className="max-w-7xl mx-auto px-6 py-2.5 flex flex-wrap items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Exibindo <strong>versão salva v{data.versao}</strong> gerada em{' '}
              <strong>{new Date(data.dataGeracao).toLocaleString('pt-BR')}</strong>
              {data.totalChunks && ` · ${data.chunksGerados}/${data.totalChunks} chunks`}
              {data.tokens?.saida && ` · ${(data.tokens.saida / 1000).toFixed(1)}k tokens`}
            </span>
          </div>
        </div>
      )}

      {secao3Incompleta && (
        <div className="border-b border-amber-300 bg-amber-50 print:hidden">
          <div className="mx-auto flex max-w-7xl items-start gap-2 px-6 py-3 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">Seção 3 incompleta ({statusSecao3.total}/16 dimensões)</p>
              <p className="mt-1 text-xs text-amber-900/90">
                Esta versão foi gerada com formato antigo ou interrompida. Use <strong>Gerar em background</strong> ou
                remova <code className="rounded bg-amber-100 px-1">relatorioSalvoId</code> da URL para criar um book
                novo com as 16 dimensões na ordem do framework.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banner de execução em background — fase, blocos, tempo e previsão */}
      {jobBg && (
        <div className="border-b border-cyan-200 bg-gradient-to-r from-cyan-50 to-teal-50 print:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 text-xs text-cyan-950">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2">
                {jobBg.status === 'failed' ? (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                ) : jobBg.status === 'completed' ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                ) : jobBg.status === 'cancelled' ? (
                  <Ban className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
                ) : (
                  <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-cyan-700" />
                )}
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold text-sm text-cyan-950">
                    Book IA em background · {labelStatusJob(jobBg.status)}
                  </p>
                  <p className="text-[13px] leading-snug text-cyan-900/95">
                    {jobBg.etapa || '—'}
                    {jobBg.status === 'failed' && jobBg.erro ? (
                      <span className="mt-1 block text-red-700">{jobBg.erro}</span>
                    ) : null}
                  </p>
                  {jobBg.metadata && typeof jobBg.metadata === 'object' && jobBg.metadata.totalChunks ? (
                    <p className="text-[11px] uppercase tracking-wide text-cyan-700/90">
                      Blocos do livro:{' '}
                      <strong>
                        {jobBg.metadata.chunkAtual ?? '—'}/{jobBg.metadata.totalChunks}
                      </strong>
                      {jobBg.metadata.chunkLabel ? (
                        <span className="normal-case">
                          {' '}
                          · último: <em>{jobBg.metadata.chunkLabel}</em>
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-cyan-900">
                <span className="inline-flex items-center gap-1" title="Tempo desde o início do job">
                  <Clock className="h-3.5 w-3.5" />
                  Decorrido:{' '}
                  <strong>
                    {jobBg.startedAt
                      ? formatDurationMs(Date.now() - new Date(jobBg.startedAt).getTime())
                      : '—'}
                  </strong>
                </span>
                <span className="inline-flex items-center gap-1" title="Estimativa pelo progresso (aproximada)">
                  Restante ~:{' '}
                  <strong>
                    {['queued', 'running'].includes(jobBg.status)
                      ? formatDurationMs(estimateRemainingMs(jobBg))
                      : jobBg.finishedAt && jobBg.startedAt
                        ? formatDurationMs(
                            new Date(jobBg.finishedAt).getTime() - new Date(jobBg.startedAt).getTime()
                          )
                        : '—'}
                  </strong>
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {jobBg && ['queued', 'running'].includes(jobBg.status) && (
                <button
                  type="button"
                  onClick={cancelarGeracaoBackground}
                  disabled={cancelandoBg}
                  className={`${headerBtn} border border-red-200 bg-red-50 text-red-800 hover:bg-red-100`}
                  title="Parar a geração em background"
                >
                  {cancelandoBg ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Ban className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Parar geração</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-cyan-200/70">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    jobBg.status === 'failed'
                      ? 'bg-red-500'
                      : jobBg.status === 'completed'
                        ? 'bg-emerald-500'
                        : jobBg.status === 'cancelled'
                          ? 'bg-slate-400'
                          : 'bg-gradient-to-r from-cyan-500 to-teal-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, Number(jobBg.progresso) || 0))}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-[11px] font-semibold text-cyan-900">
                {Math.round(Number(jobBg.progresso) || 0)}%
              </span>
            </div>
            {jobBg.status === 'completed' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    if (params.get('relatorioSalvoId') || params.get('versaoId')) {
                      navigate(
                        pathComProjetoVersao(filtroNivelUrl),
                        { replace: true }
                      );
                    } else {
                      gerarRelatorio();
                    }
                  }}
                  className={`${headerBtn} border border-cyan-300 bg-white text-cyan-900 hover:bg-cyan-100`}
                >
                  Recarregar relatório
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8 print:p-0 print:max-w-none">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
          {/* Sidebar com índice (oculto na impressão) */}
          <aside className="lg:col-span-3 print:hidden">
            <div className="sticky top-24 bg-white rounded-2xl shadow-md border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Bookmark className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">Índice</h3>
              </div>
              <nav className="space-y-1 text-sm max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
                {indice.map((item, idx) => (
                  <a
                    key={`${item.slug}-${idx}`}
                    href={`#${item.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(item.slug);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className={`block py-1.5 px-2 rounded-md hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer ${
                      item.level === 1 
                        ? 'font-semibold text-slate-800 mt-2' 
                        : 'text-slate-600 pl-5 text-[13px]'
                    }`}
                  >
                    {item.titulo}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Conteúdo principal */}
          <main className="lg:col-span-9 print:col-span-12">
            <div ref={printRef} className="bg-white rounded-2xl shadow-xl print:shadow-none overflow-hidden">
              {/* Banner do topo */}
              <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 px-10 py-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-cyan-400/20 rounded-full translate-y-24 -translate-x-24 blur-3xl"></div>
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border border-white/30">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-emerald-200 font-semibold">Book de Trabalho</p>
                      <p className="text-sm text-white/90">Análise aprofundada · Metodologia MIT CISR</p>
                    </div>
                  </div>
                  
                  <h1 className="text-4xl font-bold mb-2 leading-tight">
                    {isBookRapido
                      ? 'Maturidade em IA — Book de Trabalho (modo rápido)'
                      : 'Maturidade em IA — Book de Trabalho Completo'}
                  </h1>
                  <p className="text-emerald-100 text-lg mb-6">
                    {data?.dadosUsados?.empresa} · {data?.dadosUsados?.projeto}
                    {data?.dadosUsados?.projetoVersao?.titulo
                      ? ` · ${data.dadosUsados.projetoVersao.titulo}`
                      : ''}
                  </p>

                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-3 py-1.5">
                      <span className="text-emerald-200">Score Geral:</span>{' '}
                      <span className="font-bold">{data?.dadosUsados?.scoreGeral?.toFixed(2)}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-3 py-1.5">
                      <span className="text-emerald-200">Nível:</span>{' '}
                      <span className="font-bold">{data?.dadosUsados?.nivel}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-3 py-1.5">
                      <span className="text-emerald-200">Setor:</span>{' '}
                      <span className="font-bold capitalize">{data?.dadosUsados?.setor}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-3 py-1.5">
                      <span className="text-emerald-200">Porte:</span>{' '}
                      <span className="font-bold capitalize">{data?.dadosUsados?.porte}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-3 py-1.5">
                      <span className="text-emerald-200">Dimensões:</span>{' '}
                      <span className="font-bold">{data?.dadosUsados?.scoresPorArea?.length || 0}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-3 py-1.5">
                      <span className="text-emerald-200">Avaliadores:</span>{' '}
                      <span className="font-bold">{data?.dadosUsados?.totalAvaliadores}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner de validação IA */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 px-10 py-4 print:py-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-900">
                        Documento de referência produzido por Consultor Sênior IA em Estratégia de IA
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Frameworks aplicados: MIT CISR · DORA · MLOps · FinOps · NIST AI RMF · Provider: {data?.provider} · Modelo: {data?.model}
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-600 text-right">
                    {data?.chunksGerados && data?.totalChunks ? (
                      <div>Chunks IA: {data.chunksGerados}/{data.totalChunks}</div>
                    ) : null}
                    <div>Tokens: {data?.tokens?.entrada}↑ / {data?.tokens?.saida}↓ · {(data?.tempoResposta / 1000).toFixed(1)}s</div>
                  </div>
                </div>
              </div>

              {/* Conteúdo do book */}
              <div className="px-10 py-10 print:px-8 print:py-6">
                {data?.dadosUsados?.comparativoVersoes?.disponivel && (
                  <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 print:hidden">
                    <p className="text-sm font-semibold text-emerald-900">Evolução entre versões da pesquisa</p>
                    <p className="mt-1 text-xs text-emerald-800">
                      {data.dadosUsados.comparativoVersoes.versaoBase?.titulo} ({Number(data.dadosUsados.comparativoVersoes.versaoBase?.score ?? 0).toFixed(1)})
                      {' → '}
                      {data.dadosUsados.comparativoVersoes.versaoComparada?.titulo} ({Number(data.dadosUsados.comparativoVersoes.versaoComparada?.score ?? 0).toFixed(1)})
                      {' · Δ '}
                      {data.dadosUsados.comparativoVersoes.delta > 0 ? '+' : ''}
                      {Number(data.dadosUsados.comparativoVersoes.delta).toFixed(2)}
                      {' · '}
                      {data.dadosUsados.comparativoVersoes.tendencia}
                    </p>
                  </div>
                )}
                <article className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h1:text-emerald-900 prose-h1:border-b prose-h1:border-emerald-200 prose-h1:pb-3 prose-h1:mt-12 prose-h1:mb-6 prose-h2:text-2xl prose-h2:text-teal-800 prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:text-teal-700 prose-h3:mt-8 prose-h4:text-lg prose-h4:text-slate-700 prose-p:text-slate-700 prose-p:leading-relaxed prose-strong:text-slate-900 prose-strong:font-semibold prose-table:text-sm prose-table:border-collapse prose-th:bg-emerald-50 prose-th:text-emerald-900 prose-th:p-3 prose-th:font-semibold prose-th:text-left prose-td:p-3 prose-td:border prose-td:border-slate-200 prose-th:border prose-th:border-emerald-200 prose-li:text-slate-700 prose-li:my-1 prose-blockquote:border-l-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r prose-code:text-emerald-700 prose-code:bg-emerald-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none print:prose-h1:text-2xl print:prose-h2:text-xl print:prose-h3:text-lg [&_h1]:scroll-mt-24 [&_h2]:scroll-mt-24">
                  <MarkdownRenderer content={data?.relatorio || ''} bookCompleto={!isBookRapido} />
                </article>
              </div>

              {/* Rodapé */}
              <div className="bg-slate-50 border-t border-slate-200 px-10 py-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-semibold text-slate-700">
                    Book de Trabalho gerado por Inteligência Artificial · Validado pela metodologia MIT CISR
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
                  Este documento é uma referência aprofundada produzida por um Consultor Sênior IA com expertise em Enterprise AI Maturity Model do MIT CISR. As recomendações, KPIs e roadmaps devem ser contextualizados pela liderança antes da execução. Projeções financeiras são referenciais.
                </p>
                <p className="text-[10px] text-slate-400 mt-2">
                  Gerado em {new Date().toLocaleString('pt-BR')} · BluePrint IA
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Botão Voltar ao Topo */}
      {showBackTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-12 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-xl flex items-center justify-center transition print:hidden z-50"
          title="Voltar ao topo"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      <style>{`
        @media print {
          body { background: white !important; }
          @page { size: A4; margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
}

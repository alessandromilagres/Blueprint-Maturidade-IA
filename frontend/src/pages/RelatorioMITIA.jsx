import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Sparkles, Download, Printer, FileText, Loader2, AlertCircle, CheckCircle2, Cpu, Zap, File, RefreshCw, History, Library } from 'lucide-react';
import { dashboardApi, relatoriosIAApi } from '../services/api';
import { mapRelatorioIASalvoToViewShape } from '../utils/relatorioIAViewModel';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { downloadMarkdownAsDoc } from '../utils/markdownToDoc';
import {
  filtroNivelMapeamentoFromSearchParams,
  queryNivelMapeamentoMaturidade,
  labelFiltroNivelMapeamento,
  filtroNivelFromDadosUsados,
  perguntarFiltroNivelMapeamento
} from '../utils/filtroNivelMaturidade';

export default function RelatorioMITIA() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const filtroNivelUrl = filtroNivelMapeamentoFromSearchParams(searchParams);
  const navigate = useNavigate();
  const versaoId = searchParams.get('versaoId');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const filtroNivelExibicao =
    data?.dadosUsados != null
      ? filtroNivelFromDadosUsados(data.dadosUsados)
      : filtroNivelUrl;
  const [progresso, setProgresso] = useState(0);
  const [mensagemProgresso, setMensagemProgresso] = useState('Iniciando análise...');
  const [jobBg, setJobBg] = useState(null);
  const [iniciandoBg, setIniciandoBg] = useState(false);
  const printRef = useRef(null);
  const pollingRef = useRef(null);
  const backgroundRunningRef = useRef(false);
  const skipVersaoEffectRef = useRef(false);

  useEffect(() => {
    if (skipVersaoEffectRef.current) {
      skipVersaoEffectRef.current = false;
      return;
    }
    gerarRelatorio();
  }, [id, versaoId, filtroNivelUrl]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

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
        setProgresso(Math.min(99, Math.max(10, Number(status.progresso) || 10)));
        setMensagemProgresso(status.etapa || 'Gerando relatório em background...');

        if (['completed', 'failed', 'cancelled'].includes(status.status)) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          if (status.status === 'completed') {
            backgroundRunningRef.current = false;
            setMensagemProgresso('Geração concluída. Carregando versão salva...');
            await gerarRelatorio(false);
          } else {
            backgroundRunningRef.current = false;
            setError(
              status.status === 'cancelled'
                ? 'Geração cancelada.'
                : status.erro || 'Falha ao gerar relatório em background.'
            );
            setLoading(false);
          }
        }
      } catch (e) {
        console.error('Erro no polling do relatório IA em background:', e);
      }
    }

    poll();
    pollingRef.current = setInterval(poll, 2500);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [jobBg?.id, jobBg?.status]);

  async function gerarRelatorio(forceRegenerate = false) {
    setLoading(true);
    setError(null);
    setProgresso(5);
    setMensagemProgresso(forceRegenerate ? 'Iniciando nova geração...' : 'Procurando versão salva...');

    const mensagens = forceRegenerate ? [
      { p: 10, m: 'Coletando dados do projeto...' },
      { p: 25, m: 'Calculando scores e benchmarks...' },
      { p: 45, m: 'Enviando assessment para o consultor IA...' },
      { p: 65, m: 'IA analisando gaps com metodologia MIT CISR...' },
      { p: 80, m: 'Construindo roadmap estratégico contextualizado...' },
      { p: 92, m: 'Salvando nova versão na biblioteca...' },
    ] : [
      { p: 30, m: 'Buscando versão mais recente...' },
      { p: 70, m: 'Carregando relatório...' },
    ];

    let idx = 0;
    const intervalo = setInterval(() => {
      if (idx < mensagens.length) {
        setProgresso(mensagens[idx].p);
        setMensagemProgresso(mensagens[idx].m);
        idx++;
      }
    }, forceRegenerate ? 2500 : 600);

    try {
      const vid = searchParams.get('versaoId');
      if (vid && !forceRegenerate) {
        const salvoId = parseInt(vid, 10);
        if (Number.isNaN(salvoId)) throw new Error('Identificador de versão inválido.');
        const row = await relatoriosIAApi.buscar(salvoId);
        if (row.projetoId !== parseInt(id, 10)) {
          throw new Error('Este relatório não pertence a este projeto.');
        }
        if (row.tipo !== 'executivo') {
          throw new Error('Este item não é o relatório estratégico (C-Level).');
        }
        clearInterval(intervalo);
        setProgresso(100);
        setMensagemProgresso('Versão da biblioteca carregada.');
        setData(mapRelatorioIASalvoToViewShape(row));
        return;
      }

      if (!forceRegenerate) {
        try {
          const salvo = await relatoriosIAApi.ultimaVersao(id, 'executivo', {
            nivelPrioridadeMapeamentoMaturidade: filtroNivelUrl
          });
          clearInterval(intervalo);
          setProgresso(100);
          setMensagemProgresso('Versão salva carregada!');
          setData(mapRelatorioIASalvoToViewShape(salvo));
          return;
        } catch (_) {
          // Sem versão salva: inicia geração em background.
        }
      }

      clearInterval(intervalo);
      if (forceRegenerate && searchParams.get('versaoId')) {
        skipVersaoEffectRef.current = true;
        navigate(`/relatorios/${id}/mit-ia?${queryNivelMapeamentoMaturidade(filtroNivelUrl)}`, { replace: true });
      }
      await handleGerarPerguntandoNivel();
    } catch (err) {
      clearInterval(intervalo);
      setError(err.message || 'Erro ao gerar relatório com IA');
    } finally {
      if (!backgroundRunningRef.current) {
        setTimeout(() => setLoading(false), 600);
      }
    }
  }

  async function iniciarGeracaoBackground(filtroNivel = filtroNivelUrl) {
    try {
      setIniciandoBg(true);
      setLoading(true);
      setError(null);
      setProgresso(8);
      setMensagemProgresso('Enfileirando geração em background...');
      const res = await dashboardApi.iniciarRelatorioIABackground(id, 'executivo', {
        nivelPrioridadeMapeamentoMaturidade: filtroNivel
      });
      const job = res?.job;
      if (!job?.id) throw new Error('Não foi possível iniciar job em background');
      backgroundRunningRef.current = true;
      setJobBg(job);
      setMensagemProgresso(job.etapa || 'Relatório enfileirado em background...');
    } finally {
      setIniciandoBg(false);
    }
  }

  async function handleGerarPerguntandoNivel() {
    const nivel = perguntarFiltroNivelMapeamento({
      defaultValue: filtroNivelUrl,
      contexto: 'relatório estratégico C-Level'
    });
    if (nivel == null) return;
    if (nivel !== filtroNivelUrl || searchParams.get('versaoId')) {
      skipVersaoEffectRef.current = true;
      navigate(`/relatorios/${id}/mit-ia?${queryNivelMapeamentoMaturidade(nivel)}`, { replace: true });
    }
    await iniciarGeracaoBackground(nivel);
  }

  async function handleRegerar() {
    const nivel = perguntarFiltroNivelMapeamento({
      defaultValue: filtroNivelUrl,
      contexto: 'relatório estratégico C-Level'
    });
    if (nivel == null) return;
    if (!confirm('Gerar uma nova versão? Isso consumirá tokens da IA. A versão anterior continuará disponível na biblioteca.')) return;
    if (nivel !== filtroNivelUrl || searchParams.get('versaoId')) {
      skipVersaoEffectRef.current = true;
      navigate(`/relatorios/${id}/mit-ia?${queryNivelMapeamentoMaturidade(nivel)}`, { replace: true });
    }
    await iniciarGeracaoBackground(nivel);
  }

  function handlePrint() {
    window.print();
  }

  function handleDownloadMD() {
    if (!data) return;
    const blob = new Blob([data.relatorio], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_MIT_IA_${data.dadosUsados.projeto.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleDownloadDoc() {
    if (!data) return;
    const projectName = data.dadosUsados.projeto.replace(/\s+/g, '_');
    downloadMarkdownAsDoc(
      data.relatorio,
      `Relatorio_Estrategico_MIT_IA_${projectName}`,
      {
        titulo: 'Relatório Estratégico C-Level',
        subtitulo: 'Análise Executiva de Maturidade em IA',
        empresa: data.dadosUsados.empresa,
        projeto: data.dadosUsados.projeto,
        autor: 'BluePrint IA · Consultor MIT CISR',
        headerColor: '#6b21a8',
        accentColor: '#a855f7'
      }
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-6 print:hidden">
        <div className="max-w-2xl w-full">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-10 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-full animate-pulse"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/50">
                  <Brain className="w-12 h-12 text-white animate-pulse" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-2">
                Gerando Relatório Estratégico
              </h1>
              <p className="text-purple-300 text-sm mb-1 font-medium">
                Consultor Sênior IA · Metodologia MIT CISR
              </p>
              <p className="text-slate-400 text-sm mb-8">
                A IA está analisando seu assessment e construindo um relatório executivo de alto impacto
              </p>

              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden mb-3">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500 ease-out shadow-lg shadow-purple-500/50"
                  style={{ width: `${progresso}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between w-full text-xs">
                <span className="text-purple-300 font-medium">{mensagemProgresso}</span>
                <span className="text-slate-400">{progresso}%</span>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full mt-8">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
                  <Cpu className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Modelo</p>
                  <p className="text-xs text-white font-semibold mt-0.5">Claude Sonnet</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
                  <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Tempo</p>
                  <p className="text-xs text-white font-semibold mt-0.5">~30-60s</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
                  <Sparkles className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Qualidade</p>
                  <p className="text-xs text-white font-semibold mt-0.5">C-Level</p>
                </div>
              </div>
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
          <h2 className="text-xl font-bold text-white mb-2">Erro ao gerar relatório</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={gerarRelatorio}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition"
            >
              Tentar novamente
            </button>
            <Link
              to={`/dashboard/projeto/${id}`}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
            >
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const headerBtnMini =
    'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium transition';

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Header com ações - oculto na impressão */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Relatório MIT · IA</p>
                <p className="text-sm text-slate-700 font-medium">{data?.dadosUsados?.projeto}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {labelFiltroNivelMapeamento(filtroNivelExibicao)}
                  {data?.dadosUsados?.totalAvaliadores != null
                    ? ` · ${data.dadosUsados.totalAvaliadores} avaliador(es) no consolidado`
                    : ''}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Badge de versão */}
            {data?.versao && (
              <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${data.fromCache ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                <History className="w-3.5 h-3.5" />
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
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
              title="Ir para a biblioteca de relatórios IA"
            >
              <Library className="w-4 h-4" />
              <span className="hidden lg:inline">Biblioteca</span>
            </Link>
            <button
              onClick={handleRegerar}
              className="flex items-center gap-2 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-sm font-medium transition border border-amber-200"
              title="Gerar nova versão (consome tokens da IA)"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden lg:inline">Regerar</span>
            </button>
            <button
              onClick={handleDownloadMD}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
              title="Baixar como Markdown"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Markdown</span>
            </button>
            <button
              onClick={handleDownloadDoc}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-md shadow-blue-600/30"
              title="Baixar como Word (.doc)"
            >
              <File className="w-4 h-4" />
              <span className="hidden sm:inline">Word</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition shadow-md shadow-purple-600/30"
              title="Imprimir como PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {data?.historicoBiblioteca && (
        <div className="border-b border-indigo-200 bg-indigo-50 print:hidden">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-2.5 text-xs text-indigo-950 sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="font-semibold">Biblioteca · histórico</span>
              {' · '}
              Você está vendo a versão <strong>v{data.versao}</strong> salva na biblioteca (não necessariamente a mais recente do projeto).
            </p>
            <button
              type="button"
              onClick={() =>
                navigate(`/relatorios/${id}/mit-ia?${queryNivelMapeamentoMaturidade(filtroNivelUrl)}`, {
                  replace: true
                })
              }
              className={`${headerBtnMini} shrink-0 border border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-100`}
            >
              Ver versão mais recente
            </button>
          </div>
        </div>
      )}

      {/* Banner de versão salva (não imprime) */}
      {data?.fromCache && data?.dataGeracao && (
        <div className="bg-emerald-50 border-b border-emerald-200 print:hidden">
          <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Exibindo <strong>versão salva v{data.versao}</strong> gerada em{' '}
                <strong>{new Date(data.dataGeracao).toLocaleString('pt-BR')}</strong>
                {data.dadosUsados && ` · provider ${data.provider} · ${(data.tokens?.saida / 1000).toFixed(1)}k tokens`}
              </span>
            </div>
            <button
              onClick={handleRegerar}
              className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-medium"
            >
              <RefreshCw className="w-3 h-3" />
              Gerar nova versão
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8 print:p-0 print:max-w-none">
        {/* Capa */}
        <div ref={printRef} className="bg-white rounded-2xl shadow-xl print:shadow-none overflow-hidden">
          {/* Banner do topo */}
          <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-fuchsia-700 px-10 py-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-400/20 rounded-full translate-y-24 -translate-x-24 blur-3xl"></div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border border-white/30">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-purple-200 font-semibold">Relatório Estratégico</p>
                  <p className="text-sm text-white/90">Validado pela metodologia MIT CISR</p>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold mb-2">
                Análise Executiva de Maturidade em IA
              </h1>
              <p className="text-purple-100 text-lg mb-6">
                {data?.dadosUsados?.empresa} · {data?.dadosUsados?.projeto}
              </p>

              <div className="flex flex-wrap gap-3 text-xs">
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-3 py-1.5">
                  <span className="text-purple-200">Score Geral:</span>{' '}
                  <span className="font-bold">{data?.dadosUsados?.scoreGeral?.toFixed(2)}</span>
                </div>
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-3 py-1.5">
                  <span className="text-purple-200">Nível:</span>{' '}
                  <span className="font-bold">{data?.dadosUsados?.nivel}</span>
                </div>
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-3 py-1.5">
                  <span className="text-purple-200">Setor:</span>{' '}
                  <span className="font-bold capitalize">{data?.dadosUsados?.setor}</span>
                </div>
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg px-3 py-1.5">
                  <span className="text-purple-200">Avaliadores:</span>{' '}
                  <span className="font-bold">{data?.dadosUsados?.totalAvaliadores}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Banner de validação IA */}
          <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 border-b border-purple-100 px-10 py-4 print:py-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs font-semibold text-purple-900">
                    Relatório gerado por Consultor IA Sênior em Estratégia de IA
                  </p>
                  <p className="text-[11px] text-purple-700">
                    Especialista em MIT CISR Enterprise AI Maturity Model · Provider: {data?.provider} · Modelo: {data?.model}
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-purple-600">
                Tokens: {data?.tokens?.entrada}↑ / {data?.tokens?.saida}↓ · {(data?.tempoResposta / 1000).toFixed(1)}s
              </div>
            </div>
          </div>

          {/* Conteúdo do relatório */}
          <div className="px-10 py-10 print:px-8 print:py-6">
            <article className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h1:text-purple-900 prose-h1:border-b prose-h1:border-purple-200 prose-h1:pb-3 prose-h1:mt-10 prose-h1:mb-6 prose-h2:text-xl prose-h2:text-slate-800 prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-lg prose-h3:text-slate-700 prose-p:text-slate-700 prose-p:leading-relaxed prose-strong:text-slate-900 prose-table:text-sm prose-th:bg-purple-50 prose-th:text-purple-900 prose-th:p-3 prose-td:p-3 prose-td:border prose-td:border-slate-200 prose-th:border prose-th:border-purple-200 prose-li:text-slate-700 prose-blockquote:border-l-purple-500 prose-blockquote:bg-purple-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r print:prose-h1:text-2xl print:prose-h2:text-lg">
              <MarkdownRenderer content={data?.relatorio || ''} />
            </article>
          </div>

          {/* Rodapé */}
          <div className="bg-slate-50 border-t border-slate-200 px-10 py-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <p className="text-xs font-semibold text-slate-700">
                Relatório gerado por Inteligência Artificial · Validado pela metodologia MIT CISR
              </p>
            </div>
            <p className="text-[10px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Este relatório foi produzido por um Consultor Sênior IA com expertise em Enterprise AI Maturity Model do MIT Center for Information Systems Research. As recomendações são baseadas nos dados do assessment e devem ser contextualizadas pela liderança antes da execução. Projeções são referenciais.
            </p>
            <p className="text-[10px] text-slate-400 mt-2">
              Gerado em {new Date().toLocaleString('pt-BR')} · BluePrint IA
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          @page { size: A4; margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
}

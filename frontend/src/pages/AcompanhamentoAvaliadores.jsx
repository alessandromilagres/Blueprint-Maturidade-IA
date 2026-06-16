import { useState, useEffect, useCallback } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { AlertTriangle, Copy, Mail, RefreshCw, Users, Building2, FolderKanban, Send, Package, History, Download, FileText, Printer } from 'lucide-react';
import { empresasApi, projetosApi, produtosApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const STATUS_LABEL = {
  finalizada: 'Finalizada',
  pronto_finalizar: 'Em andamento (100%)',
  em_andamento: 'Em andamento',
  nao_iniciada: 'Não iniciada',
  convite_pendente: 'Convite pendente',
  sem_avaliacao: 'Sem avaliação',
};

const ETAPA_LABEL = {
  link_enviado: 'Link enviado',
  convite_aberto: 'Link aberto',
  abriu_sem_iniciar: 'Abriu sem iniciar',
  iniciada_sem_respostas: 'Iniciada sem respostas',
  em_andamento: 'Em andamento',
  finalizada: 'Finalizada',
  sem_convite: 'Sem convite',
};

const EVENTO_LABEL = {
  convite_enviado: 'Convite enviado',
  convite_aberto: 'Link aberto',
  avaliacao_iniciada: 'Avaliação iniciada',
  avaliacao_salva: 'Progresso salvo',
  avaliacao_revisada: 'Revisão confirmada',
  avaliacao_finalizada: 'Avaliação finalizada',
};

function formatDataCurta(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AlertasQualidade({ row }) {
  const totalAlertasResposta = row?.alertasRespostas?.length || 0;
  if (!row?.alertasQualidade?.length && totalAlertasResposta === 0) {
    return <span className="text-xs text-emerald-600 dark:text-emerald-400">OK</span>;
  }
  return (
    <div className="space-y-1">
      {row.alertasQualidade.map((alerta) => (
        <div
          key={alerta.tipo}
          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
          title={alerta.mensagem}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {alerta.tipo === 'straight_lining'
            ? 'Mesmo score'
            : alerta.tipo === 'conclusao_rapida'
              ? 'Rápida'
              : alerta.tipo === 'muitas_sem_informacao'
                ? 'Sem info'
                : 'Evidência'}
        </div>
      ))}
      {totalAlertasResposta > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-amber-700 hover:underline dark:text-amber-300">
            {totalAlertasResposta} resposta(s) para revisar
          </summary>
          <div className="mt-2 max-w-xs space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            {row.alertasRespostas.slice(0, 5).map((alerta, idx) => (
              <div key={`${alerta.perguntaId}-${alerta.tipo}-${idx}`}>
                <div className="font-medium">{alerta.area || 'Dimensão'}</div>
                <div className="line-clamp-2">{alerta.mensagem}</div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function labelAcaoLembrete(row) {
  if (row?.etapaConvite === 'link_enviado' || row?.etapaConvite === 'abriu_sem_iniciar') {
    return 'Reenviar link';
  }
  return 'Lembrete';
}

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

export default function AcompanhamentoAvaliadores() {
  const location = useLocation();
  const { usuario, isAdmin, isAvaliador } = useAuth();
  const toast = useToast();
  const [escopo, setEscopo] = useState('projeto');
  const [empresas, setEmpresas] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [empresaId, setEmpresaId] = useState('');
  const [projetoId, setProjetoId] = useState('');
  const [produtoId, setProdutoId] = useState('');
  const [data, setData] = useState(null);
  const [loadingLista, setLoadingLista] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [enviandoId, setEnviandoId] = useState(null);
  const [enviandoLote, setEnviandoLote] = useState(false);
  const [loteHabilitado, setLoteHabilitado] = useState(false);
  const [erro, setErro] = useState(null);
  const [ultimoLote, setUltimoLote] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsAberto, setLogsAberto] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [relatorioDimensoes, setRelatorioDimensoes] = useState(null);
  const [relatorioDimensoesAberto, setRelatorioDimensoesAberto] = useState(false);
  const [loadingRelatorioDimensoes, setLoadingRelatorioDimensoes] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  /** Filtro cumulativo no painel de maturidade (projeto): 0 = todos (sem filtro); 1–3 = até esse nível. */
  const [filtroNivelMapeamentoMaturidade, setFiltroNivelMapeamentoMaturidade] = useState(0);

  const selecionadoId = escopo === 'projeto' ? projetoId : produtoId;

  useEffect(() => {
    const st = location.state;
    if (st?.empresaId != null) setEmpresaId(String(st.empresaId));
    if (st?.escopo === 'produto' || st?.escopo === 'projeto') setEscopo(st.escopo);
    if (st?.projetoId != null) setProjetoId(String(st.projetoId));
    if (st?.produtoId != null) {
      setEscopo('produto');
      setProdutoId(String(st.produtoId));
    }
  }, [location.key]);

  useEffect(() => {
    if (!usuario?.id || isAvaliador()) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await empresasApi.listar();
        if (cancelled) return;
        setEmpresas(list);
        if (!isAdmin() && usuario?.empresaId) {
          setEmpresaId(String(usuario.empresaId));
        }
      } catch (e) {
        console.error(e);
        setErro(e.message);
      } finally {
        if (!cancelled) setLoadingLista(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [usuario?.id, usuario?.empresaId, isAdmin, isAvaliador]);

  useEffect(() => {
    if (!empresaId || isAvaliador()) {
      setProjetos([]);
      setProjetoId('');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await projetosApi.listar(parseInt(empresaId, 10));
        if (cancelled) return;
        setProjetos(list);
        setProjetoId((prev) =>
          list.some((p) => String(p.id) === String(prev)) ? prev : ''
        );
        setProdutoId('');
        setProdutos([]);
        setData(null);
      } catch (e) {
        console.error(e);
        setProjetos([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [empresaId, isAvaliador]);

  useEffect(() => {
    if (escopo !== 'produto' || !projetoId) {
      setProdutos([]);
      setProdutoId('');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await produtosApi.listar(projetoId);
        if (cancelled) return;
        setProdutos(list);
        setProdutoId((prev) =>
          list.some((p) => String(p.id) === String(prev)) ? prev : ''
        );
        setData(null);
      } catch (e) {
        console.error(e);
        setProdutos([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [escopo, projetoId]);

  useEffect(() => {
    setLoteHabilitado(false);
    setUltimoLote(null);
  }, [escopo, projetoId, produtoId, filtroNivelMapeamentoMaturidade]);

  useEffect(() => {
    setRelatorioDimensoes(null);
    setRelatorioDimensoesAberto(false);
  }, [escopo, projetoId]);

  const carregarStatus = useCallback(async () => {
    const pid = escopo === 'projeto' ? parseInt(projetoId, 10) : parseInt(produtoId, 10);
    if (!pid) return;
    setLoadingStatus(true);
    setErro(null);
    try {
      const res =
        escopo === 'projeto'
          ? await projetosApi.avaliadoresStatus(pid, {
              nivelPrioridadeMapeamentoMaturidade: filtroNivelMapeamentoMaturidade
            })
          : await produtosApi.avaliadoresStatus(pid);
      setData(res);
    } catch (e) {
      setErro(e.message);
      setData(null);
    } finally {
      setLoadingStatus(false);
    }
  }, [escopo, projetoId, produtoId, filtroNivelMapeamentoMaturidade]);

  const carregarLogs = useCallback(async () => {
    const pid = escopo === 'projeto' ? parseInt(projetoId, 10) : parseInt(produtoId, 10);
    if (!pid) return;
    setLoadingLogs(true);
    try {
      const res =
        escopo === 'projeto'
          ? await projetosApi.lembretesLog(pid)
          : await produtosApi.lembretesLog(pid);
      setLogs(res.logs || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingLogs(false);
    }
  }, [escopo, projetoId, produtoId, toast]);

  const carregarRelatorioDimensoes = useCallback(async () => {
    const pid = parseInt(projetoId, 10);
    if (!pid || escopo !== 'projeto') return;
    setLoadingRelatorioDimensoes(true);
    try {
      const res = await projetosApi.avaliadoresDimensoes(pid, {
        nivelPrioridadeMapeamentoMaturidade: filtroNivelMapeamentoMaturidade
      });
      setRelatorioDimensoes(res);
      setRelatorioDimensoesAberto(true);
    } catch (e) {
      toast.error(e.message || 'Não foi possível carregar o relatório de dimensões.');
    } finally {
      setLoadingRelatorioDimensoes(false);
    }
  }, [escopo, projetoId, filtroNivelMapeamentoMaturidade, toast]);

  useEffect(() => {
    if (!selecionadoId) {
      setData(null);
      return;
    }
    carregarStatus();
  }, [selecionadoId, carregarStatus]);

  useEffect(() => {
    if (logsAberto && selecionadoId) {
      carregarLogs();
    }
  }, [logsAberto, selecionadoId, carregarLogs]);

  async function handleLembrete(usuarioId) {
    const pid = parseInt(selecionadoId, 10);
    if (!pid) return;
    setEnviandoId(usuarioId);
    setErro(null);
    try {
      const res =
        escopo === 'projeto'
          ? await projetosApi.enviarLembreteAvaliador(pid, usuarioId)
          : await produtosApi.enviarLembreteAvaliador(pid, usuarioId);
      const email = res?.email;
      if (email?.simulado) {
        toast.info('Lembrete processado (e-mail simulado — configure SMTP ou Graph no servidor).');
      } else {
        toast.success('E-mail de lembrete enviado.');
      }
      await carregarStatus();
      if (logsAberto) await carregarLogs();
    } catch (e) {
      setErro(e.message);
      toast.error(e.message);
    } finally {
      setEnviandoId(null);
    }
  }

  async function handleCopiarLink(row) {
    if (!row?.conviteLink) return;
    try {
      await navigator.clipboard.writeText(row.conviteLink);
      toast.success('Link do avaliador copiado.');
    } catch {
      toast.error('Não foi possível copiar o link.');
    }
  }

  function exportarRelatorioDimensoesCsv() {
    if (!relatorioDimensoes) return;
    const linhas = [
      [
        'Projeto',
        'Empresa',
        'Avaliador',
        'Data avaliação final',
        'Dimensões avaliadas',
      ],
    ];
    for (const avaliador of relatorioDimensoes.avaliadores || []) {
      linhas.push([
        relatorioDimensoes.projeto?.nome,
        relatorioDimensoes.empresa?.nome,
        avaliador.nome,
        avaliador.dataAvaliacaoFinal
          ? new Date(avaliador.dataAvaliacaoFinal).toLocaleDateString('pt-BR')
          : 'Não finalizada',
        (avaliador.dimensoesAvaliadasNomes || []).join(', ') || 'Nenhuma',
      ]);
    }
    const nomeProjeto = relatorioDimensoes.projeto?.nome || 'projeto';
    baixarCsv(`relatorio-dimensoes-${nomeProjeto.replace(/\s+/g, '-').toLowerCase()}.csv`, linhas);
  }

  const pendentesLembrete = data?.avaliadores?.filter((r) => r.podeLembrar).length ?? 0;
  const finalizadas = data?.avaliadores?.filter((r) => r.statusFormulario === 'finalizada').length ?? 0;
  const totalLinhas = data?.avaliadores?.length ?? 0;
  const alertasQualidade = data?.resumoQualidade?.alertas ?? 0;
  const avaliadoresComAlerta = data?.resumoQualidade?.avaliadoresComAlerta ?? 0;
  const resumoOperacional = data?.resumoOperacional ?? {};
  const avaliadoresFiltrados = (data?.avaliadores || []).filter((row) => {
    if (filtroStatus === 'todos') return true;
    if (filtroStatus === 'pendentes') return row.statusFormulario !== 'finalizada';
    if (filtroStatus === 'alertas') return row.qualidadeDadoStatus === 'atencao';
    if (filtroStatus === 'lembrete') return row.podeLembrar;
    if (filtroStatus === 'nao_abriu') return row.conviteLink && !row.abriuConvite && !row.iniciouAvaliacao;
    if (filtroStatus === 'abriu_sem_iniciar') return row.etapaConvite === 'abriu_sem_iniciar';
    return row.statusFormulario === filtroStatus;
  });

  async function handleLembreteLote() {
    const pid = parseInt(selecionadoId, 10);
    if (!pid || pendentesLembrete === 0) return;
    if (
      !confirm(
        `Enviar o mesmo e-mail de lembrete para ${pendentesLembrete} avaliador(es) que ainda não finalizaram neste ${escopo === 'projeto' ? 'projeto' : 'produto'}?`
      )
    ) {
      return;
    }
    setEnviandoLote(true);
    setErro(null);
    setUltimoLote(null);
    try {
      const res =
        escopo === 'projeto'
          ? await projetosApi.enviarLembreteAvaliadoresLote(pid, {
              nivelPrioridadeMapeamentoMaturidade: filtroNivelMapeamentoMaturidade
            })
          : await produtosApi.enviarLembreteAvaliadoresLote(pid);
      setUltimoLote(res);
      const simulado = res?.detalhes?.some((d) => d.ok && d.email?.simulado);
      toast.success(
        `Lote: ${res.enviados}/${res.total} enviados.${res.falhas > 0 ? ` Falhas: ${res.falhas}.` : ''}${
          simulado ? ' (Alguns simulados — veja configuração de e-mail no servidor.)' : ''
        }`
      );
      setLoteHabilitado(false);
      await carregarStatus();
      if (logsAberto) await carregarLogs();
    } catch (e) {
      setErro(e.message);
      toast.error(e.message);
    } finally {
      setEnviandoLote(false);
    }
  }

  if (isAvaliador()) {
    return <Navigate to="/" replace />;
  }

  if (loadingLista) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-8 h-8 text-primary-600" />
          Acompanhamento de avaliadores
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Maturidade (projeto) ou Produto IA-First: progresso, lembrete individual ou em lote, e histórico de
          envios.
        </p>
        {escopo === 'projeto' && data?.projetoVersao && (
          <p className="mt-2 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
            Versão da pesquisa: {data.projetoVersao.titulo} · {data.projetoVersao.status}
          </p>
        )}
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEscopo('projeto');
              setProdutoId('');
              setData(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              escopo === 'projeto'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Projeto (maturidade)
          </button>
          <button
            type="button"
            onClick={() => {
              setEscopo('produto');
              setData(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1 ${
              escopo === 'produto'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Package className="w-4 h-4" />
            Produto IA-First
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Building2 className="w-4 h-4 inline mr-1" />
              Empresa
            </label>
            {isAdmin() ? (
              <select
                className="input w-full"
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
              >
                <option value="">Selecione…</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
            ) : (
              <div className="py-2 text-gray-800 dark:text-gray-200 font-medium">
                {empresas.find((e) => Number(e.id) === Number(usuario?.empresaId))?.nome || '—'}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FolderKanban className="w-4 h-4 inline mr-1" />
              Projeto
            </label>
            <select
              className="input w-full"
              value={projetoId}
              onChange={(e) => setProjetoId(e.target.value)}
              disabled={!empresaId}
            >
              <option value="">Selecione…</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {escopo === 'projeto' && projetoId && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filtro de prioridade (maturidade)
            </label>
            <select
              className="input max-w-xl"
              value={filtroNivelMapeamentoMaturidade}
              onChange={(e) => setFiltroNivelMapeamentoMaturidade(parseInt(e.target.value, 10))}
            >
              <option value={0}>Todos (sem filtro por prioridade do usuário)</option>
              <option value={1}>Até prioridade 1 (somente nível 1)</option>
              <option value={2}>Até prioridade 2 (níveis 1 e 2)</option>
              <option value={3}>Até prioridade 3 (níveis 1, 2 e 3)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              &quot;Todos&quot; lista todos os convites e avaliações do projeto. Nos demais, só entram avaliadores
              com nível de prioridade cadastrado até o limite escolhido. O lembrete em lote segue o mesmo filtro.
            </p>
          </div>
        )}

        {escopo === 'produto' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Package className="w-4 h-4 inline mr-1" />
              Produto
            </label>
            <select
              className="input w-full max-w-xl"
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              disabled={!projetoId}
            >
              <option value="">Selecione…</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {selecionadoId && data && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-800 dark:text-slate-200">
            <span className="font-medium">Resumo: </span>
            {finalizadas} de {totalLinhas} avaliador(es) com avaliação finalizada ·{' '}
            {pendentesLembrete} pendente(s) de lembrete
            {escopo === 'projeto' && (
              <>
                {' · '}
                <span className={alertasQualidade > 0 ? 'text-amber-700 dark:text-amber-300 font-medium' : ''}>
                  {alertasQualidade} alerta(s) de qualidade em {avaliadoresComAlerta} avaliador(es)
                </span>
              </>
            )}
            {escopo === 'projeto' ? (
              <>
                {' · '}
                <Link
                  to={`/projetos/${projetoId}`}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Abrir projeto
                </Link>
              </>
            ) : (
              <>
                {' · '}
                <Link
                  to={`/produtos/${produtoId}`}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Abrir produto
                </Link>
              </>
            )}
          </div>
        )}

        {escopo === 'projeto' && projetoId && (
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-900/60 dark:bg-primary-950/30">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                  <FileText className="h-5 w-5 text-primary-600" />
                  Relatório: avaliador x dimensões avaliadas
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Gere uma visão simples mostrando quais dimensões cada avaliador avaliou neste projeto.
                </p>
              </div>
              <button
                type="button"
                onClick={carregarRelatorioDimensoes}
                disabled={!projetoId || loadingRelatorioDimensoes}
                className="btn btn-primary inline-flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {loadingRelatorioDimensoes ? 'Gerando relatório…' : 'Gerar relatório'}
              </button>
            </div>
          </div>
        )}

        {selecionadoId && data && escopo === 'projeto' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <button
              type="button"
              onClick={() => setFiltroStatus('nao_abriu')}
              className={`rounded-xl border p-4 text-left transition ${
                filtroStatus === 'nao_abriu'
                  ? 'border-slate-400 bg-slate-100 dark:bg-slate-900/40'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50'
              }`}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">Ainda não abriu</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {(data.avaliadores || []).filter((r) => r.conviteLink && !r.abriuConvite && !r.iniciouAvaliacao).length}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                link enviado, sem abertura registrada
              </p>
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('abriu_sem_iniciar')}
              className={`rounded-xl border p-4 text-left transition ${
                filtroStatus === 'abriu_sem_iniciar'
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50'
              }`}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">Abriu sem iniciar</p>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                {(data.avaliadores || []).filter((r) => r.etapaConvite === 'abriu_sem_iniciar').length}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                precisa de reforço direcionado
              </p>
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('em_andamento')}
              className={`rounded-xl border p-4 text-left transition ${
                filtroStatus === 'em_andamento'
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50'
              }`}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">Iniciou avaliação</p>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {resumoOperacional.avaliacoesIniciadas ?? 0}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                link aberto com sessão criada
              </p>
            </button>
          </div>
        )}

        {selecionadoId && data && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <button
              type="button"
              onClick={() => setFiltroStatus('todos')}
              className={`rounded-xl border p-4 text-left transition ${
                filtroStatus === 'todos'
                  ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/30'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50'
              }`}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{resumoOperacional.total ?? totalLinhas}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">avaliadores</p>
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('finalizada')}
              className={`rounded-xl border p-4 text-left transition ${
                filtroStatus === 'finalizada'
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50'
              }`}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">Conclusão</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{resumoOperacional.taxaConclusao ?? 0}%</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{resumoOperacional.finalizadas ?? finalizadas} finalizados</p>
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('em_andamento')}
              className={`rounded-xl border p-4 text-left transition ${
                filtroStatus === 'em_andamento'
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50'
              }`}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">Em andamento</p>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{resumoOperacional.emAndamento ?? 0}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{resumoOperacional.progressoMedio ?? 0}% médio</p>
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('lembrete')}
              className={`rounded-xl border p-4 text-left transition ${
                filtroStatus === 'lembrete'
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50'
              }`}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">Ação necessária</p>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{resumoOperacional.pendentesLembrete ?? pendentesLembrete}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">podem receber lembrete</p>
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('alertas')}
              className={`rounded-xl border p-4 text-left transition ${
                filtroStatus === 'alertas'
                  ? 'border-red-400 bg-red-50 dark:bg-red-950/30'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50'
              }`}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">Qualidade</p>
              <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{avaliadoresComAlerta}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{alertasQualidade} alerta(s)</p>
            </button>
          </div>
        )}

        {selecionadoId && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <label className="flex items-start gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={loteHabilitado}
                onChange={(e) => setLoteHabilitado(e.target.checked)}
              />
              <span>
                Permitir envio em lote: mesmo e-mail de lembrete para{' '}
                <strong>todos os avaliadores pendentes</strong> ({pendentesLembrete}).
              </span>
            </label>
            <div className="flex flex-wrap gap-2 justify-end shrink-0">
              <button
                type="button"
                onClick={() => setLogsAberto((v) => !v)}
                className="btn btn-secondary inline-flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                {logsAberto ? 'Ocultar histórico' : 'Histórico de lembretes'}
              </button>
              <button
                type="button"
                onClick={() => carregarStatus()}
                disabled={loadingStatus || enviandoLote}
                className="btn btn-secondary inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                type="button"
                onClick={handleLembreteLote}
                disabled={
                  !loteHabilitado || pendentesLembrete === 0 || loadingStatus || enviandoLote
                }
                className="btn btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                title={
                  !loteHabilitado
                    ? 'Marque a opção acima para habilitar o envio em lote'
                    : pendentesLembrete === 0
                      ? 'Nenhum avaliador pendente'
                      : `Enviar lembrete a ${pendentesLembrete} avaliador(es)`
                }
              >
                <Send className="w-4 h-4" />
                {enviandoLote ? 'Enviando…' : `Lembrete em lote (${pendentesLembrete})`}
              </button>
            </div>
          </div>
        )}
      </div>

      {relatorioDimensoesAberto && relatorioDimensoes && (
        <div className="card p-5 space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <FileText className="w-5 h-5 text-primary-600" />
                Relatório de dimensões por avaliador
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {relatorioDimensoes.projeto?.nome} · {relatorioDimensoes.empresa?.nome}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Filtro de prioridade aplicado:{' '}
                {relatorioDimensoes.filtroNivelPrioridadeMapeamentoMaturidadeAplicado == null ||
                relatorioDimensoes.filtroNivelPrioridadeMapeamentoMaturidadeAplicado === 0
                  ? 'Todos'
                  : `Até prioridade ${relatorioDimensoes.filtroNivelPrioridadeMapeamentoMaturidadeAplicado}`}
                {relatorioDimensoes.projetoVersao?.titulo
                  ? ` · Versão: ${relatorioDimensoes.projetoVersao.titulo}`
                  : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportarRelatorioDimensoesCsv}
                className="btn btn-secondary inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary inline-flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir/PDF
              </button>
              <button
                type="button"
                onClick={() => setRelatorioDimensoesAberto(false)}
                className="btn btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 pr-4 font-medium">Avaliador</th>
                  <th className="pb-3 pr-4 font-medium">Data da avaliação final</th>
                  <th className="pb-3 font-medium">Dimensões avaliadas</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {(relatorioDimensoes.avaliadores || []).map((avaliador) => {
                  const avaliadas = avaliador.dimensoesAvaliadasNomes || [];

                  return (
                    <tr key={avaliador.usuarioId} className="align-top hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="py-4 pr-4">
                        <div className="font-medium text-gray-900 dark:text-white">{avaliador.nome}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{avaliador.email}</div>
                        {avaliador.cargo && (
                          <div className="text-xs text-gray-400">{avaliador.cargo}</div>
                        )}
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          avaliador.dataAvaliacaoFinal
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-100'
                        }`}>
                          {avaliador.dataAvaliacaoFinal
                            ? new Date(avaliador.dataAvaliacaoFinal).toLocaleDateString('pt-BR')
                            : 'Não finalizada'}
                        </span>
                      </td>
                      <td className="py-4">
                        {avaliadas.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {avaliadas.map((nome) => (
                              <span
                                key={nome}
                                className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/50 dark:text-green-100"
                              >
                                {nome}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Nenhuma dimensão avaliada</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(relatorioDimensoes.avaliadores || []).length === 0 && (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Nenhum avaliador encontrado para este projeto.
            </div>
          )}
        </div>
      )}

      {logsAberto && selecionadoId && (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico de lembretes
          </h3>
          {loadingLogs ? (
            <div className="py-8 text-center text-gray-500">Carregando…</div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-500 mt-2">Nenhum registro ainda.</p>
          ) : (
            <ul className="mt-3 divide-y dark:divide-gray-700 max-h-64 overflow-y-auto text-sm">
              {logs.map((log) => (
                <li key={log.id} className="py-2 flex flex-wrap gap-x-3 gap-y-1">
                  <span className="text-gray-500">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </span>
                  <span className={log.sucesso ? 'text-emerald-600' : 'text-red-600'}>
                    {log.sucesso ? 'OK' : 'Falha'}
                  </span>
                  <span>{log.destinatarioNome}</span>
                  <span className="text-gray-500">{log.destinatarioEmail}</span>
                  <span className="text-gray-500">modo: {log.modo}</span>
                  {log.emailSimulado && <span className="text-amber-600">simulado</span>}
                  {log.erro && <span className="text-red-600 break-all">{log.erro}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {ultimoLote?.detalhes?.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Último envio em lote</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Enviados: {ultimoLote.enviados} / {ultimoLote.total} · Falhas: {ultimoLote.falhas}
          </p>
          <ul className="text-sm max-h-48 overflow-y-auto space-y-1">
            {ultimoLote.detalhes.map((d) => (
              <li key={d.usuarioId} className="flex gap-2">
                <span className={d.ok ? 'text-emerald-600' : 'text-red-600'}>{d.ok ? '✓' : '✗'}</span>
                <span>usuário #{d.usuarioId}</span>
                {!d.ok && d.error && (
                  <span className="text-red-600 break-all">{d.error}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {erro && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {selecionadoId && (
        <div className="card overflow-hidden p-0">
          {loadingStatus ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
          ) : !data?.avaliadores?.length ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Nenhum convite ou avaliação encontrada. Envie convites pelo fluxo do{' '}
              {escopo === 'projeto' ? 'projeto' : 'produto'}.
            </div>
          ) : avaliadoresFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Nenhum avaliador encontrado para o filtro selecionado.
              <button
                type="button"
                onClick={() => setFiltroStatus('todos')}
                className="ml-2 text-primary-600 hover:underline dark:text-primary-400"
              >
                Ver todos
              </button>
            </div>
          ) : (
            <>
            <div className="space-y-3 p-4 md:hidden">
              {avaliadoresFiltrados.map((row) => (
                <div key={row.usuarioId} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white">{row.nome}</div>
                      <div className="truncate text-sm text-gray-500 dark:text-gray-400">{row.email}</div>
                      {row.cargo && <div className="mt-0.5 text-xs text-gray-400">{row.cargo}</div>}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Prioridade</div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {row.nivelPrioridadeMapeamentoMaturidade ?? '—'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                      <div className="font-medium text-gray-800 dark:text-gray-100">
                        {STATUS_LABEL[row.statusFormulario] || row.statusFormulario}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {ETAPA_LABEL[row.etapaConvite] || row.etapaConvite || '—'}
                        {row.dimensaoAtual ? ` · Parou em: ${row.dimensaoAtual}` : ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Atualizado</div>
                      <div className="font-medium text-gray-800 dark:text-gray-100">
                        {formatDataCurta(row.atualizadoEm)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                        <div
                          className="h-full rounded-full bg-primary-600 transition-all"
                          style={{ width: `${Math.min(100, row.percentual)}%` }}
                        />
                      </div>
                      <span className="text-sm tabular-nums text-gray-700 dark:text-gray-300">{row.percentual}%</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {row.respondidas}/{row.totalPerguntas} perguntas
                    </div>
                  </div>

                  {escopo === 'projeto' && (
                    <div className="mt-3 space-y-2">
                      <AlertasQualidade row={row} />
                      {row.auditoria?.length > 0 && (
                        <details className="text-xs text-gray-500 dark:text-gray-400">
                          <summary className="cursor-pointer hover:underline">Trilha recente</summary>
                          <ul className="mt-2 space-y-1">
                            {row.auditoria.slice(0, 4).map((evento) => (
                              <li key={evento.id}>
                                {formatDataCurta(evento.createdAt)} · {EVENTO_LABEL[evento.tipo] || evento.tipo}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                      {row.dimensoesConvite?.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Dimensões: {row.dimensoesConvite.map((d) => d.nome).join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {row.conviteLink && (
                      <button
                        type="button"
                        onClick={() => handleCopiarLink(row)}
                        className="btn btn-secondary btn-sm inline-flex flex-1 items-center justify-center gap-1"
                      >
                        <Copy className="h-4 w-4" />
                        Copiar link
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!row.podeLembrar || enviandoId === row.usuarioId || enviandoLote}
                      onClick={() => handleLembrete(row.usuarioId)}
                      className="btn btn-primary btn-sm inline-flex flex-1 items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Mail className="h-4 w-4" />
                      {enviandoId === row.usuarioId ? 'Enviando…' : labelAcaoLembrete(row)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                    <th className="px-6 py-3 font-medium">Avaliador</th>
                    <th className="px-6 py-3 font-medium">Prioridade</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Qualidade</th>
                    <th className="px-6 py-3 font-medium w-48">Progresso</th>
                    <th className="px-6 py-3 font-medium">Dimensões</th>
                    <th className="px-6 py-3 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {avaliadoresFiltrados.map((row) => (
                    <tr key={row.usuarioId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{row.nome}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{row.email}</div>
                        {row.cargo && (
                          <div className="text-xs text-gray-400 mt-0.5">{row.cargo}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                        {row.nivelPrioridadeMapeamentoMaturidade ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {STATUS_LABEL[row.statusFormulario] || row.statusFormulario}
                        <div className="mt-1 text-xs text-gray-400">
                          Atualizado: {formatDataCurta(row.atualizadoEm)}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Etapa: {ETAPA_LABEL[row.etapaConvite] || row.etapaConvite || '—'}
                          {row.dimensaoAtual ? ` · Parou em: ${row.dimensaoAtual}` : ''}
                        </div>
                        {row.minutosAteConclusao != null && (
                          <div className="mt-1 text-xs text-gray-400">
                            Duração: {row.minutosAteConclusao} min
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <AlertasQualidade row={row} />
                        {row.auditoria?.length > 0 && (
                          <details className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <summary className="cursor-pointer hover:underline">Trilha</summary>
                            <ul className="mt-2 space-y-1">
                              {row.auditoria.slice(0, 4).map((evento) => (
                                <li key={evento.id}>
                                  {formatDataCurta(evento.createdAt)} · {EVENTO_LABEL[evento.tipo] || evento.tipo}
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden min-w-[80px]">
                            <div
                              className="h-full bg-primary-600 rounded-full transition-all"
                              style={{ width: `${Math.min(100, row.percentual)}%` }}
                            />
                          </div>
                          <span className="text-sm tabular-nums text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {row.percentual}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {row.respondidas}/{row.totalPerguntas} perguntas
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs">
                        {row.dimensoesConvite?.length > 0 ? (
                          <div className="space-y-1">
                            <div className="line-clamp-2">
                              {row.dimensoesConvite.map((d) => d.nome).join(', ')}
                            </div>
                            {row.conviteLink && (
                              <button
                                type="button"
                                onClick={() => handleCopiarLink(row)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Copiar link filtrado
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Todas</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          disabled={
                            !row.podeLembrar || enviandoId === row.usuarioId || enviandoLote
                          }
                          onClick={() => handleLembrete(row.usuarioId)}
                          className="btn btn-primary btn-sm inline-flex items-center gap-1 disabled:opacity-50"
                          title={
                            row.podeLembrar
                              ? 'Enviar e-mail de lembrete'
                              : 'Avaliação finalizada ou sem convite válido'
                          }
                        >
                          <Mail className="w-4 h-4" />
                          {enviandoId === row.usuarioId ? 'Enviando…' : labelAcaoLembrete(row)}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

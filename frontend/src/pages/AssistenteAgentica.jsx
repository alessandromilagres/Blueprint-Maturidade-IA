import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Send,
  Loader2,
  Trash2,
  Sparkles,
  FolderKanban,
  User,
  Plus,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { assistenteApi, projetosApi } from '../services/api';
import MarkdownRenderer from '../components/MarkdownRenderer';

const SUGESTOES = [
  'Como fechar uma versão de projeto?',
  'Qual a diferença entre Blueprint 16 e SATF TI v3?',
  'O que é a dimensão D8 no SATF?',
  'Como cadastrar o glossário de fatos canônicos?',
  'Como gerar o book por unidade organizacional?'
];

const MODOS_DEFAULT = [
  { id: 'auto', label: 'Automático' },
  { id: 'sistema', label: 'Como usar' },
  { id: 'metodologia', label: 'Metodologia' },
  { id: 'projeto', label: 'Este projeto' },
  { id: 'book', label: 'Deste book' }
];

function Bolha({
  role,
  content,
  fontes,
  acoes,
  mensagemId,
  conversaId,
  feedbackEstado,
  onFeedback
}) {
  const ehUser = role === 'user';
  const [motivoAberto, setMotivoAberto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [enviandoFb, setEnviandoFb] = useState(false);

  async function enviarFeedback(util, comMotivo = false) {
    if (!mensagemId || !onFeedback || enviandoFb) return;
    if (!util && comMotivo && !motivo.trim()) {
      setMotivoAberto(true);
      return;
    }
    setEnviandoFb(true);
    try {
      await onFeedback({
        mensagemId,
        conversaId,
        util,
        motivo: util ? null : motivo.trim() || null
      });
      setMotivoAberto(false);
    } finally {
      setEnviandoFb(false);
    }
  }

  return (
    <div className={`flex gap-3 ${ehUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          ehUser
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-cyan-300 dark:bg-slate-700'
        }`}
      >
        {ehUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          ehUser
            ? 'bg-blue-600 text-white'
            : 'border border-slate-200 bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
        }`}
      >
        {ehUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <>
            <div className="prose-sm max-w-none dark:prose-invert">
              <MarkdownRenderer content={content || '…'} className="text-sm" />
            </div>

            {Array.isArray(acoes) && acoes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                {acoes.map((a) => (
                  <Link
                    key={a.id}
                    to={a.to}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-[11px] font-medium text-cyan-900 transition-colors hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-100 dark:hover:bg-cyan-900/60"
                  >
                    <ExternalLink className="h-3 w-3 opacity-70" />
                    {a.label}
                  </Link>
                ))}
              </div>
            )}

            {Array.isArray(fontes) && fontes.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-700">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Fontes
                </p>
                <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {fontes.slice(0, 6).map((f, i) => (
                    <li key={`${f.titulo}-${i}`} className="flex flex-wrap items-baseline gap-x-1">
                      {f.to ? (
                        <Link
                          to={f.to}
                          className="font-medium text-cyan-700 underline-offset-2 hover:underline dark:text-cyan-300"
                        >
                          {f.titulo}
                        </Link>
                      ) : (
                        <span>{f.titulo}</span>
                      )}
                      {f.fonte ? <span className="opacity-60">· {f.fonte}</span> : null}
                      {f.relatorioId != null ? (
                        <span className="opacity-60">· #{f.relatorioId}</span>
                      ) : null}
                      {f.toLabel ? (
                        <span className="opacity-50">({f.toLabel})</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {mensagemId && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-700">
                <span className="text-[10px] uppercase tracking-wide text-slate-400">Útil?</span>
                <button
                  type="button"
                  disabled={enviandoFb || feedbackEstado === 'up'}
                  onClick={() => enviarFeedback(true)}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] ${
                    feedbackEstado === 'up'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title="Resposta útil"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={enviandoFb || feedbackEstado === 'down'}
                  onClick={() => {
                    if (feedbackEstado === 'down') return;
                    setMotivoAberto(true);
                  }}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] ${
                    feedbackEstado === 'down'
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title="Pode melhorar"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
                {motivoAberto && feedbackEstado !== 'down' && (
                  <div className="mt-1 flex w-full flex-col gap-1.5 sm:flex-row sm:items-center">
                    <input
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="O que faltou? (opcional)"
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
                    />
                    <button
                      type="button"
                      disabled={enviandoFb}
                      onClick={() => enviarFeedback(false, true)}
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-white dark:bg-slate-200 dark:text-slate-900"
                    >
                      Enviar
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AssistenteAgentica() {
  const [projetos, setProjetos] = useState([]);
  const [projetoId, setProjetoId] = useState('');
  const [conversaId, setConversaId] = useState(null);
  const [conversas, setConversas] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [modoRetrieval, setModoRetrieval] = useState('');
  const [modoPergunta, setModoPergunta] = useState('auto');
  const [modos, setModos] = useState(MODOS_DEFAULT);
  const fimRef = useRef(null);
  const inputRef = useRef(null);

  const carregarListaConversas = useCallback(async () => {
    try {
      const res = await assistenteApi.listarConversas();
      setConversas(res.conversas || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const lista = await projetosApi.listar();
        if (!cancel) setProjetos(Array.isArray(lista) ? lista : []);
      } catch {
        if (!cancel) setProjetos([]);
      }
      try {
        const m = await assistenteApi.listarModos();
        if (!cancel && Array.isArray(m.modos) && m.modos.length) setModos(m.modos);
      } catch {
        /* keep defaults */
      }
      if (!cancel) await carregarListaConversas();
    })();
    return () => {
      cancel = true;
    };
  }, [carregarListaConversas]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, enviando]);

  async function abrirConversa(id) {
    setErro('');
    try {
      const res = await assistenteApi.obterConversa(id);
      const c = res.conversa;
      setConversaId(c.id);
      setProjetoId(c.projetoId ? String(c.projetoId) : '');
      setMensagens(
        (c.mensagens || []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          fontes: m.fontes || null,
          acoes: m.acoes || null,
          feedbackEstado: null
        }))
      );
    } catch (e) {
      setErro(e.message || 'Não foi possível abrir a conversa');
    }
  }

  function novaConversa() {
    setConversaId(null);
    setMensagens([]);
    setErro('');
    setModoRetrieval('');
    inputRef.current?.focus();
  }

  async function excluirConversaAtual(id) {
    const target = id || conversaId;
    if (!target) return;
    try {
      await assistenteApi.excluirConversa(target);
      if (Number(conversaId) === Number(target)) novaConversa();
      await carregarListaConversas();
    } catch (e) {
      setErro(e.message || 'Falha ao excluir');
    }
  }

  const registrarFeedback = useCallback(
    async ({ mensagemId, util, motivo, conversaId: cid }) => {
      await assistenteApi.feedback({
        mensagemId,
        util,
        motivo,
        conversaId: cid || conversaId
      });
      setMensagens((prev) =>
        prev.map((m) =>
          m.id === mensagemId
            ? { ...m, feedbackEstado: util ? 'up' : 'down' }
            : m
        )
      );
    },
    [conversaId]
  );

  const enviar = useCallback(
    async (textoLivre) => {
      const texto = String(textoLivre ?? input).trim();
      if (!texto || enviando) return;

      setErro('');
      setInput('');
      const novas = [...mensagens, { role: 'user', content: texto }];
      setMensagens(novas);
      setEnviando(true);
      setMensagens([
        ...novas,
        { role: 'assistant', content: '', fontes: null, acoes: null, id: null }
      ]);

      try {
        await assistenteApi.chatStream(
          {
            mensagem: texto,
            conversaId,
            projetoId: projetoId ? Number(projetoId) : null,
            modoPergunta
          },
          {
            onStart: (data) => {
              if (data.conversaId) setConversaId(data.conversaId);
              if (data.modoRetrieval) setModoRetrieval(data.modoRetrieval);
              if (data.fontes) {
                setMensagens((prev) => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last?.role === 'assistant') {
                    copy[copy.length - 1] = { ...last, fontes: data.fontes };
                  }
                  return copy;
                });
              }
            },
            onToken: (tokenText) => {
              setMensagens((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') {
                  copy[copy.length - 1] = {
                    ...last,
                    content: (last.content || '') + tokenText
                  };
                }
                return copy;
              });
            },
            onDone: (data) => {
              if (data.conversaId) setConversaId(data.conversaId);
              setMensagens((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') {
                  copy[copy.length - 1] = {
                    ...last,
                    id: data.mensagemId || last.id,
                    content: data.resposta || last.content,
                    fontes: data.fontes || last.fontes,
                    acoes: data.acoes || last.acoes || null
                  };
                }
                return copy;
              });
              carregarListaConversas();
            },
            onError: (msg) => {
              setErro(msg);
              setMensagens((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant' && !last.content) {
                  copy[copy.length - 1] = {
                    role: 'assistant',
                    content:
                      'Não consegui responder agora. Verifique Configurações → IA e tente de novo.'
                  };
                }
                return copy;
              });
            }
          }
        );
      } catch (e) {
        setErro(e.message || 'Falha ao consultar o assistente');
      } finally {
        setEnviando(false);
        inputRef.current?.focus();
      }
    },
    [
      carregarListaConversas,
      conversaId,
      enviando,
      input,
      mensagens,
      modoPergunta,
      projetoId
    ]
  );

  return (
    <div className="mx-auto flex h-[calc(100vh-5.5rem)] max-w-6xl gap-4 p-4 sm:p-6">
      <aside className="hidden w-56 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 sm:flex">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5 dark:border-slate-700">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Conversas</span>
          <button
            type="button"
            onClick={novaConversa}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Nova conversa"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversas.length === 0 && (
            <p className="px-2 py-4 text-center text-[11px] text-slate-400">Nenhuma conversa ainda</p>
          )}
          {conversas.map((c) => (
            <div
              key={c.id}
              className={`group mb-1 flex items-start gap-1 rounded-lg ${
                Number(conversaId) === Number(c.id)
                  ? 'bg-cyan-50 dark:bg-cyan-950/40'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => abrirConversa(c.id)}
                className="min-w-0 flex-1 px-2 py-2 text-left"
              >
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-800 dark:text-slate-100">
                  <MessageSquare className="h-3 w-3 shrink-0 opacity-50" />
                  <span className="truncate">{c.titulo}</span>
                </div>
                <div className="mt-0.5 truncate text-[10px] text-slate-400">
                  {c.qtdMensagens || 0} msgs
                </div>
              </button>
              <button
                type="button"
                onClick={() => excluirConversaAtual(c.id)}
                className="mr-1 mt-2 hidden rounded p-1 text-slate-400 hover:text-red-500 group-hover:block"
                title="Excluir"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="shrink-0 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-white">
                <Sparkles className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                Assistente Agentica
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Fontes clicáveis · modos de busca · feedback
                {modoRetrieval ? ` · ${modoRetrieval}` : ''}
                {conversaId ? ` · #${conversaId}` : ''}
              </p>
            </div>
            <div className="flex gap-2 sm:hidden">
              <button
                type="button"
                onClick={novaConversa}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-600"
              >
                <Plus className="h-3.5 w-3.5" /> Nova
              </button>
            </div>
          </div>

          <label className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <FolderKanban className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="shrink-0">Projeto:</span>
            <select
              value={projetoId}
              onChange={(e) => setProjetoId(e.target.value)}
              className="min-w-[14rem] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Sem projeto — só base global</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.empresa?.nome ? `${p.empresa.nome} — ` : ''}
                  {p.nome}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-1.5">
            {modos.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModoPergunta(m.id)}
                title={m.descricao || m.label}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  modoPergunta === m.id
                    ? 'bg-cyan-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-cyan-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
            {mensagens.length === 0 && !enviando && (
              <div className="space-y-4 py-6 text-center">
                <Bot className="mx-auto h-10 w-10 text-slate-400" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Escolha um modo acima e pergunte. As fontes viram links para a tela ou o book.
                </p>
                <div className="mx-auto flex max-w-xl flex-wrap justify-center gap-2">
                  {SUGESTOES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => enviar(s)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs text-slate-700 hover:border-cyan-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {s}
                      <ChevronRight className="ml-1 inline h-3 w-3 opacity-40" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensagens.map((m, i) => (
              <Bolha
                key={`${m.role}-${m.id || i}`}
                role={m.role}
                content={m.content}
                fontes={m.fontes}
                acoes={m.acoes}
                mensagemId={m.role === 'assistant' ? m.id : null}
                conversaId={conversaId}
                feedbackEstado={m.feedbackEstado}
                onFeedback={registrarFeedback}
              />
            ))}

            {enviando && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando fontes ({modoPergunta}) e gerando resposta…
              </div>
            )}
            <div ref={fimRef} />
          </div>

          {erro && (
            <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {erro}
            </div>
          )}

          <form
            className="flex gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
            onSubmit={(e) => {
              e.preventDefault();
              enviar();
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviar();
                }
              }}
              rows={2}
              placeholder="Pergunte sobre o Agentica, Blueprint, SATF ou o projeto…"
              disabled={enviando}
              className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={enviando || !input.trim()}
              className="inline-flex items-center justify-center gap-1.5 self-end rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-40"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

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
  ThumbsDown,
  Square,
  Paperclip,
  Search,
  X
} from 'lucide-react';
import { assistenteApi, projetosApi, empresaUnidadesApi } from '../services/api';
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

const TOMS = [
  { id: 'curto', label: 'Tom curto' },
  { id: 'medio', label: 'Tom médio' },
  { id: 'longo', label: 'Tom longo' }
];

const FRAMEWORKS_PREF = [
  { id: '', label: 'Framework: automático' },
  { id: 'blueprint16', label: 'Pref. Blueprint 16' },
  { id: 'satf', label: 'Pref. SATF' }
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
  const [unidades, setUnidades] = useState([]);
  const [empresaUnidadeId, setEmpresaUnidadeId] = useState('');
  const [tom, setTom] = useState('medio');
  const [frameworkFavorito, setFrameworkFavorito] = useState('');
  const [prefsCarregadas, setPrefsCarregadas] = useState(false);
  const [conversaId, setConversaId] = useState(null);
  const [conversas, setConversas] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [modoRetrieval, setModoRetrieval] = useState('');
  const [modoPergunta, setModoPergunta] = useState('auto');
  const [modos, setModos] = useState(MODOS_DEFAULT);
  const [buscaConversas, setBuscaConversas] = useState('');
  const [anexo, setAnexo] = useState(null);
  const [anexoErro, setAnexoErro] = useState('');
  const fimRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const salvarPrefsTimer = useRef(null);
  const salvarFiltrosTimer = useRef(null);
  const abortRef = useRef(null);
  const buscaTimer = useRef(null);
  const conversaIdRef = useRef(null);
  const prefsPadraoRef = useRef({
    projetoPadraoId: null,
    unidadePadraoId: null,
    tom: 'medio',
    frameworkFavorito: ''
  });
  const filtrosAtuaisRef = useRef({
    projetoId: '',
    empresaUnidadeId: '',
    modoPergunta: 'auto',
    tom: 'medio',
    frameworkFavorito: ''
  });

  conversaIdRef.current = conversaId;
  filtrosAtuaisRef.current = {
    projetoId,
    empresaUnidadeId,
    modoPergunta,
    tom,
    frameworkFavorito
  };

  const carregarListaConversas = useCallback(async (q = '') => {
    try {
      const res = await assistenteApi.listarConversas(q ? { q } : {});
      setConversas(res.conversas || []);
    } catch {
      /* ignore */
    }
  }, []);

  const persistirPreferencias = useCallback((patch) => {
    if (salvarPrefsTimer.current) clearTimeout(salvarPrefsTimer.current);
    salvarPrefsTimer.current = setTimeout(() => {
      assistenteApi.salvarPreferencias(patch).catch(() => {});
    }, 400);
  }, []);

  /** Persiste filtros na conversa aberta (não altera preferências padrão). */
  const persistirFiltrosConversa = useCallback((patch = {}) => {
    const cid = conversaIdRef.current;
    if (!cid) return;
    if (salvarFiltrosTimer.current) clearTimeout(salvarFiltrosTimer.current);
    salvarFiltrosTimer.current = setTimeout(() => {
      const snap = { ...filtrosAtuaisRef.current, ...patch };
      assistenteApi
        .atualizarFiltrosConversa(cid, {
          projetoId: snap.projetoId ? Number(snap.projetoId) : null,
          empresaUnidadeId: snap.empresaUnidadeId ? Number(snap.empresaUnidadeId) : null,
          modoPergunta: snap.modoPergunta || 'auto',
          tom: snap.tom || 'medio',
          frameworkFavorito: snap.frameworkFavorito || null
        })
        .catch(() => {});
    }, 350);
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
      try {
        const prefRes = await assistenteApi.obterPreferencias();
        const p = prefRes.preferencias || {};
        if (!cancel) {
          prefsPadraoRef.current = {
            projetoPadraoId: p.projetoPadraoId || null,
            unidadePadraoId: p.unidadePadraoId || null,
            tom: p.tom || 'medio',
            frameworkFavorito: p.frameworkFavorito || ''
          };
          if (p.projetoPadraoId) setProjetoId(String(p.projetoPadraoId));
          if (p.unidadePadraoId) setEmpresaUnidadeId(String(p.unidadePadraoId));
          if (p.tom) setTom(p.tom);
          if (p.frameworkFavorito) setFrameworkFavorito(p.frameworkFavorito);
          setPrefsCarregadas(true);
        }
      } catch {
        if (!cancel) setPrefsCarregadas(true);
      }
      if (!cancel) await carregarListaConversas();
    })();
    return () => {
      cancel = true;
      if (salvarPrefsTimer.current) clearTimeout(salvarPrefsTimer.current);
      if (salvarFiltrosTimer.current) clearTimeout(salvarFiltrosTimer.current);
    };
  }, [carregarListaConversas]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!projetoId) {
        setUnidades([]);
        return;
      }
      const proj = projetos.find((p) => String(p.id) === String(projetoId));
      const empresaId = proj?.empresaId || proj?.empresa?.id;
      if (!empresaId) {
        setUnidades([]);
        return;
      }
      try {
        const lista = await empresaUnidadesApi.listar(empresaId);
        if (cancel) return;
        const arr = Array.isArray(lista) ? lista : [];
        setUnidades(arr);
        setEmpresaUnidadeId((atual) => {
          if (!atual) return atual;
          return arr.some((u) => String(u.id) === String(atual)) ? atual : '';
        });
      } catch {
        if (!cancel) setUnidades([]);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [projetoId, projetos]);

  useEffect(() => {
    if (buscaTimer.current) clearTimeout(buscaTimer.current);
    buscaTimer.current = setTimeout(() => {
      carregarListaConversas(buscaConversas.trim());
    }, 280);
    return () => {
      if (buscaTimer.current) clearTimeout(buscaTimer.current);
    };
  }, [buscaConversas, carregarListaConversas]);

  async function lerArquivoComoAnexo(file) {
    if (!file) return;
    setAnexoErro('');
    const nome = file.name || 'anexo';
    const ext = nome.toLowerCase().split('.').pop();
    const ok = ['pdf', 'md', 'txt', 'markdown', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    if (!ok) {
      setAnexoErro('Use PDF, imagem (JPG/PNG/GIF/WebP), Markdown (.md) ou texto (.txt).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAnexoErro('Arquivo muito grande (máx. 5 MB).');
      return;
    }
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = String(reader.result || '');
        const b64 = raw.includes(',') ? raw.split(',')[1] : raw;
        resolve(b64);
      };
      reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
      reader.readAsDataURL(file);
    });
    setAnexo({
      nomeOriginal: nome,
      mimeType: file.type || '',
      arquivo: base64,
      tamanho: file.size
    });
  }

  function onChangeProjeto(valor) {
    setProjetoId(valor);
    setEmpresaUnidadeId('');
    if (!prefsCarregadas) return;
    if (conversaIdRef.current) {
      persistirFiltrosConversa({ projetoId: valor, empresaUnidadeId: '' });
      return;
    }
    prefsPadraoRef.current = {
      ...prefsPadraoRef.current,
      projetoPadraoId: valor ? Number(valor) : null,
      unidadePadraoId: null
    };
    persistirPreferencias({
      projetoPadraoId: valor ? Number(valor) : null,
      unidadePadraoId: null
    });
  }

  function onChangeUnidade(valor) {
    setEmpresaUnidadeId(valor);
    if (!prefsCarregadas) return;
    if (conversaIdRef.current) {
      persistirFiltrosConversa({ empresaUnidadeId: valor });
      return;
    }
    prefsPadraoRef.current = {
      ...prefsPadraoRef.current,
      unidadePadraoId: valor ? Number(valor) : null
    };
    persistirPreferencias({
      unidadePadraoId: valor ? Number(valor) : null
    });
  }

  function onChangeModo(valor) {
    setModoPergunta(valor);
    if (conversaIdRef.current) {
      persistirFiltrosConversa({ modoPergunta: valor });
    }
  }

  function onChangeTom(valor) {
    setTom(valor);
    if (!prefsCarregadas) return;
    if (conversaIdRef.current) {
      persistirFiltrosConversa({ tom: valor });
      return;
    }
    prefsPadraoRef.current = { ...prefsPadraoRef.current, tom: valor };
    persistirPreferencias({ tom: valor });
  }

  function onChangeFramework(valor) {
    setFrameworkFavorito(valor);
    if (!prefsCarregadas) return;
    if (conversaIdRef.current) {
      persistirFiltrosConversa({ frameworkFavorito: valor });
      return;
    }
    prefsPadraoRef.current = {
      ...prefsPadraoRef.current,
      frameworkFavorito: valor || ''
    };
    persistirPreferencias({ frameworkFavorito: valor || null });
  }

  function aplicarFiltrosDaConversa(c) {
    setProjetoId(c.projetoId ? String(c.projetoId) : '');
    setEmpresaUnidadeId(c.empresaUnidadeId ? String(c.empresaUnidadeId) : '');
    setModoPergunta(c.modoPergunta || 'auto');
    setTom(c.tom || 'medio');
    setFrameworkFavorito(c.frameworkFavorito || '');
  }

  function aplicarFiltrosPadrao() {
    const p = prefsPadraoRef.current;
    setProjetoId(p.projetoPadraoId ? String(p.projetoPadraoId) : '');
    setEmpresaUnidadeId(p.unidadePadraoId ? String(p.unidadePadraoId) : '');
    setTom(p.tom || 'medio');
    setFrameworkFavorito(p.frameworkFavorito || '');
    setModoPergunta('auto');
  }

  async function abrirConversa(id) {
    setErro('');
    try {
      const res = await assistenteApi.obterConversa(id);
      const c = res.conversa;
      setConversaId(c.id);
      aplicarFiltrosDaConversa(c);
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
      setModoRetrieval('');
      setAnexo(null);
      setAnexoErro('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setErro(e.message || 'Não foi possível abrir a conversa');
    }
  }

  function novaConversa() {
    setConversaId(null);
    setMensagens([]);
    setErro('');
    setModoRetrieval('');
    setAnexo(null);
    setAnexoErro('');
    if (fileRef.current) fileRef.current.value = '';
    aplicarFiltrosPadrao();
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

  const pararGeracao = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const enviar = useCallback(
    async (textoLivre) => {
      const texto = String(textoLivre ?? input).trim();
      if (!texto || enviando) return;

      setErro('');
      setInput('');
      const textoExibir = anexo
        ? `${texto}\n\n[Anexo: ${anexo.nomeOriginal}]`
        : texto;
      const novas = [...mensagens, { role: 'user', content: textoExibir }];
      setMensagens(novas);
      setEnviando(true);
      setMensagens([
        ...novas,
        { role: 'assistant', content: '', fontes: null, acoes: null, id: null }
      ]);

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        await assistenteApi.chatStream(
          {
            mensagem: texto,
            conversaId,
            projetoId: projetoId ? Number(projetoId) : null,
            empresaUnidadeId: empresaUnidadeId ? Number(empresaUnidadeId) : null,
            modoPergunta,
            tom,
            frameworkFavorito: frameworkFavorito || null,
            anexo: anexo
              ? {
                  nomeOriginal: anexo.nomeOriginal,
                  mimeType: anexo.mimeType,
                  arquivo: anexo.arquivo
                }
              : null
          },
          {
            signal: abort.signal,
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
                    acoes: data.acoes || last.acoes || null,
                    cancelado: !!data.cancelado
                  };
                }
                return copy;
              });
              carregarListaConversas();
            },
            onCancel: () => {
              setMensagens((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') {
                  const base = String(last.content || '').trim();
                  const content = base
                    ? /interrompida/i.test(base)
                      ? base
                      : `${base}\n\n_(Resposta interrompida.)_`
                    : '_(Resposta interrompida.)_';
                  copy[copy.length - 1] = { ...last, content, cancelado: true };
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
        if (e?.name === 'AbortError' || abort.signal.aborted) {
          /* onCancel já tratou */
        } else {
          setErro(e.message || 'Falha ao consultar o assistente');
        }
      } finally {
        if (abortRef.current === abort) abortRef.current = null;
        setAnexo(null);
        setAnexoErro('');
        if (fileRef.current) fileRef.current.value = '';
        setEnviando(false);
        inputRef.current?.focus();
      }
    },
    [
      anexo,
      carregarListaConversas,
      conversaId,
      empresaUnidadeId,
      enviando,
      frameworkFavorito,
      input,
      mensagens,
      modoPergunta,
      projetoId,
      tom
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
        <div className="border-b border-slate-100 px-2 py-2 dark:border-slate-700">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={buscaConversas}
              onChange={(e) => setBuscaConversas(e.target.value)}
              placeholder="Buscar conversas…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-2 text-[11px] outline-none focus:border-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversas.length === 0 && (
            <p className="px-2 py-4 text-center text-[11px] text-slate-400">
              {buscaConversas.trim() ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
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
                Unidade · preferências · fontes clicáveis
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

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <label className="flex min-w-[14rem] flex-1 items-center gap-2">
              <FolderKanban className="h-4 w-4 shrink-0 text-slate-500" />
              <select
                value={projetoId}
                onChange={(e) => onChangeProjeto(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
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

            {projetoId && unidades.length > 0 && (
              <label className="flex min-w-[12rem] flex-1 items-center gap-2">
                <span className="shrink-0 text-xs text-slate-500">Unidade:</span>
                <select
                  value={empresaUnidadeId}
                  onChange={(e) => onChangeUnidade(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Geral (empresa)</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                      {u.ehPadrao ? ' (padrão)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {modos.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onChangeModo(m.id)}
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

          <div className="flex flex-wrap gap-1.5">
            {TOMS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeTom(t.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  tom === t.id
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
            {FRAMEWORKS_PREF.map((f) => (
              <button
                key={f.id || 'auto'}
                type="button"
                onClick={() => onChangeFramework(f.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  (frameworkFavorito || '') === f.id
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {f.label}
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
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Buscando fontes ({modoPergunta}) e gerando resposta…</span>
                <button
                  type="button"
                  onClick={pararGeracao}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Square className="h-3 w-3 fill-current" />
                  Parar
                </button>
              </div>
            )}
            <div ref={fimRef} />
          </div>

          {erro && (
            <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {erro}
            </div>
          )}

          {(anexo || anexoErro) && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/60">
              {anexo && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-1 text-cyan-900 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-100">
                  <Paperclip className="h-3 w-3" />
                  {anexo.nomeOriginal}
                  <button
                    type="button"
                    onClick={() => {
                      setAnexo(null);
                      if (fileRef.current) fileRef.current.value = '';
                    }}
                    className="ml-0.5 rounded p-0.5 hover:bg-cyan-100 dark:hover:bg-cyan-900"
                    title="Remover anexo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {anexoErro && <span className="text-amber-700 dark:text-amber-300">{anexoErro}</span>}
            </div>
          )}

          <form
            className="flex gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
            onSubmit={(e) => {
              e.preventDefault();
              enviar();
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.md,.txt,.jpg,.jpeg,.png,.gif,.webp,text/plain,text/markdown,application/pdf,image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) lerArquivoComoAnexo(f).catch((err) => setAnexoErro(err.message));
              }}
            />
            <button
              type="button"
              disabled={enviando}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center justify-center self-end rounded-xl border border-slate-200 px-3 py-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-900"
              title="Anexar PDF, imagem, MD ou TXT (só nesta pergunta)"
            >
              <Paperclip className="h-4 w-4" />
            </button>
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
            {enviando && (
              <button
                type="button"
                onClick={pararGeracao}
                className="inline-flex items-center justify-center gap-1.5 self-end rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                title="Parar geração"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                Parar
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

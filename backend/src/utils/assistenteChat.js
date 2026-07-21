import { callAI } from '../services/ai-provider.js';
import { streamAI } from '../services/ai-stream.js';
import { prisma } from '../lib/prisma.js';
import { carregarFrameworkProjeto } from './projetoFramework.js';
import {
  EMPRESA_CONSULTORIA,
  IDENTIDADE_CONSULTOR_PROMPT
} from '../constants/consultorRelatorioIA.js';
import { catalogoDimensoesMarkdown, truncarContexto } from './assistenteConhecimento.js';
import {
  recuperarChunksRelevantes,
  formatarChunksParaPrompt
} from './assistenteRetrieval.js';
import {
  garantirConversaAssistente,
  salvarMensagemAssistente,
  carregarHistoricoConversa
} from './assistenteHistorico.js';
import { montarAcoesAssistente } from './assistenteAcoes.js';
import { enriquecerFontesComLinks } from './assistenteFontes.js';
import {
  instrucaoModoNoPrompt,
  normalizarModoAssistente
} from './assistenteModos.js';
import { carregarDicasFeedbackAssistente } from './assistenteFeedback.js';

const MAX_HISTORICO = 10;
const MAX_MSG = 4000;

export const SYSTEM_PROMPT_ASSISTENTE = `Você é o **Assistente Agentica** da ${EMPRESA_CONSULTORIA}: um copiloto especializado no produto Blueprint IA / Agentica, na tese metodológica (Blueprint 16 e SATF TI v3) e no contexto do projeto selecionado pelo usuário.

${IDENTIDADE_CONSULTOR_PROMPT}

MISSÃO:
- Responder perguntas sobre **como usar o sistema**, **metodologia/tese**, **dimensões**, **scores/certificação**, **books/relatórios**, **produtos IA-First** e **o projeto em contexto** (quando houver DADOS DO PROJETO / FONTES RECUPERADAS).
- Quando houver fontes do tipo relatorio_ia, trate-as como **conteúdo já gerado na Biblioteca IA deste projeto** — cite o título do book/relatório e não invente seções que não apareçam nos trechos.
- Agregar valor: ser prático, citar telas/fluxos do manual, e ancorar em fatos do glossário/contexto quando existirem.

REGRAS:
1. Priorize as **FONTES RECUPERADAS** e os DADOS DO PROJETO — não invente rotas, botões ou campos.
2. Quando usar uma fonte, mencione de forma leve (ex.: "pelo manual…", "no glossário do projeto…").
3. Se a pergunta for sobre um projeto e não houver contexto suficiente, diga o que falta.
4. Não misture taxonomia Blueprint 16 com SATF D1–D11 sem avisar a diferença.
5. Não invente scores, evidências ou fatos do cliente.
6. Respostas em português (Brasil), claras, com markdown leve.
7. Se for "como fazer", dê passos numerados.
8. Recuse pedidos fora do escopo do produto/metodologia/projeto.
9. Se o usuário tiver vínculo a unidades organizacionais, as fontes de book/relatório já vêm filtradas às unidades dele — não invente conteúdo de outras unidades.`;

function normalizarHistorico(historico) {
  if (!Array.isArray(historico)) return [];
  return historico
    .slice(-MAX_HISTORICO)
    .map((m) => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      content: String(m?.content || '').trim().slice(0, MAX_MSG)
    }))
    .filter((m) => m.content);
}

function formatarHistorico(historico) {
  if (!historico.length) return '';
  return [
    '## Histórico recente da conversa',
    ...historico.map((m) => `**${m.role === 'assistant' ? 'Assistente' : 'Usuário'}:** ${m.content}`)
  ].join('\n\n');
}

function usuarioPodeAcessarProjeto(usuario, projeto) {
  if (!projeto) return false;
  const role = String(usuario?.role || '').trim().toLowerCase();
  if (role === 'admin') return true;
  const eid = usuario?.empresaId;
  if (eid == null) return false;
  return Number(projeto.empresaId) === Number(eid);
}

export async function carregarBlocoProjetoAssistente(usuario, projetoId) {
  if (projetoId == null || projetoId === '') return { ok: true, bloco: '', meta: null };

  const id = parseInt(projetoId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    const err = new Error('projetoId inválido');
    err.status = 400;
    throw err;
  }

  const projeto = await prisma.projeto.findUnique({
    where: { id },
    include: { empresa: { select: { id: true, nome: true } } }
  });
  if (!projeto) {
    const err = new Error('Projeto não encontrado');
    err.status = 404;
    throw err;
  }
  if (!usuarioPodeAcessarProjeto(usuario, projeto)) {
    const err = new Error('Sem permissão para acessar este projeto');
    err.status = 403;
    throw err;
  }

  let framework = null;
  try {
    const fw = await carregarFrameworkProjeto(prisma, id);
    framework = fw?.frameworkMaturidade || null;
  } catch {
    framework = null;
  }

  const meta = {
    id: projeto.id,
    nome: projeto.nome,
    empresa: projeto.empresa?.nome || null,
    frameworkMaturidade: framework
  };

  const bloco = truncarContexto(
    [
      '## Identificação do projeto',
      `- **Empresa:** ${meta.empresa || '—'}`,
      `- **Projeto:** ${meta.nome} (id ${meta.id})`,
      `- **Framework:** ${meta.frameworkMaturidade || 'não informado'}`
    ].join('\n'),
    1200
  );

  return { ok: true, bloco, meta };
}

async function montarPromptAssistente({
  mensagem,
  historico,
  blocoProjeto,
  chunks,
  modoPergunta = 'auto',
  dicasFeedback = ''
}) {
  return [
    '# CATÁLOGO RÁPIDO (referência)',
    catalogoDimensoesMarkdown(),
    '',
    instrucaoModoNoPrompt(modoPergunta),
    '',
    '# FONTES RECUPERADAS (RAG)',
    formatarChunksParaPrompt(chunks),
    '',
    blocoProjeto
      ? `# PROJETO SELECIONADO\n\n${blocoProjeto}`
      : '# PROJETO SELECIONADO\n\n_Nenhum projeto selecionado._',
    '',
    dicasFeedback || '',
    '',
    formatarHistorico(historico),
    '',
    '# PERGUNTA ATUAL DO USUÁRIO',
    mensagem,
    '',
    'Responda com base nas fontes recuperadas e no projeto. Seja útil e fundamentado. Quando citar um book/relatório, use o título da fonte.'
  ]
    .filter(Boolean)
    .join('\n');
}

async function carregarTiposRelatorios(relatorioIds) {
  const ids = [...new Set((relatorioIds || []).map(Number).filter((n) => n > 0))];
  const map = new Map();
  if (!ids.length) return map;
  try {
    const rows = await prisma.relatorioIA.findMany({
      where: { id: { in: ids } },
      select: { id: true, tipo: true }
    });
    for (const r of rows) map.set(r.id, r.tipo);
  } catch {
    /* ignore */
  }
  return map;
}

async function prepararContextoChat(opts) {
  const mensagem = String(opts.mensagem || '').trim().slice(0, MAX_MSG);
  if (!mensagem) {
    const err = new Error('Mensagem obrigatória');
    err.status = 400;
    throw err;
  }

  const usuarioId = opts.usuario?.id;
  if (!usuarioId) {
    const err = new Error('Usuário não autenticado');
    err.status = 401;
    throw err;
  }

  const modoPergunta = normalizarModoAssistente(opts.modoPergunta);

  const { bloco: blocoProjeto, meta: projetoMeta } = await carregarBlocoProjetoAssistente(
    opts.usuario,
    opts.projetoId
  );

  const conversa = await garantirConversaAssistente({
    usuarioId,
    conversaId: opts.conversaId || null,
    projetoId: opts.projetoId ?? projetoMeta?.id ?? null,
    primeiraMensagem: mensagem
  });

  let historico;
  if (opts.conversaId) {
    historico = normalizarHistorico(
      await carregarHistoricoConversa(conversa.id, { limit: MAX_HISTORICO })
    );
  } else {
    historico = normalizarHistorico(opts.historico);
  }

  const projetoIdEfetivo = projetoMeta?.id || (opts.projetoId ? Number(opts.projetoId) : null);

  const retrieval = await recuperarChunksRelevantes(mensagem, {
    projetoId: projetoIdEfetivo,
    modoPergunta,
    usuario: opts.usuario
  });

  const dicasFeedback = await carregarDicasFeedbackAssistente(usuarioId);

  const prompt = await montarPromptAssistente({
    mensagem,
    historico,
    blocoProjeto,
    chunks: retrieval.chunks,
    modoPergunta,
    dicasFeedback
  });

  await salvarMensagemAssistente({
    conversaId: conversa.id,
    role: 'user',
    content: mensagem
  });

  const fontesBase = retrieval.chunks.map(({ fonte, titulo, score, relatorioId }) => ({
    fonte,
    titulo,
    score,
    ...(relatorioId != null ? { relatorioId } : {})
  }));

  const tipos = await carregarTiposRelatorios(fontesBase.map((f) => f.relatorioId));
  const fontes = enriquecerFontesComLinks(fontesBase, {
    projetoId: projetoIdEfetivo,
    tiposPorRelatorioId: tipos
  });

  return {
    mensagem,
    prompt,
    conversa,
    projetoMeta,
    fontes,
    modoRetrieval: retrieval.modo,
    modoPergunta
  };
}

/**
 * Chat síncrono (compatível com v1) + persistência + RAG.
 */
export async function responderAssistenteChat(opts) {
  const ctx = await prepararContextoChat(opts);

  const resultado = await callAI(ctx.prompt, SYSTEM_PROMPT_ASSISTENTE, {
    maxTokens: 4096
  });

  const resposta = String(resultado?.content || resultado?.text || '').trim();
  if (!resposta) {
    const err = new Error('A IA não retornou conteúdo. Verifique a configuração do provedor.');
    err.status = 502;
    throw err;
  }

  const acoes = montarAcoesAssistente({
    mensagem: ctx.mensagem,
    resposta,
    fontes: ctx.fontes,
    projetoId: ctx.projetoMeta?.id || opts.projetoId || null,
    frameworkMaturidade: ctx.projetoMeta?.frameworkMaturidade || null
  });

  const mensagemId = await salvarMensagemAssistente({
    conversaId: ctx.conversa.id,
    role: 'assistant',
    content: resposta,
    fontes: ctx.fontes,
    acoes
  });

  return {
    resposta,
    conversaId: ctx.conversa.id,
    mensagemId,
    projeto: ctx.projetoMeta,
    fontes: ctx.fontes,
    acoes,
    modoRetrieval: ctx.modoRetrieval,
    modoPergunta: ctx.modoPergunta,
    provider: resultado?.provider || null,
    model: resultado?.model || null
  };
}

/**
 * Chat com streaming: chama onEvent para cada evento; grava resposta ao final.
 */
export async function responderAssistenteChatStream(opts, onEvent) {
  const ctx = await prepararContextoChat(opts);

  onEvent?.({
    type: 'start',
    conversaId: ctx.conversa.id,
    projeto: ctx.projetoMeta,
    fontes: ctx.fontes,
    modoRetrieval: ctx.modoRetrieval,
    modoPergunta: ctx.modoPergunta
  });

  let resposta = '';
  let provider = null;
  let model = null;

  for await (const evt of streamAI(ctx.prompt, SYSTEM_PROMPT_ASSISTENTE, { maxTokens: 4096 })) {
    if (evt.type === 'meta') {
      provider = evt.provider;
      model = evt.model;
      onEvent?.({ type: 'meta', provider, model });
    } else if (evt.type === 'token') {
      resposta += evt.text;
      onEvent?.({ type: 'token', text: evt.text });
    } else if (evt.type === 'error') {
      const err = new Error(evt.message || 'Erro no streaming');
      err.status = 502;
      throw err;
    }
  }

  resposta = resposta.trim();
  if (!resposta) {
    const err = new Error('A IA não retornou conteúdo no stream.');
    err.status = 502;
    throw err;
  }

  const acoes = montarAcoesAssistente({
    mensagem: ctx.mensagem,
    resposta,
    fontes: ctx.fontes,
    projetoId: ctx.projetoMeta?.id || opts.projetoId || null,
    frameworkMaturidade: ctx.projetoMeta?.frameworkMaturidade || null
  });

  const mensagemId = await salvarMensagemAssistente({
    conversaId: ctx.conversa.id,
    role: 'assistant',
    content: resposta,
    fontes: ctx.fontes,
    acoes
  });

  onEvent?.({
    type: 'done',
    conversaId: ctx.conversa.id,
    mensagemId,
    resposta,
    fontes: ctx.fontes,
    acoes,
    modoPergunta: ctx.modoPergunta,
    provider,
    model
  });

  return {
    resposta,
    conversaId: ctx.conversa.id,
    mensagemId,
    fontes: ctx.fontes,
    acoes,
    provider,
    model
  };
}

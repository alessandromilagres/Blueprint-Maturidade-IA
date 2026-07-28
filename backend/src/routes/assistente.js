import express from 'express';
import {
  responderAssistenteChat,
  responderAssistenteChatStream
} from '../utils/assistenteChat.js';
import {
  listarConversasAssistente,
  obterConversaAssistente,
  excluirConversaAssistente,
  atualizarFiltrosConversaAssistente
} from '../utils/assistenteHistorico.js';
import { ensureAssistenteSchema } from '../utils/assistenteSchema.js';
import { salvarFeedbackAssistente } from '../utils/assistenteFeedback.js';
import { MODOS_ASSISTENTE } from '../utils/assistenteModos.js';
import {
  obterPreferenciasAssistente,
  salvarPreferenciasAssistente
} from '../utils/assistentePreferencias.js';

const router = express.Router();

function sseWrite(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function parseEmpresaUnidadeIdBody(body) {
  const raw = body?.empresaUnidadeId ?? body?.unidadeId;
  if (raw == null || raw === '' || raw === '0' || raw === 'todas' || raw === 'all') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}

router.get('/modos', (_req, res) => {
  res.json({ ok: true, modos: MODOS_ASSISTENTE });
});

router.get('/preferencias', async (req, res) => {
  try {
    await ensureAssistenteSchema();
    const prefs = await obterPreferenciasAssistente(req.usuario.id);
    res.json({ ok: true, preferencias: prefs });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.put('/preferencias', async (req, res) => {
  try {
    await ensureAssistenteSchema();
    const prefs = await salvarPreferenciasAssistente(req.usuario.id, req.body || {});
    res.json({ ok: true, preferencias: prefs });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, error: error.message });
  }
});

/**
 * POST /api/assistente/chat
 * Body: { mensagem, historico?, projetoId?, conversaId?, modoPergunta?, empresaUnidadeId?, tom?, frameworkFavorito? }
 */
router.post('/chat', async (req, res) => {
  try {
    await ensureAssistenteSchema();
    const {
      mensagem,
      historico,
      projetoId,
      conversaId,
      modoPergunta,
      tom,
      frameworkFavorito,
      unidadeNome,
      anexo
    } = req.body || {};
    const out = await responderAssistenteChat({
      mensagem,
      historico,
      projetoId: projetoId ?? null,
      conversaId: conversaId ?? null,
      modoPergunta,
      empresaUnidadeId: parseEmpresaUnidadeIdBody(req.body),
      unidadeNome: unidadeNome || null,
      tom,
      frameworkFavorito,
      anexo: anexo || null,
      usuario: req.usuario
    });
    res.json({
      ok: true,
      resposta: out.resposta,
      conversaId: out.conversaId,
      mensagemId: out.mensagemId,
      projeto: out.projeto,
      fontes: out.fontes,
      acoes: out.acoes || [],
      modoRetrieval: out.modoRetrieval,
      modoPergunta: out.modoPergunta,
      provider: out.provider,
      model: out.model
    });
  } catch (error) {
    const status = error.status || 500;
    console.error('[Assistente]', error.message);
    res.status(status).json({
      ok: false,
      error: error.message || 'Erro ao processar o assistente'
    });
  }
});

/**
 * POST /api/assistente/chat/stream — SSE
 */
router.post('/chat/stream', async (req, res) => {
  const abort = new AbortController();
  const onClientClose = () => {
    if (!abort.signal.aborted) abort.abort();
  };
  req.on('close', onClientClose);
  req.on('aborted', onClientClose);

  try {
    await ensureAssistenteSchema();
    const {
      mensagem,
      historico,
      projetoId,
      conversaId,
      modoPergunta,
      tom,
      frameworkFavorito,
      unidadeNome,
      anexo
    } = req.body || {};

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    await responderAssistenteChatStream(
      {
        mensagem,
        historico,
        projetoId: projetoId ?? null,
        conversaId: conversaId ?? null,
        modoPergunta,
        empresaUnidadeId: parseEmpresaUnidadeIdBody(req.body),
        unidadeNome: unidadeNome || null,
        tom,
        frameworkFavorito,
        anexo: anexo || null,
        usuario: req.usuario,
        signal: abort.signal
      },
      (evt) => {
        if (res.writableEnded) return;
        if (evt.type === 'token') sseWrite(res, 'token', { text: evt.text });
        else if (evt.type === 'start') sseWrite(res, 'start', evt);
        else if (evt.type === 'meta') sseWrite(res, 'meta', evt);
        else if (evt.type === 'done') sseWrite(res, 'done', evt);
      }
    );

    if (!res.writableEnded) res.end();
  } catch (error) {
    console.error('[Assistente stream]', error.message);
    if (!res.headersSent) {
      res.status(error.status || 500).json({ ok: false, error: error.message });
      return;
    }
    try {
      if (!res.writableEnded) {
        sseWrite(res, 'error', { error: error.message || 'Erro no stream' });
      }
    } catch {
      /* ignore */
    }
    if (!res.writableEnded) res.end();
  } finally {
    req.off?.('close', onClientClose);
    req.off?.('aborted', onClientClose);
  }
});

/**
 * POST /api/assistente/feedback
 * Body: { mensagemId, util: boolean, motivo?, conversaId? }
 */
router.post('/feedback', async (req, res) => {
  try {
    const { mensagemId, util, motivo, conversaId } = req.body || {};
    const out = await salvarFeedbackAssistente({
      usuarioId: req.usuario.id,
      mensagemId,
      conversaId,
      util: typeof util === 'boolean' ? util : String(util).toLowerCase() === 'true',
      motivo
    });
    res.json({ ok: true, ...out });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, error: error.message });
  }
});

router.get('/conversas', async (req, res) => {
  try {
    const lista = await listarConversasAssistente(req.usuario.id, {
      q: req.query?.q || '',
      limit: req.query?.limit
    });
    res.json({ ok: true, conversas: lista });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/conversas/:id', async (req, res) => {
  try {
    const conversa = await obterConversaAssistente(req.usuario.id, req.params.id);
    res.json({ ok: true, conversa });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, error: error.message });
  }
});

router.patch('/conversas/:id/filtros', async (req, res) => {
  try {
    await ensureAssistenteSchema();
    const filtros = await atualizarFiltrosConversaAssistente(
      req.usuario.id,
      req.params.id,
      req.body || {}
    );
    res.json({ ok: true, filtros });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, error: error.message });
  }
});

router.delete('/conversas/:id', async (req, res) => {
  try {
    await excluirConversaAssistente(req.usuario.id, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, error: error.message });
  }
});

export default router;

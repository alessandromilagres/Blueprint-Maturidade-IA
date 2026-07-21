import express from 'express';
import {
  responderAssistenteChat,
  responderAssistenteChatStream
} from '../utils/assistenteChat.js';
import {
  listarConversasAssistente,
  obterConversaAssistente,
  excluirConversaAssistente
} from '../utils/assistenteHistorico.js';
import { ensureAssistenteSchema } from '../utils/assistenteSchema.js';
import { salvarFeedbackAssistente } from '../utils/assistenteFeedback.js';
import { MODOS_ASSISTENTE } from '../utils/assistenteModos.js';

const router = express.Router();

function sseWrite(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

router.get('/modos', (_req, res) => {
  res.json({ ok: true, modos: MODOS_ASSISTENTE });
});

/**
 * POST /api/assistente/chat
 * Body: { mensagem, historico?, projetoId?, conversaId?, modoPergunta? }
 */
router.post('/chat', async (req, res) => {
  try {
    await ensureAssistenteSchema();
    const { mensagem, historico, projetoId, conversaId, modoPergunta } = req.body || {};
    const out = await responderAssistenteChat({
      mensagem,
      historico,
      projetoId: projetoId ?? null,
      conversaId: conversaId ?? null,
      modoPergunta,
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
  try {
    await ensureAssistenteSchema();
    const { mensagem, historico, projetoId, conversaId, modoPergunta } = req.body || {};

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
        usuario: req.usuario
      },
      (evt) => {
        if (evt.type === 'token') sseWrite(res, 'token', { text: evt.text });
        else if (evt.type === 'start') sseWrite(res, 'start', evt);
        else if (evt.type === 'meta') sseWrite(res, 'meta', evt);
        else if (evt.type === 'done') sseWrite(res, 'done', evt);
      }
    );

    res.end();
  } catch (error) {
    console.error('[Assistente stream]', error.message);
    if (!res.headersSent) {
      res.status(error.status || 500).json({ ok: false, error: error.message });
      return;
    }
    try {
      sseWrite(res, 'error', { error: error.message || 'Erro no stream' });
    } catch {
      /* ignore */
    }
    res.end();
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
    const lista = await listarConversasAssistente(req.usuario.id);
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

router.delete('/conversas/:id', async (req, res) => {
  try {
    await excluirConversaAssistente(req.usuario.id, req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, error: error.message });
  }
});

export default router;

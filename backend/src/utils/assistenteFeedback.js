import { prisma } from '../lib/prisma.js';
import { ensureAssistenteSchema } from './assistenteSchema.js';

export async function salvarFeedbackAssistente({
  usuarioId,
  mensagemId,
  conversaId = null,
  util,
  motivo = null
}) {
  await ensureAssistenteSchema();
  const mid = parseInt(mensagemId, 10);
  if (!Number.isFinite(mid) || mid <= 0) {
    const err = new Error('mensagemId inválido');
    err.status = 400;
    throw err;
  }
  if (typeof util !== 'boolean') {
    const err = new Error('util deve ser boolean (true=👍, false=👎)');
    err.status = 400;
    throw err;
  }

  const msg = await prisma.$queryRaw`
    SELECT m."id", m."conversaId", c."usuarioId"
    FROM "AssistenteMensagem" m
    JOIN "AssistenteConversa" c ON c."id" = m."conversaId"
    WHERE m."id" = ${mid}
    LIMIT 1
  `;
  if (!msg?.[0] || Number(msg[0].usuarioId) !== Number(usuarioId)) {
    const err = new Error('Mensagem não encontrada');
    err.status = 404;
    throw err;
  }

  const motivoLimpo = motivo ? String(motivo).trim().slice(0, 500) : null;
  const cid = conversaId != null ? Number(conversaId) : Number(msg[0].conversaId);

  const existing = await prisma.$queryRaw`
    SELECT "id" FROM "AssistenteFeedback"
    WHERE "mensagemId" = ${mid} AND "usuarioId" = ${usuarioId}
    LIMIT 1
  `;

  if (existing?.[0]?.id) {
    await prisma.$executeRaw`
      UPDATE "AssistenteFeedback"
      SET "util" = ${util},
          "motivo" = ${motivoLimpo},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${existing[0].id}
    `;
    return { id: existing[0].id, atualizado: true };
  }

  const inserted = await prisma.$queryRaw`
    INSERT INTO "AssistenteFeedback"
      ("mensagemId", "conversaId", "usuarioId", "util", "motivo", "createdAt", "updatedAt")
    VALUES (${mid}, ${cid}, ${usuarioId}, ${util}, ${motivoLimpo}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING "id"
  `;
  return { id: inserted?.[0]?.id, atualizado: false };
}

/**
 * Trechos de feedback para afinar o prompt (motivos recentes).
 */
export async function carregarDicasFeedbackAssistente(usuarioId, { limit = 12 } = {}) {
  await ensureAssistenteSchema();
  try {
    const lim = Math.min(30, Math.max(1, Number(limit) || 12));
    const rows = await prisma.$queryRaw`
      SELECT "util", "motivo", "createdAt"
      FROM "AssistenteFeedback"
      WHERE "usuarioId" = ${usuarioId}
        AND "motivo" IS NOT NULL
        AND LENGTH(TRIM("motivo")) > 2
      ORDER BY "updatedAt" DESC
      LIMIT ${lim}
    `;
    if (!rows?.length) return '';

    const linhas = rows.map((r) => {
      const tom = r.util ? 'positivo' : 'negativo';
      return `- [${tom}] ${String(r.motivo).trim().slice(0, 200)}`;
    });

    return [
      '## Feedback recente deste usuário (ajuste o estilo; não cite esta seção)',
      ...linhas,
      'Se houver feedbacks negativos sobre imprecisão ou falta de passo a passo, seja mais concreto e cite fontes.'
    ].join('\n');
  } catch {
    return '';
  }
}

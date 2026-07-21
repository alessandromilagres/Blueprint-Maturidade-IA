import { prisma } from '../lib/prisma.js';
import { ensureAssistenteSchema } from './assistenteSchema.js';
import { parseMetaMensagemAssistente, serializarMetaMensagemAssistente } from './assistenteAcoes.js';

function tituloDeMensagem(mensagem) {
  const t = String(mensagem || '').replace(/\s+/g, ' ').trim();
  if (!t) return 'Nova conversa';
  return t.length > 72 ? `${t.slice(0, 69)}…` : t;
}

export async function listarConversasAssistente(usuarioId, { limit = 40 } = {}) {
  await ensureAssistenteSchema();
  const lim = Math.min(100, Math.max(1, Number(limit) || 40));
  const rows = await prisma.$queryRaw`
    SELECT c."id", c."projetoId", c."titulo", c."createdAt", c."updatedAt",
           (SELECT COUNT(*)::int FROM "AssistenteMensagem" m WHERE m."conversaId" = c."id") AS "qtdMensagens"
    FROM "AssistenteConversa" c
    WHERE c."usuarioId" = ${usuarioId}
    ORDER BY c."updatedAt" DESC
    LIMIT ${lim}
  `;
  return rows || [];
}

export async function obterConversaAssistente(usuarioId, conversaId) {
  await ensureAssistenteSchema();
  const id = parseInt(conversaId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    const err = new Error('conversaId inválido');
    err.status = 400;
    throw err;
  }
  const conv = await prisma.$queryRaw`
    SELECT "id", "usuarioId", "projetoId", "titulo", "createdAt", "updatedAt"
    FROM "AssistenteConversa"
    WHERE "id" = ${id} AND "usuarioId" = ${usuarioId}
    LIMIT 1
  `;
  if (!conv?.[0]) {
    const err = new Error('Conversa não encontrada');
    err.status = 404;
    throw err;
  }
  const msgs = await prisma.$queryRaw`
    SELECT "id", "role", "content", "fontesJson", "createdAt"
    FROM "AssistenteMensagem"
    WHERE "conversaId" = ${id}
    ORDER BY "id" ASC
  `;
  return {
    ...conv[0],
    mensagens: (msgs || []).map((m) => {
      const meta = parseMetaMensagemAssistente(m.fontesJson);
      return {
        id: m.id,
        role: m.role,
        content: m.content,
        fontes: meta.fontes,
        acoes: meta.acoes,
        createdAt: m.createdAt
      };
    })
  };
}

export async function garantirConversaAssistente({
  usuarioId,
  conversaId = null,
  projetoId = null,
  primeiraMensagem = ''
}) {
  await ensureAssistenteSchema();

  if (conversaId) {
    const id = parseInt(conversaId, 10);
    const conv = await prisma.$queryRaw`
      SELECT "id", "usuarioId", "projetoId", "titulo"
      FROM "AssistenteConversa"
      WHERE "id" = ${id} AND "usuarioId" = ${usuarioId}
      LIMIT 1
    `;
    if (!conv?.[0]) {
      const err = new Error('Conversa não encontrada');
      err.status = 404;
      throw err;
    }
    if (projetoId != null && Number(projetoId) > 0) {
      await prisma.$executeRaw`
        UPDATE "AssistenteConversa"
        SET "projetoId" = ${Number(projetoId)}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${id}
      `;
    }
    return conv[0];
  }

  const titulo = tituloDeMensagem(primeiraMensagem);
  const pid = projetoId != null && Number(projetoId) > 0 ? Number(projetoId) : null;
  const inserted = await prisma.$queryRaw`
    INSERT INTO "AssistenteConversa" ("usuarioId", "projetoId", "titulo", "createdAt", "updatedAt")
    VALUES (${usuarioId}, ${pid}, ${titulo}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING "id", "usuarioId", "projetoId", "titulo"
  `;
  return inserted[0];
}

export async function salvarMensagemAssistente({
  conversaId,
  role,
  content,
  fontes = null,
  acoes = null
}) {
  await ensureAssistenteSchema();
  const fontesJson =
    fontes != null || acoes != null
      ? serializarMetaMensagemAssistente({ fontes, acoes })
      : null;
  const rows = await prisma.$queryRaw`
    INSERT INTO "AssistenteMensagem" ("conversaId", "role", "content", "fontesJson", "createdAt")
    VALUES (${conversaId}, ${role}, ${content}, ${fontesJson}, CURRENT_TIMESTAMP)
    RETURNING "id"
  `;
  await prisma.$executeRaw`
    UPDATE "AssistenteConversa" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${conversaId}
  `;
  return rows?.[0]?.id || null;
}

export async function carregarHistoricoConversa(conversaId, { limit = 10 } = {}) {
  await ensureAssistenteSchema();
  const lim = Math.min(30, Math.max(1, Number(limit) || 10));
  const msgs = await prisma.$queryRaw`
    SELECT "role", "content"
    FROM "AssistenteMensagem"
    WHERE "conversaId" = ${conversaId}
    ORDER BY "id" DESC
    LIMIT ${lim}
  `;
  return (msgs || []).reverse();
}

export async function excluirConversaAssistente(usuarioId, conversaId) {
  await ensureAssistenteSchema();
  const id = parseInt(conversaId, 10);
  const conv = await prisma.$queryRaw`
    SELECT "id" FROM "AssistenteConversa"
    WHERE "id" = ${id} AND "usuarioId" = ${usuarioId}
    LIMIT 1
  `;
  if (!conv?.[0]) {
    const err = new Error('Conversa não encontrada');
    err.status = 404;
    throw err;
  }
  await prisma.$executeRaw`DELETE FROM "AssistenteMensagem" WHERE "conversaId" = ${id}`;
  await prisma.$executeRaw`DELETE FROM "AssistenteConversa" WHERE "id" = ${id}`;
  return { ok: true };
}

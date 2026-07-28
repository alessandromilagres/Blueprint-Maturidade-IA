import { prisma } from '../lib/prisma.js';
import { ensureAssistenteSchema } from './assistenteSchema.js';
import { parseMetaMensagemAssistente, serializarMetaMensagemAssistente } from './assistenteAcoes.js';
import { normalizarModoAssistente } from './assistenteModos.js';
import {
  normalizarTomAssistente,
  normalizarFrameworkFavoritoAssistente
} from './assistentePreferencias.js';

/** Gera título curto a partir da primeira mensagem do usuário (#11). */
export function tituloDeMensagem(mensagem) {
  let t = String(mensagem || '')
    .replace(/\[Anexo:[^\]]*\]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return 'Nova conversa';
  const primeira = t.split(/(?<=[.!?])\s+|\n/)[0] || t;
  t = primeira.trim() || t;
  return t.length > 72 ? `${t.slice(0, 69)}…` : t;
}

function escaparLike(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function idOrNull(v) {
  if (v == null || v === '' || v === 0 || v === '0') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
}

/** Normaliza filtros persistidos na conversa. */
export function normalizarFiltrosConversa(filtros = {}) {
  return {
    projetoId: idOrNull(filtros.projetoId),
    empresaUnidadeId: idOrNull(filtros.empresaUnidadeId),
    modoPergunta: normalizarModoAssistente(filtros.modoPergunta || 'auto'),
    tom: normalizarTomAssistente(filtros.tom || 'medio'),
    frameworkFavorito: normalizarFrameworkFavoritoAssistente(filtros.frameworkFavorito)
  };
}

export async function listarConversasAssistente(usuarioId, { limit = 40, q = '' } = {}) {
  await ensureAssistenteSchema();
  const lim = Math.min(100, Math.max(1, Number(limit) || 40));
  const busca = String(q || '').trim().slice(0, 80);

  if (!busca) {
    const rows = await prisma.$queryRaw`
      SELECT c."id", c."projetoId", c."empresaUnidadeId", c."modoPergunta", c."tom",
             c."frameworkFavorito", c."titulo", c."createdAt", c."updatedAt",
             (SELECT COUNT(*)::int FROM "AssistenteMensagem" m WHERE m."conversaId" = c."id") AS "qtdMensagens"
      FROM "AssistenteConversa" c
      WHERE c."usuarioId" = ${usuarioId}
      ORDER BY c."updatedAt" DESC
      LIMIT ${lim}
    `;
    return rows || [];
  }

  const pattern = `%${escaparLike(busca)}%`;
  const rows = await prisma.$queryRaw`
    SELECT c."id", c."projetoId", c."empresaUnidadeId", c."modoPergunta", c."tom",
           c."frameworkFavorito", c."titulo", c."createdAt", c."updatedAt",
           (SELECT COUNT(*)::int FROM "AssistenteMensagem" m WHERE m."conversaId" = c."id") AS "qtdMensagens"
    FROM "AssistenteConversa" c
    WHERE c."usuarioId" = ${usuarioId}
      AND (
        c."titulo" ILIKE ${pattern}
        OR EXISTS (
          SELECT 1 FROM "AssistenteMensagem" m
          WHERE m."conversaId" = c."id"
            AND m."content" ILIKE ${pattern}
        )
      )
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
    SELECT "id", "usuarioId", "projetoId", "empresaUnidadeId", "modoPergunta", "tom",
           "frameworkFavorito", "titulo", "createdAt", "updatedAt"
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

/**
 * Atualiza filtros da conversa (projeto/unidade blocantes + modo/tom/framework).
 */
export async function atualizarFiltrosConversaAssistente(usuarioId, conversaId, filtros = {}) {
  await ensureAssistenteSchema();
  const id = parseInt(conversaId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    const err = new Error('conversaId inválido');
    err.status = 400;
    throw err;
  }
  const f = normalizarFiltrosConversa(filtros);
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
  await prisma.$executeRaw`
    UPDATE "AssistenteConversa"
    SET "projetoId" = ${f.projetoId},
        "empresaUnidadeId" = ${f.empresaUnidadeId},
        "modoPergunta" = ${f.modoPergunta},
        "tom" = ${f.tom},
        "frameworkFavorito" = ${f.frameworkFavorito},
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${id}
  `;
  return { id, ...f };
}

export async function garantirConversaAssistente({
  usuarioId,
  conversaId = null,
  projetoId = null,
  empresaUnidadeId = null,
  modoPergunta = 'auto',
  tom = 'medio',
  frameworkFavorito = null,
  primeiraMensagem = ''
}) {
  await ensureAssistenteSchema();
  const f = normalizarFiltrosConversa({
    projetoId,
    empresaUnidadeId,
    modoPergunta,
    tom,
    frameworkFavorito
  });

  if (conversaId) {
    const id = parseInt(conversaId, 10);
    const conv = await prisma.$queryRaw`
      SELECT "id", "usuarioId", "projetoId", "empresaUnidadeId", "modoPergunta", "tom",
             "frameworkFavorito", "titulo"
      FROM "AssistenteConversa"
      WHERE "id" = ${id} AND "usuarioId" = ${usuarioId}
      LIMIT 1
    `;
    if (!conv?.[0]) {
      const err = new Error('Conversa não encontrada');
      err.status = 404;
      throw err;
    }
    await prisma.$executeRaw`
      UPDATE "AssistenteConversa"
      SET "projetoId" = ${f.projetoId},
          "empresaUnidadeId" = ${f.empresaUnidadeId},
          "modoPergunta" = ${f.modoPergunta},
          "tom" = ${f.tom},
          "frameworkFavorito" = ${f.frameworkFavorito},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${id}
    `;
    return { ...conv[0], ...f };
  }

  const titulo = tituloDeMensagem(primeiraMensagem);
  const inserted = await prisma.$queryRaw`
    INSERT INTO "AssistenteConversa"
      ("usuarioId", "projetoId", "empresaUnidadeId", "modoPergunta", "tom", "frameworkFavorito",
       "titulo", "createdAt", "updatedAt")
    VALUES
      (${usuarioId}, ${f.projetoId}, ${f.empresaUnidadeId}, ${f.modoPergunta}, ${f.tom},
       ${f.frameworkFavorito}, ${titulo}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING "id", "usuarioId", "projetoId", "empresaUnidadeId", "modoPergunta", "tom",
              "frameworkFavorito", "titulo"
  `;
  return inserted[0];
}

/**
 * Após a 1ª resposta, refina o título se ainda for genérico (#11).
 */
export async function refinarTituloConversaSeNecessario(conversaId, mensagemUsuario) {
  const id = Number(conversaId);
  if (!Number.isFinite(id) || id <= 0) return null;
  const novo = tituloDeMensagem(mensagemUsuario);
  if (!novo || novo === 'Nova conversa') return null;

  const rows = await prisma.$queryRaw`
    SELECT "titulo",
           (SELECT COUNT(*)::int FROM "AssistenteMensagem" m WHERE m."conversaId" = ${id}) AS "qtd"
    FROM "AssistenteConversa"
    WHERE "id" = ${id}
    LIMIT 1
  `;
  const row = rows?.[0];
  if (!row) return null;
  if (Number(row.qtd) > 4) return null;
  const atual = String(row.titulo || '');
  if (atual === novo) return atual;
  if (atual !== 'Nova conversa' && atual.length >= 20 && !/^\s*$/.test(atual)) {
    if (novo.length <= atual.length) return atual;
  }

  await prisma.$executeRaw`
    UPDATE "AssistenteConversa"
    SET "titulo" = ${novo}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${id}
  `;
  return novo;
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

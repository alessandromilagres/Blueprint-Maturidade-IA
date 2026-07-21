import { prisma } from '../lib/prisma.js';

export async function ensureAssistenteSchema(prismaClient = prisma) {
  try {
    await prismaClient.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AssistenteConversa" (
        "id" SERIAL PRIMARY KEY,
        "usuarioId" INTEGER NOT NULL,
        "projetoId" INTEGER,
        "titulo" TEXT NOT NULL DEFAULT 'Nova conversa',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prismaClient.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "AssistenteConversa_usuarioId_idx" ON "AssistenteConversa" ("usuarioId")'
    );
    await prismaClient.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "AssistenteConversa_usuarioId_updatedAt_idx" ON "AssistenteConversa" ("usuarioId", "updatedAt" DESC)'
    );

    await prismaClient.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AssistenteMensagem" (
        "id" SERIAL PRIMARY KEY,
        "conversaId" INTEGER NOT NULL,
        "role" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "fontesJson" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prismaClient.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "AssistenteMensagem_conversaId_idx" ON "AssistenteMensagem" ("conversaId")'
    );

    await prismaClient.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AssistenteChunk" (
        "id" SERIAL PRIMARY KEY,
        "escopo" TEXT NOT NULL DEFAULT 'global',
        "projetoId" INTEGER,
        "fonte" TEXT NOT NULL,
        "titulo" TEXT NOT NULL,
        "texto" TEXT NOT NULL,
        "embeddingJson" TEXT,
        "hashConteudo" TEXT,
        "relatorioId" INTEGER,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prismaClient.$executeRawUnsafe(
      'ALTER TABLE "AssistenteChunk" ADD COLUMN IF NOT EXISTS "relatorioId" INTEGER'
    );
    await prismaClient.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "AssistenteChunk_escopo_projetoId_idx" ON "AssistenteChunk" ("escopo", "projetoId")'
    );
    await prismaClient.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "AssistenteChunk_fonte_idx" ON "AssistenteChunk" ("fonte")'
    );
    await prismaClient.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "AssistenteChunk_relatorioId_idx" ON "AssistenteChunk" ("relatorioId")'
    );

    await prismaClient.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AssistenteFeedback" (
        "id" SERIAL PRIMARY KEY,
        "mensagemId" INTEGER NOT NULL,
        "conversaId" INTEGER,
        "usuarioId" INTEGER NOT NULL,
        "util" BOOLEAN NOT NULL,
        "motivo" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prismaClient.$executeRawUnsafe(
      'CREATE UNIQUE INDEX IF NOT EXISTS "AssistenteFeedback_mensagemId_usuarioId_key" ON "AssistenteFeedback" ("mensagemId", "usuarioId")'
    );
    await prismaClient.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "AssistenteFeedback_usuarioId_idx" ON "AssistenteFeedback" ("usuarioId")'
    );

    console.log('[schema] Assistente (conversa/mensagem/chunk/feedback) verificado.');
  } catch (e) {
    console.warn('[schema] Assistente:', e?.message || e);
  }
}

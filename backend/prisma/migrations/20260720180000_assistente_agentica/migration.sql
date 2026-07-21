-- Assistente Agentica: conversas, mensagens e chunks de RAG
CREATE TABLE IF NOT EXISTS "AssistenteConversa" (
  "id" SERIAL PRIMARY KEY,
  "usuarioId" INTEGER NOT NULL,
  "projetoId" INTEGER,
  "titulo" TEXT NOT NULL DEFAULT 'Nova conversa',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AssistenteConversa_usuarioId_idx"
  ON "AssistenteConversa" ("usuarioId");

CREATE INDEX IF NOT EXISTS "AssistenteConversa_usuarioId_updatedAt_idx"
  ON "AssistenteConversa" ("usuarioId", "updatedAt" DESC);

CREATE TABLE IF NOT EXISTS "AssistenteMensagem" (
  "id" SERIAL PRIMARY KEY,
  "conversaId" INTEGER NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "fontesJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AssistenteMensagem_conversaId_idx"
  ON "AssistenteMensagem" ("conversaId");

CREATE TABLE IF NOT EXISTS "AssistenteChunk" (
  "id" SERIAL PRIMARY KEY,
  "escopo" TEXT NOT NULL DEFAULT 'global',
  "projetoId" INTEGER,
  "fonte" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "texto" TEXT NOT NULL,
  "embeddingJson" TEXT,
  "hashConteudo" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AssistenteChunk_escopo_projetoId_idx"
  ON "AssistenteChunk" ("escopo", "projetoId");

CREATE INDEX IF NOT EXISTS "AssistenteChunk_fonte_idx"
  ON "AssistenteChunk" ("fonte");

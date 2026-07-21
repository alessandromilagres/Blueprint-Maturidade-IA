-- Feedback do Assistente Agentica (👍/👎)
CREATE TABLE IF NOT EXISTS "AssistenteFeedback" (
  "id" SERIAL PRIMARY KEY,
  "mensagemId" INTEGER NOT NULL,
  "conversaId" INTEGER,
  "usuarioId" INTEGER NOT NULL,
  "util" BOOLEAN NOT NULL,
  "motivo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "AssistenteFeedback_mensagemId_usuarioId_key"
  ON "AssistenteFeedback" ("mensagemId", "usuarioId");

CREATE INDEX IF NOT EXISTS "AssistenteFeedback_usuarioId_idx"
  ON "AssistenteFeedback" ("usuarioId");

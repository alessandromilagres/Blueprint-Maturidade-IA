-- Preferências persistentes do Assistente Agentica (projeto, unidade, framework, tom)
CREATE TABLE IF NOT EXISTS "AssistentePreferencia" (
  "id" SERIAL PRIMARY KEY,
  "usuarioId" INTEGER NOT NULL,
  "projetoPadraoId" INTEGER,
  "unidadePadraoId" INTEGER,
  "frameworkFavorito" TEXT,
  "tom" TEXT NOT NULL DEFAULT 'medio',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "AssistentePreferencia_usuarioId_key"
  ON "AssistentePreferencia" ("usuarioId");

-- Roadmap Visual Multi-Contexto — tabela de iniciativas (eixo polimórfico + amarração ao diagnóstico).
-- projetoVersaoId referencia a tabela raw "ProjetoVersao" (sem FK Prisma), mesmo padrão de ProdutoRegulatorioCiclo.

CREATE TABLE IF NOT EXISTS "Iniciativa" (
  "id"              SERIAL PRIMARY KEY,
  "projetoId"       INTEGER NOT NULL,
  "projetoVersaoId" INTEGER,
  "contextoTipo"    TEXT NOT NULL DEFAULT 'dimensao',
  "contextoId"      TEXT NOT NULL,
  "contextoRotulo"  TEXT,
  "titulo"          TEXT NOT NULL,
  "descricao"       TEXT,
  "responsavel"     TEXT,
  "dataInicio"      TIMESTAMP(3),
  "dataFimPrevista" TIMESTAMP(3),
  "dataFimReal"     TIMESTAMP(3),
  "status"          TEXT NOT NULL DEFAULT 'backlog',
  "prioridade"      TEXT NOT NULL DEFAULT 'media',
  "progresso"       INTEGER NOT NULL DEFAULT 0,
  "gapVinculado"      DOUBLE PRECISION,
  "scoreAlvo"         DOUBLE PRECISION,
  "roiEstimado"       DOUBLE PRECISION,
  "origemRelatorioId" INTEGER,
  "criadoPorId"     INTEGER,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Iniciativa_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Iniciativa_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Iniciativa_projetoId_contextoTipo_idx" ON "Iniciativa" ("projetoId", "contextoTipo");
CREATE INDEX IF NOT EXISTS "Iniciativa_projetoVersaoId_idx" ON "Iniciativa" ("projetoVersaoId");

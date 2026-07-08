-- Fase 4: iniciativas vinculadas a unidade organizacional
ALTER TABLE "Iniciativa" ADD COLUMN IF NOT EXISTS "empresaUnidadeId" INTEGER;

CREATE INDEX IF NOT EXISTS "Iniciativa_projetoId_empresaUnidadeId_idx"
  ON "Iniciativa" ("projetoId", "empresaUnidadeId");

-- Assistente RAG: coluna relatorioId para indexação incremental por RelatorioIA
ALTER TABLE "AssistenteChunk" ADD COLUMN IF NOT EXISTS "relatorioId" INTEGER;
CREATE INDEX IF NOT EXISTS "AssistenteChunk_relatorioId_idx" ON "AssistenteChunk" ("relatorioId");

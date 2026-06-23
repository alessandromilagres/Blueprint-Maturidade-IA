-- Semana 1 — módulo regulatório: meta ISO no projeto + snapshot por produto

ALTER TABLE "Projeto" ADD COLUMN IF NOT EXISTS "isoTargetScore" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "RegulatorySnapshot" (
    "id" SERIAL NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "projetoId" INTEGER NOT NULL,
    "isoScoreEstimado" DOUBLE PRECISION,
    "isoGapCount" INTEGER,
    "plRiscoNivel" TEXT,
    "lgpdRiscoNivel" TEXT,
    "isoDetalhes" JSONB,
    "plDetalhes" JSONB,
    "lgpdDetalhes" JSONB,
    "validadoConsultor" BOOLEAN NOT NULL DEFAULT false,
    "validadoEm" TIMESTAMP(3),
    "validadoPorUsuarioId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegulatorySnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RegulatorySnapshot_produtoId_key" ON "RegulatorySnapshot"("produtoId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RegulatorySnapshot_produtoId_fkey'
  ) THEN
    ALTER TABLE "RegulatorySnapshot"
      ADD CONSTRAINT "RegulatorySnapshot_produtoId_fkey"
      FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

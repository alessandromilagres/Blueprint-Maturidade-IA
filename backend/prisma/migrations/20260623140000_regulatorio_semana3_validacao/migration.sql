-- Semana 3 — validação consultor no snapshot regulatório

ALTER TABLE "RegulatorySnapshot" ADD COLUMN IF NOT EXISTS "pl2338Confirmado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RegulatorySnapshot" ADD COLUMN IF NOT EXISTS "plRiscoNivelConfirmado" TEXT;
ALTER TABLE "RegulatorySnapshot" ADD COLUMN IF NOT EXISTS "lgpdBaseLegal" TEXT;
ALTER TABLE "RegulatorySnapshot" ADD COLUMN IF NOT EXISTS "aipdStatus" TEXT DEFAULT 'nao_iniciada';
ALTER TABLE "RegulatorySnapshot" ADD COLUMN IF NOT EXISTS "isoOverride" JSONB;
ALTER TABLE "RegulatorySnapshot" ADD COLUMN IF NOT EXISTS "consultorNotas" TEXT;

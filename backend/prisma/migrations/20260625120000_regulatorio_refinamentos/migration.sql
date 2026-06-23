-- Refinamentos: LGPD override, evidências, vínculo ProjetoVersao

ALTER TABLE "RegulatorySnapshot" ADD COLUMN IF NOT EXISTS "lgpdRipdConfirmado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RegulatorySnapshot" ADD COLUMN IF NOT EXISTS "lgpdRipdOverride" BOOLEAN;

ALTER TABLE "ProdutoRegulatorioCiclo" ADD COLUMN IF NOT EXISTS "projetoVersaoId" INTEGER;

ALTER TABLE "ProdutoRegulatorioMitigacao" ADD COLUMN IF NOT EXISTS "evidencias" JSONB;

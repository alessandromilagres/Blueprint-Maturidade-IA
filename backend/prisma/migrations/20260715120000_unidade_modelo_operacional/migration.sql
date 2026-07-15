-- Modelo operacional da unidade (delivery | sustentacao | coe) para tradução de dimensões SATF.
ALTER TABLE "UnidadeEmpresa" ADD COLUMN IF NOT EXISTS "modeloOperacional" TEXT;
-- Overrides de métricas/proibições por dimensão (JSON) — multi-tenant.
ALTER TABLE "UnidadeEmpresa" ADD COLUMN IF NOT EXISTS "traducaoDimensoes" TEXT;

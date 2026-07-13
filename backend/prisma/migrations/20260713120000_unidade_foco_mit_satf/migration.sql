-- Dimensões em foco separadas por framework (MIT Blueprint vs SATF TI)
ALTER TABLE "UnidadeEmpresa" ADD COLUMN IF NOT EXISTS "dimensoesFocoSatf" TEXT;
ALTER TABLE "UnidadeEmpresa" ADD COLUMN IF NOT EXISTS "dimensoesFocoMit" TEXT;

-- Migra legado: códigos D* → SATF, BP* → MIT
UPDATE "UnidadeEmpresa"
SET "dimensoesFocoSatf" = "dimensoesFoco"
WHERE "dimensoesFocoSatf" IS NULL
  AND "dimensoesFoco" IS NOT NULL
  AND "dimensoesFoco" ~ '"D[0-9]';

UPDATE "UnidadeEmpresa"
SET "dimensoesFocoMit" = "dimensoesFoco"
WHERE "dimensoesFocoMit" IS NULL
  AND "dimensoesFoco" IS NOT NULL
  AND "dimensoesFoco" ~ '"BP';

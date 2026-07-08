-- Unidades organizacionais por empresa + vínculo opcional em Usuario

CREATE TABLE IF NOT EXISTS "UnidadeEmpresa" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL DEFAULT '',
    "descricao" TEXT,
    "dimensoesFoco" TEXT,
    "ehPadrao" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnidadeEmpresa_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UnidadeEmpresa_empresaId_codigo_key"
  ON "UnidadeEmpresa"("empresaId", "codigo");

CREATE INDEX IF NOT EXISTS "UnidadeEmpresa_empresaId_ativo_idx"
  ON "UnidadeEmpresa"("empresaId", "ativo");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UnidadeEmpresa_empresaId_fkey'
  ) THEN
    ALTER TABLE "UnidadeEmpresa"
      ADD CONSTRAINT "UnidadeEmpresa_empresaId_fkey"
      FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "empresaUnidadeId" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Usuario_empresaUnidadeId_fkey'
  ) THEN
    ALTER TABLE "Usuario"
      ADD CONSTRAINT "Usuario_empresaUnidadeId_fkey"
      FOREIGN KEY ("empresaUnidadeId") REFERENCES "UnidadeEmpresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "nivelPrioridadeMapeamentoMaturidade" INTEGER NOT NULL DEFAULT 3;

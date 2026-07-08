-- Vínculo de usuário à unidade organizacional (Fase 1 UnidadeEmpresa).
-- Execute como OWNER da tabela Usuario (ex.: role que criou o schema blueprint).

ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "empresaUnidadeId" INTEGER;

CREATE INDEX IF NOT EXISTS "Usuario_empresaUnidadeId_idx" ON "Usuario" ("empresaUnidadeId");

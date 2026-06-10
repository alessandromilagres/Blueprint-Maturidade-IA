-- Garante a coluna esperada pelo Prisma em "Usuario".
-- Execute como superusuário ou dono da tabela (ex.: psql -U postgres -d blueprint_ia -f fix-usuario-nivel-prioridade.sql)

ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "nivelPrioridadeMapeamentoMaturidade" INTEGER NOT NULL DEFAULT 1;

UPDATE "Usuario" SET "nivelPrioridadeMapeamentoMaturidade" = 1
WHERE "nivelPrioridadeMapeamentoMaturidade" IS DISTINCT FROM 1;

ALTER TABLE "Usuario" ALTER COLUMN "nivelPrioridadeMapeamentoMaturidade" SET DEFAULT 1;

-- Se o Prisma estiver com migração falha (P3018), na pasta backend:
--   npx prisma migrate resolve --rolled-back "20260513200000_usuario_nivel_prioridade_mapeamento_maturidade"
--   npx prisma migrate deploy

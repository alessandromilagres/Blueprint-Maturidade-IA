-- Todos os usuários passam a ter prioridade 1 no mapeamento de maturidade; novos registros também.
UPDATE "Usuario" SET "nivelPrioridadeMapeamentoMaturidade" = 1;
ALTER TABLE "Usuario" ALTER COLUMN "nivelPrioridadeMapeamentoMaturidade" SET DEFAULT 1;

-- Override opcional da tradução de dimensões (métricas/proibições) por unidade.
ALTER TABLE "UnidadeEmpresa" ADD COLUMN IF NOT EXISTS "traducaoDimensoes" TEXT;

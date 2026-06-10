-- Fase de idealização do produto (design sprint), anterior à especificação
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "idealizacaoProduto" JSONB;

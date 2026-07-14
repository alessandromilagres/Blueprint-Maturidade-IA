-- Papel opcional da unidade por dimensão (proprietario | consumidor | nao_se_aplica)
ALTER TABLE "UnidadeEmpresa" ADD COLUMN IF NOT EXISTS "dimensoesPapelSatf" TEXT;
ALTER TABLE "UnidadeEmpresa" ADD COLUMN IF NOT EXISTS "dimensoesPapelMit" TEXT;

-- Modelo de criação: convencional (cadastro por etapas) vs design_thinking (idealização / sprint)
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "modeloCriacao" TEXT NOT NULL DEFAULT 'convencional';

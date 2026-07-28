-- Filtros de escopo por conversa (blocantes + modo/tom/framework)
ALTER TABLE "AssistenteConversa" ADD COLUMN IF NOT EXISTS "empresaUnidadeId" INTEGER;
ALTER TABLE "AssistenteConversa" ADD COLUMN IF NOT EXISTS "modoPergunta" TEXT;
ALTER TABLE "AssistenteConversa" ADD COLUMN IF NOT EXISTS "tom" TEXT;
ALTER TABLE "AssistenteConversa" ADD COLUMN IF NOT EXISTS "frameworkFavorito" TEXT;

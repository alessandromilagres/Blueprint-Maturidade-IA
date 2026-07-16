-- Gestor multi-unidade: IDs de unidades governadas (JSON array em TEXT)
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "unidadesGovernadasIds" TEXT;

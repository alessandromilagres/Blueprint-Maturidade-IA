-- Desejos IA em tabela dedicada (evita ALTER na tabela "Avaliacao" quando o usuário do app não é owner)
CREATE TABLE IF NOT EXISTS "AvaliacaoDesejosIA" (
    "id" SERIAL NOT NULL,
    "avaliacaoId" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AvaliacaoDesejosIA_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AvaliacaoDesejosIA_avaliacaoId_key" ON "AvaliacaoDesejosIA"("avaliacaoId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AvaliacaoDesejosIA_avaliacaoId_fkey'
  ) THEN
    ALTER TABLE "AvaliacaoDesejosIA"
      ADD CONSTRAINT "AvaliacaoDesejosIA_avaliacaoId_fkey"
      FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

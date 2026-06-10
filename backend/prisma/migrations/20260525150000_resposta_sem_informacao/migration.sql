-- Marca perguntas que o avaliador declarou não ter informação para responder.
-- Essas respostas não entram no score (pontuacao permanece NULL), mas contam como justificadas no progresso.
ALTER TABLE "Resposta" ADD COLUMN IF NOT EXISTS "semInformacao" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Resposta"
SET "semInformacao" = false
WHERE "semInformacao" IS DISTINCT FROM false;

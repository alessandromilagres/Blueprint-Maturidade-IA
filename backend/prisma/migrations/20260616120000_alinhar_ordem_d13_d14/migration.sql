-- Alinha ordem D13/D14 ao framework oficial (idempotente).
UPDATE "Area"
SET ordem = CASE
  WHEN nome = 'Plataforma e Industrialização de IA' THEN 13
  WHEN nome = 'IA como Gerador de Receita' THEN 14
  ELSE ordem
END
WHERE nome IN ('Plataforma e Industrialização de IA', 'IA como Gerador de Receita');

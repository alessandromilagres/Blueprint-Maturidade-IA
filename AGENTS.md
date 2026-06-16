# Instruções para agentes — Blueprint IA

## Deploy de versionamento de projetos

Antes de liberar produção com as mudanças de **versionamento de projetos** (checklist de fechamento, resumo por versão, comparativo visual, reabrir versão, export ZIP), rode o validador obrigatório.

### Validador obrigatório (somente leitura)

```bash
cd backend
API_BASE_URL="https://SEU-DOMINIO/api" \
VALIDATOR_EMAIL="usuario-admin@empresa.com" \
VALIDATOR_PASSWORD="senha" \
npm run validate:versioning
```

### Validador recomendado (teste mutável controlado)

Cria um projeto temporário, testa fechar/criar/reabrir versão e remove o projeto ao final.

```bash
cd backend
API_BASE_URL="https://SEU-DOMINIO/api" \
VALIDATOR_EMAIL="usuario-admin@empresa.com" \
VALIDATOR_PASSWORD="senha" \
npm run validate:versioning -- --mutate
```

### Critério de aceite

- O JSON final deve ter `"ok": true`.
- Se `"ok": false`, **não faça deploy** até corrigir os checks com falha.
- Warnings não bloqueiam sozinhos; leia o campo `warnings` no JSON.

### O que o validador cobre

- Tabelas: `ProjetoVersao`, `ProjetoVersaoAvaliacao`, `ProjetoVersaoConvite`, `AvaliacaoEvento`
- Login na API
- Payload de versões (`checklistFechamento`, `resumoExecutivo`, `avaliacaoIds`)
- Dashboard filtrado por `versaoId`
- Export ZIP: `GET /api/exportar/versao/:projetoId/:versaoId/zip`
- Com `--mutate`: ciclo completo de versão em projeto temporário

### Documentação completa

Ver `docs/VALIDADOR_VERSIONAMENTO_PRODUCAO.md`.

### Arquivos principais da feature

- `backend/src/index.js` — rotas e lógica de versão
- `backend/src/routes/exportacao.js` — export ZIP da versão
- `backend/scripts/validate-versioning-production.js` — script do validador
- `frontend/src/pages/ProjetoDetalhe.jsx` — UI de versões
- `frontend/src/pages/EvolucaoProjeto.jsx` — comparativo visual

### Produção (referência)

- URL: `https://agentica.sysmap.com.br`
- API: `https://agentica.sysmap.com.br/api`
- Manual CI/CD: `docs/MANUAL_CICD_AZURE_DEVOPS.md`

---

## Deploy em produção — migração `Area.ordem` D13/D14 (item 4)

**Agente de implantação: leia antes de subir esta release.**

### O que é

Migração Prisma: `backend/prisma/migrations/20260616120000_alinhar_ordem_d13_d14/migration.sql`

```sql
UPDATE "Area" SET ordem = CASE
  WHEN nome = 'Plataforma e Industrialização de IA' THEN 13
  WHEN nome = 'IA como Gerador de Receita' THEN 14
  ELSE ordem END
WHERE nome IN ('Plataforma e Industrialização de IA', 'IA como Gerador de Receita');
```

### O que NÃO muda (pode subir sem medo de “estragar nota”)

- **Não altera scores**, avaliações, respostas nem médias de maturidade.
- **Não recalcula** books já salvos na biblioteca.
- O código já força a ordem canônica via `ORDEM_DIMENSOES_FRAMEWORK`; esta migração só alinha o **cadastro** `Area.ordem` no banco.

### O que fazer no deploy (fluxo normal)

1. Seguir o pipeline habitual (`docker compose up -d --build` → `prisma migrate deploy`).
2. **Antes** do deploy, conferir status das migrações:
   ```bash
   docker exec blueprint-ia-backend-prod npx prisma migrate status
   ```
3. Se houver migração **failed** no histórico (erro Prisma **P3009**), **não ignore**: resolva o estado da migração pendente/falha **antes** de aplicar esta. Caso contrário `migrate deploy` **não aplica nada novo** e o deploy pode parecer ok enquanto o banco fica desalinhado.
4. Após deploy, validar (opcional, somente leitura):
   ```sql
   SELECT nome, ordem FROM "Area"
   WHERE nome IN ('Plataforma e Industrialização de IA', 'IA como Gerador de Receita')
   ORDER BY ordem;
   ```
   Esperado: Plataforma = **13**, IA como Gerador de Receita = **14**.

### O que NÃO fazer

- **Não** rodar SQL manual “por garantia” se `migrate deploy` já passou com sucesso (a migração é idempotente, mas duplicar passos aumenta risco operacional).
- **Não** trocar ordem de outras áreas nem editar `ordem` em massa.
- **Não** abortar a release achando que D13/D14 invertido muda nota de quem já avaliou — **não muda**.
- **Não** usar `prisma migrate reset` em produção.

### Se `migrate deploy` falhar nesta migração

Causa provável: nomes das áreas em produção **diferentes** dos esperados (acento, espaço, texto antigo).

1. Conferir nomes reais: `SELECT id, nome, ordem FROM "Area" WHERE ordem IN (13, 14) OR nome ILIKE '%plataforma%' OR nome ILIKE '%gerador%';`
2. Se os nomes baterem com o SQL acima, reaplicar só via `prisma migrate deploy` (ou migration corretiva com os nomes exatos de produção — **não** alterar o arquivo já versionado sem novo PR).
3. Registrar no log do deploy o resultado de `migrate status`.

### Referência de código

- `backend/prisma/migrations/20260616120000_alinhar_ordem_d13_d14/migration.sql`
- `backend/src/utils/ordemDimensoesFramework.js`
- `backend/prisma/seed.js` (ordem 13/14 já correta para ambientes novos)

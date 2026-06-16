# Manual de CI/CD com Azure DevOps

**Sistema:** Blueprint IA / Blueprint Agêntico
**Ambiente:** Produção Azure
**Pipeline:** Azure DevOps
**Versão:** Junho/2026

---

## 1. Objetivo

Este manual descreve o processo de CI/CD do Blueprint IA vinculado ao Azure DevOps, cobrindo validação, versionamento, Pull Request, pipeline de produção, deploy na VM Azure, variáveis, monitoramento e procedimentos de contingência.

O fluxo oficial de produção usa:

- Repositório Azure DevOps: `app-agentica`
- Branch principal: `main`
- Pipeline: `azure-pipelines.yml`
- Azure VM: `vm-app-prod`
- Resource Group: `rg-blueagentic-devops-prod`
- Diretório de deploy: `/mnt/dados/blueprint-agentica`
- URL pública: `https://agentica.sysmap.com.br`

---

## 2. Visão Geral do Fluxo

```text
Desenvolvimento local
      ↓
Validação local / sandbox
      ↓
Commit em branch release/*
      ↓
Push para Azure DevOps
      ↓
Pull Request para main
      ↓
Merge aprovado
      ↓
Pipeline Azure DevOps
      ↓
Azure CLI executa comando remoto na VM
      ↓
git pull/reset em /mnt/dados/blueprint-agentica
      ↓
docker compose up -d --build
      ↓
Prisma migrate deploy
      ↓
Smoke test de API e frontend
```

---

## 3. Componentes Envolvidos

### 3.1 Repositório

O código-fonte fica no Azure DevOps em:

```text
https://dev.azure.com/sysmap-devops/Blueprint Agentica/_git/app-agentica
```

Branches usadas:

- `main`: branch de produção.
- `release/prd-*`: branches temporárias de release.
- `hotfix/*`: correções urgentes, quando necessário.

### 3.2 Pipeline

Arquivo principal:

```text
azure-pipelines.yml
```

O pipeline é configurado com:

```yaml
trigger:
- main
```

Isso significa que alterações mergeadas em `main` podem disparar a pipeline automaticamente. Quando o disparo automático não ocorrer, a pipeline pode ser iniciada manualmente pelo Azure DevOps ou Azure CLI.

### 3.3 Infraestrutura de Produção

Produção roda em VM Azure com Docker Compose:

```text
Resource Group: rg-blueagentic-devops-prod
VM: vm-app-prod
Deploy path: /mnt/dados/blueprint-agentica
URL: https://agentica.sysmap.com.br
```

Serviços Docker:

- `blueprint-ia-db-prod`: PostgreSQL 16
- `blueprint-ia-backend-prod`: Node.js / Express / Prisma
- `blueprint-ia-frontend-prod`: React build servido por Nginx/HTTPS

Arquivo de orquestração:

```text
docker-compose.prod.yml
```

---

## 4. Variáveis e Segredos

### 4.1 Variable Group

O pipeline usa o Variable Group:

```text
blueprint-agentica-secrets
```

Esse grupo deve fornecer os segredos vindos do Key Vault ou variáveis protegidas:

- `azureTenantId`
- `azureClientId`
- `azureClientSecret`

Esses valores são usados para configuração de envio de e-mail via Microsoft Graph.

### 4.2 Variáveis Não Sensíveis no Pipeline

Definidas em `azure-pipelines.yml`:

```text
resourceGroupName=rg-blueagentic-devops-prod
vmName=vm-app-prod
deployPath=/mnt/dados/blueprint-agentica
emailProvider=graph
mailSenderAddress=blueprint.agentica@sysmap.com.br
baseUrl=https://agentica.sysmap.com.br
```

### 4.3 Variáveis do `.env` na VM

Durante o deploy, o pipeline atualiza o `.env` remoto com:

- `EMAIL_PROVIDER`
- `MAIL_SENDER_ADDRESS`
- `BASE_URL`
- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`

O arquivo `.env` da VM também deve conter as variáveis persistentes da aplicação, como:

- `DATABASE_URL`
- `JWT_SECRET`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `ANTHROPIC_API_KEY`, quando usado por ambiente
- `OPENAI_API_KEY`, quando usado por ambiente
- `AI_PROVIDER`
- variáveis de SMTP, se SMTP for usado

Observação: as chaves de IA também podem ser persistidas pelo painel administrativo no banco de dados, reduzindo perda após restart/deploy.

### 4.4 Regras de Segurança

- Nunca escrever secrets em texto puro no repositório.
- Nunca commitar `.env`, `.env.azure` ou credenciais.
- Usar Variable Group/Key Vault para secrets.
- Conferir logs da pipeline para garantir que secrets estão mascarados.
- Remover tokens de URLs remotas após `git pull`, como o pipeline já faz.

---

## 5. Validação Antes do Deploy

Antes de abrir PR para produção, execute:

```sh
./scripts/sandbox-verify.sh
```

O script faz:

1. Build do frontend:

```sh
cd frontend && npm run build
```

2. Checagem de sintaxe do backend:

```sh
cd backend && node --check src/index.js
```

3. Validação do schema Prisma:

```sh
cd backend && npx prisma validate
```

Também é recomendado executar:

```sh
git diff --check
```

Esse comando identifica espaços/trailing whitespace que podem quebrar políticas de revisão.

### 5.1 Validador de versionamento de projetos (obrigatório quando a release incluir versionamento)

Se a release incluir versionamento de projetos, execute também:

```sh
cd backend
API_BASE_URL="https://agentica.sysmap.com.br/api" \
VALIDATOR_EMAIL="usuario-admin@empresa.com" \
VALIDATOR_PASSWORD="senha" \
npm run validate:versioning
```

Recomendado (teste mutável controlado em projeto temporário):

```sh
npm run validate:versioning -- --mutate
```

Critério de aceite: JSON final com `"ok": true`. Se `"ok": false`, não abra PR nem faça deploy.

Documentação: `docs/VALIDADOR_VERSIONAMENTO_PRODUCAO.md` e `AGENTS.md`.

---

## 6. Processo de Release

### 6.1 Preparar Branch

Crie uma branch de release a partir de `origin/main`:

```sh
git fetch origin main
git checkout -B release/prd-AAAAMMDD origin/main
```

Inclua apenas arquivos do Blueprint IA relacionados à release.

Evite incluir:

- Arquivos temporários
- Cópias locais de documentos
- `.github/` não relacionado ao Blueprint
- Diretórios de outro projeto, como `cavaleiro-sombrio/`
- Artefatos de build
- `.env` ou arquivos com credenciais

### 6.2 Commit

Use mensagens objetivas:

```text
feat: adiciona auditoria de avaliadores e comparativo executivo
fix: corrige exportação da nota da avaliação
docs: atualiza documentação operacional
```

### 6.3 Pull Request

Abra Pull Request da branch `release/prd-*` para `main`.

O PR deve informar:

- Resumo das mudanças
- Impacto esperado
- Testes executados
- Riscos de deploy
- Se há migração Prisma
- Se há alteração em variáveis de ambiente

### 6.4 Merge

Após aprovação, complete o PR com squash merge quando aplicável. O merge em `main` é o gatilho esperado para produção.

---

## 7. Pipeline Azure DevOps

### 7.1 Estrutura

O pipeline possui um estágio principal:

```text
Deploy
```

Job:

```text
DeployToVM
```

Tipo:

```text
deployment
```

Environment:

```text
production
```

### 7.2 Service Connection

O pipeline usa a service connection:

```text
sc-azure-wif-infra-devops
```

Ela permite executar Azure CLI contra a assinatura/recurso da VM.

### 7.3 Passos Executados

O pipeline:

1. Faz checkout do repositório.
2. Monta `REPO_URL` com `System.AccessToken`.
3. Executa `az vm run-command invoke`.
4. Na VM, valida se `/mnt/dados` está montado.
5. Clona ou atualiza o repositório em `/mnt/dados/blueprint-agentica`.
6. Executa `git fetch --all`.
7. Executa `git reset --hard origin/main`.
8. Remove token da URL remota.
9. Atualiza variáveis de e-mail no `.env`.
10. Para containers antigos.
11. Sobe containers com build:

```sh
docker compose -f docker-compose.prod.yml up -d --build
```

12. Aguarda inicialização.
13. Executa migrações:

```sh
docker exec blueprint-ia-backend-prod npx prisma migrate deploy
```

14. Limpa imagens antigas.
15. Mostra status dos containers.

---

## 8. Docker Compose de Produção

Arquivo:

```text
docker-compose.prod.yml
```

### 8.1 Banco de Dados

Serviço:

```text
postgres
```

Container:

```text
blueprint-ia-db-prod
```

Dados persistidos em:

```text
/mnt/dados/volumes/postgres_data_prod
```

### 8.2 Backend

Serviço:

```text
backend
```

Container:

```text
blueprint-ia-backend-prod
```

Porta interna:

```text
3001
```

Health check:

```text
http://localhost:3001/api/health
```

### 8.3 Frontend

Serviço:

```text
frontend
```

Container:

```text
blueprint-ia-frontend-prod
```

Portas:

```text
80
443
```

SSL montado em:

```text
./ssl:/etc/nginx/ssl:ro
```

---

## 9. Smoke Test Pós-Deploy

Após pipeline bem-sucedida, valide:

### 9.1 API

```sh
curl -ksS https://agentica.sysmap.com.br/api/health
```

Resultado esperado:

```json
{"status":"ok","timestamp":"..."}
```

### 9.2 Frontend

```sh
curl -ksS -I https://agentica.sysmap.com.br/
```

Resultado esperado:

```text
HTTP/2 200
```

### 9.3 Validações Funcionais Recomendadas

- Login administrativo.
- Abertura do dashboard inicial.
- Listagem de empresas/projetos.
- Abertura de `/api/health`.
- Envio/teste de e-mail quando a release mexer em convites.
- Geração de relatório IA quando a release mexer em IA.
- Abertura de avaliação por magic link quando a release mexer em convites.

### 9.4 Validador de versionamento (quando a release incluir versionamento)

```sh
cd backend
API_BASE_URL="https://agentica.sysmap.com.br/api" \
VALIDATOR_EMAIL="usuario-admin@empresa.com" \
VALIDATOR_PASSWORD="senha" \
npm run validate:versioning
```

Opcional, mais completo:

```sh
npm run validate:versioning -- --mutate
```

Critério de aceite: `"ok": true` no JSON impresso.

---

## 10. Monitoramento e Diagnóstico

### 10.1 Azure DevOps

Verifique:

- Status da pipeline
- Logs do step `Deploy via git pull na VM`
- Resultado do `docker compose ps`
- Erros durante `prisma migrate deploy`

### 10.2 VM / Docker

Na VM, comandos úteis:

```sh
cd /mnt/dados/blueprint-agentica
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f --tail=100
docker logs blueprint-ia-backend-prod --tail=100
docker logs blueprint-ia-frontend-prod --tail=100
docker logs blueprint-ia-db-prod --tail=100
```

### 10.3 Banco de Dados

Validar migrações:

```sh
docker exec blueprint-ia-backend-prod npx prisma migrate status
```

Aplicar migrações manualmente, se necessário:

```sh
docker exec blueprint-ia-backend-prod npx prisma migrate deploy
```

---

## 11. Rollback

### 11.1 Rollback por Git

Identifique o último commit estável em `main` e crie uma branch/hotfix revertendo a mudança problemática.

Fluxo recomendado:

```sh
git checkout -B hotfix/rollback-AAAAMMDD origin/main
git revert <commit_problematico>
git push origin hotfix/rollback-AAAAMMDD
```

Abra PR para `main` e execute a pipeline normalmente.

### 11.2 Rollback Emergencial na VM

Em caso crítico, na VM:

```sh
cd /mnt/dados/blueprint-agentica
git fetch --all
git reset --hard <commit_estavel>
docker compose -f docker-compose.prod.yml up -d --build
docker exec blueprint-ia-backend-prod npx prisma migrate deploy || true
```

Use esse caminho apenas em emergência, pois ele foge do fluxo auditável do Azure DevOps.

### 11.3 Banco de Dados

Prisma migrations normalmente são forward-only. Antes de rollback com alteração de schema:

- Avalie se a aplicação antiga é compatível com o schema novo.
- Faça backup antes de alterações manuais.
- Evite apagar dados.
- Prefira uma migration corretiva.

---

## 12. Backup

O banco usa volume persistente em:

```text
/mnt/dados/volumes/postgres_data_prod
```

O `docker-compose.prod.yml` também monta:

```text
./backups:/backups
```

Exemplo de backup manual:

```sh
docker exec blueprint-ia-db-prod pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

Antes de releases com migração sensível, faça backup e confirme que o arquivo foi gerado.

---

## 13. Scripts Auxiliares

### 13.1 `scripts/sandbox-verify.sh`

Script oficial de validação local antes de release.

### 13.2 `backend/scripts/validate-versioning-production.js`

Validador de versionamento de projetos para pré-deploy e pós-deploy.

Comando:

```sh
cd backend && npm run validate:versioning
```

Ver `docs/VALIDADOR_VERSIONAMENTO_PRODUCAO.md` e `AGENTS.md`.

### 13.3 `scripts/deploy-vm.sh`

Script legado/operacional para deploy direto via SSH na VM.

Útil para:

- Setup inicial
- Backup
- Logs
- Restart
- Deploy direto controlado

O fluxo preferencial de produção é o Azure DevOps.

### 13.4 `scripts/deploy-azure.sh`

Script de provisionamento/deploy em outros modelos Azure, como Container Instances/Container Apps.

Não é o fluxo principal da produção atual, que usa VM + Docker Compose.

---

## 14. Troubleshooting

| Problema | Causa provável | Ação |
|----------|----------------|------|
| Pipeline não inicia após merge | Trigger não executou ou fila do agente | Disparar manualmente a pipeline em `main`. |
| Pipeline fica `notStarted` | Fila/agent indisponível | Aguardar ou verificar capacidade do Azure DevOps. |
| Backend reinicia | Erro de runtime, env ausente ou migration | Ver logs do backend e status do Prisma. |
| Frontend não sobe | Backend healthcheck falhou ou Nginx/SSL | Ver `docker compose ps` e logs do frontend/backend. |
| `prisma migrate deploy` falha | Schema/migration incompatível | Ver logs, corrigir migration ou aplicar hotfix. |
| E-mail não envia | Graph/SMTP inválido ou secret ausente | Ver Variable Group, `.env` e teste de e-mail. |
| API retorna 502/erro | Backend fora do ar | Ver container backend e healthcheck. |
| Site abre versão antiga | Cache/CDN/browser | Validar `last-modified`, hard refresh e Cloudflare se aplicável. |
| Certificado HTTPS falha | Certificado ausente/expirado | Ver volume `ssl` e configuração Nginx. |

---

## 15. Checklist de Release

Antes do PR:

- [ ] `git status` revisado.
- [ ] Arquivos temporários excluídos.
- [ ] Secrets não commitados.
- [ ] `./scripts/sandbox-verify.sh` executado.
- [ ] `npm run validate:versioning` com `"ok": true` (se release incluir versionamento).
- [ ] `git diff --check` sem erros.
- [ ] Migrações Prisma revisadas, se houver.
- [ ] Variáveis de ambiente documentadas, se houver mudança.

Durante o PR:

- [ ] Título e descrição claros.
- [ ] Testes informados.
- [ ] Riscos informados.
- [ ] Aprovação registrada.
- [ ] Squash/merge concluído em `main`.

Após o deploy:

- [ ] Pipeline `succeeded`.
- [ ] `/api/health` retorna `200`.
- [ ] Frontend retorna `200`.
- [ ] Containers estão `healthy`.
- [ ] Logs sem erro crítico.
- [ ] Funcionalidade principal da release testada.
- [ ] Validador de versionamento executado com `"ok": true` (se aplicável).

---

## 16. Referências

- `AGENTS.md`
- `azure-pipelines.yml`
- `docker-compose.prod.yml`
- `scripts/sandbox-verify.sh`
- `scripts/deploy-vm.sh`
- `scripts/deploy-azure.sh`
- `backend/scripts/validate-versioning-production.js`
- `docs/VALIDADOR_VERSIONAMENTO_PRODUCAO.md`
- `docs/COMO_SISTEMA_FUNCIONA.md`
- `docs/MANUAL_USUARIO_ADMINISTRADOR.md`

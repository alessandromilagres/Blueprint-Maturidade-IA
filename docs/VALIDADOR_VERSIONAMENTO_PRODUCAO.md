# Validador de Versionamento de Projetos

Use este validador antes de subir a funcionalidade de versões para produção, ou logo após o deploy, para conferir schema, API e exports.

## O Que Ele Valida

- Tabelas obrigatórias: `ProjetoVersao`, `ProjetoVersaoAvaliacao`, `ProjetoVersaoConvite`, `AvaliacaoEvento`.
- Colunas mínimas necessárias para versionamento, auditoria e vínculos.
- Login na API.
- Listagem de projetos e versões.
- Payload das versões com `checklistFechamento`, `resumoExecutivo` e `avaliacaoIds`.
- Dashboard filtrado por `versaoId`.
- Exportação ZIP da versão com:
  - resumo executivo
  - dashboard em Markdown
  - análise de avaliações (CSV)
  - plano de ação real da versão
  - relatório executivo
  - relatórios IA em cache, quando existirem
- Opcionalmente, ciclo mutável completo em projeto temporário: criar projeto, fechar versão, criar próxima, reabrir versão e apagar o projeto temporário.

## Comando Somente Leitura

```bash
cd backend
API_BASE_URL="https://SEU-DOMINIO/api" \
VALIDATOR_EMAIL="usuario-admin@empresa.com" \
VALIDATOR_PASSWORD="senha" \
npm run validate:versioning
```

## Comando Com Teste Mutável Controlado

Este modo cria um projeto temporário na primeira empresa disponível e remove ao final.

```bash
cd backend
API_BASE_URL="https://SEU-DOMINIO/api" \
VALIDATOR_EMAIL="usuario-admin@empresa.com" \
VALIDATOR_PASSWORD="senha" \
npm run validate:versioning -- --mutate
```

Também funciona com:

```bash
VALIDATOR_MUTATION=1 npm run validate:versioning
```

## Resultado Esperado

O script imprime um JSON. Para liberar o deploy, o campo principal deve ser:

```json
{
  "ok": true
}
```

Se `ok` vier `false`, não suba para produção sem corrigir os checks com `ok: false`.

Warnings não bloqueiam por si só. Exemplo comum: o modo somente leitura não encontrou projeto com versões e sugere rodar `--mutate`.

## Mensagem Para Outro Agente

```text
Antes de liberar produção, rode o validador de versionamento:

cd backend
API_BASE_URL="https://SEU-DOMINIO/api" \
VALIDATOR_EMAIL="usuario-admin@empresa.com" \
VALIDATOR_PASSWORD="senha" \
npm run validate:versioning

Se possível, rode também o teste mutável controlado:

API_BASE_URL="https://SEU-DOMINIO/api" \
VALIDATOR_EMAIL="usuario-admin@empresa.com" \
VALIDATOR_PASSWORD="senha" \
npm run validate:versioning -- --mutate

Critério de aceite: JSON final com "ok": true.
Se "ok": false, revisar os checks quebrados antes do deploy.
```

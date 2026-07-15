#!/usr/bin/env bash
# Rotaciona AZURE_CLIENT_SECRET do Microsoft Graph e aplica em PRD.
#
# Pré-requisito: az login (conta com permissão no App Registration + VM/pipeline).
#
# Uso:
#   ./scripts/rotate-azure-graph-secret-prd.sh
#   # ou, se já criou o secret no Portal:
#   NEW_AZURE_CLIENT_SECRET='valor-da-chave' ./scripts/rotate-azure-graph-secret-prd.sh --skip-reset
#
set -euo pipefail

APP_ID="${AZURE_APP_ID:-9f1c09b6-705d-41c3-b493-867413194780}"
ORG="https://dev.azure.com/sysmap-devops"
PROJECT="Blueprint Agentica"
VG_NAME="blueprint-agentica-secrets"
RG="rg-blueagentic-devops-prod"
VM="vm-app-prod"
DEPLOY_PATH="/mnt/dados/blueprint-agentica"
SKIP_RESET=false

for arg in "$@"; do
  case "$arg" in
    --skip-reset) SKIP_RESET=true ;;
    -h|--help)
      sed -n '1,12p' "$0"
      exit 0
      ;;
    *) echo "Opção desconhecida: $arg" >&2; exit 1 ;;
  esac
done

echo ">>> Verificando login Azure..."
if ! az account show -o none 2>/dev/null; then
  echo ">>> Rode: az login"
  az login
fi

NEW_SECRET="${NEW_AZURE_CLIENT_SECRET:-}"

if [ "$SKIP_RESET" = false ] && [ -z "$NEW_SECRET" ]; then
  echo ">>> Gerando novo client secret no App Registration ${APP_ID}..."
  NEW_SECRET=$(az ad app credential reset \
    --id "$APP_ID" \
    --display-name "blueprint-prd-$(date +%Y%m%d)" \
    --years 2 \
    --query password -o tsv)
  echo ">>> Nova chave gerada (guarde em local seguro — não será exibida de novo)."
elif [ -z "$NEW_SECRET" ]; then
  echo "ERRO: defina NEW_AZURE_CLIENT_SECRET ou omita --skip-reset para gerar via az." >&2
  exit 1
fi

echo ">>> Atualizando Variable Group ${VG_NAME} (azureClientSecret)..."
if ! az devops project list --organization "$ORG" -o none 2>/dev/null; then
  echo ">>> Autentique no DevOps: az devops login --organization $ORG"
  az devops login --organization "$ORG"
fi

VG_ID=$(az pipelines variable-group list \
  --organization "$ORG" \
  --project "$PROJECT" \
  --query "[?name=='${VG_NAME}'].id" -o tsv)

if [ -z "$VG_ID" ]; then
  echo "ERRO: Variable Group ${VG_NAME} não encontrado. Atualize manualmente no Azure DevOps." >&2
  exit 1
fi

az pipelines variable-group variable update \
  --group-id "$VG_ID" \
  --name azureClientSecret \
  --secret true \
  --value "$NEW_SECRET" \
  --organization "$ORG" \
  --project "$PROJECT" \
  -o none

echo ">>> Aplicando secret na VM (${VM}) e reiniciando backend..."
az vm run-command invoke \
  --resource-group "$RG" \
  --name "$VM" \
  --command-id RunShellScript \
  --scripts "
    set -e
    ENV_FILE='${DEPLOY_PATH}/.env'
    touch \"\$ENV_FILE\"
    grep -v '^AZURE_CLIENT_SECRET=' \"\$ENV_FILE\" > \"\${ENV_FILE}.tmp\" || true
    mv \"\${ENV_FILE}.tmp\" \"\$ENV_FILE\"
    printf 'AZURE_CLIENT_SECRET=%s\\n' '${NEW_SECRET}' >> \"\$ENV_FILE\"
    chmod 600 \"\$ENV_FILE\"
    cd '${DEPLOY_PATH}'
    docker compose -f docker-compose.prod.yml up -d --force-recreate blueprint-ia-backend-prod
    sleep 8
    docker compose -f docker-compose.prod.yml ps blueprint-ia-backend-prod
  " -o none

echo ">>> Teste (requer token admin): POST /api/email/test com destinatario=seu@email"
echo ">>> Ou reenvie um convite na UI."
echo ">>> OK — Graph secret rotacionado e backend reiniciado."

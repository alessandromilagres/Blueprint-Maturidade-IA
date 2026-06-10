#!/bin/bash

# ============================================
# Blueprint IA - Script de Deploy para Azure
# ============================================
# Este script automatiza o deploy do Blueprint IA no Azure
#
# Pré-requisitos:
# 1. Azure CLI instalado e autenticado (az login)
# 2. Docker instalado
# 3. Arquivo .env configurado
#
# Uso:
#   ./scripts/deploy-azure.sh [opção]
#
# Opções:
#   setup     - Configura recursos Azure (primeira vez)
#   build     - Constrói e envia imagens Docker
#   deploy    - Faz deploy das imagens
#   all       - Executa setup, build e deploy
#   logs      - Mostra logs dos containers
#   status    - Mostra status dos recursos
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Carrega variáveis de ambiente
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Configurações padrão
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-blueprint-ia-rg}"
LOCATION="${AZURE_LOCATION:-eastus}"
ACR_NAME="${ACR_NAME:-blueprintiaacr}"
APP_NAME="${APP_NAME:-blueprint-ia}"

# Funções de utilidade
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# Verifica pré-requisitos
# ============================================
check_prerequisites() {
    log_info "Verificando pré-requisitos..."
    
    # Verifica Azure CLI
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI não encontrado. Instale em: https://docs.microsoft.com/cli/azure/install-azure-cli"
        exit 1
    fi
    
    # Verifica Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker não encontrado. Instale em: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Verifica login Azure
    if ! az account show &> /dev/null; then
        log_error "Não autenticado no Azure. Execute: az login"
        exit 1
    fi
    
    log_success "Pré-requisitos verificados!"
}

# ============================================
# Setup inicial dos recursos Azure
# ============================================
setup_azure() {
    log_info "Configurando recursos Azure..."
    
    # Cria Resource Group
    log_info "Criando Resource Group: $RESOURCE_GROUP"
    az group create \
        --name $RESOURCE_GROUP \
        --location $LOCATION \
        --output none
    
    # Cria Azure Container Registry
    log_info "Criando Azure Container Registry: $ACR_NAME"
    az acr create \
        --resource-group $RESOURCE_GROUP \
        --name $ACR_NAME \
        --sku Basic \
        --admin-enabled true \
        --output none
    
    # Obtém credenciais do ACR
    ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)
    ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username --output tsv)
    ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv)
    
    # Cria Azure Database for PostgreSQL Flexible Server
    log_info "Criando Azure Database for PostgreSQL..."
    
    DB_SERVER_NAME="${APP_NAME}-db"
    DB_ADMIN_USER="${POSTGRES_USER:-blueprint}"
    DB_ADMIN_PASSWORD="${POSTGRES_PASSWORD:-$(openssl rand -base64 24)}"
    
    az postgres flexible-server create \
        --resource-group $RESOURCE_GROUP \
        --name $DB_SERVER_NAME \
        --location $LOCATION \
        --admin-user $DB_ADMIN_USER \
        --admin-password $DB_ADMIN_PASSWORD \
        --sku-name Standard_B1ms \
        --tier Burstable \
        --storage-size 32 \
        --version 16 \
        --public-access 0.0.0.0 \
        --output none
    
    # Cria database
    az postgres flexible-server db create \
        --resource-group $RESOURCE_GROUP \
        --server-name $DB_SERVER_NAME \
        --database-name blueprint_ia \
        --output none
    
    # Cria Azure Container Instances
    log_info "Criando Azure Container Instances..."
    
    # Salva credenciais
    log_info "Salvando credenciais..."
    cat > .env.azure << EOF
# Azure Configuration - Gerado automaticamente
AZURE_RESOURCE_GROUP=$RESOURCE_GROUP
ACR_NAME=$ACR_NAME
ACR_LOGIN_SERVER=$ACR_LOGIN_SERVER
ACR_USERNAME=$ACR_USERNAME
ACR_PASSWORD=$ACR_PASSWORD

# Database
DB_SERVER_NAME=$DB_SERVER_NAME
DATABASE_URL=postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_SERVER_NAME}.postgres.database.azure.com:5432/blueprint_ia?schema=public&sslmode=require

# Credentials (MANTENHA SEGURO!)
POSTGRES_USER=$DB_ADMIN_USER
POSTGRES_PASSWORD=$DB_ADMIN_PASSWORD
EOF
    
    log_success "Setup Azure concluído!"
    log_warning "Credenciais salvas em .env.azure - MANTENHA ESTE ARQUIVO SEGURO!"
    echo ""
    echo "ACR Login Server: $ACR_LOGIN_SERVER"
    echo "Database Server: ${DB_SERVER_NAME}.postgres.database.azure.com"
}

# ============================================
# Build e Push das imagens Docker
# ============================================
build_and_push() {
    log_info "Construindo e enviando imagens Docker..."
    
    # Carrega configuração Azure
    if [ -f .env.azure ]; then
        export $(cat .env.azure | grep -v '#' | xargs)
    fi
    
    # Login no ACR
    log_info "Fazendo login no Azure Container Registry..."
    az acr login --name $ACR_NAME
    
    # Build Backend
    log_info "Construindo imagem do Backend..."
    docker build -t $ACR_LOGIN_SERVER/backend:latest ./backend
    
    # Build Frontend
    log_info "Construindo imagem do Frontend..."
    docker build -t $ACR_LOGIN_SERVER/frontend:latest ./frontend
    
    # Push images
    log_info "Enviando imagens para o ACR..."
    docker push $ACR_LOGIN_SERVER/backend:latest
    docker push $ACR_LOGIN_SERVER/frontend:latest
    
    log_success "Imagens enviadas com sucesso!"
}

# ============================================
# Deploy no Azure Container Instances
# ============================================
deploy_aci() {
    log_info "Fazendo deploy no Azure Container Instances..."
    
    # Carrega configuração Azure
    if [ -f .env.azure ]; then
        export $(cat .env.azure | grep -v '#' | xargs)
    fi
    
    # Deleta container group existente (se houver)
    az container delete \
        --resource-group $RESOURCE_GROUP \
        --name $APP_NAME \
        --yes \
        --output none 2>/dev/null || true
    
    # Cria novo container group
    log_info "Criando Container Group..."
    
    az container create \
        --resource-group $RESOURCE_GROUP \
        --name $APP_NAME \
        --image $ACR_LOGIN_SERVER/frontend:latest \
        --registry-login-server $ACR_LOGIN_SERVER \
        --registry-username $ACR_USERNAME \
        --registry-password $ACR_PASSWORD \
        --dns-name-label $APP_NAME \
        --ports 80 \
        --cpu 1 \
        --memory 1.5 \
        --environment-variables \
            NODE_ENV=production \
        --output none
    
    # Obtém URL
    FQDN=$(az container show \
        --resource-group $RESOURCE_GROUP \
        --name $APP_NAME \
        --query ipAddress.fqdn \
        --output tsv)
    
    log_success "Deploy concluído!"
    echo ""
    echo "=========================================="
    echo "Aplicação disponível em: http://$FQDN"
    echo "=========================================="
}

# ============================================
# Deploy usando Azure Container Apps (recomendado para produção)
# ============================================
deploy_container_apps() {
    log_info "Fazendo deploy no Azure Container Apps..."
    
    # Carrega configuração Azure
    if [ -f .env.azure ]; then
        export $(cat .env.azure | grep -v '#' | xargs)
    fi
    
    # Instala extensão Container Apps
    az extension add --name containerapp --upgrade --yes 2>/dev/null || true
    
    # Cria Container Apps Environment
    log_info "Criando Container Apps Environment..."
    az containerapp env create \
        --name "${APP_NAME}-env" \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --output none
    
    # Deploy Backend
    log_info "Fazendo deploy do Backend..."
    az containerapp create \
        --name "${APP_NAME}-backend" \
        --resource-group $RESOURCE_GROUP \
        --environment "${APP_NAME}-env" \
        --image $ACR_LOGIN_SERVER/backend:latest \
        --registry-server $ACR_LOGIN_SERVER \
        --registry-username $ACR_USERNAME \
        --registry-password $ACR_PASSWORD \
        --target-port 3001 \
        --ingress internal \
        --min-replicas 1 \
        --max-replicas 3 \
        --cpu 0.5 \
        --memory 1Gi \
        --env-vars \
            NODE_ENV=production \
            PORT=3001 \
            DATABASE_URL=$DATABASE_URL \
            JWT_SECRET=$JWT_SECRET \
        --output none
    
    # Obtém URL do backend
    BACKEND_URL=$(az containerapp show \
        --name "${APP_NAME}-backend" \
        --resource-group $RESOURCE_GROUP \
        --query properties.configuration.ingress.fqdn \
        --output tsv)
    
    # Deploy Frontend
    log_info "Fazendo deploy do Frontend..."
    az containerapp create \
        --name "${APP_NAME}-frontend" \
        --resource-group $RESOURCE_GROUP \
        --environment "${APP_NAME}-env" \
        --image $ACR_LOGIN_SERVER/frontend:latest \
        --registry-server $ACR_LOGIN_SERVER \
        --registry-username $ACR_USERNAME \
        --registry-password $ACR_PASSWORD \
        --target-port 80 \
        --ingress external \
        --min-replicas 1 \
        --max-replicas 3 \
        --cpu 0.25 \
        --memory 0.5Gi \
        --output none
    
    # Obtém URL do frontend
    FRONTEND_URL=$(az containerapp show \
        --name "${APP_NAME}-frontend" \
        --resource-group $RESOURCE_GROUP \
        --query properties.configuration.ingress.fqdn \
        --output tsv)
    
    log_success "Deploy concluído!"
    echo ""
    echo "=========================================="
    echo "Aplicação disponível em: https://$FRONTEND_URL"
    echo "=========================================="
}

# ============================================
# Mostra logs
# ============================================
show_logs() {
    log_info "Mostrando logs..."
    
    if [ -f .env.azure ]; then
        export $(cat .env.azure | grep -v '#' | xargs)
    fi
    
    az container logs \
        --resource-group $RESOURCE_GROUP \
        --name $APP_NAME \
        --follow
}

# ============================================
# Mostra status
# ============================================
show_status() {
    log_info "Status dos recursos Azure..."
    
    if [ -f .env.azure ]; then
        export $(cat .env.azure | grep -v '#' | xargs)
    fi
    
    echo ""
    echo "=== Resource Group ==="
    az group show --name $RESOURCE_GROUP --output table 2>/dev/null || echo "Não encontrado"
    
    echo ""
    echo "=== Container Registry ==="
    az acr show --name $ACR_NAME --output table 2>/dev/null || echo "Não encontrado"
    
    echo ""
    echo "=== Containers ==="
    az container show --resource-group $RESOURCE_GROUP --name $APP_NAME --output table 2>/dev/null || echo "Não encontrado"
    
    echo ""
    echo "=== Database ==="
    az postgres flexible-server show --resource-group $RESOURCE_GROUP --name "${APP_NAME}-db" --output table 2>/dev/null || echo "Não encontrado"
}

# ============================================
# Limpa recursos (CUIDADO!)
# ============================================
cleanup() {
    log_warning "ATENÇÃO: Isto vai deletar TODOS os recursos Azure do Blueprint IA!"
    read -p "Tem certeza? (digite 'sim' para confirmar): " confirm
    
    if [ "$confirm" = "sim" ]; then
        log_info "Deletando Resource Group e todos os recursos..."
        az group delete --name $RESOURCE_GROUP --yes --no-wait
        log_success "Recursos marcados para deleção."
    else
        log_info "Operação cancelada."
    fi
}

# ============================================
# Menu principal
# ============================================
show_help() {
    echo ""
    echo "Blueprint IA - Script de Deploy Azure"
    echo "======================================"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  setup              Configura recursos Azure (primeira vez)"
    echo "  build              Constrói e envia imagens Docker"
    echo "  deploy             Faz deploy usando Container Instances"
    echo "  deploy-apps        Faz deploy usando Container Apps (recomendado)"
    echo "  all                Executa setup, build e deploy"
    echo "  logs               Mostra logs dos containers"
    echo "  status             Mostra status dos recursos"
    echo "  cleanup            Remove todos os recursos (CUIDADO!)"
    echo "  help               Mostra esta ajuda"
    echo ""
}

# ============================================
# Main
# ============================================
case "${1:-help}" in
    setup)
        check_prerequisites
        setup_azure
        ;;
    build)
        check_prerequisites
        build_and_push
        ;;
    deploy)
        check_prerequisites
        deploy_aci
        ;;
    deploy-apps)
        check_prerequisites
        deploy_container_apps
        ;;
    all)
        check_prerequisites
        setup_azure
        build_and_push
        deploy_container_apps
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    cleanup)
        cleanup
        ;;
    help|*)
        show_help
        ;;
esac

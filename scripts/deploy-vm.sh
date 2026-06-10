#!/bin/bash

# ============================================
# Blueprint IA - Deploy Direto na VM Azure
# ============================================
# IP: 4.228.96.10
# Porta: 443 (HTTPS)
#
# Este script faz deploy completo do Blueprint IA na VM de produção.
# Mantém o banco de dados existente (não apaga dados).
#
# Uso:
#   ./scripts/deploy-vm.sh [opção]
#
# Opções:
#   deploy    - Deploy completo (padrão)
#   setup     - Setup inicial (primeira vez)
#   backup    - Apenas backup do banco
#   logs      - Ver logs dos containers
#   status    - Ver status dos containers
#   restart   - Reiniciar containers
#   ssl       - Gerar/renovar certificado SSL
# ============================================

set -e

# Configurações
VM_IP="4.228.96.10"
VM_USER="${VM_USER:-azureadmin}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"
REMOTE_DIR="/opt/blueprint"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================
# Função para executar comandos remotos
# ============================================
remote_exec() {
    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "${VM_USER}@${VM_IP}" "$1"
}

# ============================================
# Verifica conectividade com a VM
# ============================================
check_connection() {
    log_info "Verificando conexão com a VM ($VM_IP)..."
    if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY" "${VM_USER}@${VM_IP}" "echo 'OK'" &>/dev/null; then
        log_error "Não foi possível conectar na VM. Verifique:"
        echo "  - IP: $VM_IP"
        echo "  - Usuário: $VM_USER"
        echo "  - Chave SSH: $SSH_KEY"
        exit 1
    fi
    log_success "Conexão OK!"
}

# ============================================
# Setup inicial da VM (primeira vez)
# ============================================
setup_vm() {
    log_info "Configurando VM para Blueprint IA..."
    
    remote_exec "
        set -e
        
        # Atualiza sistema
        echo '>>> Atualizando sistema...'
        sudo apt-get update -qq
        sudo apt-get upgrade -y -qq
        
        # Instala Docker se não existir
        if ! command -v docker &> /dev/null; then
            echo '>>> Instalando Docker...'
            curl -fsSL https://get.docker.com | sudo sh
            sudo usermod -aG docker \$USER
        fi
        
        # Instala Docker Compose plugin
        if ! docker compose version &> /dev/null; then
            echo '>>> Instalando Docker Compose...'
            sudo apt-get install -y -qq docker-compose-plugin
        fi
        
        # Instala Git se não existir
        if ! command -v git &> /dev/null; then
            echo '>>> Instalando Git...'
            sudo apt-get install -y -qq git
        fi
        
        # Cria diretório do projeto
        sudo mkdir -p $REMOTE_DIR
        sudo chown \$USER:\$USER $REMOTE_DIR
        
        # Cria diretório SSL
        mkdir -p $REMOTE_DIR/ssl
        mkdir -p $REMOTE_DIR/backups
        
        echo '>>> Setup concluído!'
    "
    
    log_success "VM configurada com sucesso!"
}

# ============================================
# Gera certificado SSL auto-assinado
# ============================================
generate_ssl() {
    log_info "Gerando certificado SSL para $VM_IP..."
    
    remote_exec "
        set -e
        cd $REMOTE_DIR
        
        # Gera certificado auto-assinado válido por 1 ano
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj '/CN=$VM_IP/O=Blueprint IA/C=BR' \
            -addext 'subjectAltName=IP:$VM_IP'
        
        chmod 600 ssl/key.pem
        chmod 644 ssl/cert.pem
        
        echo '>>> Certificado SSL gerado!'
    "
    
    log_success "Certificado SSL criado!"
}

# ============================================
# Backup do banco de dados
# ============================================
backup_database() {
    log_info "Fazendo backup do banco de dados..."
    
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    remote_exec "
        set -e
        cd $REMOTE_DIR
        
        if docker ps | grep -q blueprint-ia-db-prod; then
            echo '>>> Criando backup...'
            docker exec blueprint-ia-db-prod pg_dump -U \${POSTGRES_USER:-blueprint} \${POSTGRES_DB:-blueprint_ia} > backups/$BACKUP_FILE
            
            # Mantém apenas os últimos 10 backups
            cd backups && ls -t *.sql 2>/dev/null | tail -n +11 | xargs -r rm --
            
            echo '>>> Backup salvo em: backups/$BACKUP_FILE'
        else
            echo '>>> Container do banco não está rodando, pulando backup.'
        fi
    "
    
    log_success "Backup concluído!"
}

# ============================================
# Deploy completo
# ============================================
deploy() {
    log_info "Iniciando deploy para $VM_IP..."
    
    # Verifica se existe arquivo .env
    if [ ! -f .env ]; then
        log_error "Arquivo .env não encontrado!"
        log_info "Copie o .env.example para .env e configure as variáveis."
        exit 1
    fi
    
    # Backup antes do deploy
    backup_database
    
    log_info "Enviando arquivos para a VM..."
    
    # Sincroniza projeto (excluindo node_modules e outros)
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '*.log' \
        --exclude 'dist' \
        --exclude '.env.local' \
        -e "ssh -o StrictHostKeyChecking=no -i $SSH_KEY" \
        ./ "${VM_USER}@${VM_IP}:${REMOTE_DIR}/"
    
    log_info "Executando deploy na VM..."
    
    remote_exec "
        set -e
        cd $REMOTE_DIR
        
        # Carrega variáveis de ambiente
        if [ -f .env ]; then
            export \$(cat .env | grep -v '#' | xargs)
        fi
        
        # Verifica se tem certificado SSL
        if [ ! -f ssl/cert.pem ]; then
            echo '>>> Gerando certificado SSL...'
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout ssl/key.pem \
                -out ssl/cert.pem \
                -subj '/CN=$VM_IP/O=Blueprint IA/C=BR' \
                -addext 'subjectAltName=IP:$VM_IP'
            chmod 600 ssl/key.pem
            chmod 644 ssl/cert.pem
        fi
        
        echo '>>> Parando containers antigos...'
        docker compose -f docker-compose.prod.yml down --remove-orphans || true
        
        echo '>>> Construindo e iniciando containers...'
        docker compose -f docker-compose.prod.yml up -d --build
        
        echo '>>> Aguardando containers iniciarem...'
        sleep 10
        
        echo '>>> Executando migrações do banco...'
        docker exec blueprint-ia-backend-prod npx prisma migrate deploy || true
        
        echo '>>> Limpando imagens antigas...'
        docker image prune -f
        
        echo '>>> Status dos containers:'
        docker compose -f docker-compose.prod.yml ps
    "
    
    log_success "Deploy concluído!"
    echo ""
    echo "=========================================="
    echo "Blueprint IA disponível em:"
    echo "  https://$VM_IP"
    echo "=========================================="
}

# ============================================
# Ver logs
# ============================================
show_logs() {
    log_info "Mostrando logs dos containers..."
    remote_exec "cd $REMOTE_DIR && docker compose -f docker-compose.prod.yml logs -f --tail=100"
}

# ============================================
# Ver status
# ============================================
show_status() {
    log_info "Status dos containers..."
    remote_exec "cd $REMOTE_DIR && docker compose -f docker-compose.prod.yml ps"
}

# ============================================
# Reiniciar containers
# ============================================
restart() {
    log_info "Reiniciando containers..."
    remote_exec "cd $REMOTE_DIR && docker compose -f docker-compose.prod.yml restart"
    log_success "Containers reiniciados!"
}

# ============================================
# Menu de ajuda
# ============================================
show_help() {
    echo ""
    echo "Blueprint IA - Deploy para VM Azure"
    echo "===================================="
    echo "IP: $VM_IP | Porta: 443"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos:"
    echo "  deploy    Deploy completo (padrão)"
    echo "  setup     Setup inicial da VM"
    echo "  backup    Backup do banco de dados"
    echo "  logs      Ver logs dos containers"
    echo "  status    Ver status dos containers"
    echo "  restart   Reiniciar containers"
    echo "  ssl       Gerar certificado SSL"
    echo "  help      Mostrar esta ajuda"
    echo ""
    echo "Variáveis de ambiente:"
    echo "  VM_USER   Usuário SSH (padrão: azureadmin)"
    echo "  SSH_KEY   Caminho da chave SSH (padrão: ~/.ssh/id_rsa)"
    echo ""
}

# ============================================
# Main
# ============================================
check_connection

case "${1:-deploy}" in
    setup)
        setup_vm
        generate_ssl
        ;;
    deploy)
        deploy
        ;;
    backup)
        backup_database
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    restart)
        restart
        ;;
    ssl)
        generate_ssl
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Comando desconhecido: $1"
        show_help
        exit 1
        ;;
esac

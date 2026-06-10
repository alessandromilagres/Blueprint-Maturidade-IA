#!/bin/bash

# ============================================
# Blueprint IA - Inicialização Local com Docker
# ============================================
# Uso: ./scripts/start-local.sh
# ============================================

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║     Blueprint IA - Inicialização Local               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verifica se .env existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}[INFO]${NC} Criando arquivo .env a partir do exemplo..."
    cp .env.example .env
    echo -e "${YELLOW}[AVISO]${NC} Edite o arquivo .env com suas configurações antes de continuar."
    echo ""
fi

# Para containers existentes
echo -e "${BLUE}[INFO]${NC} Parando containers existentes..."
docker-compose down 2>/dev/null || true

# Build das imagens
echo -e "${BLUE}[INFO]${NC} Construindo imagens Docker..."
docker-compose build

# Inicia os serviços
echo -e "${BLUE}[INFO]${NC} Iniciando serviços..."
docker-compose up -d

# Aguarda o banco estar pronto
echo -e "${BLUE}[INFO]${NC} Aguardando banco de dados..."
sleep 5

# Verifica se precisa rodar o seed
echo -e "${BLUE}[INFO]${NC} Verificando se precisa popular o banco..."
docker-compose exec -T backend sh -c "npx prisma db seed" 2>/dev/null || true

# Mostra status
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Blueprint IA está rodando!                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Acesse a aplicação em: http://localhost"
echo ""
echo "Credenciais padrão:"
echo "  Email: admin@sysmap.com.br"
echo "  Senha: admin123"
echo ""
echo "Comandos úteis:"
echo "  docker-compose logs -f          # Ver logs"
echo "  docker-compose down             # Parar"
echo "  docker-compose restart backend  # Reiniciar backend"
echo ""

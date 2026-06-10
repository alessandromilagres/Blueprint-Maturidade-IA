#!/bin/bash

# ============================================
# Blueprint IA - Backup do Banco de Dados
# ============================================
# Cria backup do PostgreSQL
# Uso: ./scripts/backup-db.sh
# ============================================

set -e

# Carrega variáveis
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/blueprint_ia_${TIMESTAMP}.sql"

# Cria diretório de backup
mkdir -p $BACKUP_DIR

echo "Criando backup do banco de dados..."

# Executa pg_dump no container
docker-compose exec -T postgres pg_dump \
    -U ${POSTGRES_USER:-blueprint} \
    -d ${POSTGRES_DB:-blueprint_ia} \
    --no-owner \
    --no-acl \
    > $BACKUP_FILE

# Compacta o backup
gzip $BACKUP_FILE

echo "Backup criado: ${BACKUP_FILE}.gz"

# Remove backups antigos (mantém últimos 7)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete 2>/dev/null || true

echo "Backup concluído!"

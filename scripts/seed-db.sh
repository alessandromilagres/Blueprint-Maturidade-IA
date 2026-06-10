#!/bin/bash

# ============================================
# Blueprint IA - Seed do Banco de Dados
# ============================================
# Popula o banco de dados com dados iniciais
# Uso: ./scripts/seed-db.sh
# ============================================

set -e

echo "Executando seed do banco de dados..."

# Se estiver rodando em Docker
if [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null; then
    npx prisma db seed
else
    # Se estiver rodando localmente, usa o container
    docker-compose exec -T backend npx prisma db seed
fi

echo "Seed concluído com sucesso!"

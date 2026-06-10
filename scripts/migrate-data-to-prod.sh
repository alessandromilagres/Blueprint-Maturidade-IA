#!/bin/bash

# ============================================
# Script para migrar dados locais para produção
# Execute na VM de produção (4.228.96.10)
# ============================================

set -e

echo "=== Migração de Dados para Produção ==="
echo ""

# Verifica se o dump foi copiado
if [ ! -f "/tmp/dump_local.sql" ]; then
    echo "ERRO: Arquivo /tmp/dump_local.sql não encontrado!"
    echo "Copie o dump para a VM primeiro."
    exit 1
fi

# Nome do container do banco
DB_CONTAINER="blueprint-ia-db-prod"

# Verifica se o container está rodando
if ! docker ps | grep -q $DB_CONTAINER; then
    echo "ERRO: Container $DB_CONTAINER não está rodando!"
    exit 1
fi

echo ">>> Fazendo backup do banco atual..."
docker exec $DB_CONTAINER pg_dump -U blueprint blueprint_ia > /tmp/backup_antes_migracao_$(date +%Y%m%d_%H%M%S).sql
echo "Backup salvo em /tmp/"

echo ""
echo ">>> Limpando dados existentes (mantendo estrutura)..."
docker exec -i $DB_CONTAINER psql -U blueprint -d blueprint_ia << 'EOF'
-- Desabilita triggers
SET session_replication_role = replica;

-- Limpa tabelas na ordem correta (respeitando FKs)
TRUNCATE TABLE "RespostaDiagnostico" CASCADE;
TRUNCATE TABLE "DiagnosticoRapido" CASCADE;
TRUNCATE TABLE "PerguntaDiagnostico" CASCADE;
TRUNCATE TABLE "DimensaoDiagnostico" CASCADE;
TRUNCATE TABLE "ArquivoReferencia" CASCADE;
TRUNCATE TABLE "HistoricoGeracaoIA" CASCADE;
TRUNCATE TABLE "DocumentoEspecificacao" CASCADE;
TRUNCATE TABLE "EspecificacaoProduto" CASCADE;
TRUNCATE TABLE "RespostaProduto" CASCADE;
TRUNCATE TABLE "RespostaObrigatoriaProduto" CASCADE;
TRUNCATE TABLE "AvaliacaoProduto" CASCADE;
TRUNCATE TABLE "Resposta" CASCADE;
TRUNCATE TABLE "Avaliacao" CASCADE;
TRUNCATE TABLE "ConviteAvaliacao" CASCADE;
TRUNCATE TABLE "Produto" CASCADE;
TRUNCATE TABLE "Projeto" CASCADE;
TRUNCATE TABLE "Usuario" CASCADE;
TRUNCATE TABLE "Empresa" CASCADE;
TRUNCATE TABLE "Pergunta" CASCADE;
TRUNCATE TABLE "Area" CASCADE;
TRUNCATE TABLE "PerguntaProduto" CASCADE;
TRUNCATE TABLE "VerticalProduto" CASCADE;
TRUNCATE TABLE "PerguntaObrigatoriaProduto" CASCADE;
TRUNCATE TABLE "ConfiguracaoCusto" CASCADE;

-- Reabilita triggers
SET session_replication_role = DEFAULT;
EOF

echo ""
echo ">>> Importando dados do dump local..."

# Remove a linha \restrict que pode causar problemas
sed -i 's/\\restrict.*//g' /tmp/dump_local.sql 2>/dev/null || true

# Importa os dados
docker exec -i $DB_CONTAINER psql -U blueprint -d blueprint_ia < /tmp/dump_local.sql

echo ""
echo ">>> Atualizando sequences..."
docker exec -i $DB_CONTAINER psql -U blueprint -d blueprint_ia << 'EOF'
-- Atualiza todas as sequences para o valor máximo atual
SELECT setval(pg_get_serial_sequence('"Area"', 'id'), COALESCE(MAX(id), 1)) FROM "Area";
SELECT setval(pg_get_serial_sequence('"Empresa"', 'id'), COALESCE(MAX(id), 1)) FROM "Empresa";
SELECT setval(pg_get_serial_sequence('"Usuario"', 'id'), COALESCE(MAX(id), 1)) FROM "Usuario";
SELECT setval(pg_get_serial_sequence('"Projeto"', 'id'), COALESCE(MAX(id), 1)) FROM "Projeto";
SELECT setval(pg_get_serial_sequence('"Produto"', 'id'), COALESCE(MAX(id), 1)) FROM "Produto";
SELECT setval(pg_get_serial_sequence('"Avaliacao"', 'id'), COALESCE(MAX(id), 1)) FROM "Avaliacao";
SELECT setval(pg_get_serial_sequence('"Pergunta"', 'id'), COALESCE(MAX(id), 1)) FROM "Pergunta";
SELECT setval(pg_get_serial_sequence('"Resposta"', 'id'), COALESCE(MAX(id), 1)) FROM "Resposta";
SELECT setval(pg_get_serial_sequence('"VerticalProduto"', 'id'), COALESCE(MAX(id), 1)) FROM "VerticalProduto";
SELECT setval(pg_get_serial_sequence('"PerguntaProduto"', 'id'), COALESCE(MAX(id), 1)) FROM "PerguntaProduto";
SELECT setval(pg_get_serial_sequence('"PerguntaObrigatoriaProduto"', 'id'), COALESCE(MAX(id), 1)) FROM "PerguntaObrigatoriaProduto";
SELECT setval(pg_get_serial_sequence('"AvaliacaoProduto"', 'id'), COALESCE(MAX(id), 1)) FROM "AvaliacaoProduto";
SELECT setval(pg_get_serial_sequence('"EspecificacaoProduto"', 'id'), COALESCE(MAX(id), 1)) FROM "EspecificacaoProduto";
SELECT setval(pg_get_serial_sequence('"DocumentoEspecificacao"', 'id'), COALESCE(MAX(id), 1)) FROM "DocumentoEspecificacao";
SELECT setval(pg_get_serial_sequence('"ConviteAvaliacao"', 'id'), COALESCE(MAX(id), 1)) FROM "ConviteAvaliacao";
EOF

echo ""
echo ">>> Verificando dados importados..."
docker exec $DB_CONTAINER psql -U blueprint -d blueprint_ia -c "
SELECT 'Empresas' as tabela, COUNT(*) as registros FROM \"Empresa\"
UNION ALL SELECT 'Usuarios', COUNT(*) FROM \"Usuario\"
UNION ALL SELECT 'Projetos', COUNT(*) FROM \"Projeto\"
UNION ALL SELECT 'Produtos', COUNT(*) FROM \"Produto\"
UNION ALL SELECT 'Avaliacoes', COUNT(*) FROM \"Avaliacao\"
UNION ALL SELECT 'Areas', COUNT(*) FROM \"Area\"
ORDER BY tabela;
"

echo ""
echo "=== Migração concluída com sucesso! ==="

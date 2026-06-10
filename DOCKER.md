# Blueprint IA - Guia de Deploy com Docker

Este documento explica como executar o Blueprint IA usando Docker, tanto localmente quanto no Azure.

## Requisitos

- Docker 20.10+
- Docker Compose 2.0+
- (Para Azure) Azure CLI instalado e autenticado

## Estrutura de Arquivos Docker

```
blueprint-ia/
├── docker-compose.yml          # Desenvolvimento local
├── docker-compose.prod.yml     # Produção
├── .env.example                # Exemplo de variáveis de ambiente
├── backend/
│   ├── Dockerfile              # Imagem do backend
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile              # Imagem do frontend
│   ├── nginx.conf              # Configuração do Nginx
│   └── .dockerignore
└── scripts/
    ├── start-local.sh          # Inicialização local
    ├── deploy-azure.sh         # Deploy no Azure
    ├── seed-db.sh              # Popular banco de dados
    └── backup-db.sh            # Backup do banco
```

## Execução Local

### 1. Configuração Inicial

```bash
# Clone o repositório (se ainda não tiver)
git clone <seu-repositorio>
cd blueprint-ia

# Copie o arquivo de exemplo e configure
cp .env.example .env
# Edite .env com suas configurações
```

### 2. Iniciar com Script (Recomendado)

```bash
./scripts/start-local.sh
```

### 3. Ou Manualmente

```bash
# Construir imagens
docker-compose build

# Iniciar serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### 4. Acessar a Aplicação

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

**Credenciais Padrão:**
- Email: `admin@sysmap.com.br`
- Senha: `admin123`

## Comandos Úteis

```bash
# Ver status dos containers
docker-compose ps

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Reiniciar um serviço
docker-compose restart backend

# Acessar shell do container
docker-compose exec backend sh
docker-compose exec postgres psql -U blueprint -d blueprint_ia

# Executar migrations manualmente
docker-compose exec backend npx prisma migrate deploy

# Popular banco de dados
docker-compose exec backend npx prisma db seed

# Backup do banco
./scripts/backup-db.sh
```

## Deploy no Azure

### Opção 1: Azure Container Apps (Recomendado)

```bash
# Configuração inicial (primeira vez)
./scripts/deploy-azure.sh setup

# Build e push das imagens
./scripts/deploy-azure.sh build

# Deploy
./scripts/deploy-azure.sh deploy-apps

# Ou tudo de uma vez
./scripts/deploy-azure.sh all
```

### Opção 2: Azure Container Instances

```bash
./scripts/deploy-azure.sh deploy
```

### Verificar Status

```bash
./scripts/deploy-azure.sh status
./scripts/deploy-azure.sh logs
```

## Variáveis de Ambiente

### Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexão PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Chave secreta para tokens JWT | Use `openssl rand -base64 64` |

### Opcionais

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do backend | `3001` |
| `NODE_ENV` | Ambiente | `development` |
| `SMTP_HOST` | Servidor SMTP | - |
| `SMTP_PORT` | Porta SMTP | `587` |
| `SMTP_USER` | Usuário SMTP | - |
| `SMTP_PASS` | Senha SMTP | - |
| `SMTP_FROM` | Email remetente | - |

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                        Internet                          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Nginx)                      │
│                      Port: 80                            │
│            Serve React SPA + Proxy /api                  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend (Node.js)                       │
│                     Port: 3001                           │
│              Express + Prisma ORM                        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 PostgreSQL Database                      │
│                     Port: 5432                           │
└─────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Container não inicia

```bash
# Verifique os logs
docker-compose logs backend

# Verifique se o banco está rodando
docker-compose ps postgres
```

### Erro de conexão com banco

```bash
# Verifique se o banco está acessível
docker-compose exec postgres pg_isready

# Verifique a DATABASE_URL
docker-compose exec backend printenv DATABASE_URL
```

### Erro de migração

```bash
# Execute as migrações manualmente
docker-compose exec backend npx prisma migrate deploy

# Se precisar resetar o banco (CUIDADO: perda de dados!)
docker-compose exec backend npx prisma migrate reset
```

### Limpar tudo e recomeçar

```bash
# Para e remove containers, volumes e imagens
docker-compose down -v --rmi all

# Reconstrói do zero
docker-compose build --no-cache
docker-compose up -d
```

## Segurança em Produção

1. **Sempre** use senhas fortes para `POSTGRES_PASSWORD` e `JWT_SECRET`
2. Configure SSL/TLS para o banco de dados
3. Use Azure Database for PostgreSQL em produção
4. Configure backup automático do banco
5. Use secrets do Azure Key Vault para credenciais sensíveis
6. Habilite HTTPS no frontend (use Azure Application Gateway ou SSL no nginx)

## Monitoramento

### Logs

```bash
# Logs em tempo real
docker-compose logs -f

# Últimas 100 linhas
docker-compose logs --tail=100
```

### Health Checks

- Backend: `GET /api/health`
- Frontend: `GET /health`

### Métricas (Azure)

Se usando Azure Container Apps, métricas estão disponíveis no portal Azure:
- CPU/Memória
- Requests/segundo
- Latência
- Erros

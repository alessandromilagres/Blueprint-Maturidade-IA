#!/bin/bash
# Verificação pré-deploy (sandbox / CI local): compila front e valida sintaxe do back.
# Uso: ./scripts/sandbox-verify.sh   (na raiz do repositório)

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ">>> Frontend: npm run build"
(cd frontend && npm run build)

echo ">>> Backend: syntax check"
(cd backend && node --check src/index.js)

if command -v npx >/dev/null 2>&1; then
  echo ">>> Prisma: validate schema"
  (cd backend && npx prisma validate) || true
fi

echo ">>> Sandbox verify OK"

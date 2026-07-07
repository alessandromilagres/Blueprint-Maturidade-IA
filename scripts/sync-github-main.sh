#!/usr/bin/env bash
# Espelha o código publicado em PRD no GitHub pessoal (remote github → main).
set -euo pipefail

GITHUB_REMOTE="${GITHUB_REMOTE:-github}"
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"
GITHUB_URL="${GITHUB_URL:-https://github.com/alessandromilagres/Blueprint-Maturidade-IA}"
SOURCE_REF="${1:-HEAD}"
RELEASE_ID="${2:-}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git remote get-url "$GITHUB_REMOTE" >/dev/null 2>&1; then
  echo ">>> Remote '$GITHUB_REMOTE' não configurado. Abortando sync GitHub."
  exit 1
fi

SOURCE_OID=$(git rev-parse "$SOURCE_REF")
SOURCE_SHORT=$(git rev-parse --short "$SOURCE_REF")

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo ">>> Working tree sujo — commit ou stash antes de sincronizar GitHub."
  exit 1
fi

echo ">>> Sincronizando GitHub pessoal ($GITHUB_URL, branch $GITHUB_BRANCH)..."
git fetch "$GITHUB_REMOTE" "$GITHUB_BRANCH" 2>&1

if git merge-base --is-ancestor "$GITHUB_REMOTE/$GITHUB_BRANCH" "$SOURCE_OID" 2>/dev/null; then
  echo ">>> Fast-forward $GITHUB_REMOTE/$GITHUB_BRANCH → $SOURCE_SHORT"
  git push "$GITHUB_REMOTE" "${SOURCE_OID}:refs/heads/${GITHUB_BRANCH}"
  echo ">>> GitHub atualizado: $SOURCE_SHORT"
  exit 0
fi

SYNC_BRANCH="github-sync-$$"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
trap 'git checkout "$CURRENT_BRANCH" 2>/dev/null; git branch -D "$SYNC_BRANCH" 2>/dev/null || true' EXIT

git branch "$SYNC_BRANCH" "$GITHUB_REMOTE/$GITHUB_BRANCH"
git checkout "$SYNC_BRANCH" >/dev/null
git read-tree -u --reset "$SOURCE_OID"

if git diff --quiet && git diff --cached --quiet; then
  echo ">>> GitHub já alinhado com $SOURCE_SHORT."
  exit 0
fi

MSG="Sync production ${SOURCE_SHORT}"
if [ -n "$RELEASE_ID" ]; then
  MSG="${MSG} (PRD releaseId ${RELEASE_ID})"
fi
MSG="${MSG} into GitHub ${GITHUB_BRANCH}."

git commit -m "$MSG"
SYNC_OID=$(git rev-parse --short HEAD)
git push "$GITHUB_REMOTE" "${SYNC_BRANCH}:refs/heads/${GITHUB_BRANCH}"
echo ">>> GitHub atualizado: commit de sync $SYNC_OID (tree = $SOURCE_SHORT)"

#!/usr/bin/env bash
# Publica release/prd-* no Azure DevOps e dispara pipeline de produção.
set -euo pipefail

ORG="https://dev.azure.com/sysmap-devops"
PROJECT="Blueprint Agentica"
REPO_ID="0cfcab68-25bb-4418-9623-a62a30ac907c"
BRANCH="release/prd-20260701"
PIPELINE="app-agentica"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ">>> Testando acesso ao Azure DevOps (somente Azure — não envia para GitHub)..."
if ! az devops project list --organization "$ORG" -o table | head -5; then
  echo ">>> Falha na autenticação. Rode:"
  echo "    az devops login --organization $ORG"
  echo '    ou: export AZURE_DEVOPS_EXT_PAT="seu-token"'
  exit 1
fi

echo ">>> Obtendo OID da branch $BRANCH..."
OLD_OID=$(az devops invoke \
  --area git --resource refs \
  --route-parameters "repositoryId=$REPO_ID" \
  --query-parameters "filter=heads/$BRANCH" \
  --organization "$ORG" --api-version 7.1 -o json \
  | python3 -c "import sys,json; v=json.load(sys.stdin).get('value',[]); print(v[0]['objectId'] if v else 'NONE')")

if [ "$OLD_OID" = "NONE" ]; then
  echo ">>> Branch $BRANCH não existe no Azure. Abortando."
  exit 1
fi
echo ">>> OID atual: ${OLD_OID:0:12}"

# Pipeline: deploy da branch de release na VM (até merge em main)
PIPELINE_FILE=$(mktemp)
sed 's|git reset --hard origin/main|git reset --hard origin/release/prd-20260701|' \
  azure-pipelines.yml > "$PIPELINE_FILE"

python3 <<PY
import json, subprocess
from pathlib import Path

old_oid = "$OLD_OID"
pipeline = Path("$PIPELINE_FILE").read_text(encoding="utf-8")

# Usa git show --name-status (A/M) — não depende do OID remoto estar no repo local
file_status = {}
for line in subprocess.check_output(
    ["git", "show", "--name-status", "--pretty=format:", "HEAD"], text=True
).strip().splitlines():
    if not line.strip():
        continue
    status, rel = line.split("\t", 1)
    file_status[rel.strip()] = "add" if status.strip() == "A" else "edit"

changes = [{
    "changeType": "edit",
    "item": {"path": "/azure-pipelines.yml"},
    "newContent": {"content": pipeline, "contentType": "rawtext"}
}]

for rel, change_type in file_status.items():
    if rel == "azure-pipelines.yml":
        continue
    p = Path(rel)
    if not p.exists():
        continue
    changes.append({
        "changeType": change_type,
        "item": {"path": f"/{rel}"},
        "newContent": {"content": p.read_text(encoding="utf-8"), "contentType": "rawtext"}
    })

msg = subprocess.check_output(["git", "log", "-1", "--pretty=%B"], text=True).strip()
payload = {
    "refUpdates": [{"name": "refs/heads/$BRANCH", "oldObjectId": old_oid}],
    "commits": [{"comment": msg, "changes": changes}]
}
Path("/tmp/ado-publish-prd.json").write_text(json.dumps(payload), encoding="utf-8")
print(">>> Arquivos no push:", len(changes))
PY

rm -f "$PIPELINE_FILE"

echo ">>> Push para Azure ($BRANCH)..."
NEW_COMMIT=$(az devops invoke \
  --area git --resource pushes \
  --route-parameters "repositoryId=$REPO_ID" \
  --organization "$ORG" --api-version 7.1 \
  --http-method POST --in-file /tmp/ado-publish-prd.json -o json \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['commits'][0]['commitId'][:12])")
echo ">>> Commit publicado: $NEW_COMMIT"

echo ">>> Disparando pipeline $PIPELINE..."
RUN_ID=$(az pipelines run --name "$PIPELINE" --branch "$BRANCH" \
  --organization "$ORG" --project "$PROJECT" -o json \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo ">>> Run ID: $RUN_ID (aguardando...)"

for i in $(seq 1 40); do
  state=$(az pipelines runs show --id "$RUN_ID" --organization "$ORG" --project "$PROJECT" \
    --query "{s:status,r:result}" -o tsv 2>/dev/null || echo "unknown")
  echo "$(date +%H:%M:%S) $state"
  echo "$state" | grep -q "^completed" && break
  sleep 15
done

echo ""
echo ">>> Smoke test produção"
curl -sS https://agentica.sysmap.com.br/api/release-info
echo ""
curl -sS https://agentica.sysmap.com.br/api/health
echo ""

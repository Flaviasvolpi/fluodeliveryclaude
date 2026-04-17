#!/usr/bin/env bash
# Alinha repositório local + GitHub + containers Docker.
# Uso: ./sync.sh

set -e

cd "$(dirname "$0")"

echo "→ Verificando mudanças não commitadas..."
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "✗ Há mudanças não commitadas. Rode:"
  echo "    git add -A && git commit -m 'sua mensagem' && git push"
  echo "  e então execute ./sync.sh de novo."
  exit 1
fi

echo "→ Puxando últimas do GitHub..."
git pull --ff-only

echo "→ Rebuildando e subindo containers..."
docker compose up -d --build

echo "→ Aguardando API ficar pronta..."
for i in {1..30}; do
  if docker exec fluodeliveryclaude-postgres-1 pg_isready -U fluodelivery >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo ""
echo "✓ Tudo alinhado:"
git log -1 --oneline
echo "  Frontend: http://localhost:8085"
echo "  API:      http://localhost:3002/api"

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Erro: esta pasta nao e um repositorio Git."
  exit 1
fi

if [ -z "$(git status --porcelain)" ]; then
  echo "Sem alteracoes para salvar."
  exit 0
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Erro: remote 'origin' nao configurado. Configure com:"
  echo "git remote add origin <URL_DO_REPOSITORIO>"
  exit 1
fi

if ! git config user.name >/dev/null 2>&1 || ! git config user.email >/dev/null 2>&1; then
  echo "Erro: Git sem identidade configurada. Configure com:"
  echo "git config user.name \"Seu Nome\""
  echo "git config user.email \"seu-email@exemplo.com\""
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" = "HEAD" ] || [ -z "$BRANCH" ]; then
  BRANCH="main"
fi

MESSAGE="${1:-chore(autosave): snapshot $(date '+%Y-%m-%d %H:%M:%S')}"

git add -A

if git diff --cached --quiet; then
  echo "Nenhuma alteracao preparada para commit."
  exit 0
fi

git commit -m "$MESSAGE"
git push -u origin "$BRANCH"

echo "Snapshot enviado para GitHub em $(date '+%Y-%m-%d %H:%M:%S')."

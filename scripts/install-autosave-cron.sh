#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUTOSAVE_SCRIPT="$ROOT_DIR/scripts/autosave-github.sh"
CRON_MARKER="# startafilliate-autosave"
CRON_JOB="0 23 * * * cd \"$ROOT_DIR\" && \"$AUTOSAVE_SCRIPT\" >> \"$ROOT_DIR/.autosave.log\" 2>&1 $CRON_MARKER"

if [ ! -x "$AUTOSAVE_SCRIPT" ]; then
  echo "Erro: $AUTOSAVE_SCRIPT nao existe ou nao tem permissao de execucao."
  exit 1
fi

if ! git -C "$ROOT_DIR" remote get-url origin >/dev/null 2>&1; then
  echo "Aviso: remote 'origin' ainda nao esta configurado."
fi

if ! git -C "$ROOT_DIR" config user.name >/dev/null 2>&1 || ! git -C "$ROOT_DIR" config user.email >/dev/null 2>&1; then
  echo "Aviso: identidade Git (user.name/user.email) ainda nao configurada."
fi

CURRENT_CRON="$(crontab -l 2>/dev/null || true)"
FILTERED_CRON="$(printf '%s\n' "$CURRENT_CRON" | grep -vF "$CRON_MARKER" || true)"

{
  if [ -n "$FILTERED_CRON" ]; then
    printf '%s\n' "$FILTERED_CRON"
  fi
  printf '%s\n' "$CRON_JOB"
} | crontab -

echo "Agendamento instalado: todos os dias as 23:00."
echo "Para conferir: crontab -l"

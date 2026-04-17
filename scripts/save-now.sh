#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$#" -gt 0 ]; then
  MESSAGE="$*"
else
  MESSAGE="chore: atualizacao manual $(date '+%Y-%m-%d %H:%M:%S')"
fi

"$SCRIPT_DIR/autosave-github.sh" "$MESSAGE"

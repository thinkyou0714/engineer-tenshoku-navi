#!/bin/sh
# Idempotent dependency bootstrap for Claude Code (local + web/cloud sessions).
# No-op when deps are already present, so it is safe to run on every SessionStart.
# Web/cloud sandbox has Node 20-22 + Python + uv pre-installed; this only fetches repo deps.
dir="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$dir" || exit 0

if [ -f package.json ] && [ ! -d node_modules ]; then
  if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund || npm install --no-audit --no-fund || true
  else
    npm install --no-audit --no-fund || true
  fi
fi

if [ -f pyproject.toml ] && [ ! -d .venv ] && command -v uv >/dev/null 2>&1; then
  uv sync 2>/dev/null || true
fi

exit 0

#!/bin/sh
# Idempotent dependency bootstrap for Claude Code (local + web/cloud sessions).
# No-op when deps are already present, so it is safe to run on every SessionStart.
# Web/cloud sandbox has Node 20-22 + Python + uv pre-installed; this only fetches repo deps.
#
# --ignore-scripts: dependency lifecycle scripts (pre/post-install, prepare) do NOT run
# unattended when a session opens the repo (supply-chain hardening). If THIS repo genuinely
# needs an install/prepare script, drop --ignore-scripts and run it explicitly.
dir="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$dir" || exit 0

if [ -f package.json ] && [ ! -d node_modules ]; then
  if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund --ignore-scripts || npm install --no-audit --no-fund --ignore-scripts || true
  else
    npm install --no-audit --no-fund --ignore-scripts || true
  fi
fi

if [ -f pyproject.toml ] && [ ! -d .venv ] && command -v uv >/dev/null 2>&1; then
  uv sync --frozen 2>/dev/null || uv sync 2>/dev/null || true
fi

exit 0

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON="$ROOT_DIR/backend/.venv/bin/python"

if [[ ! -x "$PYTHON" ]]; then
  echo "未找到 backend/.venv，请先安装后端依赖。"
  exit 1
fi

cd "$ROOT_DIR/backend"
exec "$PYTHON" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

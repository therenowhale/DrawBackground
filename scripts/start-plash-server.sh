#!/bin/zsh
set -euo pipefail

PROJECT_DIR="/Users/mykytatishkin/Documents/DrawBackground"
cd "$PROJECT_DIR"
exec /opt/homebrew/bin/node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173

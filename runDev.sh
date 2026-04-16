#!/usr/bin/env bash
# DiFFY dev launcher — installs deps if missing, then runs the Tauri dev shell.

set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
	echo "==> node_modules missing, running npm install"
	npm install
fi

echo "==> starting tauri dev"
exec npm run tauri dev

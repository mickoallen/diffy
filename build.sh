#!/usr/bin/env bash
# DiFFY production build — installs deps, runs type-check + clippy, then builds the Tauri app.

set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
	echo "==> node_modules missing, running npm install"
	npm install
fi

echo "==> svelte-check"
npm run check

echo "==> cargo clippy"
(cd src-tauri && cargo clippy -- -D warnings)

echo "==> tauri build"
exec npm run tauri build

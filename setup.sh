#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
command -v node >/dev/null || { echo 'Install Node.js 24 LTS: https://nodejs.org'; exit 1; }
npm ci --ignore-scripts
npm run build
node scripts/setup.mjs
npm run register
echo 'Ready: bash start.sh / Hazır: bash start.sh'

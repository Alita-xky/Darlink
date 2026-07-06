#!/usr/bin/env bash
# Restore prototype-engine.js after mistaken blindbox patch (run as xuhaiyu or sudo).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${ROOT}/scripts/prototype-engine.reverted.js"
DST="${ROOT}/frontend/prototype-engine.js"
cp "${SRC}" "${DST}"
echo "Restored ${DST} ($(wc -c < "${DST}") bytes)"
grep -q isBlindboxCelebrity "${DST}" && { echo "ERROR: patch still present"; exit 1; } || echo "OK: no blindbox patch"

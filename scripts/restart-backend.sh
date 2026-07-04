#!/usr/bin/env bash
# Restart darlink-backend after code/.env changes. Run as root or xuhaiyu:
#   sudo bash scripts/restart-backend.sh
set -euo pipefail
pids=$(pgrep -f 'uvicorn app:app.*8000' || true)
if [[ -n "${pids}" ]]; then
  echo "Stopping stale uvicorn on 8000: ${pids}"
  kill ${pids} || true
  sleep 1
fi
systemctl restart darlink-backend
sleep 2
pgrep -af 'uvicorn app:app.*8000' || { echo "restart failed"; exit 1; }
echo "darlink-backend restarted"

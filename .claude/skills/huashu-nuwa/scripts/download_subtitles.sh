#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <YouTube_URL> <output_dir>"
  exit 1
fi

url="$1"
out_dir="$2"
mkdir -p "$out_dir"

echo "This is a placeholder downloader for: $url"
echo "In a full setup, call yt-dlp or a subtitle API here and write SRT/VTT files to: $out_dir"

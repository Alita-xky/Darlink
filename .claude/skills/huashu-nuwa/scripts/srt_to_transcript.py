#!/usr/bin/env python3
import re
import sys
from pathlib import Path


def clean_lines(text: str) -> str:
    lines = []
    last = None
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if re.fullmatch(r"\d+", line):
            continue
        if re.fullmatch(r"\d{2}:\d{2}:\d{2}[,\.]\d{3} --> \d{2}:\d{2}:\d{2}[,\.]\d{3}", line):
            continue
        line = re.sub(r"<[^>]+>", "", line)
        if line and line != last:
            lines.append(line)
            last = line
    return "\n".join(lines)


def main() -> int:
    if len(sys.argv) < 2:
        print(f"Usage: {Path(sys.argv[0]).name} <input.srt> [output.txt]")
        return 1

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else input_path.with_suffix(".txt")

    text = input_path.read_text(encoding="utf-8", errors="ignore")
    output_path.write_text(clean_lines(text), encoding="utf-8")
    print(f"Wrote transcript to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

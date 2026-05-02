#!/usr/bin/env python3
import sys
from pathlib import Path


def summarize(skill_dir: Path) -> str:
    research_dir = skill_dir / "references" / "research"
    files = sorted(research_dir.glob("*.md"))
    lines = [f"# Research Summary for {skill_dir.name}", ""]
    if not files:
        lines.append("No research files found yet.")
        return "\n".join(lines)

    for file_path in files:
        lines.append(f"- {file_path.name}")
    return "\n".join(lines)


def main() -> int:
    if len(sys.argv) < 2:
        print(f"Usage: {Path(sys.argv[0]).name} <skill_dir>")
        return 1

    skill_dir = Path(sys.argv[1])
    print(summarize(skill_dir))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

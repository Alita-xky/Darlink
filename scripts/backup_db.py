#!/usr/bin/env python3
"""备份 SQLite + exports：用 sqlite3 .backup API 在线备份，避免读写锁问题。

输出：backups/darlink_backup_<YYYYMMDD_HHMMSS>.tar.gz
默认保留最近 7 份，超过自动清理最旧的。

用法：
    python scripts/backup_db.py
    python scripts/backup_db.py --keep 30
"""

from __future__ import annotations

import argparse
import shutil
import sqlite3
import sys
import tarfile
import tempfile
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from _common import (  # noqa: E402
    BACKUPS_DIR,
    DB_PATH,
    EXPORTS_DIR,
    REPORTS_DIR,
    get_logger,
)

LOGGER = get_logger("backup")


def backup_sqlite(src: Path, dst: Path) -> None:
    """用 sqlite3 backup API 安全拷贝（即使别的连接正在写也不会损坏）。"""
    if not src.exists():
        raise FileNotFoundError(f"源数据库不存在：{src}")
    src_conn = sqlite3.connect(src.as_posix())
    dst_conn = sqlite3.connect(dst.as_posix())
    try:
        with dst_conn:
            src_conn.backup(dst_conn)
    finally:
        src_conn.close()
        dst_conn.close()


def make_tarball(tar_path: Path, items: list[tuple[Path, str]]) -> None:
    """打包：items = [(实际路径, 在 tar 内的名字), ...]"""
    tar_path.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(tar_path, "w:gz") as tar:
        for src, name in items:
            if src.exists():
                tar.add(src, arcname=name)
                LOGGER.info("  + %s (%s)", name, _human_size(src))
            else:
                LOGGER.info("  · 跳过不存在：%s", src)


def _human_size(p: Path) -> str:
    if p.is_dir():
        total = sum(f.stat().st_size for f in p.rglob("*") if f.is_file())
    else:
        total = p.stat().st_size
    for unit in ["B", "KB", "MB", "GB"]:
        if total < 1024:
            return f"{total:.1f}{unit}"
        total /= 1024
    return f"{total:.1f}TB"


def prune_old_backups(directory: Path, keep: int) -> int:
    backups = sorted(
        directory.glob("darlink_backup_*.tar.gz"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    to_delete = backups[keep:]
    for p in to_delete:
        p.unlink()
        LOGGER.info("已清理旧备份：%s", p.name)
    return len(to_delete)


def main() -> int:
    parser = argparse.ArgumentParser(description="备份 SQLite + exports/reports")
    parser.add_argument("--keep", type=int, default=7, help="保留最近 N 份（默认 7）")
    parser.add_argument("--output-dir", type=str, default=None, help="备份目录（默认 backups/）")
    parser.add_argument("--include-reports", action="store_true", help="同时备份 reports/")
    parser.add_argument("--db", type=str, default=None, help="自定义 sqlite 路径")
    args = parser.parse_args()

    db_path = Path(args.db) if args.db else DB_PATH
    out_dir = Path(args.output_dir) if args.output_dir else BACKUPS_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    tar_path = out_dir / f"darlink_backup_{ts}.tar.gz"

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        # 1. SQLite 在线备份到临时目录
        sqlite_copy = tmp / "darlink.sqlite"
        LOGGER.info("正在备份 sqlite：%s → %s", db_path, sqlite_copy)
        backup_sqlite(db_path, sqlite_copy)

        # 2. 写一份 manifest
        manifest = tmp / "MANIFEST.txt"
        manifest.write_text(
            f"Darlink data backup\n"
            f"created_at: {ts}\n"
            f"sqlite_size: {sqlite_copy.stat().st_size}\n"
            f"includes_exports: yes\n"
            f"includes_reports: {'yes' if args.include_reports else 'no'}\n",
            encoding="utf-8",
        )

        items = [
            (sqlite_copy, "data/darlink.sqlite"),
            (manifest, "MANIFEST.txt"),
            (EXPORTS_DIR, "scripts/exports"),
        ]
        if args.include_reports:
            items.append((REPORTS_DIR, "scripts/reports"))

        # 3. 打 tar.gz
        LOGGER.info("正在打包：%s", tar_path)
        make_tarball(tar_path, items)

    # 4. 清理旧备份
    pruned = prune_old_backups(out_dir, args.keep)
    LOGGER.info(
        "完成：%s（%s）；保留 %d 份，清理 %d 份",
        tar_path,
        _human_size(tar_path),
        args.keep,
        pruned,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

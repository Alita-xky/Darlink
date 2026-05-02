import csv
import datetime
import sqlite3
from pathlib import Path
import db

DB = Path(db.DB_PATH)
out_dir = DB.parent / 'exports'
out_dir.mkdir(parents=True, exist_ok=True)

ts = datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
out_file = out_dir / f'messages_export_{ts}.csv'

conn = sqlite3.connect(DB.as_posix())
conn.row_factory = sqlite3.Row
cur = conn.cursor()
cur.execute("SELECT id, session_id, user_id, role, text, meta, created_at FROM messages ORDER BY created_at")
rows = cur.fetchall()

with open(out_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['id', 'session_id', 'user_id', 'role', 'text', 'meta', 'created_at'])
    for r in rows:
        writer.writerow([r['id'], r['session_id'], r['user_id'], r['role'], r['text'], r['meta'], r['created_at']])

print(f"Exported {len(rows)} rows to {out_file}")

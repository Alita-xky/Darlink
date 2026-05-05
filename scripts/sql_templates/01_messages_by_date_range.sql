-- 用途：按日期范围导出 messages
-- 用法：手动替换 :start_date / :end_date 后执行
--   sqlite3 data/darlink.sqlite < scripts/sql_templates/01_messages_by_date_range.sql

.mode column
.headers on

SELECT m.id,
       m.session_id,
       u.email      AS user_email,
       p.name       AS persona_name,
       m.role,
       SUBSTR(m.text, 1, 60) AS text_preview,
       m.created_at
FROM messages m
LEFT JOIN sessions s  ON s.id = m.session_id
LEFT JOIN users    u  ON u.id = m.user_id
LEFT JOIN personas p  ON p.id = s.persona_id
WHERE DATE(m.created_at) BETWEEN '2026-05-01' AND '2026-05-03'
ORDER BY m.created_at;

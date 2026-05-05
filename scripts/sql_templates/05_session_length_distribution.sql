-- 用途：会话长度分布（每个 session 的消息数分桶）

.mode column
.headers on

WITH session_lengths AS (
    SELECT s.id,
           p.name AS persona_name,
           COUNT(m.id) AS msg_count
    FROM sessions s
    LEFT JOIN messages m ON m.session_id = s.id
    LEFT JOIN personas p ON p.id = s.persona_id
    GROUP BY s.id, p.name
)
SELECT
    CASE
        WHEN msg_count < 4   THEN '01: <4 (低质量)'
        WHEN msg_count < 10  THEN '02: 4-9'
        WHEN msg_count < 20  THEN '03: 10-19'
        WHEN msg_count < 40  THEN '04: 20-39'
        ELSE                       '05: 40+'
    END AS bucket,
    COUNT(*)         AS sessions,
    ROUND(AVG(msg_count), 1) AS avg_msgs
FROM session_lengths
GROUP BY bucket
ORDER BY bucket;

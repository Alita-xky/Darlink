-- 用途：定位低质量会话（消息<4 OR 平均长度<10）

.mode column
.headers on

WITH session_metrics AS (
    SELECT s.id,
           u.email           AS user_email,
           p.name            AS persona_name,
           COUNT(m.id)       AS msg_count,
           ROUND(AVG(LENGTH(m.text)), 1) AS avg_length,
           s.started_at,
           s.last_at
    FROM sessions s
    LEFT JOIN messages m  ON m.session_id = s.id
    LEFT JOIN users u     ON u.id = s.user_id
    LEFT JOIN personas p  ON p.id = s.persona_id
    GROUP BY s.id, u.email, p.name, s.started_at, s.last_at
)
SELECT id, user_email, persona_name, msg_count, avg_length, started_at,
       CASE
           WHEN msg_count < 4 THEN 'too_few_messages'
           WHEN avg_length < 10 THEN 'too_short_avg'
           ELSE 'ok'
       END AS reason
FROM session_metrics
WHERE msg_count < 4 OR avg_length < 10
ORDER BY msg_count, avg_length;

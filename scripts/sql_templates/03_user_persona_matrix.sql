-- 用途：用户 x persona 交互矩阵：每个用户和每个 persona 之间的会话数

.mode column
.headers on

SELECT u.email,
       p.name        AS persona_name,
       COUNT(s.id)   AS session_count,
       SUM((SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id)) AS total_messages
FROM sessions s
JOIN users    u ON u.id = s.user_id
JOIN personas p ON p.id = s.persona_id
GROUP BY u.email, p.name
ORDER BY u.email, session_count DESC;

-- 用途：找出消息数最多的 Top 10 用户

.mode column
.headers on

SELECT u.id,
       u.email,
       u.verified,
       COUNT(m.id) AS user_message_count,
       COUNT(DISTINCT m.session_id) AS session_count,
       MAX(m.created_at) AS last_active_at
FROM users u
JOIN messages m ON m.user_id = u.id AND m.role = 'user'
GROUP BY u.id, u.email, u.verified
ORDER BY user_message_count DESC
LIMIT 10;

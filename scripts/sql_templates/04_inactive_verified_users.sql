-- 用途：已验证但近 7 天没说过话的用户（流失预警）

.mode column
.headers on

SELECT u.id,
       u.email,
       u.created_at AS registered_at,
       (SELECT MAX(m.created_at) FROM messages m WHERE m.user_id = u.id) AS last_message_at,
       (SELECT COUNT(*)         FROM messages m WHERE m.user_id = u.id) AS lifetime_messages
FROM users u
WHERE u.verified = 1
  AND (
    (SELECT MAX(m.created_at) FROM messages m WHERE m.user_id = u.id) IS NULL
    OR (SELECT MAX(m.created_at) FROM messages m WHERE m.user_id = u.id) < datetime('now','-7 days')
  )
ORDER BY u.created_at;

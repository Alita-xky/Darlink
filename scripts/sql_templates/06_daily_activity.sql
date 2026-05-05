-- 用途：近 14 天每日活跃数据（新会话 / 总消息 / 活跃用户）

.mode column
.headers on

SELECT
    DATE(created_at) AS date,
    COUNT(*) AS messages,
    COUNT(DISTINCT session_id) AS active_sessions,
    COUNT(DISTINCT user_id)    AS active_users
FROM messages
WHERE created_at >= datetime('now','-14 days')
GROUP BY DATE(created_at)
ORDER BY date DESC;

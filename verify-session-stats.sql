-- 验证会话统计数据

-- 1. 查看总会话数（不限制时间）
SELECT 'Total Sessions' as metric, COUNT(*) as count 
FROM public.user_sessions;

-- 2. 查看最近7天的会话数
SELECT 'Sessions (7 days)' as metric, COUNT(*) as count 
FROM public.user_sessions 
WHERE start_time >= NOW() - INTERVAL '7 days';

-- 3. 查看有 email 的会话数
SELECT 'Sessions with email' as metric, COUNT(*) as count 
FROM public.user_sessions 
WHERE email IS NOT NULL;

-- 4. 查看按日期分布的会话数
SELECT 
    DATE(start_time) as date,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT email) as unique_users
FROM public.user_sessions 
WHERE start_time >= NOW() - INTERVAL '7 days'
GROUP BY DATE(start_time)
ORDER BY date DESC;

-- 5. 检查最近插入的会话
SELECT 
    session_id,
    LEFT(session_id::text, 20) as session_short,
    email,
    start_time,
    page_views_count
FROM public.user_sessions 
ORDER BY start_time DESC 
LIMIT 5;

-- 6. 检查是否有重复的 session_id
SELECT 
    session_id,
    COUNT(*) as count
FROM public.user_sessions 
GROUP BY session_id
HAVING COUNT(*) > 1;

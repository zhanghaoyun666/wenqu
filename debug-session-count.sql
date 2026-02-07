-- 排查会话数统计问题

-- 1. 查看原始会话记录数（不去重）
SELECT 'Raw session records' as description, COUNT(*) as count
FROM public.user_sessions
WHERE start_time >= NOW() - INTERVAL '7 days';

-- 2. 查看唯一会话ID数（去重）
SELECT 'Unique session IDs' as description, COUNT(DISTINCT session_id) as count
FROM public.user_sessions
WHERE start_time >= NOW() - INTERVAL '7 days';

-- 3. 查看会话ID重复情况
SELECT 
    session_id,
    COUNT(*) as record_count,
    MIN(start_time) as first_seen,
    MAX(start_time) as last_seen
FROM public.user_sessions
WHERE start_time >= NOW() - INTERVAL '7 days'
GROUP BY session_id
HAVING COUNT(*) > 1
ORDER BY record_count DESC
LIMIT 10;

-- 4. 查看会话插入时间分布（用于确认数据是否正常写入）
SELECT 
    DATE_TRUNC('hour', start_time) as hour,
    COUNT(*) as count
FROM public.user_sessions
WHERE start_time >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- 5. 检查是否有 NULL 的 session_id
SELECT 'NULL session_id count' as description, COUNT(*) as count
FROM public.user_sessions
WHERE session_id IS NULL;

-- 6. 查看不同浏览器的会话数（确认数据多样性）
SELECT 
    COALESCE(browser, 'Unknown') as browser,
    COUNT(DISTINCT session_id) as unique_sessions
FROM public.user_sessions
WHERE start_time >= NOW() - INTERVAL '7 days'
GROUP BY browser
ORDER BY unique_sessions DESC;

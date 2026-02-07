-- 检查 user_sessions 表的数据情况

-- 1. 查看总会话数
SELECT COUNT(*) as total_sessions FROM public.user_sessions;

-- 2. 查看最近7天的会话数
SELECT COUNT(*) as sessions_7d 
FROM public.user_sessions 
WHERE start_time >= NOW() - INTERVAL '7 days';

-- 3. 查看会话时间分布
SELECT 
    DATE(start_time) as date,
    COUNT(*) as session_count,
    COUNT(DISTINCT email) as unique_users
FROM public.user_sessions 
WHERE start_time >= NOW() - INTERVAL '7 days'
GROUP BY DATE(start_time)
ORDER BY date DESC;

-- 4. 查看最近的几个会话
SELECT 
    session_id,
    email,
    start_time,
    end_time,
    page_views_count
FROM public.user_sessions 
ORDER BY start_time DESC 
LIMIT 10;

-- 5. 检查 start_time 和 end_time 的差异
SELECT 
    CASE 
        WHEN end_time IS NULL THEN 'No end_time'
        ELSE 'Has end_time'
    END as status,
    COUNT(*) as count
FROM public.user_sessions 
GROUP BY CASE WHEN end_time IS NULL THEN 'No end_time' ELSE 'Has end_time' END;

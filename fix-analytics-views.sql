-- ============================================
-- 修复分析视图：将 user_id 改为 email
-- ============================================

-- 修复每日活跃用户视图
DROP VIEW IF EXISTS public.stats_daily_active_users CASCADE;

CREATE OR REPLACE VIEW public.stats_daily_active_users AS
SELECT DATE(start_time) as date, COUNT(DISTINCT email) as dau
FROM public.user_sessions 
WHERE email IS NOT NULL
GROUP BY DATE(start_time) 
ORDER BY date DESC;

-- 修复 API 性能视图（使用 email 统计有身份的用户调用）
DROP VIEW IF EXISTS public.stats_api_performance CASCADE;

CREATE OR REPLACE VIEW public.stats_api_performance AS
SELECT 
    api_endpoint, 
    http_method, 
    COUNT(*) as total_calls,
    AVG(response_time_ms) as avg_response_time,
    SUM(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 ELSE 0 END) as success_count,
    COUNT(DISTINCT email) as unique_users
FROM public.api_logs 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY api_endpoint, http_method 
ORDER BY total_calls DESC;

-- 添加视图注释
COMMENT ON VIEW public.stats_daily_active_users IS '每日活跃用户数统计（基于 email）';
COMMENT ON VIEW public.stats_api_performance IS 'API 性能统计（基于 email 统计用户）';

-- 验证视图
SELECT 'stats_daily_active_users' as view_name, COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'stats_daily_active_users'
UNION ALL
SELECT 'stats_api_performance', COUNT(*) 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'stats_api_performance';

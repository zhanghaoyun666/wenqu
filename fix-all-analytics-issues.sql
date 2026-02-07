-- ============================================
-- 完整修复分析系统问题
-- ============================================

-- 1. 删除依赖视图
DROP VIEW IF EXISTS public.stats_daily_active_users CASCADE;
DROP VIEW IF EXISTS public.stats_api_performance CASCADE;

-- 2. 修复表结构 - 确保 email 列存在且 user_id 列已删除
-- user_events
ALTER TABLE public.user_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.user_events ADD COLUMN IF NOT EXISTS email TEXT;

-- page_views
ALTER TABLE public.page_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS email TEXT;

-- user_sessions
ALTER TABLE public.user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS email TEXT;

-- feature_usage
ALTER TABLE public.feature_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.feature_usage ADD COLUMN IF NOT EXISTS email TEXT;

-- conversion_funnel
ALTER TABLE public.conversion_funnel DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_funnel DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.conversion_funnel ADD COLUMN IF NOT EXISTS email TEXT;

-- api_logs
ALTER TABLE public.api_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.api_logs ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. 重建视图
CREATE OR REPLACE VIEW public.stats_daily_active_users AS
SELECT DATE(start_time) as date, COUNT(DISTINCT email) as dau
FROM public.user_sessions 
WHERE email IS NOT NULL
GROUP BY DATE(start_time) 
ORDER BY date DESC;

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

-- 4. 添加视图注释
COMMENT ON VIEW public.stats_daily_active_users IS '每日活跃用户数统计（基于 email）';
COMMENT ON VIEW public.stats_api_performance IS 'API 性能统计（基于 email 统计用户）';

-- 5. 验证修复结果
SELECT '修复完成！' as status;

SELECT 
    table_name,
    EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = c.table_name AND column_name = 'email') as has_email,
    EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = c.table_name AND column_name = 'user_id') as has_user_id
FROM information_schema.tables c
WHERE table_schema = 'public' 
    AND table_name IN ('user_events', 'page_views', 'user_sessions', 'feature_usage', 'conversion_funnel', 'api_logs')
ORDER BY table_name;

-- 检查表的 RLS 状态
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_events', 'page_views', 'api_logs', 'user_sessions', 'feature_usage', 'conversion_funnel');

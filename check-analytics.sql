-- 检查数据分析表的 RLS 策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('user_events', 'page_views', 'api_logs', 'user_sessions', 'feature_usage', 'conversion_funnel');

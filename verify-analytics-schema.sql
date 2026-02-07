-- ============================================
-- 验证分析表结构
-- ============================================

-- 检查所有分析表的列结构
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('user_events', 'page_views', 'user_sessions', 'feature_usage', 'conversion_funnel', 'api_logs')
ORDER BY table_name, ordinal_position;

-- 检查 email 列是否存在
SELECT 
    table_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = c.table_name 
        AND column_name = 'email'
    ) as has_email_column
FROM information_schema.tables c
WHERE table_schema = 'public' 
    AND table_name IN ('user_events', 'page_views', 'user_sessions', 'feature_usage', 'conversion_funnel', 'api_logs');

-- 检查 user_id 列是否还存在
SELECT 
    table_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = c.table_name 
        AND column_name = 'user_id'
    ) as has_user_id_column
FROM information_schema.tables c
WHERE table_schema = 'public' 
    AND table_name IN ('user_events', 'page_views', 'user_sessions', 'feature_usage', 'conversion_funnel', 'api_logs');

-- 查看最近的插入记录（验证 email 是否保存）
SELECT 'page_views' as table_name, email, page_path, created_at 
FROM public.page_views 
ORDER BY created_at DESC 
LIMIT 3;

SELECT 'user_sessions' as table_name, email, session_id, start_time 
FROM public.user_sessions 
ORDER BY start_time DESC 
LIMIT 3;

SELECT 'feature_usage' as table_name, email, feature_type, action, created_at 
FROM public.feature_usage 
ORDER BY created_at DESC 
LIMIT 3;

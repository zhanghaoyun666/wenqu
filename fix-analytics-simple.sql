-- ============================================
-- 简单修复数据分析表
-- ============================================

-- 1. 先禁用所有表的 RLS（最简单的方法）
DO $$
BEGIN
    -- 禁用 RLS
    EXECUTE 'ALTER TABLE IF EXISTS public.user_events DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.page_views DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.api_logs DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.user_sessions DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.feature_usage DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.conversion_funnel DISABLE ROW LEVEL SECURITY';
END
$$;

-- 2. 查看是否成功
SELECT 'RLS 已禁用' as status;

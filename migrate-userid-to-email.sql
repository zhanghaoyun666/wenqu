-- ============================================
-- 迁移脚本：将 user_id 列改为 email 列
-- ============================================

-- 禁用触发器和外键约束检查
SET session_replication_role = replica;

-- 首先删除依赖视图（如果存在）
DROP VIEW IF EXISTS stats_daily_active_users CASCADE;
DROP VIEW IF EXISTS stats_api_performance CASCADE;

-- ============================================
-- 1. user_events 表
-- ============================================
ALTER TABLE public.user_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.user_events ADD COLUMN IF NOT EXISTS email TEXT;

-- ============================================
-- 2. page_views 表
-- ============================================
ALTER TABLE public.page_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS email TEXT;

-- ============================================
-- 3. user_sessions 表
-- ============================================
ALTER TABLE public.user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS email TEXT;

-- ============================================
-- 4. feature_usage 表（注意：此表没有 ip_address/user_agent 列）
-- ============================================
ALTER TABLE public.feature_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.feature_usage ADD COLUMN IF NOT EXISTS email TEXT;

-- ============================================
-- 5. conversion_funnel 表（注意：此表没有 ip_address/user_agent 列）
-- ============================================
ALTER TABLE public.conversion_funnel DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_funnel DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.conversion_funnel ADD COLUMN IF NOT EXISTS email TEXT;

-- ============================================
-- 6. api_logs 表
-- ============================================
ALTER TABLE public.api_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.api_logs ADD COLUMN IF NOT EXISTS email TEXT;

-- 恢复触发器和外键约束检查
SET session_replication_role = DEFAULT;

-- ============================================
-- 验证结果
-- ============================================
SELECT 
    'user_events' as table_name,
    COUNT(*) as total_columns,
    EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'user_events' AND column_name = 'email') as has_email
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_events'

UNION ALL

SELECT 
    'page_views',
    COUNT(*),
    EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'page_views' AND column_name = 'email')
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'page_views'

UNION ALL

SELECT 
    'user_sessions',
    COUNT(*),
    EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'user_sessions' AND column_name = 'email')
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_sessions'

UNION ALL

SELECT 
    'feature_usage',
    COUNT(*),
    EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'feature_usage' AND column_name = 'email')
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'feature_usage'

UNION ALL

SELECT 
    'conversion_funnel',
    COUNT(*),
    EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'conversion_funnel' AND column_name = 'email')
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'conversion_funnel'

UNION ALL

SELECT 
    'api_logs',
    COUNT(*),
    EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'api_logs' AND column_name = 'email')
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'api_logs';

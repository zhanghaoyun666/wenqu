-- ============================================
-- 完整修复数据分析表
-- ============================================

-- 1. 删除所有外键约束（因为我们使用自建用户系统）
ALTER TABLE public.user_events DROP CONSTRAINT IF EXISTS user_events_user_id_fkey;
ALTER TABLE public.page_views DROP CONSTRAINT IF EXISTS page_views_user_id_fkey;
ALTER TABLE public.api_logs DROP CONSTRAINT IF EXISTS api_logs_user_id_fkey;
ALTER TABLE public.user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;
ALTER TABLE public.feature_usage DROP CONSTRAINT IF EXISTS feature_usage_user_id_fkey;
ALTER TABLE public.conversion_funnel DROP CONSTRAINT IF EXISTS conversion_funnel_user_id_fkey;

-- 2. 删除所有旧的 RLS 策略
DROP POLICY IF EXISTS "Anyone can insert events" ON public.user_events;
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "Service role can insert api logs" ON public.api_logs;
DROP POLICY IF EXISTS "Anyone can insert sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Anyone can insert feature usage" ON public.feature_usage;
DROP POLICY IF EXISTS "Anyone can insert conversion data" ON public.conversion_funnel;

-- 删除 SELECT 策略（如果存在）
DROP POLICY IF EXISTS "Admins can view all events" ON public.user_events;
DROP POLICY IF EXISTS "Admins can view all page views" ON public.page_views;
DROP POLICY IF EXISTS "Admins can view all api logs" ON public.api_logs;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can view all feature usage" ON public.feature_usage;
DROP POLICY IF EXISTS "Admins can view all conversion data" ON public.conversion_funnel;

-- 3. 禁用并重新启用 RLS（刷新策略缓存）
ALTER TABLE public.user_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_funnel DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_funnel ENABLE ROW LEVEL SECURITY;

-- 4. 创建新的 RLS 策略 - 允许所有操作（后端代码控制权限）
CREATE POLICY "Allow all user_events" ON public.user_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all page_views" ON public.page_views FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all api_logs" ON public.api_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all user_sessions" ON public.user_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all feature_usage" ON public.feature_usage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all conversion_funnel" ON public.conversion_funnel FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 完成
-- ============================================
SELECT '数据分析表修复完成！' as message;

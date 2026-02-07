-- ============================================
-- 修复数据分析表的 RLS 策略
-- 确保后端可以正常插入数据
-- ============================================

-- 删除旧的策略
DROP POLICY IF EXISTS "Anyone can insert events" ON public.user_events;
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "Service role can insert api logs" ON public.api_logs;
DROP POLICY IF EXISTS "Anyone can insert sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Anyone can insert feature usage" ON public.feature_usage;
DROP POLICY IF EXISTS "Anyone can insert conversion data" ON public.conversion_funnel;

-- 创建新的策略：允许任何人插入（后端代码控制权限）
CREATE POLICY "Allow insert user_events" ON public.user_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert page_views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert api_logs" ON public.api_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert user_sessions" ON public.user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert feature_usage" ON public.feature_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert conversion_funnel" ON public.conversion_funnel FOR INSERT WITH CHECK (true);

-- 允许任何人查询（管理后台需要）
CREATE POLICY "Allow select user_events" ON public.user_events FOR SELECT USING (true);
CREATE POLICY "Allow select page_views" ON public.page_views FOR SELECT USING (true);
CREATE POLICY "Allow select api_logs" ON public.api_logs FOR SELECT USING (true);
CREATE POLICY "Allow select user_sessions" ON public.user_sessions FOR SELECT USING (true);
CREATE POLICY "Allow select feature_usage" ON public.feature_usage FOR SELECT USING (true);
CREATE POLICY "Allow select conversion_funnel" ON public.conversion_funnel FOR SELECT USING (true);

-- ============================================
-- 完成
-- ============================================
SELECT '数据分析表 RLS 策略已修复！' as message;

-- ============================================
-- 问渠 AI 命理咨询 - 数据库初始化脚本
-- 包含用户认证表和数据分析表
-- ============================================

-- ============================================
-- 第一部分：用户认证相关表
-- ============================================

-- 1. 创建用户资料表
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    nickname TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. 启用 RLS (行级安全)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. 创建触发器函数：新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nickname, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. 创建访问策略 - profiles 表
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- 第二部分：数据分析埋点表
-- ============================================

-- 1. 用户行为事件表
CREATE TABLE IF NOT EXISTS public.user_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT,
    session_id TEXT,
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    page_path TEXT,
    properties JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. 页面访问统计表
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT,
    session_id TEXT,
    page_path TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    exit_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    ip_address INET,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT
);

-- 3. API 调用日志表
CREATE TABLE IF NOT EXISTS public.api_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT,
    session_id TEXT,
    api_endpoint TEXT NOT NULL,
    http_method TEXT NOT NULL,
    request_params JSONB,
    response_status INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. 用户会话统计表
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    email TEXT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    page_views_count INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    source TEXT,
    campaign TEXT
);

-- 5. 功能使用统计表
CREATE TABLE IF NOT EXISTS public.feature_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT,
    session_id TEXT,
    feature_type TEXT NOT NULL CHECK (feature_type IN ('bazi', 'liuyao', 'heban', 'wendao', 'hunyin', 'shiyun')),
    action TEXT NOT NULL,
    duration_seconds INTEGER,
    input_params JSONB,
    result_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. 用户转化漏斗表
CREATE TABLE IF NOT EXISTS public.conversion_funnel (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT,
    session_id TEXT,
    funnel_name TEXT NOT NULL,
    step_name TEXT NOT NULL,
    step_order INTEGER,
    completed BOOLEAN DEFAULT false,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================
-- 第三部分：启用 RLS 和创建策略
-- ============================================

-- 启用 RLS
-- Note: Analytics tables RLS disabled for custom auth system
-- Data is inserted via service role key from backend
ALTER TABLE public.user_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_funnel DISABLE ROW LEVEL SECURITY;

-- 埋点表访问策略（允许匿名插入，管理员查看）
CREATE POLICY "Anyone can insert events" ON public.user_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert page views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can insert api logs" ON public.api_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert sessions" ON public.user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert feature usage" ON public.feature_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert conversion data" ON public.conversion_funnel FOR INSERT WITH CHECK (true);

-- ============================================
-- 第四部分：创建索引
-- ============================================

-- profiles 表索引
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at DESC);

-- 埋点表索引
CREATE INDEX idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX idx_user_events_created_at ON public.user_events(created_at DESC);
CREATE INDEX idx_page_views_user_id ON public.page_views(user_id);
CREATE INDEX idx_page_views_entry_time ON public.page_views(entry_time DESC);
CREATE INDEX idx_api_logs_created_at ON public.api_logs(created_at DESC);
CREATE INDEX idx_user_sessions_session_id ON public.user_sessions(session_id);
CREATE INDEX idx_feature_usage_feature_type ON public.feature_usage(feature_type);
CREATE INDEX idx_conversion_funnel_funnel_name ON public.conversion_funnel(funnel_name);

-- ============================================
-- 第五部分：创建统计视图
-- ============================================

-- 每日活跃用户
CREATE OR REPLACE VIEW public.stats_daily_active_users AS
SELECT DATE(start_time) as date, COUNT(DISTINCT email) as dau
FROM public.user_sessions 
WHERE email IS NOT NULL
GROUP BY DATE(start_time) 
ORDER BY date DESC;

-- API 性能统计
CREATE OR REPLACE VIEW public.stats_api_performance AS
SELECT api_endpoint, http_method, COUNT(*) as total_calls,
    AVG(response_time_ms) as avg_response_time,
    SUM(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 ELSE 0 END) as success_count
FROM public.api_logs 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY api_endpoint, http_method 
ORDER BY total_calls DESC;

-- ============================================
-- 第六部分：设置实时订阅
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_usage;

-- ============================================
-- 完成
-- ============================================
SELECT '数据库初始化完成！' as message;

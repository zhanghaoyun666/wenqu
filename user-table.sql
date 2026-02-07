-- ============================================
-- 独立用户系统表
-- 不依赖 Supabase Auth
-- ============================================

-- 创建用户表
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    nickname TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 创建索引
CREATE INDEX idx_app_users_email ON public.app_users(email);
CREATE INDEX idx_app_users_role ON public.app_users(role);
CREATE INDEX idx_app_users_created_at ON public.app_users(created_at DESC);

-- 启用 RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 创建策略（允许任何人插入，但只有自己能查看自己的信息）
CREATE POLICY "Anyone can insert users" ON public.app_users FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON public.app_users FOR SELECT
    USING (auth.uid()::text = id::text);

-- 完成
SELECT '用户表创建完成！' as message;

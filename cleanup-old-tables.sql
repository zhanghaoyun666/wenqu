-- ============================================
-- 清理旧的 Supabase Auth 相关表和对象
-- 使用自建用户系统后可以执行此脚本
-- ============================================

-- 1. 删除旧的 profiles 表（如果存在）
-- 注意：确保数据已迁移到 app_users 后再执行
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. 删除旧的触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. 删除旧的触发器函数（如果存在）
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- 更新数据分析表，适配自建用户系统
-- ============================================

-- 1. 更新 user_events 表的外键引用
-- 方法A：删除外键约束（推荐，最灵活）
ALTER TABLE public.user_events 
DROP CONSTRAINT IF EXISTS user_events_user_id_fkey;

-- 方法B：改为引用 app_users（如果需要外键约束）
-- ALTER TABLE public.user_events 
-- DROP CONSTRAINT IF EXISTS user_events_user_id_fkey,
-- ADD CONSTRAINT user_events_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE SET NULL;

-- 2. 更新 page_views 表的外键引用
ALTER TABLE public.page_views 
DROP CONSTRAINT IF EXISTS page_views_user_id_fkey;

-- 3. 更新 api_logs 表的外键引用
ALTER TABLE public.api_logs 
DROP CONSTRAINT IF EXISTS api_logs_user_id_fkey;

-- 4. 更新 user_sessions 表的外键引用
ALTER TABLE public.user_sessions 
DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;

-- 5. 更新 feature_usage 表的外键引用
ALTER TABLE public.feature_usage 
DROP CONSTRAINT IF EXISTS feature_usage_user_id_fkey;

-- 6. 更新 conversion_funnel 表的外键引用
ALTER TABLE public.conversion_funnel 
DROP CONSTRAINT IF EXISTS conversion_funnel_user_id_fkey;

-- ============================================
-- 完成
-- ============================================
SELECT '清理完成！已删除外键约束，数据分析表现在与自建用户系统兼容。' as message;

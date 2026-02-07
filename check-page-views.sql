-- 检查 page_views 表中的 email 情况
SELECT 
    id,
    email,
    page_path,
    page_title,
    session_id,
    created_at
FROM public.page_views 
ORDER BY created_at DESC 
LIMIT 10;

-- 统计有 email 和没有 email 的记录数
SELECT 
    CASE WHEN email IS NULL THEN 'No Email' ELSE 'Has Email' END as status,
    COUNT(*) as count
FROM public.page_views 
GROUP BY CASE WHEN email IS NULL THEN 'No Email' ELSE 'Has Email' END;

-- 检查表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'page_views'
ORDER BY ordinal_position;

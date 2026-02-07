require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function listUsers() {
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    console.log('');
    
    // 查询所有表
    const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
    
    if (tableError) {
        console.log('查询表失败:', tableError.message);
    } else {
        console.log('Public schema 中的表:');
        tables.forEach(t => console.log('  -', t.table_name));
    }
    
    console.log('');
    
    // 查询 app_users 表
    const { data: users, error } = await supabase
        .from('app_users')
        .select('*');
    
    if (error) {
        console.log('查询 app_users 失败:', error.message);
    } else {
        console.log('app_users 表中的用户:');
        console.log('数量:', users.length);
        users.forEach(u => {
            console.log('  -', u.email, '(ID:', u.id.substring(0, 8) + '...)');
        });
    }
}

listUsers();

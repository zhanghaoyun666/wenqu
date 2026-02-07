require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkUsers() {
    console.log('检查 app_users 表...\n');
    
    const { data, error } = await supabase
        .from('app_users')
        .select('*');
    
    if (error) {
        console.log('❌ 查询失败:', error.message);
        return;
    }
    
    if (!data || data.length === 0) {
        console.log('⚠️ app_users 表为空，没有注册用户');
        console.log('\n可能原因：');
        console.log('1. 注册时使用的是旧的 Supabase Auth 系统');
        console.log('2. 注册没有成功写入数据库');
        console.log('\n建议：重新注册一个账号');
    } else {
        console.log('✅ 找到', data.length, '个用户:\n');
        data.forEach(u => {
            console.log('  邮箱:', u.email);
            console.log('  昵称:', u.nickname);
            console.log('  角色:', u.role);
            console.log('  注册时间:', u.created_at);
            console.log('  ---');
        });
    }
}

checkUsers();

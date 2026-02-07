require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
}

async function check() {
    const { data: user } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', '1@2')
        .single();
    
    if (!user) {
        console.log('未找到用户');
        return;
    }
    
    console.log('用户信息:');
    console.log('  ID:', user.id);
    console.log('  邮箱:', user.email);
    console.log('  昵称:', user.nickname);
    console.log('  角色:', user.role);
    console.log('  创建时间:', user.created_at);
    console.log('');
    console.log('密码验证测试:');
    console.log('  Salt:', user.salt);
    console.log('  Stored hash:', user.password_hash);
    console.log('');
    
    // 测试不同密码
    const passwords = ['123', '123456', '', '1', '111', '1234', '12345'];
    for (const pwd of passwords) {
        const hash = hashPassword(pwd, user.salt);
        const match = hash === user.password_hash;
        console.log(`  密码 "${pwd}": ${match ? '✅ 匹配' : '❌ 不匹配'}`);
    }
}

check();

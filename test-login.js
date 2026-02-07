require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 测试的邮箱和密码
const testEmail = '1@2';
const testPassword = '123';

function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
}

async function testLogin() {
    console.log('测试登录...\n');
    console.log('邮箱:', testEmail);
    console.log('输入密码:', testPassword);
    console.log('');
    
    // 查询用户
    const { data: user, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', testEmail)
        .single();
    
    if (error || !user) {
        console.log('❌ 用户不存在');
        return;
    }
    
    console.log('✅ 用户存在');
    console.log('  ID:', user.id);
    console.log('  邮箱:', user.email);
    console.log('  昵称:', user.nickname);
    console.log('  角色:', user.role);
    console.log('');
    console.log('存储的 salt:', user.salt);
    console.log('存储的 password_hash:', user.password_hash);
    console.log('');
    
    // 计算密码 hash
    const computedHash = hashPassword(testPassword, user.salt);
    console.log('计算的 hash:', computedHash);
    console.log('');
    
    // 比较
    if (computedHash === user.password_hash) {
        console.log('✅ 密码匹配！登录应该成功');
    } else {
        console.log('❌ 密码不匹配！');
        console.log('');
        console.log('可能原因：');
        console.log('1. 输入的密码不正确');
        console.log('2. 注册时保存的密码有误');
        console.log('3. 密码被截断或编码有问题');
    }
}

testLogin();

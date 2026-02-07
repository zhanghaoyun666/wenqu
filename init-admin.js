/**
 * 初始化管理员脚本
 * 创建第一个管理员账号
 */

require('dotenv').config();
const UserSystem = require('./user-system');

async function initAdmin() {
    try {
        const email = process.env.ADMIN_EMAIL || 'admin@wenqu.local';
        const password = process.env.ADMIN_PASSWORD || 'admin123';
        
        console.log('正在创建管理员账号...');
        console.log('邮箱:', email);
        
        // 先尝试注册
        let result = await UserSystem.register(email, password, '管理员');
        
        if (!result.success) {
            // 如果已存在，尝试登录
            if (result.error.includes('已被注册')) {
                console.log('管理员账号已存在，尝试设置为管理员角色...');
                
                // 查找用户
                const { data: users } = await UserSystem.getAllUsers();
                const admin = users.find(u => u.email === email);
                
                if (admin) {
                    await UserSystem.setUserRole(admin.id, 'admin');
                    console.log('✅ 已将账号设为管理员');
                    return;
                }
            }
            
            console.error('❌ 创建失败:', result.error);
            return;
        }
        
        // 设置为管理员
        await UserSystem.setUserRole(result.user.id, 'admin');
        
        console.log('✅ 管理员账号创建成功！');
        console.log('邮箱:', email);
        console.log('密码:', password);
        console.log('');
        console.log('请使用以上信息登录管理后台');
        
    } catch (error) {
        console.error('初始化管理员失败:', error.message);
    }
}

initAdmin();

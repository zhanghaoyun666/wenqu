/**
 * 独立用户系统
 * 不依赖 Supabase Auth，只使用 Supabase 作为数据库存储
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * 生成随机盐
 */
function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * 哈希密码
 */
function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
}

/**
 * 生成 JWT Token
 */
function generateToken(user) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7天过期
    })).toString('base64url');
    
    const signature = crypto.createHmac('sha256', JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64url');
    
    return `${header}.${payload}.${signature}`;
}

/**
 * 验证 JWT Token
 */
function verifyToken(token) {
    try {
        const [header, payload, signature] = token.split('.');
        
        const expectedSignature = crypto.createHmac('sha256', JWT_SECRET)
            .update(`${header}.${payload}`)
            .digest('base64url');
        
        if (signature !== expectedSignature) {
            return null;
        }
        
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
        
        if (decoded.exp < Math.floor(Date.now() / 1000)) {
            return null; // Token 过期
        }
        
        return decoded;
    } catch (error) {
        return null;
    }
}

/**
 * 生成 UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 用户系统
 */
const UserSystem = {
    /**
     * 用户注册
     */
    async register(email, password, nickname) {
        try {
            // 检查邮箱是否已存在
            const { data: existing, error: checkError } = await supabase
                .from('app_users')
                .select('id')
                .eq('email', email)
                .single();

            if (existing) {
                return { success: false, error: '该邮箱已被注册' };
            }

            // 创建用户
            const salt = generateSalt();
            const hashedPassword = hashPassword(password, salt);
            const userId = generateUUID();

            const { error } = await supabase
                .from('app_users')
                .insert([{
                    id: userId,
                    email,
                    password_hash: hashedPassword,
                    salt,
                    nickname: nickname || email.split('@')[0],
                    role: 'user',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);

            if (error) throw error;

            // 生成 token
            const token = generateToken({
                id: userId,
                email,
                role: 'user'
            });

            return {
                success: true,
                user: {
                    id: userId,
                    email,
                    nickname: nickname || email.split('@')[0],
                    role: 'user'
                },
                token
            };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: error.message || '注册失败' };
        }
    },

    /**
     * 用户登录
     */
    async login(email, password) {
        try {
            console.log('Login attempt:', email);
            
            // 查找用户
            const { data: user, error } = await supabase
                .from('app_users')
                .select('*')
                .eq('email', email)
                .single();

            console.log('User found:', user ? 'yes' : 'no', 'Error:', error);

            if (error || !user) {
                return { success: false, error: '邮箱或密码错误' };
            }

            // 验证密码
            const hashedPassword = hashPassword(password, user.salt);
            console.log('Password check:', hashedPassword === user.password_hash);
            console.log('Stored hash:', user.password_hash);
            console.log('Computed hash:', hashedPassword);
            
            if (hashedPassword !== user.password_hash) {
                return { success: false, error: '邮箱或密码错误' };
            }

            // 生成 token
            const token = generateToken({
                id: user.id,
                email: user.email,
                role: user.role
            });

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    nickname: user.nickname,
                    role: user.role
                },
                token
            };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message || '登录失败' };
        }
    },

    /**
     * 验证 Token
     */
    verifyToken(token) {
        return verifyToken(token);
    },

    /**
     * 获取当前用户
     */
    async getUserById(userId) {
        try {
            const { data: user, error } = await supabase
                .from('app_users')
                .select('id, email, nickname, role, created_at')
                .eq('id', userId)
                .single();

            if (error || !user) {
                return { success: false, error: '用户不存在' };
            }

            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * 获取所有用户（管理员用）
     */
    async getAllUsers() {
        try {
            const { data, error } = await supabase
                .from('app_users')
                .select('id, email, nickname, role, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Get all users error:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * 获取新注册用户
     */
    async getNewUsers(hours = 24) {
        try {
            const since = new Date();
            since.setHours(since.getHours() - hours);

            const { data, error } = await supabase
                .from('app_users')
                .select('id, email, nickname, role, created_at')
                .gte('created_at', since.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Get new users error:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * 设置用户角色
     */
    async setUserRole(userId, role) {
        try {
            const { error } = await supabase
                .from('app_users')
                .update({ role, updated_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * 删除用户
     */
    async deleteUser(userId) {
        try {
            const { error } = await supabase
                .from('app_users')
                .delete()
                .eq('id', userId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * 获取统计
     */
    async getStats() {
        try {
            // 用户总数
            const { count: totalUsers } = await supabase
                .from('app_users')
                .select('*', { count: 'exact', head: true });

            // 今日新增
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: todayUsers } = await supabase
                .from('app_users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            // 本周新增
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const { count: weekUsers } = await supabase
                .from('app_users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', weekAgo.toISOString());

            // 管理员数量
            const { count: adminCount } = await supabase
                .from('app_users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'admin');

            return {
                success: true,
                stats: {
                    totalUsers: totalUsers || 0,
                    todayNewUsers: todayUsers || 0,
                    weekNewUsers: weekUsers || 0,
                    adminCount: adminCount || 0
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

module.exports = UserSystem;

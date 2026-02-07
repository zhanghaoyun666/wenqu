/**
 * Supabase 客户端配置
 * 用于用户认证、数据存储和数据分析
 */

const { createClient } = require('@supabase/supabase-js');

// 从环境变量读取配置
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 服务角色客户端（使用相同的 key）
const supabaseAdmin = supabase;

/**
 * 用户认证模块
 */
const Auth = {
    /**
     * 用户注册
     * @param {string} email - 邮箱
     * @param {string} password - 密码
     * @param {string} nickname - 昵称
     */
    async signUp(email, password, nickname) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        nickname: nickname || email.split('@')[0],
                        role: 'user'
                    }
                }
            });

            if (error) {
                // 如果是速率限制，给出友好提示
                if (error.message && error.message.includes('rate limit')) {
                    return {
                        success: false,
                        error: '注册太频繁，请等待1小时后再试，或联系管理员'
                    };
                }
                throw error;
            }

            return {
                success: true,
                user: data.user,
                message: '注册成功'
            };
        } catch (error) {
            console.error('Sign up error:', error);
            return {
                success: false,
                error: error.message || '注册失败'
            };
        }
    },

    /**
     * 用户登录
     * @param {string} email - 邮箱
     * @param {string} password - 密码
     */
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // 获取用户详细信息
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Get profile error:', profileError);
            }

            return {
                success: true,
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    ...profile
                },
                session: data.session,
                message: '登录成功'
            };
        } catch (error) {
            console.error('Sign in error:', error);
            return {
                success: false,
                error: error.message || '登录失败'
            };
        }
    },

    /**
     * 用户登出
     */
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true, message: '已登出' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * 获取当前用户
     */
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            
            if (!user) return { success: false, user: null };

            // 获取用户详细信息
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Get profile error:', profileError);
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    ...profile
                }
            };
        } catch (error) {
            console.error('Get current user error:', error);
            return { success: false, error: error.message, user: null };
        }
    },

    /**
     * 刷新会话
     */
    async refreshSession() {
        try {
            const { data, error } = await supabase.auth.refreshSession();
            if (error) throw error;
            return { success: true, session: data.session };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

/**
 * 管理员功能
 */
const Admin = {
    /**
     * 获取所有用户列表
     */
    async getAllUsers() {
        try {
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Get all users error:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    /**
     * 获取新注册用户（最近24小时）
     */
    async getNewUsers(hours = 24) {
        try {
            const since = new Date();
            since.setHours(since.getHours() - hours);

            const { data, error } = await supabaseAdmin
                .from('profiles')
                .select('*')
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
     * 获取统计数据
     */
    async getStats() {
        try {
            // 用户总数
            const { count: totalUsers, error: userError } = await supabaseAdmin
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            if (userError) throw userError;

            // 今日新增用户
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: todayUsers, error: todayError } = await supabaseAdmin
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            if (todayError) throw todayError;

            // 本周新增用户
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const { count: weekUsers, error: weekError } = await supabaseAdmin
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', weekAgo.toISOString());

            if (weekError) throw weekError;

            // 管理员数量
            const { count: adminCount, error: adminError } = await supabaseAdmin
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'admin');

            if (adminError) throw adminError;

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
            console.error('Get admin stats error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 设置用户角色
     */
    async setUserRole(userId, role) {
        try {
            const { error } = await supabaseAdmin
                .from('profiles')
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
            // 先删除 profile
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (profileError) throw profileError;

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

/**
 * 数据埋点模块
 */
const Analytics = {
    async trackEvent(eventData) {
        try {
            const { error } = await supabase
                .from('user_events')
                .insert([eventData]);
            return { success: !error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

module.exports = {
    supabase,
    supabaseAdmin,
    Auth,
    Admin,
    Analytics
};

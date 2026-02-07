/**
 * 认证相关 API 路由
 * 使用自建用户系统（不依赖 Supabase Auth）
 */

const express = require('express');
const router = express.Router();
const UserSystem = require('./user-system');

/**
 * 中间件：验证用户是否登录
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: '未登录' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = UserSystem.verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ success: false, error: '登录已过期' });
    }
    
    req.user = decoded;
    next();
}

/**
 * 中间件：验证是否是管理员
 */
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: '无权限访问' });
    }
    next();
}

// ==================== 认证路由 ====================

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
    const { email, password, nickname } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, error: '邮箱和密码不能为空' });
    }
    
    const result = await UserSystem.register(email, password, nickname);
    res.json(result);
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, error: '邮箱和密码不能为空' });
    }
    
    const result = await UserSystem.login(email, password);
    res.json(result);
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', requireAuth, async (req, res) => {
    const result = await UserSystem.getUserById(req.user.id);
    res.json(result);
});

// ==================== 管理员路由 ====================

/**
 * GET /api/admin/users
 * 获取所有用户列表
 */
router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
    const result = await UserSystem.getAllUsers();
    res.json(result);
});

/**
 * GET /api/admin/users/new
 * 获取新注册用户
 */
router.get('/admin/users/new', requireAuth, requireAdmin, async (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    const result = await UserSystem.getNewUsers(hours);
    res.json(result);
});

/**
 * GET /api/admin/stats
 * 获取统计数据
 */
router.get('/admin/stats', requireAuth, requireAdmin, async (req, res) => {
    const result = await UserSystem.getStats();
    res.json(result);
});

/**
 * POST /api/admin/users/:id/role
 * 设置用户角色
 */
router.post('/admin/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, error: '无效的角色' });
    }
    
    const result = await UserSystem.setUserRole(id, role);
    res.json(result);
});

/**
 * DELETE /api/admin/users/:id
 * 删除用户
 */
router.delete('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const result = await UserSystem.deleteUser(id);
    res.json(result);
});

module.exports = {
    router,
    requireAuth,
    requireAdmin
};

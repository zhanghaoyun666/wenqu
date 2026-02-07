# 问渠 - 登录功能配置指南

## 🔐 登录功能概述

本项目实现了完整的用户认证系统，包括：
- ✅ 用户注册/登录/登出
- ✅ 游客模式（免登录体验）
- ✅ 管理员权限控制
- ✅ 会话持久化

---

## 📋 配置步骤

### 第一步：创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并注册账号
2. 创建一个新项目
3. 等待数据库初始化完成

### 第二步：获取 API 密钥

在 Supabase 控制台中：
1. 进入 **Project Settings** → **API**
2. 复制以下信息：
   - `Project URL` → 对应 `SUPABASE_URL`
   - `anon public` → 对应 `SUPABASE_ANON_KEY`
   - `service_role secret` → 对应 `SUPABASE_SERVICE_KEY`

### 第三步：配置环境变量

编辑 `.env` 文件：

```bash
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...

# 管理员配置（设置一个复杂密码）
ADMIN_SECRET=your-secure-admin-secret-key
ADMIN_EMAIL=admin@example.com
ADMIN_INITIAL_PASSWORD=Admin@123456
```

### 第四步：初始化数据库

1. 在 Supabase 控制台中打开 **SQL Editor**
2. 创建一个新查询
3. 复制 `supabase-init.sql` 文件的全部内容
4. 执行脚本

---

## 👤 创建管理员账号

### 方法一：使用脚本（推荐 ⭐）

**最简单的方法**，一键创建管理员：

```bash
# 1. 确保 .env 文件已配置好
# 2. 运行初始化脚本
npm run init-admin
```

**输出示例**：
```
🚀 开始创建管理员账号...

📋 配置信息：
  Supabase URL: https://xxx.supabase.co
  管理员邮箱: admin@wenqu.local
  管理员昵称: 管理员

🔍 步骤 1/3：检查用户是否已存在...
👤 步骤 2/3：创建管理员用户...
✅ 用户创建成功
   用户ID: xxx-xxx-xxx
   邮箱: admin@wenqu.local
📝 步骤 3/3：更新用户资料...
✅ 用户资料已更新

🎉 管理员账号创建成功！

📧 登录信息：
   邮箱: admin@wenqu.local
   密码: Admin@123456
   角色: admin

🌐 登录地址：
   http://localhost:3000/auth.html
```

### 方法二：使用 Supabase Dashboard

如果脚本执行失败，可以手动创建：

**步骤 1：创建用户**
1. 打开 Supabase Dashboard → Authentication → Users
2. 点击 **Invite user** 或 **Add user**
3. 输入管理员邮箱和密码
4. 勾选 **Auto-confirm email?**（跳过邮箱验证）

**步骤 2：设置为管理员**
1. 打开 SQL Editor
2. 执行以下 SQL：

```sql
-- 将指定邮箱的用户设置为管理员
UPDATE public.profiles 
SET role = 'admin',
    nickname = '管理员'
WHERE id IN (
    SELECT id 
    FROM auth.users 
    WHERE email = 'admin@wenqu.local'
);
```

**步骤 3：验证**
```sql
-- 查看所有管理员
SELECT p.id, u.email, p.role
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';
```

### 方法三：使用 SQL 脚本

在 SQL Editor 中执行 `create-admin.sql` 文件中的内容。

---

## 🎯 功能说明

### 普通用户流程

```
访问功能页面 → 检查登录状态
                      │
        ┌─────────────┴─────────────┐
        │                           │
     已登录                      未登录
        │                           │
   显示功能表单              显示登录提示
        │                           │
   正常使用功能              点击登录
                                  │
                            跳转到登录页
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                 选择登录                      选择注册
                    │                           │
              输入邮箱密码                 填写注册信息
                    │                           │
              验证成功 ←─────────────────────────┘
                    │
              跳转到首页
```

### 游客模式

如果 Supabase 未配置，系统会自动切换到**演示模式**：
- 用户可以点击"游客体验"免登录使用
- 游客身份标记为 `isGuest: true`
- 数据仅保存在本地，清除浏览器后丢失

### 管理员功能

管理员账号可以：
- 查看所有用户列表
- 查看统计数据
- 设置用户角色
- 访问数据看板 (`/dashboard.html`)

**访问管理员后台**：
1. 使用管理员账号登录
2. 点击导航栏的"📊 数据"
3. 或在浏览器直接访问 `http://localhost:3000/dashboard.html`

---

## 🔧 技术实现

### 前端存储

登录状态保存在 `localStorage`：

```javascript
localStorage.setItem('wq_user', JSON.stringify({
    id: 'user-uuid',
    email: 'user@example.com',
    role: 'user' // 或 'admin'
}));
```

### 后端验证

受保护的路由使用中间件验证：

```javascript
// 验证登录
app.post('/api/protected', requireAuth, async (req, res) => {
    // 只有登录用户能访问
});

// 验证管理员
app.get('/api/admin/data', requireAdmin, async (req, res) => {
    // 只有管理员能访问
});
```

### API 端点

| 端点 | 方法 | 说明 | 需要登录 |
|------|------|------|---------|
| `/api/config` | GET | 获取前端配置 | ❌ |
| `/api/auth/register` | POST | 用户注册 | ❌ |
| `/api/auth/login` | POST | 用户登录 | ❌ |
| `/api/auth/logout` | POST | 用户登出 | ✅ |
| `/api/auth/me` | GET | 获取当前用户 | ✅ |
| `/api/admin/users` | GET | 用户列表 | 仅管理员 |
| `/api/admin/stats` | GET | 统计数据 | 仅管理员 |

---

## 🐛 常见问题

### 1. 创建管理员失败

**可能原因**：
- SUPABASE_SERVICE_KEY 不正确
- 数据库表未创建
- 网络连接问题

**解决方法**：
```bash
# 1. 检查配置
echo $SUPABASE_SERVICE_KEY

# 2. 确认数据库表已创建
# 在 SQL Editor 中执行：
SELECT * FROM public.profiles LIMIT 1;

# 3. 重新运行脚本
npm run init-admin
```

### 2. 管理员登录后看不到数据看板

**检查项**：
1. 用户 role 是否为 `admin`
   ```sql
   SELECT role FROM public.profiles WHERE id = '用户ID';
   ```

2. 是否使用了正确的 ADMIN_SECRET
   ```bash
   # 检查 .env 中的 ADMIN_SECRET
   grep ADMIN_SECRET .env
   ```

### 3. 登录按钮无反应

**可能原因**：
- Supabase 配置未设置
- 网络连接问题

**解决方法**：
1. 检查 `.env` 文件配置
2. 查看浏览器控制台错误信息
3. 确认 `/api/config` 接口返回正确配置

### 4. 注册后无法登录

**可能原因**：
- Supabase 邮件验证开启
- 密码不符合要求

**解决方法**：
1. 检查邮箱验证邮件
2. 确认密码长度 >= 6 位
3. 在 Supabase Auth Settings 中关闭邮件验证（开发环境）

### 5. 游客数据丢失

**说明**：游客模式数据保存在浏览器本地存储，清除浏览器缓存或换设备会丢失。

**建议**：重要数据请注册账号保存。

---

## 🛡️ 安全建议

### 生产环境必做

1. **修改默认密码**
   ```bash
   # 将 .env 中的
   ADMIN_INITIAL_PASSWORD=Admin@123456
   # 改为强密码
   ADMIN_INITIAL_PASSWORD=Your-Strong-Password-123!
   ```

2. **启用邮箱验证**
   ```bash
   # 在 .env 中设置
   SUPABASE_EMAIL_CONFIRM=true
   ```

3. **使用 HTTPS**
   ```bash
   # 生产环境使用 HTTPS
   npm run start:https
   ```

4. **定期更换密钥**
   - 定期更换 SUPABASE_SERVICE_KEY
   - 定期更换 ADMIN_SECRET

### 环境变量保护

```bash
# 确保 .env 在 .gitignore 中
cat .gitignore | grep ".env"

# 如果不存在，添加
echo ".env" >> .gitignore
```

---

## 📝 更新日志

- **2026-02-06**: 新增 `npm run init-admin` 一键创建管理员
- **2026-02-06**: 新增游客模式支持
- **2026-02-06**: 添加配置接口 `/api/config`
- **2026-02-05**: 初始登录功能实现

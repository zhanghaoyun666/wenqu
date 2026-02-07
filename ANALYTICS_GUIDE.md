# 智能八字占卜平台 - 数据埋点使用指南

## 📊 概述

本项目已实现完整的数据埋点系统，包括：

1. **前端埋点 SDK** - 自动收集用户行为、页面访问等数据
2. **后端埋点 API** - 接收并存储埋点数据
3. **数据库表结构** - 6 张表存储各类埋点数据
4. **统计分析视图** - 预置常用统计查询

---

## 🚀 快速开始

### 第一步：执行数据库初始化脚本

在 Supabase SQL Editor 中执行 `supabase-init.sql`：

```bash
# 文件位置: ./supabase-init.sql
```

这将创建以下表：
- `user_events` - 用户行为事件
- `page_views` - 页面访问记录
- `api_logs` - API 调用日志
- `user_sessions` - 用户会话统计
- `feature_usage` - 功能使用统计
- `conversion_funnel` - 转化漏斗数据

### 第二步：后端已自动集成

`server.js` 已集成埋点中间件和路由，无需额外配置。

### 第三步：前端引入埋点 SDK

在 HTML 页面中引入 SDK：

```html
<!DOCTYPE html>
<html data-auto-analytics>
<head>
    <!-- 其他 head 内容 -->
</head>
<body>
    <!-- 页面内容 -->
    
    <script src="/js/analytics.js"></script>
    <script>
        // 自定义配置（可选）
        Analytics.init({
            debug: true,  // 开启调试模式
            batchSize: 5, // 每 5 个事件发送一次
            flushInterval: 3000 // 3 秒发送一次
        });
    </script>
</body>
</html>
```

---

## 📈 埋点类型

### 1. 自动收集（无需代码）

| 事件 | 说明 |
|------|------|
| `page_view` | 页面访问 |
| `session_start` | 新会话开始 |
| `click` | 点击事件（带有 `data-track` 属性的元素） |
| `scroll` | 滚动深度（25%, 50%, 75%, 90%） |

### 2. 手动埋点

#### 记录自定义事件

```javascript
// 普通事件
Analytics.trackEvent('user', 'login', {
    method: 'email'
});

// 功能使用
Analytics.trackFeature('bazi', 'start', {
    year: 1990,
    month: 1,
    day: 1
});

Analytics.trackFeature('bazi', 'complete', {
    duration_seconds: 5
});

// 转化漏斗
Analytics.trackFunnel('consultation', 'enter_question', 1);
Analytics.trackFunnel('consultation', 'submit', 2);
Analytics.trackFunnel('consultation', 'view_result', 3);
```

#### 用户身份关联

```javascript
// 用户登录后
Analytics.identify(userId);

// 用户登出
Analytics.reset();
```

---

## 🎯 HTML 属性埋点

给元素添加 `data-track` 属性自动追踪点击：

```html
<!-- 简单追踪 -->
<button data-track="submit_bazi">提交八字</button>

<!-- 详细追踪 -->
<button data-track='{"name": "submit_bazi", "category": "bazi", "label": "事业咨询"}'>
    提交八字
</button>

<!-- 导航追踪 -->
<a href="/liuyao" data-track='{"name": "nav_liuyao", "from": "homepage"}'>六爻测算</a>
```

---

## 📊 统计 API

### 获取统计数据（管理员）

```bash
GET /api/analytics/stats?days=7
```

响应示例：
```json
{
  "success": true,
  "stats": {
    "period": "7 days",
    "summary": {
      "totalSessions": 150,
      "totalFeatureUsage": 320,
      "totalApiCalls": 580,
      "totalPageViews": 420
    },
    "featureBreakdown": {
      "bazi_complete": 80,
      "liuyao_complete": 45,
      "heban_complete": 30
    },
    "apiPerformance": [
      {
        "endpoint": "/api/ask",
        "calls": 120,
        "errorRate": "2.5%",
        "avgResponseTime": "850ms"
      }
    ],
    "topPages": [
      { "path": "/", "views": 200 },
      { "path": "/bazi", "views": 150 }
    ]
  }
}
```

### 获取实时数据（管理员）

```bash
GET /api/analytics/realtime
```

响应示例：
```json
{
  "success": true,
  "realtime": {
    "activeUsers": 12,
    "recentEvents": 45,
    "activeSessions": [...]
  }
}
```

---

## 📋 数据库视图

预置统计视图可直接查询：

| 视图名 | 说明 |
|--------|------|
| `stats_daily_active_users` | 每日活跃用户数 (DAU) |
| `stats_daily_feature_usage` | 每日功能使用统计 |
| `stats_api_performance` | API 性能统计（7天） |
| `stats_page_views` | 页面访问量统计（7天） |
| `stats_user_retention` | 用户留存率 |

查询示例：
```sql
-- 查看最近7天 DAU
SELECT * FROM stats_daily_active_users LIMIT 7;

-- 查看 API 性能
SELECT * FROM stats_api_performance;
```

---

## 🔧 自定义埋点示例

### 八字测算页面

```javascript
// 用户开始输入
Analytics.trackEvent('form', 'focus_birthdate');

// 用户提交
Analytics.trackFeature('bazi', 'start', {
    year, month, day, hour,
    question_type: 'career'
});

// 收到结果
Analytics.trackFeature('bazi', 'complete', {
    duration_seconds: 3,
    has_tts: false
});
```

### 六爻测算页面

```javascript
// 开始摇卦
Analytics.trackFeature('liuyao', 'start', {
    question: questionText.substring(0, 50)
});

// 摇卦完成
Analytics.trackFeature('liuyao', 'complete', {
    hexagram_name: hexagramData.name
});
```

---

## 🛡️ 隐私与安全

1. **自动过滤敏感字段** - API 日志会自动隐藏 password、token 等字段
2. **RLS 保护** - 用户只能查看自己的数据，管理员可查看全部
3. **IP 匿名化** - 建议在生产环境对 IP 进行哈希处理

---

## 📦 性能优化

- **批量写入** - 前端事件批量发送，后端批量插入
- **异步处理** - API 日志异步写入，不影响响应时间
- **定时刷新** - 默认 5 秒写入一次数据库
- **索引优化** - 所有常用查询字段已建立索引

---

## 🔍 故障排查

### 开启调试模式

```javascript
Analytics.init({ debug: true });
```

### 检查网络请求

打开浏览器开发者工具，查看发送到 `/api/analytics/track` 的请求。

### 常见问题

| 问题 | 解决方案 |
|------|----------|
| 数据没有入库 | 检查 `supabase-init.sql` 是否执行 |
| 用户 ID 为 null | 确保调用 `Analytics.identify(userId)` |
| 事件丢失 | 检查网络连接，或使用 `flush()` 强制发送 |

---

## 📝 更新日志

- **2026-02-06** - 初始版本，包含完整的埋点系统

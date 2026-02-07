/**
 * 数据埋点 API 路由
 * 处理前端发送的埋点数据
 */

const express = require('express');
const { supabase, supabaseAdmin } = require('./supabase-client');

const router = express.Router();

// 存储批量插入的缓存
const batchInsertQueue = {
    user_events: [],
    page_views: [],
    feature_usage: [],
    conversion_funnel: []
};

// 批量插入间隔（毫秒）
const BATCH_FLUSH_INTERVAL = 5000;

// 定时批量写入数据库
setInterval(async () => {
    for (const [table, records] of Object.entries(batchInsertQueue)) {
        if (records.length > 0) {
            const toInsert = [...records];
            batchInsertQueue[table] = [];
            
            // 统计 email 数量
            const withEmail = toInsert.filter(r => r.email).length;
            console.log(`[Analytics] Inserting ${toInsert.length} records into ${table} (${withEmail} with email)`);
            
            // 打印第一个记录的详细信息（用于调试）
            if (toInsert.length > 0) {
                console.log(`[Analytics] First record for ${table}:`, JSON.stringify({
                    email: toInsert[0].email,
                    session_id: toInsert[0].session_id,
                    page_path: toInsert[0].page_path,
                    feature_type: toInsert[0].feature_type
                }));
            }
            
            try {
                const { data, error } = await supabaseAdmin
                    .from(table)
                    .insert(toInsert);
                
                if (error) {
                    console.error(`[Analytics] Batch insert error for ${table}:`, error);
                    console.error(`[Analytics] Error details:`, JSON.stringify(error));
                    console.error(`[Analytics] First record sample:`, JSON.stringify(toInsert[0]));
                    // 错误时把数据放回队列重试
                    batchInsertQueue[table].unshift(...toInsert);
                } else {
                    console.log(`[Analytics] Successfully inserted ${toInsert.length} records into ${table}`);
                }
            } catch (err) {
                console.error(`[Analytics] Failed to batch insert ${table}:`, err);
                // 错误时把数据放回队列重试
                batchInsertQueue[table].unshift(...toInsert);
            }
        }
    }
}, BATCH_FLUSH_INTERVAL);

/**
 * 获取客户端 IP 地址
 */
function getClientIp(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           null;
}

/**
 * 处理前端埋点数据
 * POST /api/analytics/track
 */
router.post('/track', async (req, res) => {
    try {
        const { events } = req.body;
        
        console.log('[Analytics API] Received', events ? events.length : 0, 'events');
        
        if (!Array.isArray(events) || events.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid events data' });
        }

        const clientIp = getClientIp(req);
        const userAgent = req.headers['user-agent'] || '';
        
        // 打印第一个事件的详细信息用于调试
        if (events.length > 0) {
            console.log('[Analytics API] First event:', JSON.stringify({
                type: events[0].type,
                email: events[0].email,
                session_id: events[0].session_id
            }));
        }

        // 分类处理事件
        for (const event of events) {
            // 使用 email 作为用户标识
            const email = event.email || null;
            
            if (email) {
                console.log('[Analytics API] Processing event with email:', email, 'type:', event.type);
            }

            const baseData = {
                email: email,
                session_id: event.session_id || null,
                ip_address: clientIp,
                user_agent: userAgent
            };

            switch (event.type) {
                case 'page_view':
                    batchInsertQueue.page_views.push({
                        ...baseData,
                        page_path: event.page_path,
                        page_title: event.page_title,
                        referrer: event.referrer,
                        entry_time: event.timestamp,
                        device_type: event.device_type,
                        browser: event.browser,
                        os: event.os
                    });
                    
                    // 同时更新或创建会话
                    await upsertSession({
                        session_id: event.session_id,
                        email: email,
                        ip_address: clientIp,
                        user_agent: userAgent,
                        device_type: event.device_type,
                        browser: event.browser,
                        os: event.os
                    });
                    break;

                case 'page_view_update':
                    // 更新页面停留时长
                    await updatePageViewDuration(event.page_view_id, event.duration_seconds);
                    break;

                case 'event':
                    batchInsertQueue.user_events.push({
                        ...baseData,
                        event_type: event.event_type,
                        event_name: event.event_name,
                        page_path: event.page_path,
                        properties: event.properties || {},
                        created_at: event.timestamp
                    });
                    break;

                case 'feature_usage':
                    batchInsertQueue.feature_usage.push({
                        email: email,
                        session_id: event.session_id || null,
                        feature_type: event.feature_type,
                        action: event.action,
                        duration_seconds: event.duration_seconds || null,
                        input_params: event.properties || {},
                        created_at: event.timestamp
                    });
                    break;

                case 'conversion_funnel':
                    batchInsertQueue.conversion_funnel.push({
                        email: email,
                        session_id: event.session_id || null,
                        funnel_name: event.funnel_name,
                        step_name: event.step_name,
                        step_order: event.step_order || 1,
                        properties: event.properties || {},
                        created_at: event.timestamp
                    });
                    break;
            }
        }

        // 立即处理队列（如果积压太多）
        const totalQueueSize = Object.values(batchInsertQueue).reduce((sum, arr) => sum + arr.length, 0);
        console.log('[Analytics API] Total queue size:', totalQueueSize);
        
        if (totalQueueSize >= 50) {
            flushBatchQueue();
        }

        res.json({ success: true, queued: events.length });
    } catch (error) {
        console.error('[Analytics API] Track error:', error);
        res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
});



/**
 * 更新或创建会话
 */
async function upsertSession(sessionData) {
    try {
        // 使用 maybeSingle() 而不是 single()，避免找不到记录时抛出错误
        const { data: existing, error } = await supabaseAdmin
            .from('user_sessions')
            .select('id, page_views_count, email')
            .eq('session_id', sessionData.session_id)
            .maybeSingle();

        if (error) {
            console.error('[Analytics] Error querying session:', error);
            return;
        }

        if (existing) {
            // 更新现有会话 - 如果之前没有 email 但现在有了，更新 email
            const updateData = {
                page_views_count: existing.page_views_count + 1,
                end_time: new Date().toISOString()
            };
            
            // 如果现有记录没有 email 但新数据有，更新 email
            if (!existing.email && sessionData.email) {
                updateData.email = sessionData.email;
            }
            
            const { error: updateError } = await supabaseAdmin
                .from('user_sessions')
                .update(updateData)
                .eq('id', existing.id);
                
            if (updateError) {
                console.error('[Analytics] Error updating session:', updateError);
            }
        } else {
            // 创建新会话
            const { error: insertError } = await supabaseAdmin
                .from('user_sessions')
                .insert([{
                    session_id: sessionData.session_id,
                    email: sessionData.email,
                    ip_address: sessionData.ip_address,
                    user_agent: sessionData.user_agent,
                    device_type: sessionData.device_type,
                    browser: sessionData.browser,
                    os: sessionData.os,
                    start_time: new Date().toISOString()
                }]);
                
            if (insertError) {
                console.error('[Analytics] Error inserting session:', insertError);
            } else {
                console.log('[Analytics] Created new session:', sessionData.session_id.substring(0, 8) + '...');
            }
        }
    } catch (err) {
        console.error('[Analytics] Upsert session error:', err);
    }
}

/**
 * 更新页面停留时长
 */
async function updatePageViewDuration(pageViewId, duration) {
    try {
        // 由于 page_view_id 不是数据库主键，我们使用 session_id 和最新记录来更新
        // 这里简化处理，实际生产环境可以优化
    } catch (err) {
        console.error('Update page view duration error:', err);
    }
}

/**
 * 立即刷新批量队列
 */
async function flushBatchQueue() {
    for (const [table, records] of Object.entries(batchInsertQueue)) {
        if (records.length > 0) {
            const toInsert = [...records];
            batchInsertQueue[table] = [];
            
            try {
                const { error } = await supabaseAdmin
                    .from(table)
                    .insert(toInsert);
                
                if (error) {
                    console.error(`Immediate flush error for ${table}:`, error);
                }
            } catch (err) {
                console.error(`Failed to flush ${table}:`, err);
            }
        }
    }
}

/**
 * API 埋点中间件
 * 用于自动记录 API 调用日志
 */
function apiAnalyticsMiddleware(req, res, next) {
    const startTime = Date.now();
    const clientIp = getClientIp(req);
    
    // 捕获响应完成事件
    res.on('finish', async () => {
        const duration = Date.now() - startTime;
        
        // 排除埋点接口本身和健康检查
        if (req.path === '/api/analytics/track' || req.path === '/health') {
            return;
        }

        try {
            // 获取用户 email（从请求头）
            const email = req.headers['x-user-email'] || null;

            const logData = {
                email: email,
                session_id: req.headers['x-session-id'] || null,
                api_endpoint: req.path,
                http_method: req.method,
                request_params: sanitizeParams(req.body),
                response_status: res.statusCode,
                response_time_ms: duration,
                ip_address: clientIp,
                user_agent: req.headers['user-agent'] || ''
            };

            // 异步插入，不阻塞响应
            supabaseAdmin
                .from('api_logs')
                .insert([logData])
                .then(({ error }) => {
                    if (error) {
                        console.error('API log insert error:', error);
                    }
                })
                .catch(err => {
                    console.error('API logging error:', err);
                });
        } catch (err) {
            console.error('API analytics middleware error:', err);
        }
    });

    next();
}

/**
 * 清理敏感参数
 */
function sanitizeParams(params) {
    if (!params || typeof params !== 'object') {
        return {};
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...params };

    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '***';
        }
    }

    return sanitized;
}

/**
 * 获取统计数据 API（管理员用）
 * GET /api/analytics/stats
 */
router.get('/stats', async (req, res) => {
    try {
        // 时间范围
        const days = parseInt(req.query.days) || 7;
        const since = new Date();
        since.setDate(since.getDate() - days);

        // 并行获取统计数据
        const [
            { data: dailyActiveUsers, error: sessionsError },
            { data: featureUsage, error: featureError },
            { data: apiPerformance, error: apiError },
            { data: pageViews, error: pageError }
        ] = await Promise.all([
            supabaseAdmin
                .from('user_sessions')
                .select('session_id, start_time')
                .gte('start_time', since.toISOString()),
            supabaseAdmin
                .from('feature_usage')
                .select('feature_type, action, created_at')
                .gte('created_at', since.toISOString()),
            supabaseAdmin
                .from('api_logs')
                .select('api_endpoint, response_status, response_time_ms')
                .gte('created_at', since.toISOString()),
            supabaseAdmin
                .from('page_views')
                .select('page_path, entry_time')
                .gte('entry_time', since.toISOString())
        ]);
        
        // 记录错误日志
        if (sessionsError) console.error('[Analytics Stats] Sessions error:', sessionsError);
        if (featureError) console.error('[Analytics Stats] Feature error:', featureError);
        if (apiError) console.error('[Analytics Stats] API error:', apiError);
        if (pageError) console.error('[Analytics Stats] Page views error:', pageError);

        // 计算汇总统计（会话数按 session_id 去重）
        const uniqueSessions = dailyActiveUsers ? 
            new Set(dailyActiveUsers.map(s => s.session_id)).size : 0;
        
        console.log(`[Analytics Stats] Raw sessions: ${dailyActiveUsers?.length || 0}, Unique: ${uniqueSessions}`);
        
        const stats = {
            period: `${days} days`,
            summary: {
                totalSessions: uniqueSessions,
                totalFeatureUsage: featureUsage?.length || 0,
                totalApiCalls: apiPerformance?.length || 0,
                totalPageViews: pageViews?.length || 0
            },
            featureBreakdown: {},
            apiPerformance: {},
            topPages: {}
        };

        // 功能使用统计
        if (featureUsage) {
            featureUsage.forEach(usage => {
                const key = `${usage.feature_type}_${usage.action}`;
                stats.featureBreakdown[key] = (stats.featureBreakdown[key] || 0) + 1;
            });
        }

        // API 性能统计
        if (apiPerformance) {
            const apiStats = {};
            apiPerformance.forEach(log => {
                if (!apiStats[log.api_endpoint]) {
                    apiStats[log.api_endpoint] = {
                        calls: 0,
                        errors: 0,
                        totalTime: 0
                    };
                }
                apiStats[log.api_endpoint].calls++;
                apiStats[log.api_endpoint].totalTime += log.response_time_ms;
                // 只统计 5xx 服务器错误和 4xx 客户端错误（排除 401 未认证）
                if (log.response_status >= 500 || (log.response_status >= 400 && log.response_status !== 401)) {
                    apiStats[log.api_endpoint].errors++;
                }
            });
            
            stats.apiPerformance = Object.entries(apiStats).map(([endpoint, data]) => ({
                endpoint,
                calls: data.calls,
                errorRate: ((data.errors / data.calls) * 100).toFixed(2) + '%',
                avgResponseTime: Math.round(data.totalTime / data.calls) + 'ms'
            })).sort((a, b) => b.calls - a.calls);
        }

        // 热门页面统计
        if (pageViews) {
            const pageStats = {};
            pageViews.forEach(view => {
                pageStats[view.page_path] = (pageStats[view.page_path] || 0) + 1;
            });
            stats.topPages = Object.entries(pageStats)
                .map(([path, count]) => ({ path, views: count }))
                .sort((a, b) => b.views - a.views)
                .slice(0, 10);
        }

        res.json({ success: true, stats });
    } catch (error) {
        console.error('Get analytics stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
});

/**
 * 获取实时数据 API（管理员用）
 * GET /api/analytics/realtime
 */
router.get('/realtime', async (req, res) => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const [
            { data: activeSessions },
            { count: recentEvents }
        ] = await Promise.all([
            supabaseAdmin
                .from('user_sessions')
                .select('session_id, email, device_type, browser')
                .gte('end_time', fiveMinutesAgo)
                .limit(100),
            supabaseAdmin
                .from('user_events')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', fiveMinutesAgo)
        ]);

        res.json({
            success: true,
            realtime: {
                activeUsers: activeSessions?.length || 0,
                recentEvents: recentEvents || 0,
                activeSessions: activeSessions || []
            }
        });
    } catch (error) {
        console.error('Get realtime analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to get realtime data' });
    }
});

module.exports = {
    router,
    apiAnalyticsMiddleware
};

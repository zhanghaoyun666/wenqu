/**
 * 智能八字占卜平台 - 前端数据埋点 SDK
 * 用于收集用户行为、页面访问等数据
 */

(function() {
    'use strict';

    // 配置
    const CONFIG = {
        endpoint: '/api/analytics/track',
        batchSize: 10,
        flushInterval: 5000, // 5秒发送一次
        sessionTimeout: 30 * 60 * 1000, // 30分钟会话超时
        debug: false
    };

    // 存储工具
    const storage = {
        get: (key) => {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                return null;
            }
        },
        set: (key, value) => {
            try {
                localStorage.setItem(key, value);
            } catch (e) {}
        },
        remove: (key) => {
            try {
                localStorage.removeItem(key);
            } catch (e) {}
        }
    };

    // 生成唯一 ID
    function generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // 获取或创建会话 ID
    function getSessionId() {
        let sessionId = storage.get('analytics_session_id');
        let lastActivity = parseInt(storage.get('analytics_last_activity') || '0');
        const now = Date.now();

        // 检查会话是否超时
        if (!sessionId || (now - lastActivity) > CONFIG.sessionTimeout) {
            sessionId = generateId();
            storage.set('analytics_session_id', sessionId);
            
            // 新会话开始，发送会话开始事件
            Analytics.trackEvent('session', 'session_start', {
                referrer: document.referrer,
                landing_page: window.location.pathname
            });
        }

        storage.set('analytics_last_activity', now.toString());
        return sessionId;
    }

    // 获取设备信息
    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let deviceType = 'desktop';
        let browser = 'unknown';
        let os = 'unknown';

        // 检测设备类型
        if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
            deviceType = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
        }

        // 检测浏览器
        if (/Chrome/i.test(ua)) browser = 'Chrome';
        else if (/Safari/i.test(ua)) browser = 'Safari';
        else if (/Firefox/i.test(ua)) browser = 'Firefox';
        else if (/Edge/i.test(ua)) browser = 'Edge';
        else if (/MSIE|Trident/i.test(ua)) browser = 'IE';

        // 检测操作系统
        if (/Windows/i.test(ua)) os = 'Windows';
        else if (/Mac/i.test(ua)) os = 'MacOS';
        else if (/Linux/i.test(ua)) os = 'Linux';
        else if (/Android/i.test(ua)) os = 'Android';
        else if (/iOS|iPhone|iPad/i.test(ua)) os = 'iOS';

        return { deviceType, browser, os };
    }

    // 获取用户 ID（从 Supabase session 或其他存储）
    function getUserId() {
        try {
            // 尝试从 Supabase 获取
            const session = storage.get('sb-session');
            if (session) {
                const parsed = JSON.parse(session);
                return parsed.user?.id || null;
            }
            // 尝试从自定义存储获取
            return storage.get('user_id') || null;
        } catch (e) {
            return null;
        }
    }

    // 事件队列
    let eventQueue = [];
    let currentPageViewId = null;
    let pageEnterTime = null;

    // 核心 Analytics 对象
    const Analytics = {
        // 初始化
        init: function(options = {}) {
            Object.assign(CONFIG, options);
            
            // 启动会话
            getSessionId();
            
            // 记录页面访问
            this.trackPageView();
            
            // 设置定时发送
            setInterval(() => this.flush(), CONFIG.flushInterval);
            
            // 页面卸载时发送剩余事件
            window.addEventListener('beforeunload', () => this.flush());
            
            // 监听页面可见性变化
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    this.updatePageViewDuration();
                    this.flush();
                } else if (document.visibilityState === 'visible') {
                    pageEnterTime = Date.now();
                }
            });

            // 跟踪点击事件
            this.trackClicks();
            
            // 跟踪滚动深度
            this.trackScrollDepth();

            this.log('Analytics initialized');
        },

        // 记录页面访问
        trackPageView: function(properties = {}) {
            const deviceInfo = getDeviceInfo();
            currentPageViewId = generateId();
            pageEnterTime = Date.now();

            const event = {
                type: 'page_view',
                session_id: getSessionId(),
                user_id: getUserId(),
                page_path: window.location.pathname,
                page_title: document.title,
                referrer: document.referrer,
                device_type: deviceInfo.deviceType,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                properties: {
                    ...properties,
                    url: window.location.href,
                    screen_width: window.screen.width,
                    screen_height: window.screen.height
                },
                timestamp: new Date().toISOString()
            };

            this.queue(event);
            
            // 跟踪转化漏斗
            this.trackFunnel('page_view', window.location.pathname);
        },

        // 更新页面停留时长
        updatePageViewDuration: function() {
            if (currentPageViewId && pageEnterTime) {
                const duration = Math.round((Date.now() - pageEnterTime) / 1000);
                
                const event = {
                    type: 'page_view_update',
                    session_id: getSessionId(),
                    page_view_id: currentPageViewId,
                    duration_seconds: duration,
                    timestamp: new Date().toISOString()
                };

                this.queue(event);
            }
        },

        // 记录自定义事件
        trackEvent: function(eventType, eventName, properties = {}) {
            const deviceInfo = getDeviceInfo();
            
            const event = {
                type: 'event',
                session_id: getSessionId(),
                user_id: getUserId(),
                event_type: eventType,
                event_name: eventName,
                page_path: window.location.pathname,
                device_type: deviceInfo.deviceType,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                properties: properties,
                timestamp: new Date().toISOString()
            };

            this.queue(event);
            this.log('Event tracked:', eventType, eventName);
        },

        // 记录功能使用
        trackFeature: function(featureType, action, properties = {}) {
            const event = {
                type: 'feature_usage',
                session_id: getSessionId(),
                user_id: getUserId(),
                feature_type: featureType,
                action: action, // 'start', 'complete', 'cancel', 'error'
                page_path: window.location.pathname,
                properties: properties,
                timestamp: new Date().toISOString()
            };

            this.queue(event);
            this.log('Feature tracked:', featureType, action);
        },

        // 记录转化漏斗
        trackFunnel: function(funnelName, stepName, stepOrder = 1, properties = {}) {
            const event = {
                type: 'conversion_funnel',
                session_id: getSessionId(),
                user_id: getUserId(),
                funnel_name: funnelName,
                step_name: stepName,
                step_order: stepOrder,
                page_path: window.location.pathname,
                properties: properties,
                timestamp: new Date().toISOString()
            };

            this.queue(event);
        },

        // 跟踪点击事件
        trackClicks: function() {
            document.addEventListener('click', (e) => {
                const target = e.target.closest('[data-track]');
                if (target) {
                    const trackData = target.getAttribute('data-track');
                    try {
                        const data = JSON.parse(trackData);
                        this.trackEvent('click', data.name || 'unknown', data);
                    } catch (err) {
                        this.trackEvent('click', trackData);
                    }
                }
            });
        },

        // 跟踪滚动深度
        trackScrollDepth: function() {
            let maxScroll = 0;
            let tracked = { 25: false, 50: false, 75: false, 90: false };

            window.addEventListener('scroll', () => {
                const scrollPercent = Math.round(
                    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
                );
                
                maxScroll = Math.max(maxScroll, scrollPercent);

                Object.keys(tracked).forEach(threshold => {
                    if (!tracked[threshold] && maxScroll >= parseInt(threshold)) {
                        tracked[threshold] = true;
                        this.trackEvent('scroll', `depth_${threshold}%`, {
                            page_path: window.location.pathname,
                            scroll_percent: maxScroll
                        });
                    }
                });
            });
        },

        // 将事件加入队列
        queue: function(event) {
            eventQueue.push(event);
            
            // 达到批量大小时立即发送
            if (eventQueue.length >= CONFIG.batchSize) {
                this.flush();
            }
        },

        // 发送事件到服务器
        flush: function() {
            if (eventQueue.length === 0) return;

            const events = [...eventQueue];
            eventQueue = [];

            // 使用 sendBeacon 确保数据在页面卸载时也能发送
            const data = JSON.stringify({ events });
            
            if (navigator.sendBeacon) {
                navigator.sendBeacon(CONFIG.endpoint, new Blob([data], { type: 'application/json' }));
            } else {
                fetch(CONFIG.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: data,
                    keepalive: true
                }).catch(err => {
                    this.log('Failed to send analytics:', err);
                });
            }
        },

        // 设置用户 ID
        identify: function(userId) {
            storage.set('user_id', userId);
            this.trackEvent('user', 'identify', { user_id: userId });
        },

        // 清空用户 ID
        reset: function() {
            storage.remove('user_id');
            storage.remove('analytics_session_id');
        },

        // 调试日志
        log: function(...args) {
            if (CONFIG.debug) {
                console.log('[Analytics]', ...args);
            }
        }
    };

    // 暴露到全局
    window.Analytics = Analytics;

    // 自动初始化（如果页面有 data-auto-analytics 属性）
    if (document.documentElement.hasAttribute('data-auto-analytics')) {
        Analytics.init();
    }
})();

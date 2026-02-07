/**
 * 问渠数据分析 SDK
 * 用于收集用户行为、页面访问等数据
 */

(function() {
    'use strict';

    // 配置
    const CONFIG = {
        endpoint: '/api/analytics/track',
        batchSize: 5,  // 减小批量大小，更快发送
        flushInterval: 3000,  // 减少到3秒
        debug: true  // 开启调试模式
    };

    // 状态
    let sessionId = null;
    let userEmail = null;
    let eventQueue = [];
    let flushTimer = null;
    let pageViewId = null;
    let pageStartTime = Date.now();
    
    // 脚本加载时立即尝试从 localStorage 读取 email
    (function initUserEmail() {
        try {
            const storedUser = localStorage.getItem('wq_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                if (user.email) {
                    userEmail = user.email;
                    console.log('[Analytics] Pre-loaded email from localStorage:', userEmail);
                }
            }
        } catch (e) {
            console.log('[Analytics] Failed to pre-load email:', e);
        }
    })();

    /**
     * 生成唯一 ID
     */
    function generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 获取或创建会话 ID
     */
    function getSessionId() {
        if (!sessionId) {
            sessionId = localStorage.getItem('wq_analytics_session_id');
            if (!sessionId) {
                sessionId = generateId();
                localStorage.setItem('wq_analytics_session_id', sessionId);
            }
        }
        return sessionId;
    }

    /**
     * 获取设备信息
     */
    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let deviceType = 'desktop';
        let browser = 'unknown';
        let os = 'unknown';

        // 设备类型
        if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
            deviceType = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
        }

        // 浏览器
        if (/Chrome/i.test(ua)) browser = 'Chrome';
        else if (/Firefox/i.test(ua)) browser = 'Firefox';
        else if (/Safari/i.test(ua)) browser = 'Safari';
        else if (/Edge/i.test(ua)) browser = 'Edge';

        // 操作系统
        if (/Windows/i.test(ua)) os = 'Windows';
        else if (/Mac/i.test(ua)) os = 'MacOS';
        else if (/Linux/i.test(ua)) os = 'Linux';
        else if (/Android/i.test(ua)) os = 'Android';
        else if (/iOS|iPhone|iPad/i.test(ua)) os = 'iOS';

        return { deviceType, browser, os };
    }

    /**
     * 添加事件到队列
     */
    function queueEvent(event) {
        // 如果没有设置 userEmail，尝试从 localStorage 获取
        if (!userEmail) {
            // 优先使用页面预设置的 email
            if (window.__wq_user_email) {
                userEmail = window.__wq_user_email;
                if (CONFIG.debug) {
                    console.log('[Analytics] Using pre-set email in queueEvent:', userEmail);
                }
            } else {
                const storedUser = localStorage.getItem('wq_user');
                if (storedUser) {
                    try {
                        const user = JSON.parse(storedUser);
                        userEmail = user.email || null;
                    } catch (e) {
                        console.log('[Analytics] Failed to parse wq_user:', e);
                    }
                }
            }
        }
        
        const enrichedEvent = {
            ...event,
            session_id: getSessionId(),
            email: userEmail,
            timestamp: new Date().toISOString()
        };
        
        eventQueue.push(enrichedEvent);

        if (CONFIG.debug) {
            console.log('[Analytics] Event queued:', enrichedEvent);
        }

        // 如果队列满了，立即发送
        if (eventQueue.length >= CONFIG.batchSize) {
            flush();
        }
    }

    /**
     * 发送事件到服务器
     */
    async function flush() {
        if (eventQueue.length === 0) return;

        const events = [...eventQueue];
        eventQueue = [];

        // 发送前再检查一次 email
        const storedUser = localStorage.getItem('wq_user');
        if (storedUser && !userEmail) {
            try {
                const user = JSON.parse(storedUser);
                userEmail = user.email || null;
                // 更新事件中的 email
                events.forEach(event => {
                    if (!event.email) event.email = userEmail;
                });
            } catch (e) {}
        }
        
        console.log('[Analytics] Sending', events.length, 'events. First event email:', events[0]?.email);
        if (CONFIG.debug) {
            console.log('[Analytics] Events details:', events);
        }

        try {
            const response = await fetch(CONFIG.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Id': getSessionId(),
                    'X-User-Email': userEmail || ''
                },
                body: JSON.stringify({ events })
            });

            const data = await response.json();
            console.log('[Analytics] Response:', data);

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to send events');
            }

            console.log('[Analytics] Events sent successfully:', events.length);
        } catch (error) {
            console.error('[Analytics] Failed to send events:', error);
            // 发送失败，重新加入队列
            eventQueue.unshift(...events);
        }
    }

    /**
     * 开始定时发送
     */
    function startFlushTimer() {
        if (flushTimer) return;
        flushTimer = setInterval(flush, CONFIG.flushInterval);
    }

    /**
     * 记录页面访问
     */
    function trackPageView() {
        pageViewId = generateId();
        pageStartTime = Date.now();

        const deviceInfo = getDeviceInfo();

        queueEvent({
            type: 'page_view',
            page_path: window.location.pathname,
            page_title: document.title,
            referrer: document.referrer,
            device_type: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            os: deviceInfo.os
        });
    }

    /**
     * 更新页面停留时长
     */
    function updatePageViewDuration() {
        const duration = Math.floor((Date.now() - pageStartTime) / 1000);
        if (duration > 0 && pageViewId) {
            queueEvent({
                type: 'page_view_update',
                page_view_id: pageViewId,
                duration_seconds: duration
            });
        }
    }

    /**
     * 记录自定义事件
     */
    function trackEvent(eventType, eventName, properties = {}) {
        queueEvent({
            type: 'event',
            event_type: eventType,
            event_name: eventName,
            page_path: window.location.pathname,
            properties: properties
        });
    }

    /**
     * 记录功能使用
     */
    function trackFeature(featureType, action, properties = {}) {
        queueEvent({
            type: 'feature_usage',
            feature_type: featureType,
            action: action,
            properties: properties
        });
    }

    /**
     * 记录转化漏斗
     */
    function trackFunnel(funnelName, stepName, stepOrder = 1, properties = {}) {
        queueEvent({
            type: 'conversion_funnel',
            funnel_name: funnelName,
            step_name: stepName,
            step_order: stepOrder,
            properties: properties
        });
    }

    /**
     * 设置用户邮箱
     */
    function identify(email) {
        userEmail = email;
        if (CONFIG.debug) {
            console.log('[Analytics] User identified:', email);
            console.log('[Analytics] Current queue size:', eventQueue.length);
        }
        
        // 更新已排队但未发送的事件的 email
        if (email) {
            let updatedCount = 0;
            eventQueue.forEach(event => {
                if (!event.email) {
                    event.email = email;
                    updatedCount++;
                }
            });
            if (CONFIG.debug && updatedCount > 0) {
                console.log('[Analytics] Updated', updatedCount, 'queued events with email');
            }
        }
    }

    /**
     * 重置用户
     */
    function reset() {
        userEmail = null;
        sessionId = null;
        localStorage.removeItem('wq_analytics_session_id');
    }

    /**
     * 初始化
     */
    function init(options = {}) {
        Object.assign(CONFIG, options);

        // 确保在 trackPageView 之前已经获取了 email
        // 优先使用页面预设置的 email
        if (!userEmail && window.__wq_user_email) {
            userEmail = window.__wq_user_email;
            if (CONFIG.debug) {
                console.log('[Analytics] Using pre-set email from window.__wq_user_email:', userEmail);
            }
        }
        
        // 如果没有，从 localStorage 获取
        if (!userEmail) {
            try {
                const storedUser = localStorage.getItem('wq_user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    if (user.email) {
                        userEmail = user.email;
                        if (CONFIG.debug) {
                            console.log('[Analytics] Pre-loaded email in init from localStorage:', userEmail);
                        }
                    }
                }
            } catch (e) {}
        }

        // 页面加载时记录访问
        trackPageView();
        startFlushTimer();

        // 页面卸载时发送剩余事件
        window.addEventListener('beforeunload', function() {
            updatePageViewDuration();
            flush();
        });

        // 页面可见性变化时更新停留时长
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                updatePageViewDuration();
                flush();
            } else {
                pageStartTime = Date.now();
            }
        });

        // 自动追踪点击事件（带有 data-track 属性的元素）
        document.addEventListener('click', function(e) {
            const target = e.target.closest('[data-track]');
            if (target) {
                const trackData = target.dataset.track;
                let eventData;
                try {
                    eventData = JSON.parse(trackData);
                } catch {
                    eventData = { name: trackData };
                }

                trackEvent('click', eventData.name || 'unknown', {
                    category: eventData.category || 'general',
                    label: eventData.label || target.textContent.trim(),
                    element: target.tagName.toLowerCase()
                });
            }
        });

        // 追踪滚动深度
        let maxScroll = 0;
        window.addEventListener('scroll', function() {
            const scrollPercent = Math.floor(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                // 记录关键滚动点
                if ([25, 50, 75, 90].includes(scrollPercent)) {
                    trackEvent('scroll', `scroll_${scrollPercent}_percent`, {
                        page_path: window.location.pathname
                    });
                }
            }
        });

        if (CONFIG.debug) {
            console.log('[Analytics] Initialized');
        }
    }

    // 公开 API
    window.Analytics = {
        init,
        trackEvent,
        trackFeature,
        trackFunnel,
        identify,
        reset,
        flush
    };

    // 自动初始化（如果页面有 data-auto-analytics 属性）
    if (document.documentElement.dataset.autoAnalytics !== undefined) {
        init();
    }
})();

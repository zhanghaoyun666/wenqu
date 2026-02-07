/**
 * 问渠 - 通用前端交互逻辑
 */

(function() {
    'use strict';

    // ==================== 工具函数 ====================
    
    /**
     * 防抖函数
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 格式化日期
     */
    function formatDate(date) {
        return new Date(date).toLocaleString('zh-CN');
    }

    /**
     * 显示提示信息
     */
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            background: ${type === 'error' ? 'rgba(255, 100, 100, 0.9)' : 'rgba(201, 162, 39, 0.9)'};
            color: white;
            border-radius: 30px;
            font-size: 1rem;
            z-index: 10000;
            animation: slideDown 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ==================== 导航高亮 ====================
    
    function highlightNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'main.html';
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('href') === currentPage) {
                btn.classList.add('active');
            }
        });
    }

    // ==================== 表单验证 ====================
    
    function validateDate(year, month, day) {
        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year && 
               date.getMonth() === month - 1 && 
               date.getDate() === day;
    }

    function validateForm(inputs) {
        for (let input of inputs) {
            if (!input.value.trim()) {
                showToast(`请填写${input.placeholder || '必填项'}`, 'error');
                input.focus();
                return false;
            }
        }
        return true;
    }

    // ==================== API 请求封装 ====================
    
    const API = {
        async post(url, data) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            }
        },

        async get(url) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            }
        }
    };

    // ==================== 浏览器原生语音合成 ====================
    
    const TTS = {
        synth: window.speechSynthesis,
        currentUtterance: null,

        /**
         * 使用浏览器原生语音合成朗读文本
         * @param {string} text 要朗读的文本
         * @param {Object} options 可选配置
         */
        speak(text, options = {}) {
            if (!this.synth) {
                showToast('您的浏览器不支持语音合成', 'error');
                return;
            }

            // 停止当前播放
            this.stop();

            // 创建语音合成实例
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = options.rate || 0.9;
            utterance.pitch = options.pitch || 1;
            utterance.volume = options.volume || 1;

            // 尝试选择中文语音
            const voices = this.synth.getVoices();
            const zhVoice = voices.find(v => v.lang.includes('zh'));
            if (zhVoice) {
                utterance.voice = zhVoice;
            }

            this.currentUtterance = utterance;
            this.synth.speak(utterance);
        },

        stop() {
            if (this.synth) {
                this.synth.cancel();
            }
            this.currentUtterance = null;
        },

        isSpeaking() {
            return this.synth ? this.synth.speaking : false;
        }
    };

    // 加载语音列表
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
            console.log('语音列表已加载');
        };
    }

    // ==================== 用户认证 ====================
    
    const Auth = {
        /**
         * 获取当前用户信息
         */
        getUser() {
            try {
                const user = localStorage.getItem('wq_user');
                return user ? JSON.parse(user) : null;
            } catch (e) {
                console.error('Auth getUser error:', e);
                return null;
            }
        },

        /**
         * 检查用户是否已登录
         */
        isLoggedIn() {
            const user = this.getUser();
            return !!(user && user.id && !user.isGuest);
        },

        /**
         * 获取当前登录用户ID
         */
        getUserId() {
            const user = this.getUser();
            return user && user.id ? user.id : null;
        }
    };

    // ==================== 本地存储 ====================
    
    const Storage = {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Storage get error:', e);
                return defaultValue;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('Storage set error:', e);
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error('Storage remove error:', e);
            }
        }
    };

    // ==================== 平滑滚动 ====================
    
    function smoothScrollTo(element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    // ==================== 输入框增强 ====================
    
    function enhanceInputs() {
        // 数字输入框限制
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', function() {
                const min = parseInt(this.min);
                const max = parseInt(this.max);
                const value = parseInt(this.value);
                
                if (value < min) this.value = min;
                if (value > max) this.value = max;
            });
        });

        // 文本域自动高度
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', debounce(function(e) {
                const target = e.target;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
            }, 100));
        });
    }

    // ==================== 页面加载动画 ====================
    
    function initPageAnimations() {
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // ==================== 键盘快捷键 ====================
    
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // ESC 关闭弹窗或停止播放
            if (e.key === 'Escape') {
                AudioPlayer.stop();
            }
        });
    }

    // ==================== 健康检查 ====================
    
    async function checkHealth() {
        try {
            const result = await API.get('/health');
            if (result.status === 'ok') {
                console.log('✅ 服务状态正常');
            }
        } catch (error) {
            console.warn('⚠️ 服务连接异常');
            showToast('服务器连接异常，部分功能可能无法使用', 'error');
        }
    }

    // ==================== 初始化 ====================
    
    function init() {
        highlightNav();
        enhanceInputs();
        initPageAnimations();
        initKeyboardShortcuts();
        checkHealth();

        // 添加CSS动画
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translate(-50%, -100%); opacity: 0; }
                to { transform: translate(-50%, 0); opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translate(-50%, 0); opacity: 1; }
                to { transform: translate(-50%, -100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        console.log('🎯 问渠前端已加载');
    }

    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 暴露全局对象
    window.WenQu = {
        API,
        TTS,
        Storage,
        Auth,
        showToast,
        validateDate,
        validateForm,
        smoothScrollTo
    };
})();
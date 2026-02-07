/**
 * 问渠 - 增强动画系统
 * 提供更流畅、更丰富的交互体验
 */

(function() {
    'use strict';

    // ==================== 粒子系统 ====================
    const ParticleSystem = {
        container: null,
        particles: [],
        maxParticles: 30,
        
        init() {
            // 创建粒子容器
            this.container = document.createElement('div');
            this.container.className = 'particles-container';
            document.body.appendChild(this.container);
            
            // 创建粒子
            for (let i = 0; i < this.maxParticles; i++) {
                setTimeout(() => this.createParticle(), i * 200);
            }
            
            // 持续生成新粒子
            setInterval(() => {
                if (this.particles.length < this.maxParticles) {
                    this.createParticle();
                }
            }, 500);
        },
        
        createParticle() {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // 随机大小
            const size = Math.random() * 6 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // 随机位置
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = '100%';
            
            // 随机动画时长
            const duration = Math.random() * 10 + 10;
            particle.style.animationDuration = `${duration}s`;
            
            // 随机动画延迟
            particle.style.animationDelay = `${Math.random() * 5}s`;
            
            this.container.appendChild(particle);
            this.particles.push(particle);
            
            // 动画结束后移除
            particle.addEventListener('animationend', () => {
                particle.remove();
                this.particles = this.particles.filter(p => p !== particle);
            });
        }
    };

    // ==================== 打字机效果 ====================
    const Typewriter = {
        async type(element, text, speed = 30) {
            element.innerHTML = '';
            element.classList.add('typing');
            
            // 添加光标
            const cursor = document.createElement('span');
            cursor.className = 'typewriter-cursor';
            
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                
                // 处理Markdown格式
                if (char === '\n') {
                    element.appendChild(document.createElement('br'));
                } else {
                    const span = document.createElement('span');
                    span.textContent = char;
                    span.style.opacity = '0';
                    span.style.animation = 'fadeIn 0.1s forwards';
                    element.appendChild(span);
                }
                
                // 智能滚动：只在内容超出视口底部时才滚动，不强制锁住用户
                if (i % 30 === 0) {
                    const rect = element.getBoundingClientRect();
                    const isBelowViewport = rect.bottom > window.innerHeight - 50;
                    if (isBelowViewport) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }
                }
                
                await this.delay(speed);
            }
            
            // 移除光标
            cursor.remove();
            element.classList.remove('typing');
        },
        
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // ==================== 滚动显示动画 ====================
    const ScrollReveal = {
        observer: null,
        
        init() {
            // 使用 IntersectionObserver 不会阻塞滚动，是高性能的
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                    }
                });
            }, {
                threshold: 0.05, // 降低阈值，更早触发
                rootMargin: '0px 0px -30px 0px'
            });
            
            // 延迟观察，避免页面加载时阻塞
            setTimeout(() => {
                document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale, .card, .feature-card').forEach(el => {
                    if (!el.classList.contains('scroll-reveal') && 
                        !el.classList.contains('scroll-reveal-left') && 
                        !el.classList.contains('scroll-reveal-right') &&
                        !el.classList.contains('scroll-reveal-scale')) {
                        el.classList.add('scroll-reveal');
                    }
                    this.observer.observe(el);
                });
            }, 100);
        }
    };

    // ==================== 平滑滚动优化 ====================
    const SmoothScroll = {
        targetScroll: 0,
        currentScroll: 0,
        isScrolling: false,
        ease: 0.08,
        wheelMultiplier: 1.2,
        
        init() {
            // 检测是否为触摸设备
            const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
            
            // 所有设备都使用 CSS 平滑滚动，不劫持原生滚动
            this.initSmoothWheel();
            
            // 添加滚动进度指示器
            this.createProgressIndicator();
            
            // 添加返回顶部按钮
            this.createBackToTop();
            
            // 初始化视差效果（仅桌面端）
            if (!isTouchDevice) {
                this.initParallax();
            }
            
            // 初始化滚动吸附
            this.initScrollSnap();
        },
        
        initSmoothWheel() {
            // CSS 已经在 style.css 中设置了 scroll-behavior: smooth
            // 这里不做任何拦截，让浏览器原生处理滚动
            // 确保不禁用默认滚动行为
        },
        
        initParallax() {
            const parallaxElements = document.querySelectorAll('.bg-decoration, .particles-container');
            
            let ticking = false;
            let lastScrollY = 0;
            
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        const scrollY = window.scrollY;
                        
                        // 只有当滚动距离变化超过 5px 时才更新，减少重绘
                        if (Math.abs(scrollY - lastScrollY) > 5) {
                            parallaxElements.forEach((el, index) => {
                                const speed = 0.3 + (index * 0.05); // 降低速度减少卡顿
                                el.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`; // 使用 GPU 加速
                            });
                            lastScrollY = scrollY;
                        }
                        
                        ticking = false;
                    });
                    ticking = true;
                }
            }, { passive: true });
        },
        
        initScrollSnap() {
            // 只对卡片添加视觉高亮，不阻塞滚动
            const cards = document.querySelectorAll('.card, .feature-card');
            
            // 使用更宽松的阈值，避免频繁触发
            let observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-viewport');
                    } else {
                        entry.target.classList.remove('in-viewport');
                    }
                });
            }, {
                threshold: 0.1, // 降低阈值
                rootMargin: '0px 0px -20% 0px'
            });
            
            cards.forEach(card => observer.observe(card));
        },
        
        createProgressIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'scroll-progress';
            indicator.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 0%;
                height: 3px;
                background: linear-gradient(90deg, var(--accent-color), #f0c674);
                z-index: 10000;
                transition: width 0.15s ease-out;
                box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
            `;
            document.body.appendChild(indicator);
            
            let ticking = false;
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        const scrollTop = window.scrollY;
                        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                        const progress = (scrollTop / docHeight) * 100;
                        indicator.style.width = progress + '%';
                        ticking = false;
                    });
                    ticking = true;
                }
            }, { passive: true });
        },
        
        createBackToTop() {
            const btn = document.createElement('button');
            btn.className = 'back-to-top';
            btn.innerHTML = '↑';
            btn.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--accent-color), rgba(212, 175, 55, 0.8));
                border: none;
                color: #1a1a2e;
                font-size: 24px;
                cursor: pointer;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 9999;
                box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
            `;
            
            btn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            
            document.body.appendChild(btn);
            
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    btn.style.opacity = '1';
                    btn.style.visibility = 'visible';
                } else {
                    btn.style.opacity = '0';
                    btn.style.visibility = 'hidden';
                }
            }, { passive: true });
            
            // 悬停效果
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.1) translateY(-5px)';
                btn.style.boxShadow = '0 8px 25px rgba(212, 175, 55, 0.5)';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1) translateY(0)';
                btn.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.3)';
            });
        }
    };

    // ==================== 鼠标跟随光效 ====================
    const CursorGlow = {
        element: null,
        isActive: false,
        rafId: null,
        mouseX: 0,
        mouseY: 0,
        currentX: 0,
        currentY: 0,
        
        init() {
            // 只在非触摸设备上启用
            if (window.matchMedia('(pointer: coarse)').matches) return;
            
            this.element = document.createElement('div');
            this.element.className = 'cursor-glow';
            this.element.style.opacity = '0';
            document.body.appendChild(this.element);
            
            document.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
                this.isActive = true;
                this.element.style.opacity = '1';
                
                if (!this.rafId) {
                    this.animate();
                }
            });
            
            document.addEventListener('mouseleave', () => {
                this.isActive = false;
                this.element.style.opacity = '0';
            });
        },
        
        animate() {
            if (!this.isActive) {
                this.rafId = null;
                return;
            }
            
            // 平滑跟随
            this.currentX += (this.mouseX - this.currentX) * 0.1;
            this.currentY += (this.mouseY - this.currentY) * 0.1;
            
            this.element.style.left = `${this.currentX}px`;
            this.element.style.top = `${this.currentY}px`;
            
            this.rafId = requestAnimationFrame(() => this.animate());
        }
    };

    // ==================== 按钮涟漪效果 ====================
    const RippleEffect = {
        init() {
            document.querySelectorAll('.btn, .nav-btn, .feature-card').forEach(btn => {
                btn.classList.add('ripple-btn');
                btn.addEventListener('click', (e) => this.createRipple(e, btn));
            });
        },
        
        createRipple(e, btn) {
            const ripple = document.createElement('span');
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            btn.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        }
    };

    // ==================== 增强加载动画 ====================
    const LoadingAnimation = {
        show(container) {
            const loading = document.createElement('div');
            loading.className = 'loading-enhanced';
            loading.innerHTML = `
                <div class="spinner-enhanced">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <p style="color: var(--text-secondary); margin-top: 10px;">天乙贵人正在推算...</p>
            `;
            
            container.innerHTML = '';
            container.appendChild(loading);
            container.style.display = 'block';
            
            return loading;
        },
        
        hide(container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
    };

    // ==================== 八字展示动画 ====================
    const BaziAnimation = {
        show(container, baziData) {
            container.innerHTML = '';
            container.style.display = 'block';
            
            const pillars = [
                { label: '年柱', content: baziData.yearPillar },
                { label: '月柱', content: baziData.monthPillar },
                { label: '日柱', content: baziData.dayPillar },
                { label: '时柱', content: baziData.hourPillar }
            ];
            
            pillars.forEach((pillar, index) => {
                const div = document.createElement('div');
                div.className = 'bazi-pillar bazi-pillar-animated';
                div.innerHTML = `
                    <div class="pillar-label">${pillar.label}</div>
                    <div class="pillar-content glow-text">${pillar.content}</div>
                `;
                div.style.animationDelay = `${index * 0.15}s`;
                container.appendChild(div);
            });
        }
    };

    // ==================== 平滑锚点滚动 ====================
    const AnchorScroll = {
        init() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    const targetId = anchor.getAttribute('href');
                    if (targetId === '#') return;
                    
                    const target = document.querySelector(targetId);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        }
    };

    // ==================== 输入框动画 ====================
    const InputAnimation = {
        init() {
            document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(input => {
                // 聚焦时添加发光效果
                input.addEventListener('focus', () => {
                    input.parentElement?.classList.add('input-focused');
                });
                
                input.addEventListener('blur', () => {
                    input.parentElement?.classList.remove('input-focused');
                });
                
                // 输入时的震动反馈（可选）
                input.addEventListener('input', () => {
                    if (input.classList.contains('shake-on-input')) {
                        input.style.transform = 'scale(1.02)';
                        setTimeout(() => {
                            input.style.transform = 'scale(1)';
                        }, 100);
                    }
                });
            });
        }
    };

    // ==================== 页面加载动画序列 ====================
    const PageLoadSequence = {
        async run() {
            const body = document.body;
            body.style.opacity = '0';
            
            await this.delay(100);
            body.style.transition = 'opacity 0.5s ease';
            body.style.opacity = '1';
            
            // 头部动画
            const header = document.querySelector('.header');
            if (header) {
                header.style.opacity = '0';
                header.style.transform = 'translateY(-20px)';
                await this.delay(200);
                header.style.transition = 'all 0.6s ease';
                header.style.opacity = '1';
                header.style.transform = 'translateY(0)';
            }
            
            // 导航动画
            const navBtns = document.querySelectorAll('.nav-btn');
            navBtns.forEach((btn, i) => {
                btn.style.opacity = '0';
                btn.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    btn.style.transition = 'all 0.4s ease';
                    btn.style.opacity = '1';
                    btn.style.transform = 'translateY(0)';
                }, 400 + i * 100);
            });
        },
        
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // ==================== 祥云背景 ====================
    const CloudBackground = {
        container: null,
        
        init() {
            this.container = document.createElement('div');
            this.container.className = 'clouds-container';
            this.container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: -2;
                overflow: hidden;
            `;
            document.body.appendChild(this.container);
            
            // 创建祥云
            for (let i = 0; i < 5; i++) {
                this.createCloud(i);
            }
        },
        
        createCloud(index) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            
            const size = Math.random() * 200 + 100;
            cloud.style.width = `${size}px`;
            cloud.style.height = `${size * 0.6}px`;
            cloud.style.top = `${Math.random() * 80}%`;
            cloud.style.left = '-200px';
            cloud.style.animationDuration = `${Math.random() * 20 + 30}s`;
            cloud.style.animationDelay = `${index * 8}s`;
            
            this.container.appendChild(cloud);
        }
    };

    // ==================== 初始化所有动画 ====================
    function initAnimations() {
        // 页面加载动画
        PageLoadSequence.run();
        
        // 粒子系统
        ParticleSystem.init();
        
        // 祥云背景
        CloudBackground.init();
        
        // 滚动显示
        ScrollReveal.init();
        
        // 鼠标光效（桌面端）
        CursorGlow.init();
        
        // 涟漪效果
        RippleEffect.init();
        
        // 平滑滚动
        SmoothScroll.init();
        
        // 输入框动画
        InputAnimation.init();
        
        console.log('✨ 增强动画系统已加载');
    }

    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
        initAnimations();
    }

    // 暴露全局对象
    window.EnhancedAnimations = {
        Typewriter,
        LoadingAnimation,
        BaziAnimation,
        ParticleSystem,
        ScrollReveal,
        CursorGlow
    };

})();

// 添加CSS动画关键帧
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .typing {
        position: relative;
    }
    
    .input-focused {
        position: relative;
    }
    
    .input-focused::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 2px;
        background: var(--accent-color);
        transition: all 0.3s ease;
        transform: translateX(-50%);
    }
    
    .input-focused.input-focused::after {
        width: 100%;
    }
`;
document.head.appendChild(style);

/**
 * 合盘页面交互逻辑
 */

(function() {

    // 表单提交
    document.getElementById('hebanForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 追踪功能使用 - 开始合盘
        if (window.Analytics) {
            Analytics.trackFeature('heban', 'start', {
                has_question: !!document.getElementById('userQuestion').value
            });
            Analytics.trackFunnel('heban_analysis', 'submit_form', 1);
        }
        
        // 获取甲方信息
        const year1 = parseInt(document.getElementById('year1').value);
        const month1 = parseInt(document.getElementById('month1').value);
        const day1 = parseInt(document.getElementById('day1').value);
        const hour1 = parseInt(document.getElementById('hour1').value);
        
        // 获取乙方信息
        const year2 = parseInt(document.getElementById('year2').value);
        const month2 = parseInt(document.getElementById('month2').value);
        const day2 = parseInt(document.getElementById('day2').value);
        const hour2 = parseInt(document.getElementById('hour2').value);
        
        const question = document.getElementById('userQuestion').value;

        // 显示加载
        document.getElementById('loading').classList.add('show');
        document.getElementById('resultContainer').classList.remove('show');
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('btnText').textContent = '合盘中...';

        try {
            // 追踪表单提交
            if (window.WenQuAnalytics) {
                WenQuAnalytics.formSubmit('heban', true);
            }
            
            // 计算双方八字
            const [baziRes1, baziRes2] = await Promise.all([
                fetch('/api/calculate_bazi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ year: year1, month: month1, day: day1, hour: hour1 })
                }),
                fetch('/api/calculate_bazi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ year: year2, month: month2, day: day2, hour: hour2 })
                })
            ]);

            const [baziData1, baziData2] = await Promise.all([
                baziRes1.json(),
                baziRes2.json()
            ]);

            if (baziData1.success && baziData2.success) {
                // 显示八字预览
                displayBazi(baziData1.baziData, 1);
                displayBazi(baziData2.baziData, 2);

                // 调用合盘分析
                const endpoint = '/api/ask_heban';
                
                // 追踪AI请求开始
                const aiStartTime = Date.now();
                if (window.WenQuAnalytics) {
                    WenQuAnalytics.trackAIRequest('heban', question.length);
                }

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        person1: { year: year1, month: month1, day: day1, hour: hour1 },
                        person2: { year: year2, month: month2, day: day2, hour: hour2 },
                        question: question
                    })
                });
                
                const data = await res.json();
                
                // 追踪AI响应完成
                if (window.WenQuAnalytics) {
                    WenQuAnalytics.trackAIResponse(aiStartTime, data.success);
                }

                if (data.success) {
                    displayResult(data);
                    saveToHistory(data);
                    
                    // 追踪功能使用 - 完成合盘
                    if (window.Analytics) {
                        Analytics.trackFeature('heban', 'complete', {
                            duration_ms: Date.now() - aiStartTime
                        });
                        Analytics.trackFunnel('heban_analysis', 'view_result', 2);
                    }
                } else {
                    alert('合盘分析失败：' + (data.error || '未知错误'));
                }
            } else {
                alert('八字计算失败');
            }
        } catch (error) {
            console.error('Error:', error);
            
            // 追踪错误
            if (window.WenQuAnalytics) {
                WenQuAnalytics.trackAIError('request_failed', error.message);
            }
            
            alert('请求失败，请检查网络连接');
        } finally {
            document.getElementById('loading').classList.remove('show');
            document.getElementById('submitBtn').disabled = false;
            document.getElementById('btnText').textContent = '💕 请红鸾天喜合盘';
        }
    });

    // 显示八字
    function displayBazi(baziData, personNum) {
        const display = document.getElementById(`baziDisplay${personNum}`);
        const preview = document.getElementById(`baziPreview${personNum}`);
        const bazi = baziData.bazi;
        
        display.innerHTML = `
            <div class="bazi-pillar">
                <div class="pillar-label">年柱</div>
                <div class="pillar-content">${bazi.yearPillar}</div>
            </div>
            <div class="bazi-pillar">
                <div class="pillar-label">月柱</div>
                <div class="pillar-content">${bazi.monthPillar}</div>
            </div>
            <div class="bazi-pillar">
                <div class="pillar-label">日柱</div>
                <div class="pillar-content">${bazi.dayPillar}</div>
            </div>
            <div class="bazi-pillar">
                <div class="pillar-label">时柱</div>
                <div class="pillar-content">${bazi.hourPillar}</div>
            </div>
        `;
        preview.style.display = 'block';
    }

    // 显示结果
    function displayResult(data) {
        const container = document.getElementById('resultContainer');
        const content = document.getElementById('resultContent');
        const audioControls = document.getElementById('audioControls');

        content.textContent = data.analysis || data.result || '暂无合盘结果';
        container.classList.add('show');
        audioControls.style.display = 'flex';

        // 滚动到结果
        container.scrollIntoView({ behavior: 'smooth' });
    }

    // 朗读结果（使用浏览器原生TTS）
    document.getElementById('playTTSBtn')?.addEventListener('click', function() {
        const content = document.getElementById('resultContent').textContent;
        if (content && window.WenQu && window.WenQu.TTS) {
            window.WenQu.TTS.speak(content);
        }
    });

    // 保存历史记录
    function saveToHistory(data) {
        // 检查用户是否已登录
        if (!window.WenQu || !window.WenQu.Auth || !window.WenQu.Auth.isLoggedIn()) {
            // 未登录用户不保存历史记录
            return;
        }
        
        const userId = window.WenQu.Auth.getUserId();
        const historyKey = `hebanHistory_${userId}`;
        
        // 获取用户输入的问题
        const question = document.getElementById('userQuestion').value.trim();
        // 获取双方八字信息
        const year1 = document.getElementById('year1').value;
        const month1 = document.getElementById('month1').value;
        const day1 = document.getElementById('day1').value;
        const year2 = document.getElementById('year2').value;
        const month2 = document.getElementById('month2').value;
        const day2 = document.getElementById('day2').value;
        
        // 构建显示文本：优先显示问题，如果没有则显示双方日期
        let displayText;
        if (question) {
            displayText = question.length > 30 ? question.substring(0, 30) + '...' : question;
        } else {
            displayText = `${year1}年${month1}月${day1}日 vs ${year2}年${month2}月${day2}日`;
        }
        
        let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        history.unshift({
            time: new Date().toLocaleString(),
            content: displayText,
            fullData: data
        });
        if (history.length > 10) history = history.slice(0, 10);
        localStorage.setItem(historyKey, JSON.stringify(history));
        loadHistory();
    }

    // 加载历史记录
    function loadHistory() {
        const list = document.getElementById('historyList');
        const card = document.getElementById('historyCard');
        
        // 检查用户是否已登录
        if (!window.WenQu || !window.WenQu.Auth || !window.WenQu.Auth.isLoggedIn()) {
            // 未登录用户不显示历史记录
            card.style.display = 'none';
            return;
        }
        
        const userId = window.WenQu.Auth.getUserId();
        const historyKey = `hebanHistory_${userId}`;
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');

        if (history.length === 0) {
            card.style.display = 'none';
            return;
        }

        card.style.display = 'block';
        list.innerHTML = history.map((item, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-time">${item.time}</div>
                <div class="history-content">${item.content}</div>
            </div>
        `).join('');

        // 点击历史记录加载
        list.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', function() {
                const idx = parseInt(this.dataset.index);
                const data = history[idx].fullData;
                displayResult(data, 'text');
            });
        });
    }

    // 页面加载时加载历史
    loadHistory();
})();
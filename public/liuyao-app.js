/**
 * 六爻页面交互逻辑
 */

(function() {
    // 状态管理
    let tossCount = 0;
    let tossResults = [];

    // 爻的符号映射
    const YAO_SYMBOLS = {
        '少阳': { symbol: '━━━━━━━', type: 'yang', changing: false },
        '少阴': { symbol: '━━　━━', type: 'yin', changing: false },
        '老阳': { symbol: '━━━━━━━', type: 'yang', changing: true },
        '老阴': { symbol: '━━　━━', type: 'yin', changing: true }
    };

    

    // 摇卦按钮
    document.getElementById('tossBtn').addEventListener('click', async function() {
        if (tossCount >= 6) {
            resetToss();
            return;
        }
        
        // 第一次摇卦时追踪
        if (tossCount === 0 && window.Analytics) {
            Analytics.trackFeature('liuyao', 'start');
            Analytics.trackFunnel('liuyao_divination', 'start_toss', 1);
        }

        const btn = this;
        btn.disabled = true;
        
        // 铜钱动画
        const coins = document.querySelectorAll('.coin');
        coins.forEach(coin => {
            coin.classList.add('flipping');
        });

        // 等待动画完成
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 生成随机结果
        const result = generateTossResult();
        tossResults.push(result);
        tossCount++;

        // 移除动画类
        coins.forEach(coin => {
            coin.classList.remove('flipping');
            // 随机显示正反面
            const isFront = Math.random() > 0.5;
            coin.style.transform = isFront ? 'rotateY(0deg)' : 'rotateY(180deg)';
        });

        // 更新UI
        updateProgress(result);

        // 检查是否完成6次
        if (tossCount >= 6) {
            finishToss();
        } else {
            btn.disabled = false;
            btn.textContent = `🎲 第 ${tossCount + 1} 次摇卦`;
        }
    });

    // 生成投掷结果
    function generateTossResult() {
        // 三枚铜钱，每枚正反面概率各50%
        const coins = [
            Math.random() > 0.5 ? 1 : 0,
            Math.random() > 0.5 ? 1 : 0,
            Math.random() > 0.5 ? 1 : 0
        ];
        
        const sum = coins.reduce((a, b) => a + b, 0);
        
        // 1=正面(阳)，0=反面(阴)
        // 3正=老阳(9)，2正1反=少阴(8)，1正2反=少阳(7)，0正=老阴(6)
        if (sum === 3) return { name: '老阳', value: 9, coins: coins };
        if (sum === 2) return { name: '少阴', value: 8, coins: coins };
        if (sum === 1) return { name: '少阳', value: 7, coins: coins };
        return { name: '老阴', value: 6, coins: coins };
    }

    // 更新进度显示
    function updateProgress(result) {
        document.getElementById('progressArea').style.display = 'block';
        document.getElementById('currentToss').textContent = tossCount;
        
        const resultDiv = document.createElement('div');
        resultDiv.style.cssText = `
            padding: 10px 15px;
            background: rgba(201, 162, 39, 0.1);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            text-align: center;
        `;
        resultDiv.innerHTML = `
            <div style="color: var(--accent-color); font-weight: bold;">第${tossCount}爻</div>
            <div style="color: var(--text-primary); font-size: 1.2rem; margin: 5px 0;">${result.name}</div>
            <div style="color: var(--text-secondary); font-size: 0.85rem;">${result.value}</div>
        `;
        document.getElementById('tossResults').appendChild(resultDiv);

        document.getElementById('tossInfo').textContent = 
            `第 ${tossCount} 次投掷完成：${result.name}（${result.value}）`;
    }

    // 完成投掷
    function finishToss() {
        document.getElementById('tossBtn').textContent = '🔄 重新摇卦';
        document.getElementById('tossBtn').disabled = false;
        document.getElementById('tossInfo').textContent = '六爻已成，请查看卦象';
        
        // 显示卦象
        displayGua();
        
        // 显示输出选项和提交按钮
        document.getElementById('outputOptions').style.display = 'block';
        document.getElementById('submitArea').style.display = 'block';
    }

    // 显示卦象
    function displayGua() {
        document.getElementById('guaArea').style.display = 'block';
        
        // 本卦（从下到上）
        const mainGuaDiv = document.getElementById('mainGua');
        mainGuaDiv.innerHTML = '';
        
        // 变卦
        const changeGuaDiv = document.getElementById('changeGua');
        changeGuaDiv.innerHTML = '';
        
        // 从下到上显示（第6爻在上，第1爻在下）
        for (let i = 5; i >= 0; i--) {
            const result = tossResults[i];
            const yaoInfo = YAO_SYMBOLS[result.name];
            
            // 本卦爻
            const mainLine = document.createElement('div');
            mainLine.className = `gua-line ${yaoInfo.type}-line`;
            mainLine.style.cssText = `
                font-size: 1.5rem;
                margin: 8px 0;
                color: ${yaoInfo.changing ? '#ff6464' : 'inherit'};
                font-weight: ${yaoInfo.changing ? 'bold' : 'normal'};
            `;
            mainLine.innerHTML = yaoInfo.symbol + (yaoInfo.changing ? ' (变)' : '');
            mainGuaDiv.appendChild(mainLine);
            
            // 变卦爻（老阳变阴，老阴变阳）
            const changeLine = document.createElement('div');
            changeLine.className = 'gua-line';
            let changeSymbol;
            if (result.name === '老阳') {
                changeSymbol = YAO_SYMBOLS['少阴'].symbol;
            } else if (result.name === '老阴') {
                changeSymbol = YAO_SYMBOLS['少阳'].symbol;
            } else {
                changeSymbol = yaoInfo.symbol;
            }
            changeLine.style.cssText = 'font-size: 1.5rem; margin: 8px 0;';
            changeLine.innerHTML = changeSymbol;
            changeGuaDiv.appendChild(changeLine);
        }
    }

    // 重置摇卦
    function resetToss() {
        tossCount = 0;
        tossResults = [];
        
        document.getElementById('tossResults').innerHTML = '';
        document.getElementById('progressArea').style.display = 'none';
        document.getElementById('guaArea').style.display = 'none';

        document.getElementById('submitArea').style.display = 'none';
        document.getElementById('resultContainer').classList.remove('show');
        document.getElementById('tossInfo').textContent = '准备就绪，请点击开始摇卦';
        document.getElementById('tossBtn').textContent = '🎲 开始摇卦';
        
        // 重置铜钱
        document.querySelectorAll('.coin').forEach(coin => {
            coin.style.transform = 'rotateY(0deg)';
        });
    }

    // 提交解卦
    document.getElementById('submitBtn').addEventListener('click', async function() {
        const question = document.getElementById('userQuestion').value.trim();
        
        if (!question) {
            alert('请输入你想问的问题');
            return;
        }

        const btn = this;
        btn.disabled = true;
        btn.textContent = '解卦中...';
        document.getElementById('loading').classList.add('show');
        document.getElementById('resultContainer').classList.remove('show');

        try {
            // 追踪表单提交
            if (window.WenQuAnalytics) {
                WenQuAnalytics.formSubmit('liuyao', true);
            }
            
            const endpoint = '/api/ask_liuyao';
            
            // 追踪AI请求开始
            const aiStartTime = Date.now();
            if (window.WenQuAnalytics) {
                WenQuAnalytics.trackAIRequest('liuyao', question.length);
            }
            
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: question,
                    tossResults: tossResults
                })
            });
            
            const data = await res.json();
            
            // 追踪AI响应完成
            if (window.WenQuAnalytics) {
                WenQuAnalytics.trackAIResponse(aiStartTime, data.success);
            }

            if (data.success) {
                displayResult(data);
                
                // 追踪功能使用 - 完成六爻
                if (window.Analytics) {
                    Analytics.trackFeature('liuyao', 'complete', {
                        hexagram: currentHexagram?.name
                    });
                    Analytics.trackFunnel('liuyao_divination', 'view_result', 2);
                }
            } else {
                alert('解卦失败：' + (data.error || '未知错误'));
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
            btn.disabled = false;
            btn.textContent = '🙏 请太极贵人解卦';
        }
    });

    // 显示结果
    function displayResult(data) {
        const container = document.getElementById('resultContainer');
        const content = document.getElementById('resultContent');
        const audioControls = document.getElementById('audioControls');

        content.textContent = data.analysis || data.result || '暂无解卦结果';
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
})();

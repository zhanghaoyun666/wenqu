/**
 * 美团 LangCat 大模型调用客户端
 * 支持自定义提示词函数
 * 
 * LangCat API 文档：https://langcat.meituan.com/
 * 兼容 OpenAI API 格式
 */

const axios = require('axios');

// 尝试加载环境变量：优先使用 dotenv；若未安装，则手动解析 .env
(() => {
    try {
        // 可选依赖，不做强制安装
        require('dotenv').config();
    } catch (_) {
        // 简单解析项目根目录下的 .env（KEY=VALUE，每行一对，忽略 # 注释）
        try {
            const fs = require('fs');
            const path = require('path');
            const envPath = path.resolve(__dirname, '.env');
            if (fs.existsSync(envPath)) {
                const content = fs.readFileSync(envPath, 'utf8');
                content.split(/\r?\n/).forEach((line) => {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#')) return;
                    const eqIndex = trimmed.indexOf('=');
                    if (eqIndex === -1) return;
                    const key = trimmed.slice(0, eqIndex).trim();
                    const value = trimmed.slice(eqIndex + 1).trim();
                    if (key && !(key in process.env)) {
                        process.env[key] = value;
                    }
                });
            }
        } catch (_) {}
    }
})();

// 美团 LangCat API配置（从环境变量读取，提供合理默认值；API Key 不提供默认）
const LANGCAT_CONFIG = {
    baseURL: process.env.LANGCAT_BASE_URL || 'https://api.langcat.meituan.com/v1',
    model: process.env.LANGCAT_MODEL || 'langcat-v1',
    apiKey: process.env.LANGCAT_API_KEY || ''
};

/**
 * 调用美团 LangCat 大模型
 * @param {string} prompt 提示词
 * @param {Object} options 可选参数
 * @returns {Promise<Object>} 模型响应
 */
async function callLangCatModel(prompt, options = {}) {
    try {
        // 检查 API Key
        if (!LANGCAT_CONFIG.apiKey) {
            throw new Error('未配置 LANGCAT_API_KEY，请在 .env 文件中设置');
        }

        const response = await axios.post(
            `${LANGCAT_CONFIG.baseURL}/chat/completions`,
            {
                model: LANGCAT_CONFIG.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 8000,
                stream: false
            },
            {
                headers: {
                    'Authorization': `Bearer ${LANGCAT_CONFIG.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: options.timeout || 60000
            }
        );

        return {
            success: true,
            data: response.data,
            content: response.data.choices[0].message.content
        };
    } catch (error) {
        console.error('调用美团 LangCat 大模型失败:', error.message);
        if (error.response) {
            console.error('错误详情:', error.response.data);
        }
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}

/**
 * 主函数：八字分析
 * @param {Object} baziData 八字数据
 * @param {string} questionType 问题类型
 * @param {string} userQuestion 用户问题
 * @param {Function} customPromptFunc 自定义提示词函数
 * @returns {Promise<Object>} 分析结果
 */
async function analyzeBazi(baziData, questionType, userQuestion, customPromptFunc) {
    try {
        // 使用自定义提示词函数
        const prompt = customPromptFunc(baziData, questionType, userQuestion);
        
        console.log('正在调用美团 LangCat 大模型进行分析...');
        const result = await callLangCatModel(prompt);
        
        if (result.success) {
            return {
                success: true,
                baziData: baziData,
                questionType: questionType,
                userQuestion: userQuestion,
                analysis: result.content,
                prompt: prompt // 返回使用的提示词，方便调试
            };
        } else {
            return {
                success: false,
                error: result.error,
                baziData: baziData
            };
        }
    } catch (error) {
        console.error('八字分析失败:', error.message);
        return {
            success: false,
            error: error.message,
            baziData: baziData
        };
    }
}

// 导出函数
module.exports = {
    callLangCatModel,
    analyzeBazi,
    LANGCAT_CONFIG
};

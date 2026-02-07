
const { callLangCatModel, analyzeBazi, LANGCAT_CONFIG } = require('./langcat_client');

// 为了保持向后兼容，导出相同的接口
// 但实际上调用的是 LangCat 模型

const QINIU_CONFIG = {
    baseURL: LANGCAT_CONFIG.baseURL,
    model: LANGCAT_CONFIG.model,
    apiKey: LANGCAT_CONFIG.apiKey
};

/**
 * 调用大模型（兼容旧接口，实际调用 LangCat）
 * @param {string} prompt 提示词
 * @param {Object} options 可选参数
 * @returns {Promise<Object>} 模型响应
 */
async function callQwenModel(prompt, options = {}) {
    console.log('[兼容模式] 通过 qwen_client 调用，实际使用 LangCat 模型');
    return await callLangCatModel(prompt, options);
}

// 导出函数（保持与之前相同的接口）
module.exports = {
    callQwenModel,
    analyzeBazi,
    QINIU_CONFIG
};

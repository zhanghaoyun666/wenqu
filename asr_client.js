class ASRClient {
    constructor() {
        console.log('[ASR] 后端ASR服务已禁用，请使用浏览器原生语音识别');
    }

    /**
     * 语音转文字（模拟接口）
     * @returns {Object} { success: boolean, error: string }
     */
    async speechToText() {
        return { 
            success: false, 
            error: '后端ASR服务已禁用，请使用浏览器原生语音识别功能' 
        };
    }

    /**
     * 测试ASR连接
     * @returns {Object} { success: boolean, message: string }
     */
    async testConnection() {
        return {
            success: true,
            message: 'ASR服务已禁用，请使用浏览器原生语音识别'
        };
    }

    /**
     * 获取ASR模型信息
     * @returns {Object} 模型配置信息
     */
    getModelInfo() {
        return {
            description: '后端ASR服务已禁用，请使用浏览器原生语音识别'
        };
    }
}

module.exports = {
    ASRClient
};

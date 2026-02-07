
/**
 * 文本转语音（模拟接口，实际使用浏览器原生 API）
 * @param {Object} params
 * @returns {Promise<{success:boolean, audioBuffer?:Buffer, contentType?:string, error?:string}>}
 */
async function synthesizeSpeech(params) {
    console.log('[TTS] 后端TTS服务已禁用，请使用浏览器原生语音合成');
    return { 
        success: false, 
        error: '后端TTS服务已禁用，请使用浏览器原生语音合成功能' 
    };
}

module.exports = {
    synthesizeSpeech
};

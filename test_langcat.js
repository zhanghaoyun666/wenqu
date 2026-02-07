/**
 * 美团 LangCat 模型连接测试
 */

const { callLangCatModel, LANGCAT_CONFIG } = require('./langcat_client');

async function testLangCat() {
    console.log('========================================');
    console.log('🧪 美团 LangCat 模型连接测试');
    console.log('========================================\n');

    // 显示配置
    console.log('📋 当前配置:');
    console.log(`  模型: ${LANGCAT_CONFIG.model}`);
    console.log(`  API地址: ${LANGCAT_CONFIG.baseURL}`);
    console.log(`  API Key: ${LANGCAT_CONFIG.apiKey ? '已设置 (' + LANGCAT_CONFIG.apiKey.slice(0, 10) + '...)' : '未设置'}\n`);

    if (!LANGCAT_CONFIG.apiKey) {
        console.error('❌ 错误: 未设置 LANGCAT_API_KEY 环境变量');
        console.log('\n💡 请按照以下步骤配置:');
        console.log('  1. 复制 env.example 为 .env');
        console.log('  2. 在 .env 文件中设置 LANGCAT_API_KEY=你的API密钥');
        console.log('  3. 从美团 LangCat 控制台获取 API 密钥');
        console.log('     官网: https://langcat.meituan.com/\n');
        process.exit(1);
    }

    console.log('🔄 正在测试 API 连接...\n');

    try {
        const result = await callLangCatModel(
            '你好，请简单介绍一下自己，用一句话即可。',
            { maxTokens: 100 }
        );

        if (result.success) {
            console.log('✅ 连接成功!');
            console.log('\n📝 模型回复:');
            console.log('  ' + result.content);
            console.log('\n========================================');
            console.log('🎉 LangCat 模型配置正确，可以正常使用');
            console.log('========================================\n');
        } else {
            console.error('❌ 连接失败:');
            console.error('  错误:', result.error);
            console.log('\n💡 可能的原因:');
            console.log('  - API 密钥无效或已过期');
            console.log('  - 网络连接问题');
            console.log('  - LangCat 服务暂时不可用');
            console.log('\n请检查配置后重试。\n');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ 测试过程出错:');
        console.error('  ', error.message);
        process.exit(1);
    }
}

// 运行测试
testLangCat();

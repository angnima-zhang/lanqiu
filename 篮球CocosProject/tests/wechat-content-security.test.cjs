const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const ts = require(require.resolve('typescript', { paths: [
    project, path.join(project, 'extensions/cocos-code-mode'),
] }));

function loadClient(runtime) {
    const source = fs.readFileSync(
        path.join(project, 'assets/scripts/home/WechatContentSecurityService.ts'),
        'utf8',
    );
    const compiled = ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
    }).outputText;
    const exports = {};
    const context = vm.createContext({ exports, console, ...runtime });
    vm.runInContext(compiled, context);
    return exports;
}

function createWechatCloud(response) {
    const calls = { init: 0, functions: [] };
    const cloud = {
        init(options) {
            calls.init += 1;
            calls.initOptions = options;
        },
        async callFunction(options) {
            calls.functions.push(options);
            if (response instanceof Error) throw response;
            return response;
        },
    };
    return { cloud, calls };
}

test('TapTap and non-WeChat builds bypass WeChat content security', async () => {
    const runtime = createWechatCloud(new Error('must not call'));
    const tapClient = loadClient({ tap: {}, wx: { cloud: runtime.cloud } });
    const browserClient = loadClient({});

    assert.equal((await tapClient.checkWechatGameText('我的球队')).status, 'pass');
    assert.equal((await browserClient.checkWechatGameText('我的球队')).status, 'pass');
    assert.equal(runtime.calls.functions.length, 0);
});

test('WeChat team-name checks call the cloud function and reject risky content', async () => {
    const runtime = createWechatCloud({
        result: { ok: true, suggest: 'risky', label: 20003, traceId: 'text-trace' },
    });
    const client = loadClient({ wx: { cloud: runtime.cloud } });

    const result = await client.checkWechatGameText('违规球队名');

    assert.equal(result.status, 'risky');
    assert.equal(runtime.calls.init, 1);
    assert.equal(runtime.calls.functions[0].name, 'contentSecurity');
    assert.equal(runtime.calls.functions[0].data.action, 'checkText');
    assert.equal(runtime.calls.functions[0].data.content, '违规球队名');
    assert.equal(runtime.calls.functions[0].data.scene, 1);
});

test('WeChat media checks submit image/audio URLs through the same cloud function', async () => {
    const runtime = createWechatCloud({
        result: { ok: true, suggest: 'submitted', traceId: 'media-trace' },
    });
    const client = loadClient({ wx: { cloud: runtime.cloud } });

    const result = await client.submitWechatMediaCheck('https://example.com/avatar.png', 2);

    assert.equal(result.status, 'submitted');
    assert.equal(result.traceId, 'media-trace');
    assert.equal(runtime.calls.functions[0].data.action, 'checkMedia');
    assert.equal(runtime.calls.functions[0].data.mediaUrl, 'https://example.com/avatar.png');
    assert.equal(runtime.calls.functions[0].data.mediaType, 2);
    assert.equal(runtime.calls.functions[0].data.scene, 1);
});

test('WeChat cloud failures fail closed instead of saving unchecked names', async () => {
    const runtime = createWechatCloud(new Error('offline'));
    const client = loadClient({ wx: { cloud: runtime.cloud } });
    const missingCloudClient = loadClient({ wx: {} });

    assert.equal((await client.checkWechatGameText('新球队名')).status, 'unavailable');
    assert.equal((await missingCloudClient.checkWechatGameText('新球队名')).status, 'unavailable');
});

test('team identity is persisted only after the asynchronous name check passes', () => {
    const home = fs.readFileSync(
        path.join(project, 'assets/scripts/home/HomeUiController.ts'),
        'utf8',
    );

    assert.match(home, /await checkWechatGameText\(teamName\)/);
    assert.match(home, /if \(securityResult\.status !== 'pass'\)[\s\S]*?return;/);
    assert.match(home, /private saveTeamIdentity = async \(\): Promise<void>/);
});

test('cloud function calls both official security APIs with server-derived OPENID', async () => {
    const source = fs.readFileSync(
        path.join(project, 'build-templates/wechatgame/cloudfunctions/contentSecurity/index.js'),
        'utf8',
    );
    const calls = { text: [], media: [] };
    const cloud = {
        DYNAMIC_CURRENT_ENV: 'dynamic-env',
        init() {},
        getWXContext: () => ({ OPENID: 'server-openid' }),
        openapi: {
            wxa: { game: { contentSpam: { msgSecCheck: async (data) => {
                calls.text.push(data);
                return { errCode: 0, result: { suggest: 'pass', label: 100 }, traceId: 't1' };
            } } } },
            security: { mediaCheckAsync: async (data) => {
                calls.media.push(data);
                return { errCode: 0, traceId: 'm1' };
            } },
        },
    };
    const module = { exports: {} };
    vm.runInNewContext(source, {
        module,
        exports: module.exports,
        require(id) {
            if (id === 'wx-server-sdk') return cloud;
            throw new Error(`Unexpected dependency: ${id}`);
        },
    });

    const text = await module.exports.main({ action: 'checkText', content: '我的球队', scene: 1 });
    const media = await module.exports.main({
        action: 'checkMedia',
        mediaUrl: 'https://example.com/avatar.png',
        mediaType: 2,
        scene: 1,
    });

    assert.equal(text.suggest, 'pass');
    assert.equal(media.suggest, 'submitted');
    assert.equal(calls.text[0].openid, 'server-openid');
    assert.equal(calls.text[0].version, 2);
    assert.equal(calls.media[0].openid, 'server-openid');
    assert.equal(calls.media[0].mediaUrl, 'https://example.com/avatar.png');
    assert.equal(calls.media[0].mediaType, 2);
    assert.equal(calls.media[0].version, 2);
});

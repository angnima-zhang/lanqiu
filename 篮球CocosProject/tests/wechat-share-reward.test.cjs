const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const ts = require(require.resolve('typescript', { paths: [
    project, path.join(project, 'extensions/cocos-code-mode'),
] }));
const source = fs.readFileSync(
    path.join(project, 'assets/scripts/home/RewardedAdService.ts'),
    'utf8',
);
const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;

function createHarness(runtime, preview = false) {
    const state = { pity: 0, audio: 0, events: 0, now: 0 };
    class Label {
        static Overflow = { SHRINK: 2 };
        static HorizontalAlign = { CENTER: 1 };
        static VerticalAlign = { CENTER: 1 };
    }
    class RichText {}
    class Sprite {}
    class Button {}
    const exports = {};
    const context = vm.createContext({
        exports,
        console,
        Date: { now: () => state.now },
        ...runtime,
        require(id) {
            if (id === 'cc/env') return { PREVIEW: preview };
            if (id === 'cc') return { Button, Label, RichText, Sprite };
            if (id === './GameAudio') return {
                gameAudio: { playAdSuccess: () => { state.audio += 1; } },
            };
            if (id === './GameState') return {
                GAME_STATE_EVENT_REWARDED_AD_COMPLETED: 'rewarded',
                gameStateEvents: { emit: () => { state.events += 1; } },
                recordRewardedAdForRecruitmentPity: () => { state.pity += 1; },
            };
            throw new Error(`Unexpected dependency: ${id}`);
        },
    });
    vm.runInContext(compiled, context);
    return { service: exports, state, classes: { Button, Label, RichText, Sprite } };
}

function createNode(name, classes, component = null, children = []) {
    const components = new Map();
    const node = {
        name,
        active: true,
        parent: null,
        children,
        getChildByName(childName) {
            return this.children.find(child => child.name === childName) ?? null;
        },
        getComponent(Type) { return components.get(Type) ?? null; },
        addComponent(Type) {
            const value = new Type();
            value.node = this;
            components.set(Type, value);
            return value;
        },
    };
    for (const child of children) child.parent = node;
    if (component) {
        component.node = node;
        components.set(component instanceof classes.Label ? classes.Label : classes.Sprite, component);
    }
    return node;
}

function createWechatRuntime() {
    let onHide = null;
    let onShow = null;
    let onShareAppMessage = null;
    let onShareTimeline = null;
    let onCopyUrl = null;
    const calls = {
        share: 0,
        createAd: 0,
        offHide: 0,
        offShow: 0,
        showShareMenu: 0,
        onShareAppMessage: 0,
        onShareTimeline: 0,
        onCopyUrl: 0,
        menus: null,
    };
    const wx = {
        shareAppMessage() { calls.share += 1; },
        createRewardedVideoAd() {
            calls.createAd += 1;
            throw new Error('WeChat rewarded video must not be used');
        },
        onHide(callback) { onHide = callback; },
        onShow(callback) { onShow = callback; },
        offHide(callback) {
            if (onHide === callback) onHide = null;
            calls.offHide += 1;
        },
        offShow(callback) {
            if (onShow === callback) onShow = null;
            calls.offShow += 1;
        },
        showShareMenu(options) {
            calls.showShareMenu += 1;
            calls.menus = options.menus;
            options.success?.();
        },
        onShareAppMessage(callback) {
            onShareAppMessage = callback;
            calls.onShareAppMessage += 1;
        },
        offShareAppMessage(callback) {
            if (onShareAppMessage === callback) onShareAppMessage = null;
        },
        onShareTimeline(callback) {
            onShareTimeline = callback;
            calls.onShareTimeline += 1;
        },
        offShareTimeline(callback) {
            if (onShareTimeline === callback) onShareTimeline = null;
        },
        onCopyUrl(callback) {
            onCopyUrl = callback;
            calls.onCopyUrl += 1;
        },
        offCopyUrl(callback) {
            if (onCopyUrl === callback) onCopyUrl = null;
        },
    };
    return {
        wx,
        calls,
        hide: () => onHide?.(),
        show: () => onShow?.(),
        menuShare: () => onShareAppMessage?.(),
        timelineShare: () => onShareTimeline?.(),
        copyUrl: () => onCopyUrl?.(),
    };
}

test('WeChat enables the native share menu and registers share cards only once', () => {
    const runtime = createWechatRuntime();
    const { service } = createHarness({ wx: runtime.wx });

    service.initializeWechatShareCapabilities();
    service.initializeWechatShareCapabilities();

    assert.equal(runtime.calls.showShareMenu, 1);
    assert.deepEqual(Array.from(runtime.calls.menus), ['shareAppMessage', 'shareTimeline']);
    assert.equal(runtime.calls.onShareAppMessage, 1);
    assert.equal(runtime.calls.onShareTimeline, 1);
    assert.equal(runtime.calls.onCopyUrl, 1);
    assert.equal(runtime.menuShare().query, 'from=menu_share');
    assert.equal(runtime.timelineShare().query, 'from=timeline_share');
    assert.equal(runtime.copyUrl().query, 'from=copy_link');
});

test('TapTap compatibility wx never initializes WeChat share capabilities', () => {
    const runtime = createWechatRuntime();
    const { service } = createHarness({
        tap: { createRewardedVideoAd() {} },
        wx: runtime.wx,
    });

    service.initializeWechatShareCapabilities();

    assert.equal(runtime.calls.showShareMenu, 0);
    assert.equal(runtime.calls.onShareAppMessage, 0);
    assert.equal(runtime.calls.onShareTimeline, 0);
    assert.equal(runtime.calls.onCopyUrl, 0);
});

test('WeChat share rewards only after leaving the game for at least two seconds', async () => {
    const runtime = createWechatRuntime();
    const { service, state } = createHarness({ wx: runtime.wx });

    state.now = 1000;
    const tooShort = service.showRewardedVideo();
    runtime.hide();
    state.now = 2999;
    runtime.show();
    assert.equal(await tooShort, false);
    assert.deepEqual(
        { share: runtime.calls.share, createAd: runtime.calls.createAd, pity: state.pity },
        { share: 1, createAd: 0, pity: 0 },
    );

    state.now = 5000;
    const completed = service.showRewardedVideo();
    runtime.hide();
    state.now = 7000;
    runtime.show();
    assert.equal(await completed, true);
    assert.deepEqual(
        { share: runtime.calls.share, createAd: runtime.calls.createAd, pity: state.pity },
        { share: 2, createAd: 0, pity: 1 },
    );
    assert.equal(state.audio, 1);
    assert.equal(state.events, 1);
    assert.equal(runtime.calls.offHide, 2);
    assert.equal(runtime.calls.offShow, 2);
});

test('TapTap rewarded video remains preferred when TapTap also exposes wx compatibility', async () => {
    let close = null;
    let shareCalls = 0;
    const ad = {
        show: async () => {},
        onClose(callback) { close = callback; },
        offClose() {},
        onError() {},
        offError() {},
    };
    const { service, state } = createHarness({
        tap: { createRewardedVideoAd: () => ad },
        wx: { shareAppMessage: () => { shareCalls += 1; } },
    });

    const result = service.showRewardedVideo({ wechat: '', tapTap: 'tap-placement' });
    await Promise.resolve();
    close({ isEnded: true });

    assert.equal(await result, true);
    assert.equal(shareCalls, 0);
    assert.equal(state.pity, 1);
});

test('WeChat reward copy removes every visible ad expression without changing TapTap copy', () => {
    const wechat = createHarness({ wx: createWechatRuntime().wx }).service;
    assert.equal(wechat.toRewardedActionCopy('看广告双倍领取'), '分享双倍领取');
    assert.equal(wechat.toRewardedActionCopy('预算不足，可观看广告免费升级'), '预算不足，可分享免费升级');
    assert.equal(wechat.toRewardedActionCopy('广告保底 2/10（10次广告后必出）'), '分享保底 2/10（10次分享后必出）');

    const tap = createHarness({ tap: { createRewardedVideoAd() {} }, wx: {} }).service;
    assert.equal(tap.toRewardedActionCopy('看广告双倍领取'), '看广告双倍领取');
});

test('WeChat reward buttons replace the video icon with explicit share copy', () => {
    const h = createHarness({ wx: createWechatRuntime().wx });
    const label = new h.classes.Label();
    label.string = '领取';
    const iconSprite = new h.classes.Sprite();
    iconSprite.enabled = true;
    const labelNode = createNode('Label', h.classes, label);
    const icon = createNode('看广告', h.classes, iconSprite);
    const button = createNode('看广告双倍领取', h.classes, null, [labelNode, icon]);

    const boostSprite = new h.classes.Sprite();
    boostSprite.enabled = true;
    const boostIcon = createNode('广告', h.classes, boostSprite);
    const boostButton = createNode('广告加成10%', h.classes, null, [boostIcon]);
    const root = createNode('Root', h.classes, null, [button, boostButton]);

    h.service.applyWechatShareCopy(root);

    assert.equal(label.string, '领取');
    assert.equal(iconSprite.enabled, false);
    assert.equal(icon.getComponent(h.classes.Label).string, '分享');
    assert.equal(icon.active, true);
    assert.equal(boostSprite.enabled, false);
    assert.equal(boostIcon.getComponent(h.classes.Label).string, '分享');
    assert.equal(boostIcon.active, true);
});

test('event reward button keeps its frame when both button and icon are named 看广告', () => {
    const h = createHarness({ wx: createWechatRuntime().wx });
    const buttonFrame = new h.classes.Sprite();
    buttonFrame.enabled = true;
    const iconSprite = new h.classes.Sprite();
    iconSprite.enabled = true;
    const label = new h.classes.Label();
    label.string = '生活大于篮球';
    const labelNode = createNode('Label', h.classes, label);
    const icon = createNode('看广告', h.classes, iconSprite);
    const button = createNode('看广告', h.classes, buttonFrame, [labelNode, icon]);
    button.addComponent(h.classes.Button);
    const root = createNode('事件页面', h.classes, null, [button]);

    h.service.applyWechatShareCopy(root);

    assert.equal(buttonFrame.enabled, true);
    assert.equal(button.getComponent(h.classes.Label), null);
    assert.equal(iconSprite.enabled, false);
    assert.equal(icon.getComponent(h.classes.Label).string, '分享');
});

test('all dynamic rewarded UI copy passes through the platform formatter', () => {
    const files = [
        'RecruitmentController.ts',
        'RecruitmentProbabilityController.ts',
        'ManagementController.ts',
        'MatchController.ts',
    ];
    for (const file of files) {
        const text = fs.readFileSync(path.join(project, 'assets/scripts/home', file), 'utf8');
        assert.match(text, /toRewardedActionCopy/, `${file} must format dynamic reward copy`);
    }

    const home = fs.readFileSync(path.join(project, 'assets/scripts/home/HomeUiController.ts'), 'utf8');
    const match = fs.readFileSync(path.join(project, 'assets/scripts/home/MatchController.ts'), 'utf8');
    const playerEvent = fs.readFileSync(path.join(project, 'assets/scripts/home/PlayerEventController.ts'), 'utf8');
    assert.match(home, /applyWechatShareCopy\(this\.node\.scene/);
    assert.match(home, /initializeWechatShareCapabilities\(\)/);
    assert.match(match, /applyWechatShareCopy/);
    assert.match(match, /initializeWechatShareCapabilities\(\)/);
    assert.match(playerEvent, /applyWechatShareCopy\(this\.page/);
});

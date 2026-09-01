const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const project = path.resolve(__dirname, '..');
const ts = require(require.resolve('typescript', { paths: [project, path.join(project, 'extensions/cocos-code-mode')] }));

function load(file, mocks) {
    const exports = {};
    const compiled = ts.transpileModule(fs.readFileSync(path.join(project, 'assets/scripts', file), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true },
    }).outputText;
    vm.runInNewContext(compiled, { exports, console, require: id => mocks[id] ?? {} });
    return exports;
}

function preloaderHarness() {
    const calls = { scenes: [], assets: [], portraits: [], frames: [], json: [] };
    const state = { failScene: false, failAsset: false, roster: [] };
    const mocks = {
        cc: {
            Font: class {}, Prefab: class {}, JsonAsset: class {},
            director: { preloadScene(name, progress, callback) {
                calls.scenes.push(name);
                callback(state.failScene ? new Error('scene unavailable') : null);
            } },
            resources: { load(name, type, callback) {
                calls.assets.push(name);
                callback(state.failAsset ? new Error('resource unavailable') : null, { name });
            } },
        },
        './GameState': {
            loadJson(name) { calls.json.push(name); return Promise.resolve({ name }); },
            loadRoster: () => state.roster,
            getManagementEffects: () => Promise.resolve({}),
        },
        './PlayerAssets': {
            loadPlayerPortrait(card) { calls.portraits.push(card.instanceId); return Promise.resolve({}); },
            loadRoundQualityFrame(quality) { calls.frames.push(quality); return Promise.resolve({}); },
            loadQualityFrame: () => Promise.resolve({}),
            loadRecruitmentBackground: () => Promise.resolve({}),
        },
    };
    return { calls, state, mocks, ...load('home/MatchPreloader.ts', mocks) };
}

test('preparation and match entry share one runtime load and one scene download', async () => {
    const h = preloaderHarness();
    await Promise.all([h.preloadMatchAssets(), h.preloadMatchAssets(), h.loadMatchRuntimeAssets()]);
    assert.deepEqual(h.calls.scenes, ['Match']);
    assert.equal(h.calls.assets.length, 5);
    assert.equal(h.calls.json.length, 1);
    const first = await h.loadMatchRuntimeAssets();
    assert.equal(await h.loadMatchRuntimeAssets(), first);
    assert.equal(h.calls.assets.length, 5);
});

test('failed runtime warming retries on entry rather than caching a rejection', async () => {
    const h = preloaderHarness();
    h.state.failAsset = true;
    await assert.rejects(h.loadMatchRuntimeAssets(), /resource unavailable/);
    h.state.failAsset = false;
    assert.equal((await h.loadMatchRuntimeAssets()).length, 6);
    assert.equal(h.calls.assets.length, 10);
});

test('failed scene download is retried without reloading successful runtime assets', async () => {
    const h = preloaderHarness();
    h.state.failScene = true;
    await assert.rejects(h.preloadMatchAssets(), /scene unavailable/);
    h.state.failScene = false;
    await h.preloadMatchAssets();
    assert.deepEqual(h.calls.scenes, ['Match', 'Match']);
    assert.equal(h.calls.assets.length, 5);
});

test('only each teams top five are warmed, without mutating lineup order', async () => {
    const h = preloaderHarness();
    const roster = Array.from({ length: 12 }, (_, index) => ({ instanceId: `p${index}`, overall: index, qualityId: 3 }));
    const session = { playerRoster: [null, ...roster], opponentRoster: [{ instanceId: 'enemy', overall: 99, qualityId: 4 }] };
    await h.preloadMatchAssets(session);
    assert.deepEqual(h.calls.portraits, ['p11', 'p10', 'p9', 'p8', 'p7', 'enemy']);
    assert.deepEqual(h.calls.frames, [3, 4]);
    assert.equal(session.playerRoster[1].instanceId, 'p0');
    session.playerRoster.push({ instanceId: 'new', overall: 100, qualityId: 15 });
    await h.preloadMatchAssets(session);
    assert.equal(h.calls.portraits[6], 'new');
    assert(h.calls.frames.includes(15));
    assert.equal(h.calls.assets.length, 5);
});

test('Homepage warming sees players recruited after an empty initial load', async () => {
    const h = preloaderHarness();
    const home = load('home/HomepagePreloader.ts', h.mocks);
    await home.preloadHomepageRuntimeAssets();
    const jsonCount = h.calls.json.length;
    assert.equal(h.calls.portraits.length, 0);
    h.state.roster = [null, { instanceId: 'new recruit', qualityId: 15 }];
    await home.preloadHomepageRuntimeAssets();
    assert.deepEqual(h.calls.portraits, ['new recruit']);
    assert.deepEqual(h.calls.frames, [15]);
    assert.equal(h.calls.json.length, jsonCount);
});

function fontHarness(count = 25) {
    const changed = [];
    const labels = Array.from({ length: count }, (_, id) => ({
        id, isValid: true, node: { activeInHierarchy: false }, currentFont: null,
        get font() { return this.currentFont; },
        set font(value) { this.currentFont = value; changed.push(id); },
    }));
    const scheduled = new Set();
    const owner = { isValid: true, schedule: cb => scheduled.add(cb), unschedule: cb => scheduled.delete(cb) };
    const root = { isValid: true, getComponentsInChildren: () => labels };
    const api = load('loading/GameFont.ts', { cc: { Label: class {} } });
    const font = {};
    api.applyGameFontInBatches(root, font, owner);
    return { labels, scheduled, owner, root, changed, font,
        tick() { for (const callback of [...scheduled]) callback(); } };
}

test('font changes are capped at eight per frame and visible labels go first', () => {
    const h = fontHarness();
    assert.equal(h.changed.length, 0);
    h.labels[24].node.activeInHierarchy = true;
    h.tick();
    assert.equal(h.changed.length, 8);
    assert.equal(h.changed[0], 24);
    h.tick(); h.tick(); h.tick();
    assert.equal(h.changed.length, 25);
    assert.equal(new Set(h.changed).size, 25);
    assert.equal(h.scheduled.size, 0);
    assert(h.labels.every(label => label.font === h.font));
});

test('a newly opened page is prioritized over remaining hidden labels', () => {
    const h = fontHarness();
    h.tick();
    h.labels[24].node.activeInHierarchy = true;
    h.tick();
    assert.equal(h.changed[8], 24);
});

test('font batching never touches destroyed labels or rebuilds an already updated font', () => {
    const h = fontHarness(3);
    h.labels[0].isValid = false;
    h.labels[1].currentFont = h.font;
    h.tick();
    assert.deepEqual(h.changed, [2]);
    assert.equal(h.scheduled.size, 0);
});

test('destroying the scene cancels pending font work', () => {
    const h = fontHarness();
    h.tick();
    h.root.isValid = false;
    h.tick();
    assert.equal(h.changed.length, 8);
    assert.equal(h.scheduled.size, 0);
});

test('return navigation starts immediately without waiting for a background preload', () => {
    const calls = [];
    const { MatchController } = load('home/MatchController.ts', {
        cc: { Component: class {}, Color: class {}, _decorator: { ccclass: () => type => type },
            director: { loadScene: name => calls.push(name) } },
        './MatchCommentarySelector': { MatchCommentarySelector: class {} },
        './MatchSession': {
            clearCurrentMatchSession: () => calls.push('clear'),
            setHomepageReturnTarget: target => calls.push(target),
        },
        './HomepagePreloader': { preloadHomepageRuntimeAssets() { assert.fail('must not wait for assets on click'); } },
    });
    new MatchController().returnToHomepage(true);
    assert.deepEqual(calls, ['clear', 'pre-match', 'Homepage']);
});

test('hidden event popup is never activated while attaching it to Homepage', async () => {
    const page = { active: true };
    let fontApplied = false;
    let attached = false;
    const { PlayerEventController } = load('home/PlayerEventController.ts', {
        cc: { Component: class {}, Color: class {}, _decorator: { ccclass: () => type => type }, instantiate: () => page },
        '../loading/GameFont': { applyGameFont(root) {
            assert.equal(root.active, false);
            fontApplied = true;
        } },
    });
    const controller = new PlayerEventController();
    Object.assign(controller, {
        node: { isValid: true },
        canvas: { addChild(root) { assert.equal(root.active, false); attached = true; } },
        loadJson: async () => ({ events: [] }), loadPrefab: async () => ({}), loadGameFont: async () => ({}),
        isConfigValid: () => true, resolvePageButtons() {}, resolveRosterSlots() {},
        bindSlotEventButtons() {}, reconcileLastSettledMatch() {}, syncEventIndicators: async () => {},
    });
    await controller.initialize();
    assert.equal(controller.initialized, true);
    assert.equal(fontApplied, true);
    assert.equal(attached, true);
});

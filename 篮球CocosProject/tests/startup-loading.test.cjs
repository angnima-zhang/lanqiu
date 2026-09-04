const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const project = path.resolve(__dirname, '..');
const ts = require(require.resolve('typescript', { paths: [project, path.join(project, 'extensions/cocos-code-mode')] }));
const drain = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function deferred() {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}
function load(file, mocks) {
    const exports = {};
    const compiled = ts.transpileModule(fs.readFileSync(path.join(project, 'assets/scripts', file), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true },
    }).outputText;
    vm.runInNewContext(compiled, { exports, console: { error() {} }, require: id => mocks[id] ?? {} });
    return exports;
}
function harness() {
    const cloud = deferred(), data = deferred(), roster = deferred();
    const calls = { cloud: 0, data: 0, roster: 0, scenes: [], entered: 0, marks: [], retries: [] };
    const state = { data: data.promise, roster: roster.promise };
    const { LoadingController } = load('loading/LoadingController.ts', {
        cc: {
            Component: class {
                enabled = true; isValid = true;
                scheduleOnce(callback) { calls.retries.push(callback); }
                unscheduleAllCallbacks() { calls.retries = []; }
            },
            _decorator: { ccclass: () => type => type, property: () => () => {} },
            director: {
                preloadScene(name, progress, complete) { calls.scenes.push({ progress, complete }); },
                loadScene(name, callback) { calls.entered++; callback(null, {}); },
            },
        },
        '../home/TapCloudSaveService': { initializeTapCloudSave() { calls.cloud++; return cloud.promise; } },
        '../home/HomepagePreloader': {
            preloadHomepageStaticAssets() { calls.data++; return state.data; },
            preloadHomepageRuntimeAssets() { calls.roster++; return state.roster; },
        },
        './StartupTiming': { markStartupStage: stage => calls.marks.push(stage) },
    });
    const controller = new LoadingController();
    controller.start();
    return { controller, cloud, data, roster, calls, state };
}

test('scene and static data overlap cloud restore, but entering Homepage waits for all three lanes', async () => {
    const h = harness();
    assert.equal(h.calls.cloud, 1);
    assert.equal(h.calls.data, 1);
    assert.equal(h.calls.scenes.length, 1);
    assert.equal(h.calls.roster, 0);
    h.data.resolve(); h.calls.scenes[0].progress(1, 1); h.calls.scenes[0].complete(null);
    await drain(); h.controller.update(1);
    assert.equal(h.calls.entered, 0);
    assert(h.controller.targetProgress < 1);
    h.cloud.resolve(); await drain();
    assert.equal(h.calls.roster, 1);
    h.controller.update(1); assert.equal(h.calls.entered, 0);
    h.roster.resolve(); await drain(); h.controller.update(1);
    assert.equal(h.calls.entered, 1);
    assert.equal(h.controller.targetProgress, 1);
    assert(h.calls.marks.includes('homepage-dependencies-ready'));
});

test('cloud finishing first still cannot bypass pending static data or scene files', async () => {
    const h = harness();
    h.cloud.resolve(); h.roster.resolve(); await drain(); h.controller.update(1);
    assert.equal(h.calls.entered, 0);
    h.data.resolve(); await drain(); h.controller.update(1);
    assert.equal(h.calls.entered, 0);
    h.calls.scenes[0].complete(null); await drain(); h.controller.update(1);
    assert.equal(h.calls.entered, 1);
});

test('scene retry shares the original cloud restore and pending roster warmup', async () => {
    const h = harness();
    h.data.resolve(); h.calls.scenes[0].complete(new Error('offline')); await drain();
    assert.equal(h.calls.retries.length, 1);
    h.calls.retries.shift()();
    assert.equal(h.calls.scenes.length, 2);
    h.cloud.resolve(); h.roster.resolve(); h.calls.scenes[1].complete(null);
    await drain(); h.controller.update(1);
    assert.equal(h.calls.cloud, 1); assert.equal(h.calls.roster, 1); assert.equal(h.calls.entered, 1);
});

test('a shared static/runtime failure consumes only one retry, not one per promise', async () => {
    const h = harness();
    h.state.roster = h.data.promise;
    h.cloud.resolve(); h.calls.scenes[0].complete(null); await drain();
    h.data.reject(new Error('shared asset failed')); await drain();
    assert.equal(h.calls.retries.length, 1); assert.equal(h.controller.stopped, false);
    h.state.data = Promise.resolve(); h.state.roster = Promise.resolve();
    h.calls.retries.shift()(); await drain(); h.controller.update(1);
    assert.equal(h.calls.entered, 1); assert.equal(h.calls.scenes.length, 1);
});

test('destroying the loader blocks saved-state reads and scene entry from late callbacks', async () => {
    const h = harness();
    h.controller.onDestroy();
    h.cloud.resolve(); h.data.resolve(); h.roster.resolve(); h.calls.scenes[0].complete(null);
    await drain(); h.controller.update(1);
    assert.equal(h.calls.roster, 0); assert.equal(h.calls.entered, 0);
});

test('repeated resource failure stops loading and cannot be cleared by late success callbacks', async () => {
    const h = harness();
    h.calls.scenes[0].complete(new Error('first failure')); await drain();
    h.calls.retries.shift()();
    h.calls.scenes[1].complete(new Error('second failure')); await drain();
    assert.equal(h.controller.stopped, true);
    h.cloud.resolve(); h.data.resolve(); h.roster.resolve(); await drain(); h.controller.update(1);
    assert.equal(h.calls.entered, 0); assert.equal(h.calls.roster, 0);
    assert.equal(h.calls.retries.length, 0);
});

test('static preload failures can retry instead of caching a rejected promise forever', async () => {
    let failed = true;
    const home = load('home/HomepagePreloader.ts', {
        './GameState': { loadJson: () => failed ? Promise.reject(new Error('offline')) : Promise.resolve({}) },
    });
    await assert.rejects(home.preloadHomepageStaticAssets(), /offline/);
    failed = false;
    await home.preloadHomepageStaticAssets();
});

test('static preloading never reads player state and runtime warming uses the restored roster', async () => {
    const calls = { json: [], portraits: [], reads: 0 };
    let restored = false;
    const home = load('home/HomepagePreloader.ts', {
        './GameState': {
            loadJson: name => { calls.json.push(name); return Promise.resolve({}); },
            loadRoster: () => { assert(restored); calls.reads++; return [{ instanceId: 'cloud-player', qualityId: 3 }]; },
            getManagementEffects: () => { assert(restored); return Promise.resolve({}); },
        },
        './PlayerAssets': {
            loadPlayerPortrait: card => { calls.portraits.push(card.instanceId); return Promise.resolve(); },
            loadQualityFrame: () => Promise.resolve(), loadRoundQualityFrame: () => Promise.resolve(),
            loadRecruitmentBackground: () => Promise.resolve(),
        },
    });
    await home.preloadHomepageStaticAssets();
    assert.equal(calls.reads, 0);
    assert(calls.json.includes('data/balance/management_effects'));
    const jsonCount = calls.json.length;
    restored = true; await home.preloadHomepageRuntimeAssets();
    assert.deepEqual(calls.portraits, ['cloud-player']); assert.equal(calls.json.length, jsonCount);
});

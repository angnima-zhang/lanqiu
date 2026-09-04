const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const ts = require(require.resolve('typescript', { paths: [
    project, path.join(project, 'extensions/cocos-code-mode'),
    path.join(project, 'extensions/taptap-minigame-tools'),
] }));
const source = fs.readFileSync(path.join(project, 'assets/scripts/home/TapCloudSaveService.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;
const BUDGET = 'basketball.economy.budget.v2';
const KNOWN = 'basketball.cloud.known-archive.v1';
const LAST_UPLOAD = 'basketball.cloud.last-upload-at.v1';
const ARCHIVE_NAME = 'basketball_auto_save_v1';
const snapshot = (data) => ({ game: 'basketball', version: 1, savedAt: 500_000, data });
const remoteArchive = () => ({ uuid: 'archive-1', fileId: 'file-1', name: ARCHIVE_NAME });
const drain = () => new Promise((resolve) => setImmediate(resolve));

function harness(options = {}) {
    const storage = new Map(Object.entries(options.local || {}));
    const files = new Map();
    const intervals = [];
    const timers = new Map();
    const events = new Map();
    const calls = { list: 0, download: 0, create: 0, update: 0, modal: 0, toast: [] };
    const state = {
        now: 1_000_000,
        archive: options.remote ? remoteArchive() : null,
        raw: options.raw ?? (options.remote ? JSON.stringify(options.remote) : null),
        uploadError: options.uploadError,
        holdUpload: options.holdUpload,
        uploadCallback: null,
        listCallback: null,
    };
    let timerId = 0;
    let fileVersion = 1;
    const localStorage = {
        get length() { return storage.size; },
        key(index) { return [...storage.keys()][index] ?? null; },
        getItem(key) { return storage.get(key) ?? ''; }, // Mini-game adapter's missing-key behavior.
        setItem(key, value) {
            if (options.failRestore && key === BUDGET && value === '99') throw new Error('storage write failed');
            storage.set(key, value);
        },
        removeItem(key) { storage.delete(key); },
    };
    const fileManager = {
        writeFile(params) {
            if (options.failBackup && params.filePath.includes('before_cloud_restore')) {
                params.fail(new Error('backup failed'));
                return;
            }
            files.set(params.filePath, params.data);
            params.success({});
        },
        readFile(params) { params.success({ data: files.get(params.filePath) }); },
    };
    function upload(params, kind) {
        calls[kind] += 1;
        assert.equal(params.archiveMetaData.name, ARCHIVE_NAME);
        assert.equal(params.archiveFilePath, 'tapfile://usr/basketball_auto_save.json');
        assert.ok(files.has(params.archiveFilePath), 'file must be written before upload');
        if (state.uploadError) { params.fail(new Error('upload failed')); return; }
        const finish = () => {
            state.archive = { uuid: 'archive-1', fileId: `file-${++fileVersion}`, name: ARCHIVE_NAME };
            state.raw = files.get(params.archiveFilePath);
            params.success({ uuid: state.archive.uuid, fileId: state.archive.fileId });
        };
        if (state.holdUpload) state.uploadCallback = finish;
        else finish();
    }
    const cloud = {
        getArchiveList(params) {
            calls.list += 1;
            if (options.holdList) { state.listCallback = params; return; }
            if (options.listError) { params.fail(new Error('offline')); return; }
            params.success({ saves: options.duplicates ? [state.archive, state.archive] : state.archive ? [state.archive] : [] });
        },
        getArchiveData(params) {
            calls.download += 1;
            assert.equal(params.archiveUUID, state.archive.uuid);
            assert.equal(params.archiveFileId, state.archive.fileId);
            files.set(params.targetFilePath, state.raw);
            params.success({ filePath: params.targetFilePath });
        },
        createArchive(params) { upload(params, 'create'); },
        updateArchive(params) {
            assert.equal(params.archiveUUID, state.archive.uuid);
            upload(params, 'update');
        },
    };
    const platform = {
        getCloudSaveManager: () => cloud,
        getFileSystemManager: () => fileManager,
        env: { USER_DATA_PATH: 'tapfile://usr' },
        showModal(params) {
            calls.modal += 1;
            params.success({ confirm: options.choice === 'cloud', cancel: options.choice !== 'cloud' });
        },
        showToast(params) {
            if (options.toastThrows) throw new Error('toast unavailable');
            calls.toast.push(params.title);
        },
    };
    class Clock extends Date { static now() { return state.now; } }
    const context = vm.createContext({
        exports: {}, Date: Clock,
        tap: options.wechatOnly ? undefined : platform,
        wx: platform,
        console: { info() {}, warn() {}, error() {} },
        setInterval(callback, delay) { assert.equal(delay, 65_000); intervals.push(callback); return 1; },
        setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; },
        clearTimeout(id) { timers.delete(id); },
        require(id) {
            if (id === 'cc/env') return { PREVIEW: options.preview ?? false };
            assert.equal(id, 'cc');
            return {
                sys: { localStorage }, Game: { EVENT_HIDE: 'hide', EVENT_SHOW: 'show' },
                game: { on(name, callback) { events.set(name, callback); } },
            };
        },
    });
    vm.runInContext(compiled, context);
    return {
        storage, files, intervals, calls, state,
        initialize: () => context.exports.initializeTapCloudSave(),
        async tick(ms = 65_000) { state.now += ms; intervals.forEach((callback) => callback()); await drain(); },
        async lifecycle(name, after = () => {}) { events.get(name)?.(); after(); await drain(); },
        async expire() { [...timers.values()].forEach((callback) => callback()); await drain(); },
    };
}

test('WeChat and Creator preview remain local-only', async () => {
    for (const flags of [{ wechatOnly: true }, { preview: true }]) {
        const h = harness({ ...flags, local: { [BUDGET]: '20' } });
        await h.initialize();
        assert.equal(h.calls.list, 0);
        assert.equal(h.intervals.length, 0);
        assert.deepEqual([...h.storage], [[BUDGET, '20']]);
    }
});

test('new save creates one archive, filters metadata, and updates only after 65 seconds', async () => {
    const h = harness({ local: {
        [BUDGET]: '20', 'basketball.team.name.v2': '测试队',
        'basketball.local-preview-reset-revision': 'local', 'other.setting': 'keep',
    } });
    await h.initialize();
    await h.initialize();
    assert.equal(h.intervals.length, 1, 'scene switches must not register another timer');
    await h.tick();
    assert.equal(h.calls.create, 1);
    assert.deepEqual(JSON.parse(h.state.raw).data, { [BUDGET]: '20', 'basketball.team.name.v2': '测试队' });
    h.storage.set(BUDGET, '18');
    await h.lifecycle('hide');
    assert.equal(h.calls.update, 0, 'hide may not bypass upload rate limit');
    await h.tick();
    assert.equal(h.calls.update, 1);
    assert.equal(JSON.parse(h.state.raw).data[BUDGET], '18');
    await h.tick();
    assert.equal(h.calls.update, 1, 'unchanged data should not upload');
});

test('fresh device restores all progress before initialize resolves', async () => {
    const data = {
        [BUDGET]: '0', 'basketball.roster.v2': JSON.stringify({ version: 2, cards: [null] }),
        'basketball.recruitment.ad-highest-quality-pity.v1': '22',
        'basketball.team.progression.v2': JSON.stringify({ version: 2, teamLevel: 3 }),
        'basketball.player-knowledge.v1': '{}',
    };
    const h = harness({ remote: snapshot(data), local: { 'other.setting': 'keep' } });
    await h.initialize();
    for (const [key, value] of Object.entries(data)) assert.equal(h.storage.get(key), value);
    assert.equal(h.storage.get('other.setting'), 'keep');
    assert.equal(h.calls.modal, 0);
    assert.ok(h.files.has('tapfile://usr/basketball_before_cloud_restore.json'));
    await h.tick();
    assert.equal(h.calls.update, 0);
});

test('conflict choosing cloud backs up local data and replaces the whole snapshot', async () => {
    const h = harness({ local: { [BUDGET]: '20', 'basketball.team.name.v2': 'Local' }, remote: snapshot({ [BUDGET]: '99' }), choice: 'cloud' });
    await h.initialize();
    assert.equal(h.calls.modal, 1);
    assert.equal(h.storage.get(BUDGET), '99');
    assert.equal(h.storage.has('basketball.team.name.v2'), false);
    assert.equal(JSON.parse(h.files.get('tapfile://usr/basketball_before_cloud_restore.json')).data[BUDGET], '20');
});

test('conflict choosing local preserves downloaded cloud backup before updating', async () => {
    const h = harness({ local: { [BUDGET]: '20' }, remote: snapshot({ [BUDGET]: '99' }), choice: 'local' });
    await h.initialize();
    assert.equal(h.storage.get(BUDGET), '20');
    assert.equal(JSON.parse(h.files.get('tapfile://usr/basketball_cloud_previous.json')).data[BUDGET], '99');
    await h.tick();
    assert.equal(h.calls.update, 1);
});

test('unchanged remote revision keeps newer local progress without another conflict dialog', async () => {
    const h = harness({ local: { [BUDGET]: '42', [KNOWN]: JSON.stringify(remoteArchive()) }, remote: snapshot({ [BUDGET]: '20' }) });
    await h.initialize();
    assert.equal(h.calls.modal, 0);
    assert.equal(h.calls.download, 0);
    assert.equal(h.storage.get(BUDGET), '42');
});

test('offline/list timeout never permits a new upload or a late restore', async () => {
    for (const flags of [{ listError: true, toastThrows: true }, { holdList: true }]) {
        const h = harness({ ...flags, local: { [BUDGET]: '20' }, remote: snapshot({ [BUDGET]: '99' }) });
        const pending = h.initialize();
        await drain();
        if (flags.holdList) await h.expire();
        await pending;
        h.state.listCallback?.success({ saves: [remoteArchive()] });
        await h.tick();
        assert.equal(h.storage.get(BUDGET), '20');
        assert.equal(h.calls.create + h.calls.update, 0);
        assert.equal(h.calls.download, 0);
        assert.equal(h.intervals.length, 0);
    }
});

test('malformed, foreign, oversized, and duplicate saves leave local progress untouched', async () => {
    for (const extra of [
        { raw: '{bad json' },
        { raw: JSON.stringify({ ...snapshot({ [BUDGET]: '99' }), version: 2 }) },
        { raw: JSON.stringify(snapshot({ 'other.data': '99' })) },
        { raw: JSON.stringify(snapshot({ [BUDGET]: '-1' })) },
        { raw: JSON.stringify(snapshot({ [BUDGET]: '20', 'basketball.roster.v2': '{bad' })) },
        { raw: JSON.stringify(snapshot({ [BUDGET]: '20', 'basketball.team.name.v2': 'a'.repeat(10 * 1024 * 1024) })) },
        { duplicates: true },
    ]) {
        const h = harness({ local: { [BUDGET]: '20' }, remote: snapshot({ [BUDGET]: '99' }), ...extra });
        await h.initialize();
        await h.tick();
        assert.equal(h.storage.get(BUDGET), '20');
        assert.equal(h.calls.create + h.calls.update, 0);
        assert.equal(h.intervals.length, 0);
    }
});

test('backup/restore failures preserve local data and disable sync for this session', async () => {
    for (const flags of [{ failBackup: true }, { failRestore: true }]) {
        const h = harness({ ...flags, local: { [BUDGET]: '20' }, remote: snapshot({ [BUDGET]: '99' }), choice: 'cloud' });
        await h.initialize();
        assert.equal(h.storage.get(BUDGET), '20');
        assert.equal(h.intervals.length, 0);
    }
});

test('concurrent flushes and ambiguous uploads cannot create duplicate cloud archives', async () => {
    const h = harness({ local: { [BUDGET]: '20' }, holdUpload: true });
    await h.initialize();
    await h.tick();
    await h.lifecycle('hide');
    assert.equal(h.calls.create, 1);
    await h.expire();
    h.state.uploadCallback(); // Native operation succeeds after our timeout.
    await h.tick();
    assert.equal(h.calls.create, 1);
    assert.equal(h.calls.update, 0);
    assert.equal(h.storage.get(BUDGET), '20');
});

test('a completed upload failure retries later without losing local changes', async () => {
    const h = harness({ local: { [BUDGET]: '20' }, uploadError: true });
    await h.initialize();
    await h.tick();
    assert.equal(h.storage.get(BUDGET), '20');
    await h.lifecycle('show');
    assert.equal(h.calls.create, 1);
    h.state.uploadError = false;
    await h.tick();
    assert.equal(h.calls.create, 2);
    assert.equal(h.state.archive.name, ARCHIVE_NAME);
});

test('remote revision change pauses uploads instead of overwriting another device', async () => {
    const h = harness({ local: { [BUDGET]: '42', [KNOWN]: JSON.stringify(remoteArchive()) }, remote: snapshot({ [BUDGET]: '20' }) });
    await h.initialize();
    h.state.archive = { ...h.state.archive, fileId: 'another-device-file' };
    await h.tick();
    await h.tick();
    assert.equal(h.calls.update, 0);
    assert.equal(h.storage.get(BUDGET), '42');
});

test('hide captures idle state written by later gameplay listeners and persists the rate limit', async () => {
    const h = harness({ local: { [BUDGET]: '20' } });
    await h.initialize();
    await h.lifecycle('hide', () => h.storage.set('basketball.idle.v2', '{"offlineStartedAtMs":1000000}'));
    assert.equal(JSON.parse(h.state.raw).data['basketball.idle.v2'], '{"offlineStartedAtMs":1000000}');
    const restarted = harness({ local: Object.fromEntries(h.storage), remote: JSON.parse(h.state.raw) });
    restarted.state.archive = h.state.archive;
    await restarted.initialize();
    restarted.storage.set(BUDGET, '19');
    await restarted.lifecycle('hide');
    assert.equal(restarted.calls.update, 0);
    assert.equal(Number(restarted.storage.get(LAST_UPLOAD)), restarted.state.now);
});

test('LoadingController starts static preloads immediately but gates saved-state preloads on cloud restore', async () => {
    const loadingSource = fs.readFileSync(path.join(project, 'assets/scripts/loading/LoadingController.ts'), 'utf8');
    const js = ts.transpileModule(loadingSource, { compilerOptions: {
        target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true,
    } }).outputText;
    for (const destroyed of [false, true]) {
        let resolveCloud;
        const pendingCloud = new Promise((resolve) => { resolveCloud = resolve; });
        const context = vm.createContext({
            exports: {},
            console,
            require(id) {
                if (id.endsWith('TapCloudSaveService')) return { initializeTapCloudSave: () => pendingCloud };
                if (id.endsWith('HomepagePreloader')) return {
                    preloadHomepageRuntimeAssets: () => { runtimePreloads += 1; return Promise.resolve(); },
                };
                if (id.endsWith('StartupTiming')) return { markStartupStage() {} };
                assert.equal(id, 'cc');
                return {
                    Component: class { enabled = true; isValid = true; },
                    _decorator: { ccclass: () => (ctor) => ctor, property: () => () => {} },
                };
            },
        });
        vm.runInContext(js, context);
        const component = new context.exports.LoadingController();
        let preloads = 0;
        let runtimePreloads = 0;
        component.preloadHomepage = () => { preloads += 1; void component.preloadHomepageRuntime(); };
        component.start();
        assert.equal(preloads, 1);
        assert.equal(runtimePreloads, 0);
        if (destroyed) component.isValid = false;
        resolveCloud();
        await drain();
        assert.equal(runtimePreloads, destroyed ? 0 : 1);
    }
});

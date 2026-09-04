const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const project = path.resolve(__dirname, '..');
const extension = path.join(project, 'extensions/taptap-minigame-tools');
const injection = fs.readFileSync(path.join(extension, 'converter/wx_unity_converter/wx_unity.js'), 'utf8');
const converter = fs.readFileSync(path.join(extension, 'dist/converter-ts.js'), 'utf8');
const ts = require(require.resolve('typescript', { paths: [project, path.join(project, 'extensions/cocos-code-mode')] }));
const timingScript = ts.transpileModule(fs.readFileSync(path.join(project, 'assets/scripts/loading/StartupTiming.ts'), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;

test('TapTap entry and game milestones use one clock and suppress duplicate scene-return logs', () => {
    let now = 1000;
    const logs = [];
    const context = vm.createContext({ exports: {}, Date: { now: () => now }, console: { info: text => logs.push(text) } });
    vm.runInContext(injection, context);
    now = 1200; vm.runInContext(timingScript, context);
    context.exports.markStartupStage('loading-scene-onload');
    now = 1800; context.exports.markStartupStage('homepage-recruitment-ready');
    now = 2200; context.exports.markStartupStage('homepage-recruitment-ready');
    assert.equal(logs.length, 3);
    assert.match(logs[1], /\+200ms \(from game-entry\)/);
    assert.match(logs[2], /\+800ms/);
});

test('WeChat/preview fallback does not pretend to measure pre-engine startup', () => {
    const logs = [];
    const context = vm.createContext({ exports: {}, Date: { now: () => 1000 }, console: { info: text => logs.push(text) } });
    vm.runInContext(timingScript, context);
    context.exports.markStartupStage('loading-scene-onload');
    assert.match(logs[0], /from game-script/);
});

test('official converter injects public lifecycle observers without changing the init return value', () => {
    let output;
    const fixture = 'function boot(application, cc) { return application.init(cc); }';
    const context = vm.createContext({ exports: {}, console: { log() {}, warn() {} }, require(id) {
        if (id === 'fs-extra') return {
            existsSync: () => true,
            readFileSync: filename => filename.endsWith('wx_unity.js') ? injection : fixture,
            writeFileSync: (filename, content) => { output = content; },
        };
        if (id === 'archiver') return () => {};
        return require(id);
    } });
    vm.runInContext(converter + '\nexports.injectForTest = injectRuntimeCode;', context);
    context.exports.injectForTest('output', 'converter');
    assert(output.startsWith('/* Unity Converter Injection */'));
    assert.match(converter, /CONVERTER_VERSION = "2\.0\.8-ts"/);
    let now = 0;
    const logs = [], callbacks = {};
    const runtime = vm.createContext({ Date: { now: () => now }, console: { info: text => logs.push(text) } });
    vm.runInContext(output, runtime);
    const cc = {
        Game: { EVENT_ENGINE_INITED: 'engine' },
        game: {
            once(event, callback) { callbacks[event] = callback; },
            onPreProjectInitDelegate: { add(callback) { callbacks.pre = callback; } },
            onPostProjectInitDelegate: { add(callback) { callbacks.post = callback; } },
        },
    };
    const result = {};
    now = 10; assert.equal(runtime.boot({ init: value => { assert.equal(value, cc); return result; } }, cc), result);
    now = 20; callbacks.engine();
    now = 30; callbacks.pre();
    now = 100; callbacks.post();
    assert(logs.some(line => line.includes('engine-initialized +20ms')));
    assert(logs.some(line => line.includes('project-preload-ready +100ms')));
});

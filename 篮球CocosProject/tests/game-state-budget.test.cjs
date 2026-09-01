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
const compiled = ts.transpileModule(fs.readFileSync(
    path.join(project, 'assets/scripts/home/GameState.ts'), 'utf8',
), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;

function harness(missingValue, savedBudget) {
    const storage = new Map();
    const writes = [];
    const key = 'basketball.economy.budget.v2';
    if (savedBudget !== undefined) storage.set(key, savedBudget);
    const exports = {};
    vm.runInNewContext(compiled, {
        exports,
        require(name) {
            if (name === 'cc/env') return { PREVIEW: false };
            if (name === './SeasonRoute') return {};
            if (name === 'cc') return {
                EventTarget: class { emit() {} },
                sys: { localStorage: {
                    getItem(key) { return storage.has(key) ? storage.get(key) : missingValue; },
                    setItem(key, value) { storage.set(key, value); writes.push([key, value]); },
                } },
            };
            throw new Error(`Unexpected dependency: ${name}`);
        },
    });
    return { state: exports, storage, writes, key };
}

for (const missing of [null, undefined, '', ' ', '\t\n']) {
    test(`missing budget ${JSON.stringify(missing)} initializes exactly once to 20`, () => {
        const { state, storage, writes, key } = harness(missing);
        assert.equal(state.getBudget(), 20);
        assert.equal(state.getBalance(), 20);
        assert.equal(storage.get(key), '20');
        assert.deepEqual(writes, [[key, '20']]);
    });
}

for (const invalid of ['NaN', 'Infinity', '-1', 'invalid']) {
    test(`invalid saved budget ${invalid} falls back to 20`, () => {
        const { state } = harness('', invalid);
        assert.equal(state.getBudget(), 20);
    });
}

for (const saved of ['0', '8', '42.125']) {
    test(`existing budget ${saved} is preserved, including cloud-restored zero`, () => {
        const { state, writes } = harness('', saved);
        assert.equal(state.getBudget(), Number(saved));
        assert.deepEqual(writes, []);
    });
}

test('first spend uses the initial 20 and does not refill a spent balance', () => {
    const { state } = harness('');
    assert.equal(state.trySpendBudget(5), true);
    assert.equal(state.getBudget(), 15);
    assert.equal(state.trySpendBudget(15), true);
    assert.equal(state.getBudget(), 0);
    assert.equal(state.trySpendBudget(1), false);
});

test('income before the first budget read adds to the initial 20', () => {
    assert.equal(harness('').state.addBudget(3), 23);
});

test('root and runtime economy both configure initial budget 20', () => {
    for (const filename of [
        path.join(project, '../data/balance/economy.json'),
        path.join(project, 'assets/resources/data/balance/economy.json'),
    ]) {
        assert.equal(JSON.parse(fs.readFileSync(filename, 'utf8')).initialBudget, 20);
    }
});

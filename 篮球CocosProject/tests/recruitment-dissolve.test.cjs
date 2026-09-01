const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const project = path.resolve(__dirname, '..');
const ts = require(require.resolve('typescript', { paths: [
    project, path.join(project, 'extensions/cocos-code-mode'),
] }));
const stats = { materials: 0, vectors: 0, clones: 0 };
class Color {
    constructor(r = 0, g = 0, b = 0, a = 255) { Object.assign(this, { r, g, b, a }); }
    clone() { stats.clones++; return new Color(this.r, this.g, this.b, this.a); }
}
class Vec4 {
    constructor(x, y, z, w) { stats.vectors++; Object.assign(this, { x, y, z, w }); }
}
class Material {
    isValid = true;
    updates = [];
    constructor() { stats.materials++; }
    initialize(options) { this.options = options; }
    setProperty(name, value) { this.updates.push({ name, value, x: value.x }); }
    destroy() { this.isValid = false; }
}
class Sprite {}
class Label {}
class Node {
    static EventType = {};
    children = [];
    activeInHierarchy = true;
    getComponent(type) { return type === Sprite ? this.sprite : type === Label ? this.label : null; }
}
class Component {
    scheduled = new Set();
    isValid = true;
    schedule(callback) { this.scheduled.add(callback); }
    unschedule(callback) { this.scheduled.delete(callback); }
    advance(dt) { for (const callback of [...this.scheduled]) callback(dt); }
}
const compiled = ts.transpileModule(fs.readFileSync(
    path.join(project, 'assets/scripts/home/RecruitmentController.ts'), 'utf8',
), { compilerOptions: {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true,
} }).outputText;
const moduleExports = {};
vm.runInNewContext(compiled, { exports: moduleExports, console,
    setTimeout() { assert.fail('Dissolve must use the engine scheduler, not wall-clock timers'); },
    require(id) {
        if (id === 'cc') return { Component, Color, Vec4, Material, Sprite, Label, Node,
            Button: { EventType: {}, Transition: { NONE: 0 } },
            _decorator: { ccclass: () => type => type, property: () => () => {} } };
        if (id === './GameState') return { gameStateEvents: { off() {} } };
        if (id === './TeamLevelController') return { teamProgressionEvents: { off() {} } };
        return {};
    },
});

function harness() {
    const controller = new moduleExports.RecruitmentController();
    const root = new Node();
    function child(active = true, enabled = true) {
        const node = new Node();
        node.activeInHierarchy = active;
        const original = { isValid: true, name: 'persistent-effect' };
        node.sprite = { isValid: true, enabled, spriteFrame: {}, customMaterial: original };
        node.label = { isValid: true, enabled, string: '球员信息', color: new Color(30, 60, 90, 200) };
        root.children.push(node);
        return { node, sprite: node.sprite, label: node.label, original };
    }
    const visible = [child(), child()];
    const hidden = child(false);
    const disabled = child(true, false);
    Object.assign(controller, { resultPage: root, dissolveEffectAsset: {}, finishedCount: 0,
        finishCloseResultPage() { this.finishedCount++; },
        stopDismissHold() {}, setAutoDismissBatchLocked() {},
    });
    return { controller, visible, hidden, disabled };
}

test('all visible sprites share a prewarmed material; hidden and disabled renderers are untouched', () => {
    const h = harness();
    h.controller.prepareDissolveMaterial();
    const count = stats.materials;
    h.controller.dissolveResultPage();
    assert.equal(stats.materials, count);
    for (const item of h.visible) assert.equal(item.sprite.customMaterial, h.controller.dissolveMaterial);
    assert.equal(h.hidden.sprite.customMaterial, h.hidden.original);
    assert.equal(h.disabled.sprite.customMaterial, h.disabled.original);
    assert.equal(h.controller.scheduled.size, 1);
});

test('each frame uploads one parameter vector with no Vec4 or Color.clone allocations', () => {
    const h = harness();
    h.controller.dissolveResultPage();
    const material = h.controller.dissolveMaterial;
    const before = { ...stats, updates: material.updates.length };
    h.controller.advance(0.25);
    assert.equal(material.updates.length, before.updates + 1);
    assert.equal(material.updates.at(-1).value, h.controller.dissolveParams);
    assert.equal(material.updates.at(-1).x, 0.5);
    assert.equal(stats.clones, before.clones);
    assert.equal(stats.vectors, before.vectors);
    assert.equal(h.visible[0].label.color.a, 100);
    assert.equal(h.hidden.label.color.a, 200);
});

test('completion restores permanent shaders and label colors, retaining the material for repeated recruitment', () => {
    const h = harness();
    h.controller.prepareDissolveMaterial();
    const material = h.controller.dissolveMaterial;
    const count = stats.materials;
    for (let i = 0; i < 12; i++) {
        h.controller.dissolveResultPage();
        assert.equal(h.controller.dissolveParams.x, 0);
        h.controller.advance(0.5);
        assert.equal(h.controller.finishedCount, i + 1);
        assert.equal(h.controller.scheduled.size, 0);
        for (const item of h.visible) {
            assert.equal(item.sprite.customMaterial, item.original);
            assert.equal(item.label.color.a, 200);
        }
    }
    assert.equal(material.isValid, true);
    assert.equal(stats.materials, count);
});

for (const [continuous, count, duration] of [[false, 0, 0.5], [true, 10, 0.25], [true, 31, 0.125]]) {
    test(`animation retains its ${duration}s duration for recruitment count ${count}`, () => {
        const h = harness();
        h.controller.continuousRecruitmentActive = continuous;
        h.controller.continuousRecruitmentBatchCount = count;
        h.controller.dissolveResultPage();
        h.controller.advance(duration / 2);
        assert.equal(h.controller.finishedCount, 0);
        h.controller.advance(duration / 2);
        assert.equal(h.controller.finishedCount, 1);
    });
}

test('disabling during dissolve cancels updates and restores state without advancing the recruitment queue', () => {
    const h = harness();
    h.controller.dissolveResultPage();
    h.controller.advance(0.1);
    h.controller.onDisable();
    h.controller.advance(1);
    assert.equal(h.controller.finishedCount, 0);
    assert.equal(h.controller.scheduled.size, 0);
    assert.equal(h.controller.cancelDissolve, null);
    for (const item of h.visible) {
        assert.equal(item.sprite.customMaterial, item.original);
        assert.equal(item.label.color.a, 200);
    }
    const material = h.controller.dissolveMaterial;
    h.controller.onDestroy();
    assert.equal(material.isValid, false);
    assert.equal(h.controller.dissolveMaterial, null);
});

test('cleanup ignores destroyed renderers and does not overwrite a replacement shader', () => {
    const h = harness();
    h.controller.dissolveResultPage();
    const replacement = { isValid: true };
    h.visible[0].sprite.customMaterial = replacement;
    h.visible[1].sprite.isValid = false;
    h.visible[1].label.isValid = false;
    h.controller.advance(0.5);
    assert.equal(h.visible[0].sprite.customMaterial, replacement);
    assert.equal(h.controller.finishedCount, 1);
});

test('a button glow destroyed while its button is disabled is not restored as an invalid material', () => {
    const h = harness();
    h.controller.dissolveResultPage();
    h.visible[0].original.isValid = false;
    h.controller.advance(0.5);
    assert.equal(h.visible[0].sprite.customMaterial, null);
    assert.equal(h.visible[1].sprite.customMaterial, h.visible[1].original);
});

test('transparent pixels are discarded before noise computation, independent of USE_ALPHA_TEST', () => {
    const source = fs.readFileSync(path.join(project, 'assets/resources/effects/dissolve.effect'), 'utf8');
    const discard = source.indexOf('if (o.a <= 0.0) discard;');
    assert(discard >= 0);
    assert(discard < source.indexOf('float n = fbm('));
});

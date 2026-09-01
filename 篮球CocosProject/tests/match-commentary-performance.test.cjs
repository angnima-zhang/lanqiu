const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const project = path.resolve(__dirname, '..');
const ts = require(require.resolve('typescript', { paths: [project, path.join(project, 'extensions/cocos-code-mode')] }));
const exportsMock = {};
class Label { static CacheMode = { CHAR: 2 }; }
class RichText {}
class TTFFont {}
class UITransform {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync(
    path.join(project, 'assets/scripts/home/MatchController.ts'), 'utf8',
), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true } }).outputText, {
    exports: exportsMock, console,
    require(id) {
        if (id === 'cc') return { Component: class {}, Color: class {}, Label, RichText, TTFFont, UITransform,
            _decorator: { ccclass: () => type => type } };
        if (id === './MatchCommentarySelector') return { MatchCommentarySelector: class {} };
        return {};
    },
});

function harness() {
    const controller = new exportsMock.MatchController();
    const writes = [];
    function textView(id, field) {
        let value = field === 'time' ? '--:--' : '';
        return { id, node: { setParent(parent) { this.parent = parent; } },
            get string() { return value; },
            set string(next) { value = next; writes.push({ id, field, value }); } };
    }
    const slots = Array.from({ length: 5 }, (_, index) => ({ index }));
    const views = slots.map((slot, index) => ({ time: textView(index, 'time'), content: textView(index, 'content') }));
    Object.assign(controller, {
        session: {}, commentarySlots: slots, commentaryViews: views,
        createRichCommentary: (text) => `<color=#123456>${text}</color>`,
        setLabel: (...args) => writes.push({ field: 'time', args }),
        setCommentaryRichText: (...args) => writes.push({ field: 'content', args }),
    });
    return { controller, writes, slots,
        drain() { for (let index = 0; index < 5; index++) controller.lateUpdate(); },
        visible() { return controller.commentaryViews.map(view => view.content.string); } };
}

for (const [name, lines] of [
    ['made basket', ['投篮命中']],
    ['defensive rebound', ['投篮打铁', '防守方收下篮板']],
    ['commentary series', ['投篮打铁', '多人争抢', '防守方收下篮板']],
]) {
    test(`${name} callback never rebuilds text, and each frame renders at most one new row`, () => {
        const h = harness();
        h.controller.onCourtCommentary(lines, { startSecond: 12 }, []);
        assert.equal(h.writes.length, 0, 'physics callback must only enqueue commentary');
        for (let index = 0; index < lines.length; index++) {
            const before = h.writes.filter(write => write.field === 'content').length;
            h.controller.lateUpdate();
            assert.equal(h.writes.filter(write => write.field === 'content').length - before, 1);
        }
        assert.deepEqual(Array.from(h.visible().slice(-lines.length)), lines.map(line => `<color=#123456>${line}</color>`));
        assert.equal(h.controller.commentaryViews.at(-1).time.string, '00:12');
    });
}

test('history scrolls by reusing text nodes rather than rewriting the four previous rows', () => {
    const h = harness();
    h.controller.onCourtCommentary(['a', 'b', 'c', 'd', 'e'], { startSecond: 0 }, []);
    h.drain();
    const previous = h.controller.commentaryViews.slice();
    h.writes.length = 0;
    h.controller.pushCommentary(7, 'f');
    h.controller.lateUpdate();
    assert.equal(h.writes.filter(write => write.field === 'content').length, 1);
    for (let index = 0; index < 4; index++) assert.equal(h.controller.commentaryViews[index], previous[index + 1]);
    assert.equal(h.controller.commentaryViews[4], previous[0]);
    h.controller.commentaryViews.forEach((view, index) => {
        assert.equal(view.time.node.parent, h.slots[index]);
        assert.equal(view.content.node.parent, h.slots[index]);
    });
    assert.deepEqual(Array.from(h.visible()), ['b', 'c', 'd', 'e', 'f'].map(line => `<color=#123456>${line}</color>`));
});

test('a burst keeps only the five visible lines and cannot create an unbounded render backlog', () => {
    const h = harness();
    for (let index = 0; index < 100; index++) h.controller.pushCommentary(index, `line${index}`);
    assert.equal(h.controller.pendingCommentaryLines.length, 5);
    assert.equal(h.controller.commentaryLines.length, 5);
    h.drain();
    assert.deepEqual(Array.from(h.visible()), [95, 96, 97, 98, 99].map(index => `<color=#123456>line${index}</color>`));
    assert.equal(h.controller.pendingCommentaryLines.length, 0);
});

test('reset clears old match text and pending work without discarding reusable views', () => {
    const h = harness();
    h.controller.pushCommentary(1, 'previous match');
    const views = h.controller.commentaryViews.slice();
    h.controller.resetCommentary();
    assert.equal(h.controller.pendingCommentaryLines.length, 0);
    assert.equal(h.controller.commentaryLines.length, 0);
    assert(h.visible().every(value => value === ''));
    assert(h.controller.commentaryViews.every((view, index) => view === views[index]));
    h.controller.pushCommentary(0, 'new match');
    h.drain();
    assert.equal(h.visible().at(-1), '<color=#123456>new match</color>');
});

test('empty input and idle frames never rebuild commentary', () => {
    const h = harness();
    h.controller.pushCommentary(0, '');
    h.drain();
    assert.equal(h.writes.length, 0);
});

test('reusable rich text retains font, color, wrapping and uses character caching', () => {
    const h = harness();
    const color = { clone: () => color };
    const font = new TTFFont();
    const label = { fontSize: 30, lineHeight: 34, horizontalAlign: 0, verticalAlign: 1,
        color, font, useSystemFont: false, fontFamily: 'zpix', enabled: true };
    const rich = new RichText();
    const node = {
        getComponent: type => type === Label ? label : type === UITransform ? { width: 800 } : null,
        addComponent: type => { assert.equal(type, RichText); return rich; },
    };
    assert.equal(h.controller.createCommentaryRichText(node), rich);
    assert.equal(rich.cacheMode, Label.CacheMode.CHAR);
    assert.equal(rich.font, font);
    assert.equal(rich.fontSize, 30);
    assert.equal(rich.lineHeight, 34);
    assert.equal(rich.maxWidth, 800);
    assert.equal(rich.fontColor, color);
    assert.equal(rich.string, '');
    assert.equal(rich.enabled, true);
    assert.equal(label.enabled, false);
});

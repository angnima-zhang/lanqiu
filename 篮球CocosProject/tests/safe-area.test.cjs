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
    path.join(project, 'assets/scripts/home/MobileSafeArea.ts'),
    'utf8',
);
const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;

class SafeArea {
    constructor() {
        this.symmetric = true;
        this.updates = 0;
    }
    updateArea() { this.updates += 1; }
}
class Widget {}
const ResolutionPolicy = { FIXED_HEIGHT: 3, FIXED_WIDTH: 4 };

function loadService(frameSize = { width: 1080, height: 2160 }) {
    const resolutionCalls = [];
    const view = {
        getFrameSize: () => frameSize,
        setDesignResolutionSize: (...args) => resolutionCalls.push(args),
    };
    const exports = {};
    const context = vm.createContext({
        exports,
        require(id) {
            if (id === 'cc') return { ResolutionPolicy, SafeArea, Widget, view };
            throw new Error(`Unexpected dependency: ${id}`);
        },
    });
    vm.runInContext(compiled, context);
    return { service: exports, resolutionCalls };
}

function createNode(name, children = [], withWidget = false) {
    const components = new Map();
    if (withWidget) components.set(Widget, new Widget());
    let safeAreaAdds = 0;
    return {
        name,
        children,
        get safeAreaAdds() { return safeAreaAdds; },
        getComponent(Type) { return components.get(Type) ?? null; },
        addComponent(Type) {
            const component = new Type();
            components.set(Type, component);
            if (Type === SafeArea) safeAreaAdds += 1;
            return component;
        },
    };
}

test('safe area is added once to full-screen widget pages but not manager or camera nodes', () => {
    const { service } = loadService();
    const homepage = createNode('主页', [], true);
    const result = createNode('招募结果页面', [], true);
    const manager = createNode('manager');
    const camera = createNode('Camera');
    const canvas = createNode('Canvas', [homepage, result, manager, camera]);

    service.applySafeAreaToCanvasPages(canvas);
    service.applySafeAreaToCanvasPages(canvas);

    assert.equal(homepage.safeAreaAdds, 1);
    assert.equal(result.safeAreaAdds, 1);
    assert.equal(manager.safeAreaAdds, 0);
    assert.equal(camera.safeAreaAdds, 0);
});

test('short desktop windows fit height while tall phone screens keep fitting width', () => {
    const desktop = loadService({ width: 470, height: 837 });
    desktop.service.applyAdaptiveDesignResolution();
    assert.deepEqual(
        desktop.resolutionCalls,
        [[1080, 2160, ResolutionPolicy.FIXED_HEIGHT]],
    );

    const phone = loadService({ width: 390, height: 844 });
    phone.service.applyAdaptiveDesignResolution();
    assert.deepEqual(
        phone.resolutionCalls,
        [[1080, 2160, ResolutionPolicy.FIXED_WIDTH]],
    );
});

test('Homepage and Match install safe area before showing their full-screen pages', () => {
    const home = fs.readFileSync(
        path.join(project, 'assets/scripts/home/HomeUiController.ts'),
        'utf8',
    );
    const match = fs.readFileSync(
        path.join(project, 'assets/scripts/home/MatchController.ts'),
        'utf8',
    );

    assert.match(home, /applySafeAreaToCanvasPages\(this\.canvas\)/);
    assert.match(match, /applySafeAreaToCanvasPages\(this\.node\)/);
    assert.match(match, /applySafeAreaToPage\(this\.victoryPage\)/);
    assert.match(match, /applySafeAreaToPage\(this\.championshipPage\)/);
    assert.match(match, /applySafeAreaToPage\(this\.defeatPage\)/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const project = path.resolve(__dirname, '..');
const ts = require(require.resolve('typescript', { paths: [
    project, path.join(project, 'extensions/cocos-code-mode'),
] }));
const compiled = ts.transpileModule(fs.readFileSync(
    path.join(project, 'assets/scripts/home/RecruitmentController.ts'), 'utf8',
), { compilerOptions: {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true,
} }).outputText;

function harness(level, { completed = true, wechat = false } = {}) {
    const calls = { draws: [], acquired: [], boosts: [], protection: 0, willpower: 0 };
    const exports = {};
    const state = {
        getLowestRecruitmentQualityProtectionCount: () => 3,
        getRecruitmentAdProbabilityBoostCount: value => value === 10 ? 10 : 5,
        consumeLowestRecruitmentQualityProtection: () => calls.protection++,
        consumeRecruitmentAdProbabilityBoost: (...args) => calls.boosts.push(args),
        loadRoster: () => [{ sourcePlayerName: 'roster-player' }],
    };
    vm.runInNewContext(compiled, { exports, console: { error: (...args) => assert.fail(args.join(' ')) },
        require(id) {
            if (id === 'cc') return {
                Component: class {}, Color: class {}, Vec4: class {}, Node: { EventType: {} },
                Button: { EventType: {}, Transition: { NONE: 0 } },
                _decorator: { ccclass: () => type => type, property: () => () => {} },
            };
            if (id === './GameState') return state;
            if (id === './TeamLevelController') return { getStoredTeamLevel: () => level };
            if (id === './RewardedAdService') return {
                showRewardedVideo: async () => completed,
                toRewardedActionCopy: text => wechat ? text.replace('看广告', '分享') : text,
            };
            if (id === './PlayerKnowledge') return {
                recordPlayerAcquisitionWithKnowledgeReset: card => calls.acquired.push(card),
            };
            return {};
        },
    });
    const controller = new exports.RecruitmentController();
    Object.assign(controller, {
        node: { isValid: true },
        teamLevelController: {
            getSnapshot: () => ({ teamLevel: level }),
            addRecruitWillpower: () => { calls.willpower += 10; return 10; },
        },
        showRecruitingButtonVisual() {}, refreshBudgetView() {}, restoreRecruitButtonVisual() {},
        waitForPendingPlayerEvents: async () => {}, showNextAdRecruitmentResult: async () => {},
        setAutoDismissBatchLocked() {},
        createRecruitedCard(protection, excluded, boost10, boost5) {
            calls.draws.push({ protection, excluded: [...excluded], boost10, boost5 });
            return { sourcePlayerName: 'same-player' };
        },
        continuousRecruitLabel: { fontSize: 24 }, continuousRecruitRichText: {},
        getBudgetRecruitmentCount: () => 0,
        getLowestQualityProtectionHint: () => ({ text: '', highlights: [], qualityHighlights: [] }),
        getUpperQualityPityHint: () => ({ text: '', highlights: [], qualityHighlights: [] }),
        setContinuousRecruitLabel: (...args) => { calls.label = args; },
    });
    return { controller, calls };
}

for (const [level, count] of [[0, 10], [1, 10], [2, 20], [5, 50], [80, 800], [100, 1000]]) {
    test(`level ${level} ad grants ${count} draws and permits batch duplicates`, async () => {
        const { controller, calls } = harness(level);
        await controller.recruitTripleFromAd();
        assert.equal(controller.queuedAdRecruitments.length, count);
        assert.equal(calls.acquired.length, count);
        assert.equal(calls.willpower, count * 10);
        assert.equal(calls.draws.length, count);
        for (const draw of calls.draws) assert.deepEqual(draw.excluded, ['roster-player']);
        assert.equal(calls.draws.filter(draw => draw.protection).length, 3);
        assert.equal(calls.protection, 3);
        assert.equal(calls.draws.filter(draw => draw.boost10).length, 10);
        assert.equal(calls.draws.filter(draw => draw.boost5).length, 5);
        assert.deepEqual(calls.boosts, [[10, 10], [5, 5]]);
    });
}

test('canceling the reward grants no draws or willpower', async () => {
    const { controller, calls } = harness(5, { completed: false });
    await controller.recruitTripleFromAd();
    assert.equal(calls.draws.length, 0);
    assert.equal(calls.willpower, 0);
    assert.equal(controller.processing, false);
});

for (const wechat of [false, true]) {
    test(`${wechat ? 'WeChat share' : 'TapTap ad'} label follows team level`, () => {
        const { controller, calls } = harness(5, { wechat });
        controller.refreshContinuousRecruitLabel();
        assert.equal(calls.label[0], `${wechat ? '分享' : '看广告'}50连抽`);
        assert.equal(calls.label[2][0], '50');
        controller.teamLevelController.getSnapshot = () => ({ teamLevel: 6 });
        controller.refreshContinuousRecruitLabel();
        assert.equal(calls.label[0], `${wechat ? '分享' : '看广告'}60连抽`);
        controller.teamLevelController = null;
        controller.refreshContinuousRecruitLabel();
        assert.equal(calls.label[0], `${wechat ? '分享' : '看广告'}50连抽`);
    });
}

test('draw count is captured on click, not changed by a level change during the ad', async () => {
    const { controller, calls } = harness(2);
    const pending = controller.recruitTripleFromAd();
    controller.teamLevelController.getSnapshot = () => ({ teamLevel: 3 });
    await pending;
    assert.equal(calls.draws.length, 20);
});

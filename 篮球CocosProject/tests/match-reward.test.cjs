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
    path.join(project, 'assets/scripts/home/MatchController.ts'), 'utf8',
), { compilerOptions: {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true,
} }).outputText;

function harness(teamLevel, opponentLevel, rewardMultiplier = 1, operationPresidentBonus = 0) {
    const exports = {};
    vm.runInNewContext(compiled, { exports, console, require(id) {
        if (id === 'cc') return {
            _decorator: { ccclass: () => type => type }, Component: class {}, Color: class {},
        };
        if (id === './MatchCommentarySelector') return { MatchCommentarySelector: class {} };
        if (id === './TeamLevelController') return { getStoredTeamLevel: () => teamLevel };
        if (id === './SeasonRoute') return { STANDARD_MATCH_COUNT: 100 };
        return {};
    } });
    const controller = new exports.MatchController();
    controller.session = { opponentLevel, rewardMultiplier, operationPresidentBonus };
    controller.matchRewards = { championship: { budgetReward: 100000 } };
    return controller;
}

for (const [team, opponent, multiplier, bonus, expected] of [
    [0, 1, 1, 0, 20], [5, 10, 1, 0, 120], [5, 20, 1, 0, 240],
    [5, 20, 2, 0, 480], [5, 20, 3, 0, 720],
    [5, 20, 1.5, 0.2, 432], [0, 11, 1.25, 0.002, 28], [0, 11, 1, 0.002, 23],
]) {
    test(`doubled base reward: team ${team}, opponent ${opponent}, multiplier ${multiplier}, bonus ${bonus}`, () => {
        assert.equal(harness(team, opponent, multiplier, bonus).calculateMatchReward(), expected);
    });
}

test('championship remains a fixed 100K and bypasses normal multipliers', () => {
    const controller = harness(100, 100, 1.5, 0.2);
    Object.assign(controller.session, { isStandardProgressionMatch: true, matchNumber: 100 });
    assert.equal(controller.calculateMatchReward(), 100000);
});

test('root and runtime formula documentation both include the doubled base', () => {
    for (const directory of ['../data/balance', 'assets/resources/data/balance']) {
        const economy = JSON.parse(fs.readFileSync(path.join(project, directory, 'economy.json'), 'utf8'));
        const rewards = JSON.parse(fs.readFileSync(path.join(project, directory, 'match_rewards.json'), 'utf8'));
        assert.equal(economy.budgetSources.matchRewards.baseBudgetFormula,
            '2 * (currentTeamLevel + 1) * max(opponentLevel, 10)');
        assert.equal(rewards._meta.baseBudgetFormula,
            '2 * (currentTeamLevel + 1) * max(opponentLevel, 10)');
        assert.equal(economy.budgetSources.matchRewards.lossBudget, 0);
    }
});

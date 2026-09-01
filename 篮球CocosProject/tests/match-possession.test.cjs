const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const project = path.resolve(__dirname, '..');
const ts = require(require.resolve('typescript', { paths: [
    project, path.join(project, 'extensions/cocos-code-mode'),
] }));

function load(name) {
    const exports = {};
    const compiled = ts.transpileModule(fs.readFileSync(
        path.join(project, `assets/scripts/home/${name}.ts`), 'utf8',
    ), { compilerOptions: {
        target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
        experimentalDecorators: true,
    } }).outputText;
    vm.runInNewContext(compiled, { exports, console, require(id) {
        if (id === 'cc') return {
            _decorator: { ccclass: () => (type) => type }, Component: class {}, Color: class {},
        };
        if (id === './MatchCommentarySelector') return { MatchCommentarySelector: class {} };
        return {};
    } });
    return exports[name];
}
const MatchController = load('MatchController');
const MatchCourtSimulation = load('MatchCourtSimulation');
const event = (changes = {}) => ({
    index: 0, quarter: 0, startSecond: 0, offenseTeam: 0,
    tactic: 'five-out', action: 'jumper', points: 0, made: false, foul: false,
    shooterIndex: 0, handlerIndex: 0, passerIndex: 1,
    rebound: 'self', contestedRebound: false, ...changes,
});
function nextTeam(play) {
    const misses = play.action === 'free-throw' ? play.points < 2 : !play.made;
    return play.action !== 'turnover' && misses && play.rebound !== 'opponent'
        ? play.offenseTeam : 1 - play.offenseTeam;
}

for (const rebound of ['self', 'teammate', 'opponent']) {
    test(`${rebound} rebounds agree with the next planned offense and preserve every quarter score`, () => {
        const controller = new MatchController();
        controller.pickReboundResult = () => rebound;
        const result = { forcedWin: false,
            playerQuarterScores: [0, 5, 11, 15], opponentQuarterScores: [2, 0, 9, 13] };
        for (let seed = 0; seed < 30; seed++) {
            controller.session = { matchId: `seed-${seed}`, playerRoster: [], opponentRoster: [] };
            const plays = controller.createPlayPlan(result);
            const scores = [Array(4).fill(0), Array(4).fill(0)];
            plays.forEach((play, index) => {
                assert.equal(play.index, index);
                assert(Number.isFinite(play.points));
                scores[play.offenseTeam][play.quarter] += play.points;
                const next = plays[index + 1];
                if (next) {
                    assert(next.startSecond > play.startSecond);
                    assert.equal(next.offenseTeam, nextTeam(play),
                        `${play.action}/${play.points}/${play.rebound} incorrectly changes possession`);
                } else {
                    assert.equal(nextTeam(play), 1 - play.offenseTeam);
                }
            });
            assert.deepEqual(scores, [result.playerQuarterScores, result.opponentQuarterScores]);
            for (const quarter of [0, 1, 2, 3]) {
                assert.equal(plays.find(p => p.quarter === quarter).startSecond, quarter * 60);
            }
        }
    });
}

for (const speed of [1, 2, 3]) {
    test(`completed animation starts the next play immediately at ${speed}x without waiting for its clock slot`, () => {
        const controller = new MatchController();
        const first = event({ rebound: 'opponent' });
        const next = event({ index: 1, offenseTeam: 1, startSecond: 6 });
        controller.plannedPlays = [first, next];
        controller.nextPlayIndex = 1;
        controller.elapsedMatchSeconds = 4.8;
        controller.requestedSpeedMultiplier = speed;
        const starts = [];
        controller.courtSimulation = { isBusy: false, play(p, s) { starts.push([p, s]); return true; } };
        controller.onCourtPlayComplete(1, first);
        assert.equal(starts.length, 1);
        assert.equal(starts[0][0], next);
        assert.equal(starts[0][1], speed);
        assert.equal(controller.elapsedMatchSeconds, 6);
    });
}

test('an offensive rebound can lead to a scoring second chance without adding extra score', () => {
    const controller = new MatchController();
    const planned = event({ action: 'three', points: 3, made: true, rebound: 'teammate' });
    const attempts = controller.createPossessionAttempts(planned);
    assert.equal(attempts.length, 2);
    assert.equal(attempts[0].made, false);
    assert.equal(nextTeam(attempts[0]), attempts[1].offenseTeam);
    assert.equal(attempts[1].points, 3);
    assert.equal(nextTeam(attempts[1]), 1);
    assert.equal(attempts.reduce((sum, play) => sum + play.points, 0), planned.points);
    assert.equal(planned.made, true);
});

test('steals, completed and-ones and two made free throws have no spurious offensive rebound', () => {
    const controller = new MatchController();
    for (const [action, points] of [['turnover', 0], ['and-one', 3], ['free-throw', 2]]) {
        const attempts = controller.createPossessionAttempts(event({ action, points, made: points > 0 }));
        assert.equal(attempts.length, 1);
        assert.equal(nextTeam(attempts[0]), 1);
    }
});

test('score callbacks still cap each attempt independently, including separate free throws', () => {
    const controller = new MatchController();
    const attempts = controller.createPossessionAttempts(event({ action: 'free-throw', points: 1, made: true }));
    attempts.forEach((play, index) => {
        play.index = index;
        controller.onCourtScore(play.offenseTeam, 1, play);
        controller.onCourtScore(play.offenseTeam, 1, play);
    });
    assert.equal(controller.playerQuarterScores[0], 1);
});

test('a busy animation cannot be interrupted even when the clock reaches the next slot', () => {
    const controller = new MatchController();
    controller.plannedPlays = [event()];
    controller.elapsedMatchSeconds = 60;
    controller.courtSimulation = { isBusy: true, play() { assert.fail('interrupted live play'); } };
    controller.startDueCourtPlay();
    assert.equal(controller.nextPlayIndex, 0);
});

test('the final animation completes the match without an idle tail', () => {
    const controller = new MatchController();
    controller.plannedPlays = [event()];
    controller.nextPlayIndex = 1;
    controller.elapsedMatchSeconds = 238;
    controller.courtSimulation = { isBusy: false };
    let finishes = 0;
    controller.finishMatch = () => { finishes++; };
    controller.onCourtPlayComplete(1, controller.plannedPlays[0]);
    assert.equal(controller.elapsedMatchSeconds, 240);
    assert.equal(finishes, 1);
});

test('stopped or repeated simulation completions cannot advance another play', () => {
    const simulation = Object.create(MatchCourtSimulation.prototype);
    const play = event();
    let completions = 0;
    Object.assign(simulation, { token: 3, busy: true, activeEvent: play,
        callbacks: { onPlayComplete: () => { completions++; } } });
    simulation.completePlay(0, play, 2);
    assert.equal(completions, 0);
    assert.equal(simulation.busy, true);
    simulation.completePlay(0, play, 3);
    simulation.completePlay(0, play, 3);
    assert.equal(completions, 1);
    assert.equal(simulation.busy, false);
});

for (const points of [0, 1, 2]) {
    test(`two free throws scoring ${points}: only the final shot decides rebound or inbound`, () => {
        const simulation = Object.create(MatchCourtSimulation.prototype);
        let misses = 0, inbounds = 0, total = 0;
        Object.assign(simulation, { token: 1, ball: { worldPosition: { clone() { return {}; } } },
            callbacks: { onScore: (_team, p) => { total += p; } },
            animateFreeThrowShot: (_shooter, _made, _token, cb) => cb(),
            getBallAnchorPosition: () => ({}), after: (_duration, _token, cb) => cb(),
            animateBallArc: (_s, _e, _d, _h, _t, cb) => cb(), setBallOwner() {},
            playerName: () => 'A', selectCommentary: () => null,
            composeCommentarySeries: () => [], joinCommentarySentences: () => '', emitCommentary() {},
            completeMadePlay: () => { inbounds++; }, resolveMissedShot: () => { misses++; },
        });
        simulation.animateFreeThrowSequence({}, event({ action: 'free-throw', points }), 1, 0, points);
        assert.equal(total, points);
        assert.equal(misses, points < 2 ? 1 : 0);
        assert.equal(inbounds, points === 2 ? 1 : 0);
    });
}

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.7/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const root = 'D:/篮球/篮球CocosProject/assets/scripts/home/';
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
function harness(file, methods, context) {
  const source = fs.readFileSync(root + file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const cls = ast.statements.find(n => ts.isClassDeclaration(n));
  const body = cls.members.filter(m => methods.includes(m.name?.getText(ast))).map(m => m.getText(ast)).join('\n');
  const constants = ast.statements.filter(n => ts.isVariableStatement(n) && n.getText(ast).startsWith('const CONTINUOUS_RECRUIT_')).map(n => n.getText(ast)).join('\n');
  context.exports = {};
  vm.runInNewContext(compile(constants + '\nexport class Harness {' + body + '}'), context);
  return new context.exports.Harness();
}
const clone = data => JSON.parse(JSON.stringify(data));
async function checkEvents(rolls, count, expected, rosterCount = 12) {
  let roster = Array.from({ length: rosterCount }, (_, i) => ({ instanceId: String(i), overall: 100, attributes: {}, matchesPlayed: 0 }));
  let checks = 0, resumed = 0;
  const context = {
    console, ROSTER_SLOT_COUNT: 12, Math: Object.assign(Object.create(Math), { random: () => { checks++; return rolls.shift() ?? 0; } }),
    loadRoster: () => clone(roster), saveRoster: value => { roster = clone(value); },
    getManagementEffects: async () => { await Promise.resolve(); return { medicalTeamInjuryRiskReduction: 0 }; },
  };
  const c = harness('PlayerEventController.ts', ['tryCreateRandomEvent', 'createRandomEvent', 'onValidOperationCompleted', 'onRewardedAdCompleted'], context);
  c.initialized = true; c.config = { triggerProbability: 0.3, events: [{ id: 'injury' }] };
  c.getRetirementMatchLimit = () => 100;
  c.pickWeighted = values => values[0];
  c.pickEventTarget = (_type, candidates) => candidates[0];
  c.pickEventDescription = () => 'event'; c.resolveOverallDelta = () => -10;
  c.queuedActionAfterPendingEvents = () => {};
  c.openNextQueuedEventOrRunAction = () => { resumed++; assert.equal(checks, count, 'resume only after all checks'); };
  await c.tryCreateRandomEvent(count);
  assert.equal(checks, count, 'do not lose checks to the generation lock');
  assert.equal(roster.filter(card => card.pendingEvent).length, expected);
  assert.equal(resumed, 1);
  assert.equal(c.generatingEvent, false);
  const forwarded = [];
  c.tryCreateRandomEvent = async (value = 1) => { forwarded.push(value); };
  c.onValidOperationCompleted(2); c.onValidOperationCompleted(); c.onRewardedAdCompleted();
  c.resolvingEvent = true; c.onRewardedAdCompleted();
  assert.deepEqual(forwarded, [2, 1, 1]);
}
function checkRecruitment(requested, affordable = requested, generated = requested, charge = true) {
  let balance = 100000, calls = [], index = 0, charged = 0;
  const context = {
    console, Number, loadRoster: () => [], getLowestRecruitmentQualityProtectionCount: () => 0,
    getRecruitmentAdProbabilityBoostCount: () => 0, getBalance: () => balance,
    trySpend: cost => { if (charged >= affordable) return false; charged++; if (charge) balance -= cost; return true; },
    notifyValidOperationCompleted: (count = 1) => { if (count > 0) calls.push(count); },
    recordPlayerAcquisitionWithKnowledgeReset: () => {}, RECRUITING_DELAY_SECONDS: 1,
  };
  const c = harness('RecruitmentController.ts', ['beginContinuousRecruitment', 'finishContinuousRecruitment'], context);
  c.ready = true; c.economyConfig = { initialBudget: 100 }; c.rosterSlots = [];
  c.getMaxContinuousRecruitmentCount = () => requested;
  c.getRecruitmentCost = () => 1;
  c.createRecruitedCard = () => index < generated ? { sourcePlayerName: String(index++) } : null;
  c.resetContinuousRecruitLabel = c.beginRecruitment = c.refreshBudgetView = c.showRecruitingButtonVisual = c.restoreRecruitButtonVisual = c.setAutoDismissBatchLocked = () => {};
  c.waitForSeconds = () => new Promise(() => {});
  c.beginContinuousRecruitment(requested);
  const expected = charge ? Math.floor(Math.min(requested, affordable, generated) / 10) : 0;
  assert.deepEqual(calls, [], 'do not generate events on players about to be replaced');
  c.finishContinuousRecruitment();
  c.finishContinuousRecruitment();
  assert.deepEqual(calls, expected ? [expected] : [], 'checks from actual successful pulls: ' + requested);
  return calls;
}
(async () => {
  await checkEvents([0, 0], 2, 2);
  await checkEvents([0.9, 0], 2, 1);
  await checkEvents([0, 0.9], 2, 1);
  await checkEvents([0.9, 0.9], 2, 0);
  await checkEvents([], 15, 12);
  await checkEvents([], 2, 0, 0);
  for (const count of [2, 9, 10, 19, 20, 23, 29, 30, 99, 100, 230]) checkRecruitment(count);
  checkRecruitment(23, 19); checkRecruitment(23, 23, 9); checkRecruitment(23, 23, 23, false);
  assert.deepEqual([...checkRecruitment(9), ...checkRecruitment(9)], [], 'no cross-batch remainder');
  const ast = ts.createSourceFile('GameState.ts', fs.readFileSync(root + 'GameState.ts', 'utf8'), ts.ScriptTarget.Latest, true);
  const fn = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name.text === 'notifyValidOperationCompleted');
  const emissions = [];
  const context = { exports: {}, GAME_STATE_EVENT_VALID_OPERATION_COMPLETED: 'operation', gameStateEvents: { emit: (...args) => emissions.push(args) } };
  vm.runInNewContext(compile(fn.getText(ast)), context);
  context.exports.notifyValidOperationCompleted(); context.exports.notifyValidOperationCompleted(0); context.exports.notifyValidOperationCompleted(2);+  assert.deepEqual(emissions, [['operation', 1], ['operation', 2]]);
  console.log(JSON.stringify({ passed: true, asyncEventCases: 6, recruitmentBoundaries: 15, defaultSingleAndAdUnchanged: true }));
})().catch(error => { console.error(error); process.exitCode = 1; });

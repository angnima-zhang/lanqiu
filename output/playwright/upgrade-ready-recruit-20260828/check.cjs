const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.7/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const path = 'D:/篮球/篮球CocosProject/assets/scripts/home/RecruitmentController.ts';
const source = fs.readFileSync(path, 'utf8');
const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
const cls = ast.statements.find(n => ts.isClassDeclaration(n));
const names = ['getBudgetRecruitmentCount', 'getMaxContinuousRecruitmentCount', 'growContinuousRecruitment', 'activateContinuousRecruitment', 'onRecruitTouchStart', 'onRecruitTouchEnd', 'stopContinuousRecruitHold', 'beginContinuousRecruitment', 'finishContinuousRecruitment'];
const methods = cls.members.filter(m => names.includes(m.name?.getText(ast))).map(m => m.getText(ast)).join('\n');
const constants = ast.statements.filter(n => ts.isVariableStatement(n) && n.getText(ast).startsWith('const CONTINUOUS_RECRUIT_')).map(n => n.getText(ast)).join('\n');
let now = 100000, balance = 0, acquired = 0, operations = 0, cardId = 0, storedLevel = 10;
const context = {
  exports: {}, console, Date: { now: () => now },
  isCheatModeEnabled: () => false, getStoredTeamLevel: () => storedLevel,
  loadRoster: () => Array(12).fill(null),
  getLowestRecruitmentQualityProtectionCount: () => 0,
  getRecruitmentAdProbabilityBoostCount: () => 0,
  getBalance: () => balance,
  trySpend: cost => { if (balance < cost) return false; balance -= cost; return true; },
  notifyValidOperationCompleted: () => operations++,
  recordPlayerAcquisitionWithKnowledgeReset: () => acquired++,
  RECRUITING_DELAY_SECONDS: 1,
};
const js = ts.transpileModule(constants + '\nexport class Harness {' + methods + '}', { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
vm.runInNewContext(js, context);
function make(snapshot, deficit, budget = 1100) {
  snapshot = { willpower: deficit === 0 ? 200 : 50, currentRequirement: 200, ...snapshot };
  const c = new context.exports.Harness();
  c.budget = balance = budget;
  c.ready = true;
  c.processing = false;
  c.economyConfig = { initialBudget: 100 };
  c.rosterSlots = Array(12).fill(null);
  c.teamLevelController = { getSnapshot: () => snapshot, getRecruitmentsUntilWillpowerFull: () => deficit, addRecruitWillpower: () => 0 };
  c.getRecruitmentCost = () => 11;
  c.unschedule = c.scheduleOnce = c.schedule = () => {};
  c.refreshContinuousRecruitLabel = c.resetContinuousRecruitLabel = c.setAutoDismissBatchLocked = c.showRecruitingButtonVisual = c.restoreRecruitButtonVisual = c.refreshBudgetView = () => {};
  c.lockContinuousRecruitLabel = n => { c.lockedCount = n; };
  c.beginRecruitment = () => { c.singleTriggered = true; };
  c.createRecruitedCard = () => ({ sourcePlayerName: 'player-' + cardId++ });
  c.waitForSeconds = () => new Promise(() => {});
  return c;
}
const cases = [
  { name: 'upgrade-ready', snapshot: { canUpgrade: true, maxLevel: false }, deficit: 0, cap: 100, atTwo: 15, atThree: 25 },
  { name: 'needs-win', snapshot: { canUpgrade: false, maxLevel: false }, deficit: 0, cap: 100, atTwo: 15, atThree: 25 },
  { name: 'normal', snapshot: { canUpgrade: false, maxLevel: false }, deficit: 15, cap: 15, atTwo: 10, atThree: 15 },
  { name: 'max-level', snapshot: { canUpgrade: false, maxLevel: true }, deficit: Number.MAX_SAFE_INTEGER, cap: 100, atTwo: 55, atThree: 100 },
];
for (const test of cases) {
  const c = make(test.snapshot, test.deficit);
  assert.equal(c.getMaxContinuousRecruitmentCount(), test.cap, test.name + ' cap');
  c.continuousRecruitHolding = true;
  c.continuousRecruitHoldStartedAtMs = 100000;
  for (const [seconds, expected] of [[1, Math.min(5, test.cap)], [2, test.atTwo], [3, test.atThree], [100, test.cap]]) {
    now = 100000 + seconds * 1000;
    c.growContinuousRecruitment();
    assert.equal(c.continuousRecruitCount, expected, test.name + ' at ' + seconds + 's');
  }
}
for (const budget of [0, 10, 11, 21, 22, 44, 55, 60]) {
  const c = make({ canUpgrade: true, maxLevel: false }, 0, budget);
  assert.equal(c.getMaxContinuousRecruitmentCount(), Math.floor(budget / 11));
  now = 100000;
  c.onRecruitTouchStart();
  assert.equal(!!c.continuousRecruitHolding, budget >= 22);
}
const c = make({ canUpgrade: true, maxLevel: false }, 0);
now = 100000;
c.onRecruitTouchStart();
now += 1000;
c.activateContinuousRecruitment();
assert.equal(c.continuousRecruitCount, 5);
now += 1999;
c.onRecruitTouchEnd();
assert.equal(c.pendingContinuousRecruitmentCount, 24, 'release must recompute current count');
assert.equal(c.lockedCount, 24);
c.beginContinuousRecruitment(c.pendingContinuousRecruitmentCount);
assert.equal(c.continuousRecruitmentBatchCount, 24);
assert.equal(c.queuedContinuousRecruitments.length, 24);
assert.equal(balance, 1100 - 24 * 11);
assert.equal(acquired, 24);
assert.equal(operations, 0, 'wait until final roster is settled');
c.finishContinuousRecruitment();
assert.equal(operations, 1);
c.finishContinuousRecruitment();
assert.equal(operations, 1, 'never repeat the checks');
const limited = make({ canUpgrade: true, maxLevel: false }, 0, 44);
limited.beginContinuousRecruitment(25);
assert.equal(limited.continuousRecruitmentBatchCount, 4, 'execution rechecks budget');
const single = make({ canUpgrade: true, maxLevel: false }, 0, 11);
single.beginContinuousRecruitment(25);
assert.equal(single.singleTriggered, true);
console.log(JSON.stringify({ passed: true, cases: cases.map(c => c.name), budgetBoundaries: 8, releaseAndBatchCount: 24 }));

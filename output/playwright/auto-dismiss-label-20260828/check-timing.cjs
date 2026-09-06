const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.7/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const file = 'D:/篮球/篮球CocosProject/assets/scripts/home/RecruitmentController.ts';
const source = fs.readFileSync(file, 'utf8');
const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
const cls = ast.statements.find(ts.isClassDeclaration);
const method = cls.members.find(m => m.name?.getText(ast) === 'showNextQueuedRecruitmentResult').getText(ast);
const constants = ast.statements.filter(n => ts.isVariableStatement(n) && /^const AUTO_DISMISS_(SEGMENT_SECONDS|FINAL_COUNT_HOLD_SECONDS)/.test(n.getText(ast))).map(n => n.getText(ast));
let now = 0;
const context = { exports: {}, Date: { now: () => now } };
vm.runInNewContext(ts.transpileModule(constants.join('\n') + '\nexport class Harness {' + method + '}', { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, context);
function harness(frameMs = 1000 / 60) {
  now = 0;
  const c = new context.exports.Harness();
  c.autoDismissEnabled = true; c.autoDismissCount = 0; c.isValid = c.enabledInHierarchy = true;
  c.frames = []; c.shown = []; c.final = null; c.text = 'auto:0'; c.quality = 10;
  c.setAutoDismissBatchLocked = c.refreshBudgetView = () => {};
  c.refreshContinuousRecruitLabel = () => { c.text = 'auto:' + c.autoDismissCount; };
  c.getCurrentRecruitmentDecision = () => ({ quality: c.quality });
  c.shouldAutoDismiss = (card, decision) => c.autoDismissEnabled && card.quality < decision.quality;
  c.waitForSeconds = async seconds => {
    const target = now + seconds * 1000;
    do { c.frames.push({ time: now, text: c.text }); now += frameMs; } while (now <= target);
    now += frameMs; // model Cocos scheduleOnce overhead
    c.onWait?.();
  };
  c.showRecruitmentResult = async card => { c.shown.push({ id: card.id, time: now, count: c.autoDismissCount }); };
  c.finish = () => { c.final = { time: now, count: c.autoDismissCount }; c.text = 'default'; };
  return c;
}
const queue = qualities => qualities.map((quality, id) => ({ card: { quality, id }, willpowerAdded: 0 }));
(async () => {
  for (const frameMs of [1000 / 60, 1000 / 30, 100]) {
    for (const count of [1, 3, 56, 58, 230]) {
      const c = harness(frameMs);
      await c.showNextQueuedRecruitmentResult(queue(Array(count).fill(1)), c.finish);
      assert.equal(c.final.count, count);
      const finalFrames = c.frames.filter(f => f.text === 'auto:' + count);
      assert.ok(finalFrames.length >= 2, 'final counter must cross rendered frames');
      assert.ok(c.final.time - finalFrames[0].time >= 300, 'hold final value');
      assert.ok(c.final.time < 1500 + frameMs * 5, 'do not accumulate per-player frame drift');
      assert.equal(c.text, 'default');
    }
  }
  const mixed = harness();
  const results = queue([1, 1, 10, 1, 1, 1, 1, 10]);
  await mixed.showNextQueuedRecruitmentResult(results, mixed.finish);
  assert.equal(mixed.shown[0].id, 2); assert.equal(mixed.shown[0].count, 2);
  assert.ok(mixed.shown[0].time >= 1500 && mixed.shown[0].time < 1600);
  await mixed.showNextQueuedRecruitmentResult(results, mixed.finish);
  assert.equal(mixed.shown[1].id, 7); assert.equal(mixed.shown[1].count, 6);
  assert.equal(mixed.final, null);
  const dynamic = harness();
  dynamic.onWait = () => { dynamic.quality = 1; };
  await dynamic.showNextQueuedRecruitmentResult(queue([5, 5]), dynamic.finish);
  assert.equal(dynamic.shown[0].id, 0); assert.equal(dynamic.autoDismissCount, 0);
  assert.ok(dynamic.shown[0].time >= 1500, 'recheck current replacement player after waiting');
  const cancelled = harness();
  cancelled.onWait = () => { cancelled.enabledInHierarchy = false; };
  await cancelled.showNextQueuedRecruitmentResult(queue([1]), cancelled.finish);
  assert.equal(cancelled.final, null); assert.equal(cancelled.autoDismissCount, 0);
  const plain = harness(); plain.autoDismissEnabled = false;
  await plain.showNextQueuedRecruitmentResult(queue([1]), plain.finish);
  assert.equal(plain.shown[0].time, 0); assert.equal(plain.autoDismissCount, 0);
  console.log(JSON.stringify({ passed: true, timingCases: 15, mixedSequence: [2, 6], currentRosterRechecked: true, disabledFlowUnchanged: true }));
})().catch(error => { console.error(error); process.exitCode = 1; });

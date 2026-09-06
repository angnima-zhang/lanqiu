const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.7/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const file = 'D:/篮球/篮球CocosProject/assets/scripts/home/PlayerEventController.ts';
const source = fs.readFileSync(file, 'utf8');
const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
const names = ['openEventAt', 'isCurrentEventPresentation', 'closePageAndWait', 'resolveActiveEvent', 'setButtonsInteractable'];
const cls = ast.statements.find(ts.isClassDeclaration);
const code = 'export class Harness {' + cls.members.filter(m => names.includes(m.name?.getText(ast))).map(m => m.getText(ast)).join('\n') + '}';
const clone = data => JSON.parse(JSON.stringify(data));
let roster, adCalls, saves, adSuccess, entrances;
const context = {
  exports: {}, ROSTER_SLOT_COUNT: 12, EVENT_OVERALL_ANIMATION_DELAY_SECONDS: 0.5,
  loadRoster: () => clone(roster), saveRoster: cards => { saves++; roster = clone(cards); },
  showRewardedVideo: async () => { adCalls++; return adSuccess; },
  playFullScreenExit: async () => {},
  playFullScreenEntrance: page => { page.active = true; return new Promise(resolve => entrances.push(resolve)); },
};
vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText, context);
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
function make() {
  roster = [{ instanceId: 'A', pendingEvent: { type: 'retirement', occurredAtMs: 1 } }];
  adCalls = saves = 0; adSuccess = true; entrances = [];
  const c = new context.exports.Harness();
  Object.assign(c, { initialized: true, eventPageReady: true, eventPageRenderVersion: 1, activePlayerInstanceId: 'A', activeEventOccurredAtMs: 1, resolvingEvent: false, adResultShown: false, rosterSlots: [null], page: { active: true, isValid: true, parent: { children: [] }, setSiblingIndex: () => {} }, confirmButton: { interactable: true }, adButton: { interactable: true } });
  c.applyEventResolution = (_roster, _index, card) => { delete card.pendingEvent; };
  c.showAdResolvedEventResult = () => { c.adResultShown = true; };
  c.openNextQueuedEventOrRunAction = c.scheduleOnce = () => {};
  return c;
}
(async () => {
  for (const withAd of [false, true]) {
    const c = make(); c.eventPageReady = false;
    await c.resolveActiveEvent(withAd);
    assert.equal(adCalls, 0); assert.equal(saves, 0);
  }
  const cancelled = make(); adSuccess = false;
  await cancelled.resolveActiveEvent(true);
  assert.equal(adCalls, 1); assert.equal(saves, 0); assert.equal(cancelled.adResultShown, false); assert.equal(cancelled.adButton.interactable, true);
  const rewarded = make(); await rewarded.resolveActiveEvent(true);
  assert.equal(adCalls, 1); assert.equal(saves, 1); assert.equal(rewarded.confirmButton.interactable, true); assert.equal(rewarded.adButton.interactable, false);
  const next = make();
  next.openNextQueuedEventOrRunAction = () => { next.page.active = true; next.eventPageReady = false; next.activePlayerInstanceId = 'B'; };
  await next.resolveActiveEvent(false);
  assert.equal(next.confirmButton.interactable, false); assert.equal(next.adButton.interactable, false, 'previous resolution must not unlock next entrance');
  const c = make(); const renders = [];
  c.renderEventPage = (card, event) => {
    c.eventPageRenderVersion++; c.eventPageReady = false; c.setButtonsInteractable(false);
    c.activePlayerInstanceId = card.instanceId; c.activeEventOccurredAtMs = event.occurredAtMs;
    return new Promise(resolve => renders.push(resolve));
  };
  c.openEventAt(0); c.openEventAt(0);
  renders[0](); await flush(); assert.equal(entrances.length, 0, 'discard superseded render');
  renders[1](); await flush(); assert.equal(entrances.length, 1); assert.equal(c.adButton.interactable, false);
  entrances[0](); await flush(); assert.equal(c.eventPageReady, true); assert.equal(c.adButton.interactable, true);
  c.openEventAt(0); renders[2](); await flush();
  await c.closePageAndWait(); entrances[1](); await flush();
  assert.equal(c.eventPageReady, false); assert.equal(c.adButton.interactable, false, 'closed entrance must not re-enable buttons');
  console.log(JSON.stringify({ passed: true, cases: ['loading-confirm', 'loading-ad', 'ad-cancel', 'ad-success', 'queued-next-event', 'superseded-render', 'entrance-complete', 'close-during-entrance'] }));
})().catch(error => { console.error(error); process.exitCode = 1; });

async (page) => {
  await page.waitForFunction(() => window.cc?.director.getScene()?.getComponentInChildren(window.cc.js.getClassByName('PlayerEventController'))?.initialized);
  await page.evaluate(async () => {
    const cc = window.cc, scene = cc.director.getScene();
    const game = [...window.System.entries()].map(([, m]) => m).find(m => m.loadSeasonState);
    const pre = cc.js.getClassByName('PreMatchController').instance;
    await pre.ensureDataLoaded();
    const templates = pre.playerConfig.players.filter(p => p.quality === 14).slice(0, 3);
    game.saveRoster(templates.map((p, i) => ({
      instanceId: 'event-ad-' + i, templateId: p.id, sourcePlayerName: p.sourcePlayerName, displayName: p.displayName,
      position: p.position, qualityId: p.quality, qualityName: p.qualityName, overall: 3690000,
      attributes: pre.allocateAttributes(3690000, p.attributes), acquiredAtMs: Date.now(), lineupSinceMs: Date.now(),
      pendingEvent: { type: 'retirement', occurredAtMs: Date.now() + i, descriptionTemplate: '{{player}}决定退役。', overallDelta: 0, recoveryMatches: 0 },
    })));
    const e = scene.getComponentInChildren(cc.js.getClassByName('PlayerEventController'));
    const qa = window.__adStateQA = { e, game, calls: [], done: false, snapshots: [] };
    const resolve = e.resolveActiveEvent;
    e.resolveActiveEvent = function (withAd) {
      qa.calls.push({ withAd, id: this.activePlayerInstanceId, stack: new Error().stack });
      return resolve.call(this, withAd);
    };
    qa.snapshot = () => ({ id: e.activePlayerInstanceId, adResult: e.adResultShown, confirm: e.confirmButton.node.getChildByName('Label').getComponent(cc.Label).string, adEnabled: e.adButton.interactable, pending: game.loadRoster().filter(c => c?.pendingEvent).map(c => c.instanceId) });
    if (!e.runAfterPendingEvents(() => { qa.done = true; })) throw Error('event queue did not open');
  });
  await page.waitForFunction(() => window.__adStateQA.e.page.activeInHierarchy && window.__adStateQA.e.confirmButton.interactable);
  await page.evaluate(() => { const q = window.__adStateQA; q.snapshots.push(q.snapshot()); q.e.resolveEventWithAd(); });
  await page.waitForFunction(() => window.__adStateQA.e.adResultShown && !window.__adStateQA.e.resolvingEvent);
  await page.evaluate(() => { const q = window.__adStateQA; q.snapshots.push(q.snapshot()); q.e.confirmEvent(); });
  await page.waitForFunction(() => window.__adStateQA.e.activePlayerInstanceId === 'event-ad-1' && window.__adStateQA.e.page.activeInHierarchy && window.__adStateQA.e.confirmButton.interactable && !window.__adStateQA.e.resolvingEvent);
  await page.evaluate(() => { const q = window.__adStateQA; q.snapshots.push(q.snapshot()); q.e.confirmEvent(); });
  await page.waitForFunction(() => window.__adStateQA.e.activePlayerInstanceId === 'event-ad-2' && window.__adStateQA.e.page.activeInHierarchy && window.__adStateQA.e.confirmButton.interactable && !window.__adStateQA.e.resolvingEvent);
  return await page.evaluate(() => {
    const q = window.__adStateQA; q.snapshots.push(q.snapshot());
    return { snapshots: q.snapshots, calls: q.calls.map(c => ({ withAd: c.withAd, id: c.id })) };
  });
}

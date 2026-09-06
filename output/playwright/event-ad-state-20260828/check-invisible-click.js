async (page) => {
  const pos = await page.evaluate(async () => {
    const cc = window.cc, q = window.__adStateQA, e = q.e;
    e.queuedActionAfterPendingEvents = null;
    await e.closePageAndWait();
    const roster = q.game.loadRoster();
    const card = roster.find(Boolean);
    card.pendingEvent = { type: 'retirement', occurredAtMs: Date.now(), descriptionTemplate: '{{player}}决定退役。', overallDelta: 0, recoveryMatches: 0 };
    q.game.saveRoster([card]); q.calls.length = 0;
    const r = cc.director.getScene().getComponentInChildren(cc.js.getClassByName('RecruitmentController'));
    const rect = document.querySelector('canvas').getBoundingClientRect(), size = cc.view.getVisibleSize(), p = r.recruitButton.node.worldPosition;
    return { x: rect.x + p.x / size.width * rect.width, y: rect.bottom - p.y / size.height * rect.height };
  });
  await page.mouse.click(pos.x, pos.y);
  await page.waitForFunction(() => window.__adStateQA.e.page.activeInHierarchy);
  const beforeSecondClick = await page.evaluate(() => {
    const cc = window.cc, e = window.__adStateQA.e;
    return { adOpacity: e.adButton.node.getComponent('cc.UIOpacity')?.opacity, adEnabled: e.adButton.interactable, adResult: e.adResultShown };
  });
  await page.mouse.click(pos.x, pos.y);
  await page.waitForFunction(() => !window.__adStateQA.e.resolvingEvent);
  await page.waitForFunction(() => window.__adStateQA.e.eventPageReady);
  await page.evaluate(() => {
    const q = window.__adStateQA;
    if (q.calls.length || q.e.adResultShown || !q.e.adButton.interactable || !q.game.loadRoster().some(c => c?.pendingEvent)) throw Error('invisible button consumed an ad');
  });
  return await page.evaluate(beforeSecondClick => ({ beforeSecondClick, after: window.__adStateQA.snapshot(), calls: window.__adStateQA.calls.map(c => ({ withAd: c.withAd, id: c.id })) }), beforeSecondClick);
}

async (page) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
  await page.reload();
  await page.waitForFunction(() => {
    const cc = window.cc;
    const scene = cc?.director.getScene();
    return scene?.getComponentInChildren(cc.js.getClassByName('RecruitmentController'))?.ready
      && scene.getComponentInChildren(cc.js.getClassByName('PlayerEventController'))?.initialized;
  });
  const state = await page.evaluate(async () => {
    const cc = window.cc;
    const e = cc.director.getScene().getComponentInChildren(cc.js.getClassByName('PlayerEventController'));
    const game = [...window.System.entries()].map(([, m]) => m).find(m => m.loadSeasonState);
    await e.syncEventIndicators();
    const pending = game.loadRoster().filter(c => c?.pendingEvent).length;
    const icons = e.rosterSlots.filter(slot => {
      const node = slot.node.getChildByName('事件');
      return node?.activeInHierarchy && node.getComponent(cc.Sprite)?.spriteFrame;
    }).length;
    if (pending !== icons) throw Error('saved event icons did not load after refresh');
    return { eventTypes: e.config.events.map(event => event.id), probability: e.config.triggerProbability, pending, icons };
  });
  if (errors.length) throw Error(JSON.stringify(errors));
  return { passed: true, errors, state };
}

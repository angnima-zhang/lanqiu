async (page) => {
  await page.waitForFunction(() => window.cc?.js.getClassByName('TeamLevelController')?.instance?.getSnapshot()
    && window.cc.director.getScene().getComponentInChildren(window.cc.js.getClassByName('PlayerEventController'))?.initialized
    && window.cc.director.getScene().getComponentInChildren(window.cc.js.getClassByName('RecruitmentController'))?.ready);
  await page.evaluate(async () => {
    const cc = window.cc;
    const game = [...window.System.entries()].map(([, m]) => m).find(m => m.loadSeasonState);
    const pre = cc.js.getClassByName('PreMatchController').instance;
    await pre.ensureDataLoaded();
    const roster = pre.playerConfig.players.filter(p => p.quality === 3).slice(0, 12).map((p, i) => ({
      instanceId: 'event-check-' + i, templateId: p.id, sourcePlayerName: p.sourcePlayerName,
      displayName: p.displayName, position: p.position, qualityId: 3, qualityName: p.qualityName,
      overall: 1000 + i, attributes: pre.allocateAttributes(1000 + i, p.attributes), acquiredAtMs: Date.now(), lineupSinceMs: Date.now(),
    }));
    game.saveRoster(roster);
    const team = cc.js.getClassByName('TeamLevelController').instance;
    team.state.teamLevel = 100; team.saveState(); team.refreshView(false);
    game.setBudget(100000);
    const scene = cc.director.getScene();
    const c = scene.getComponentInChildren(cc.js.getClassByName('RecruitmentController'));
    const events = scene.getComponentInChildren(cc.js.getClassByName('PlayerEventController'));
    const qa = window.__eventQA = { game, c, events, checks: 0, counts: [] };
    events.config = { ...events.config, triggerProbability: 1 };
    const create = events.createRandomEvent;
    events.createRandomEvent = async function () { qa.checks++; return create.call(this); };
    game.gameStateEvents.on(game.GAME_STATE_EVENT_VALID_OPERATION_COMPLETED, count => qa.counts.push(count));
    c.autoDismissEnabled = false;
    c.beginContinuousRecruitment(23);
  });
  await page.waitForFunction(() => window.__eventQA.checks === 2 && !window.__eventQA.events.generatingEvent);
  const before = await page.evaluate(() => {
    const q = window.__eventQA;
    const pending = q.game.loadRoster().filter(c => c?.pendingEvent).map(c => c.instanceId);
    if (pending.length !== 2 || q.counts.length !== 1 || q.counts[0] !== 2 || q.c.continuousRecruitmentBatchCount !== 23) throw Error('23 pulls did not produce exactly two independent checks');
    return { pending, checks: q.checks, batch: q.c.continuousRecruitmentBatchCount };
  });
  for (let index = 0; index < 23; index++) {
    await page.waitForFunction(() => { const c = window.__eventQA.c; return c.pendingCard && c.resultPage?.activeInHierarchy && c.dismissButton?.interactable && !c.resultPageClosing; });
    await page.evaluate(() => window.__eventQA.c.onDismissClicked());
  }
  await page.waitForFunction(() => !window.__eventQA.c.continuousRecruitmentActive && !window.__eventQA.c.pendingCard);
  const after = await page.evaluate(() => {
    const q = window.__eventQA;
    return { checks: q.checks, pending: q.game.loadRoster().filter(c => c?.pendingEvent).map(c => c.instanceId) };
  });
  if (after.checks !== 2 || JSON.stringify(after.pending) !== JSON.stringify(before.pending)) throw Error('Checks duplicated or events disappeared after batch');
  return { passed: true, before, after };
}

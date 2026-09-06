async (page) => {
  await page.waitForFunction(() => window.cc?.js.getClassByName('TeamLevelController')?.instance?.getSnapshot());
  const position = await page.evaluate(async () => {
    const cc = window.cc;
    const scene = cc.director.getScene();
    const game = [...window.System.entries()].map(([, m]) => m).find(m => m.loadSeasonState);
    const r = scene.getComponentInChildren(cc.js.getClassByName('RecruitmentController'));
    const e = scene.getComponentInChildren(cc.js.getClassByName('PlayerEventController'));
    const t = cc.js.getClassByName('TeamLevelController').instance;
    const pre = cc.js.getClassByName('PreMatchController').instance;
    await pre.ensureDataLoaded();
    game.saveRoster(pre.playerConfig.players.filter(p => p.quality === 3).slice(0, 12).map((p, i) => ({
      instanceId: 'old-' + i, templateId: p.id, sourcePlayerName: p.sourcePlayerName,
      displayName: p.displayName, position: p.position, qualityId: 3, qualityName: p.qualityName,
      overall: 1, attributes: pre.allocateAttributes(1, p.attributes), acquiredAtMs: Date.now(), lineupSinceMs: Date.now(),
    })));
    game.saveSeasonState({ ...game.loadSeasonState(), officialWins: 10 });
    t.state.teamLevel = 10; t.state.willpower = t.getCurrentRequirement(); t.saveState(); t.refreshView(false);
    game.setBudget(1100);
    const qa = window.__recruitFix = { game, r, e, t, checks: 0, notifications: [] };
    e.config = { ...e.config, triggerProbability: 1 };
    const create = e.createRandomEvent;
    e.createRandomEvent = async function () { qa.checks++; return create.call(this); };
    game.gameStateEvents.on(game.GAME_STATE_EVENT_VALID_OPERATION_COMPLETED, n => qa.notifications.push(n));
    r.autoDismissEnabled = false;
    if (r.getMaxContinuousRecruitmentCount() !== 100 || t.getSnapshot().canUpgrade) throw Error('needs-win cap is wrong');
    const rect = document.querySelector('canvas').getBoundingClientRect();
    const visible = cc.view.getVisibleSize();
    const point = r.recruitButton.node.worldPosition;
    return { x: rect.x + point.x / visible.width * rect.width, y: rect.bottom - point.y / visible.height * rect.height };
  });
  await page.mouse.move(position.x, position.y);
  await page.mouse.down();
  await page.waitForFunction(() => window.__recruitFix.r.continuousRecruitReady);
  await page.waitForFunction(() => window.__recruitFix.r.continuousRecruitCount >= 15);
  const held = await page.evaluate(() => {
    const r = window.__recruitFix.r;
    const seconds = (Date.now() - r.continuousRecruitHoldStartedAtMs) / 1000;
    const expected = Math.min(100, Math.floor(5 + Math.max(0, seconds - 1) * 10));
    if (Math.abs(expected - r.continuousRecruitCount) > 1) throw Error('hold speed is not 10/s');
    return { count: r.continuousRecruitCount, seconds };
  });
  await page.mouse.up();
  await page.waitForFunction(() => window.__recruitFix.r.continuousRecruitmentActive);
  const started = await page.evaluate(() => {
    const q = window.__recruitFix;
    if (q.checks !== 0 || q.game.loadRoster().some(c => c?.pendingEvent)) throw Error('events ran before replacements finished');
    const batch = q.r.continuousRecruitmentBatchCount;
    if (q.game.getBudget() !== 1100 - batch * 11) throw Error('selected count and charge differ');
    return { batch, budget: q.game.getBudget(), pendingChecks: q.r.continuousRecruitmentEventCheckCount };
  });
  for (let i = 0; i < started.batch; i++) {
    await page.waitForFunction(() => { const r = window.__recruitFix.r; return r.pendingCard && r.resultPage.activeInHierarchy && r.replaceButton.interactable && !r.resultPageClosing; });
    await page.evaluate(() => window.__recruitFix.r.onReplaceClicked());
  }
  await page.waitForFunction(() => { const q = window.__recruitFix; return !q.r.continuousRecruitmentActive && !q.e.generatingEvent; });
  await page.waitForFunction(() => window.__recruitFix.r.rosterSlots.some(s => s.node.getChildByName('事件')?.activeInHierarchy));
  const settled = await page.evaluate(() => {
    const q = window.__recruitFix;
    const roster = q.game.loadRoster();
    const pending = roster.filter(c => c?.pendingEvent);
    if (roster.some(c => c?.instanceId.startsWith('old-')) || pending.length === 0 || pending.some(c => c.instanceId.startsWith('old-'))) throw Error('events lost with replacements');
    if (q.checks !== q.notifications[0] || q.notifications.length !== 1) throw Error('event checks not dispatched exactly once');
    return { checks: q.checks, notifications: q.notifications, pending: pending.map(c => ({ id: c.instanceId, type: c.pendingEvent.type })) };
  });
  await page.screenshot({ path: 'D:/篮球/output/playwright/recruit-event-fix-20260828/after-replacements.png' });
  return { passed: true, held, started, settled };
}

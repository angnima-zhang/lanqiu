async (page) => {
  const runs = [];
  for (const probability of [1, 0.3]) {
    const start = await page.evaluate(async probability => {
      const cc = window.cc;
      const q = window.__recruitFix;
      const pre = cc.js.getClassByName('PreMatchController').instance;
      const templates = pre.playerConfig.players.filter(p => p.quality === 15).slice(0, 12);
      if (templates.length !== 12) throw Error('missing GOAT fixture');
      q.game.saveRoster(templates.map((p, i) => ({
        instanceId: 'auto-kept-' + i, templateId: p.id, sourcePlayerName: p.sourcePlayerName,
        displayName: p.displayName, position: p.position, qualityId: 15, qualityName: p.qualityName,
        overall: 1000000, attributes: pre.allocateAttributes(1000000, p.attributes), acquiredAtMs: Date.now(), lineupSinceMs: Date.now(),
      })));
      q.game.saveSeasonState({ ...q.game.loadSeasonState(), officialWins: 82 });
      q.t.state.teamLevel = 81; q.t.state.willpower = q.t.getCurrentRequirement(); q.t.saveState(); q.t.refreshView(false);
      q.game.setBudget(100000);
      q.r.autoDismissEnabled = true;
      q.e.config = { ...q.e.config, triggerProbability: probability };
      q.checks = 0; q.notifications.length = 0;
      if (!q.t.getSnapshot().canUpgrade) throw Error('direct-upgrade fixture invalid');
      q.r.pendingContinuousRecruitmentCount = 230;
      q.r.onRecruitClicked();
      if (q.r.continuousRecruitmentBatchCount !== 230 || q.checks !== 0 || q.r.continuousRecruitmentEventCheckCount !== 23) throw Error('wrong batch start');
      return { count: q.r.continuousRecruitmentBatchCount, pendingChecks: q.r.continuousRecruitmentEventCheckCount, budget: q.game.getBudget() };
    }, probability);
    await page.waitForFunction(() => { const q = window.__recruitFix; return !q.r.continuousRecruitmentActive && q.checks === 23 && !q.e.generatingEvent; });
    const finish = await page.evaluate(probability => {
      const q = window.__recruitFix;
      const roster = q.game.loadRoster();
      const pending = roster.filter(c => c?.pendingEvent);
      if (q.r.autoDismissCount !== 230 || q.notifications.length !== 1 || q.notifications[0] !== 23) throw Error('auto dismissal or checks did not finish');
      if (roster.some(c => !c || !c.instanceId.startsWith('auto-kept-'))) throw Error('auto dismissal replaced a player');
      if (probability === 1 && pending.length !== 12) throw Error('forced hits were lost');
      if (q.r.recruitmentInputBlocker?.active || !q.r.recruitButton.interactable) throw Error('buttons stayed locked');
      return { checks: q.checks, notifications: q.notifications, autoDismissed: q.r.autoDismissCount, eventCount: pending.length, eventTypes: [...new Set(pending.map(c => c.pendingEvent.type))], unlocked: true };
    }, probability);
    runs.push({ probability, start, finish });
  }
  await page.screenshot({ path: 'D:/篮球/output/playwright/recruit-event-fix-20260828/after-230-auto-dismiss.png' });
  return { passed: true, runs };
}

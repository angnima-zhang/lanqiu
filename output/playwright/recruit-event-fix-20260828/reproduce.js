async (page) => {
  return await page.evaluate(async () => {
    const cc = window.cc;
    const scene = cc.director.getScene();
    const game = [...window.System.entries()].map(([, m]) => m).find(m => m.loadSeasonState);
    const r = scene.getComponentInChildren(cc.js.getClassByName('RecruitmentController'));
    const e = scene.getComponentInChildren(cc.js.getClassByName('PlayerEventController'));
    const t = cc.js.getClassByName('TeamLevelController').instance;
    game.saveSeasonState({ ...game.loadSeasonState(), officialWins: 10 });
    t.state.teamLevel = 10; t.state.willpower = t.getCurrentRequirement(); t.saveState(); t.refreshView(false);
    game.setBudget(1000000);
    const full = { team: t.getSnapshot(), max: r.getMaxContinuousRecruitmentCount(), budgetLimit: r.getBudgetRecruitmentCount(), hint: r.continuousRecruitRichText.string };
    const pre = cc.js.getClassByName('PreMatchController').instance;
    await pre.ensureDataLoaded();
    const roster = pre.playerConfig.players.filter(p => p.quality === 3).slice(0, 12).map((p, i) => ({
      instanceId: 'old-' + i, templateId: p.id, sourcePlayerName: p.sourcePlayerName,
      displayName: p.displayName, position: p.position, qualityId: 3, qualityName: p.qualityName,
      overall: 100, attributes: pre.allocateAttributes(100, p.attributes), acquiredAtMs: Date.now(), lineupSinceMs: Date.now(),
    }));
    game.saveRoster(roster);
    t.state.teamLevel = 100; t.saveState(); t.refreshView(false);
    const qa = window.__recruitFix = { game, r, e, t, checks: 0 };
    e.config = { ...e.config, triggerProbability: 1 };
    const create = e.createRandomEvent;
    e.createRandomEvent = async function () { qa.checks++; return create.call(this); };
    r.autoDismissEnabled = false;
    r.beginContinuousRecruitment(230);
    while (e.generatingEvent) await new Promise(resolve => setTimeout(resolve, 10));
    return { full, batch: r.continuousRecruitmentBatchCount, checks: qa.checks, pending: game.loadRoster().filter(c => c?.pendingEvent).length, cheat: game.isCheatModeEnabled() };
  });
}

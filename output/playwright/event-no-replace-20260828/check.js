async (page) => {
  await page.waitForFunction(() => {
    const cc = window.cc;
    return cc?.director.getScene()?.getComponentInChildren(cc.js.getClassByName('RecruitmentController'))?.ready;
  });
  await page.evaluate(async () => {
    const cc = window.cc;
    const scene = cc.director.getScene();
    const game = [...window.System.entries()].map(([, m]) => m).find(m => m.loadSeasonState);
    const r = scene.getComponentInChildren(cc.js.getClassByName('RecruitmentController'));
    const e = scene.getComponentInChildren(cc.js.getClassByName('PlayerEventController'));
    const t = cc.js.getClassByName('TeamLevelController').instance;
    const pre = cc.js.getClassByName('PreMatchController').instance;
    await pre.ensureDataLoaded();
    const q = window.__noReplace = { game, r, e, t, pre, checks: 0, notifications: [], shown: 0 };
    const create = e.createRandomEvent;
    e.createRandomEvent = async function () { q.checks++; return create.call(this); };
    const show = r.showRecruitmentResult;
    r.showRecruitmentResult = async function (...args) { q.shown++; return show.apply(this, args); };
    game.gameStateEvents.on(game.GAME_STATE_EVENT_VALID_OPERATION_COMPLETED, n => q.notifications.push(n));
    q.fresh = pre.playerConfig.players.filter(p => p.quality === 15).slice(0, 12).map((p, i) => ({
      instanceId: 'kept-' + i, templateId: p.id, sourcePlayerName: p.sourcePlayerName,
      displayName: p.displayName, position: p.position, qualityId: 15, qualityName: p.qualityName,
      overall: 1000000, attributes: pre.allocateAttributes(1000000, p.attributes),
      acquiredAtMs: Date.now(), lineupSinceMs: Date.now(), matchesPlayed: 0, retirementMatchLimit: 5,
    }));
    game.saveSeasonState({ ...game.loadSeasonState(), officialWins: 76 });
    t.state.teamLevel = 75; t.state.willpower = t.getCurrentRequirement(); t.saveState(); t.refreshView(false);
    game.setBudget(1000000);
    r.autoDismissEnabled = true;
    game.saveRoster(structuredClone(q.fresh));
  });
  const runs = [];
  async function batch(label, probability, expectedEvents) {
    const start = await page.evaluate(({ probability }) => {
      const q = window.__noReplace;
      q.e.config = { ...q.e.config, triggerProbability: probability };
      q.checks = 0; q.notifications = []; q.shown = 0;
      q.r.pendingContinuousRecruitmentCount = 90;
      q.r.onRecruitClicked();
      if (q.r.continuousRecruitmentBatchCount !== 90) throw Error('batch size mismatch');
      return { batch: q.r.continuousRecruitmentBatchCount, storedChecks: q.r.continuousRecruitmentEventCheckCount };
    }, { probability });
    await page.waitForFunction(() => {
      const q = window.__noReplace;
      return !q.r.continuousRecruitmentActive && !q.e.generatingEvent && q.checks === 9;
    });
    const finish = await page.evaluate(() => {
      const q = window.__noReplace;
      const roster = q.game.loadRoster();
      return { checks: q.checks, notifications: q.notifications, autoDismissed: q.r.autoDismissCount,
        resultPages: q.shown, pending: roster.filter(c => c?.pendingEvent).length,
        statuses: roster.filter(c => c?.activeInjury || c?.activeTraining).length,
        matchesPlayed: roster.map(c => c?.matchesPlayed),
        injuries: roster.map(c => c?.activeInjury?.remainingMatches ?? 0),
        training: roster.map(c => c?.activeTraining?.remainingMatches ?? 0),
        unchangedPlayers: roster.every((c, i) => c?.instanceId === q.fresh[i].instanceId) };
    });
    if (finish.autoDismissed !== 90 || finish.resultPages !== 0 || !finish.unchangedPlayers) throw Error('not all-auto-dismiss');
    if (finish.notifications.length !== 1 || finish.notifications[0] !== 9) throw Error('missing dispatch');
    if (expectedEvents !== undefined && finish.pending !== expectedEvents) throw Error('unexpected events: ' + JSON.stringify(finish));
    runs.push({ label, probability, start, finish });
  }
  await batch('healthy-real-probability', 0.3);
  await page.evaluate(() => window.__noReplace.game.saveRoster(structuredClone(window.__noReplace.fresh)));
  await batch('healthy-forced-hit', 1, 9);
  await page.evaluate(() => {
    const q = window.__noReplace;
    // Apply real injury/training resolutions to a fresh roster, as if all twelve were already handled.
    const roster = structuredClone(q.fresh);
    roster.forEach((card, i) => {
      const type = i % 2 ? 'training' : 'injury';
      const definition = q.e.definitions.get(type);
      card.pendingEvent = { type, occurredAtMs: Date.now() + i,
        overallDelta: q.e.resolveOverallDelta(definition, card.overall), recoveryMatches: definition.recoveryMatches };
      q.e.applyEventResolution(roster, i, card, false);
    });
    q.game.saveRoster(roster);
  });
  for (let i = 0; i < 6; i++) await batch('all-status-active-batch-' + (i + 1), 1, 0);
  await page.evaluate(() => {
    const q = window.__noReplace;
    const roster = q.game.loadRoster();
    // Only slot 0 is replaced with a status-free player; preserve all other slots' state.
    roster[0] = { ...structuredClone(q.fresh[0]), instanceId: 'new-player-0' };
    q.fresh[0].instanceId = 'new-player-0';
    q.game.saveRoster(roster);
  });
  await batch('one-new-player', 1, 1);
  const afterMatches = await page.evaluate(async () => {
    const q = window.__noReplace;
    const roster = q.game.loadRoster();
    const pending = roster[0].pendingEvent;
    q.e.applyEventResolution(roster, 0, roster[0], false);
    q.game.saveRoster(roster);
    for (let i = 0; i < 3; i++) q.e.advancePlayerMatchState('qa-match-' + i, roster.map(c => c.instanceId));
    const statuses = q.game.loadRoster().filter(c => c.activeInjury || c.activeTraining).length;
    await q.e.tryCreateRandomEvent(9);
    return { statusesAfterThreeMatches: statuses, eventsAfterThreeMatches: q.game.loadRoster().filter(c => c.pendingEvent).length };
  });
  if (afterMatches.statusesAfterThreeMatches !== 0 || afterMatches.eventsAfterThreeMatches !== 9) throw Error('match expiry failed');
  return { passed: true, runs, afterMatches };
}

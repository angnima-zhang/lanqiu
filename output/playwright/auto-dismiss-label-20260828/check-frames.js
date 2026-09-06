async (page) => {
  await page.waitForFunction(() => window.cc?.director.getScene()?.getComponentInChildren(window.cc.js.getClassByName('RecruitmentController'))?.ready);
  await page.evaluate(async () => {
    const cc = window.cc;
    const scene = cc.director.getScene();
    const game = [...window.System.entries()].map(([, m]) => m).find(m => m.loadSeasonState);
    const r = scene.getComponentInChildren(cc.js.getClassByName('RecruitmentController'));
    const e = scene.getComponentInChildren(cc.js.getClassByName('PlayerEventController'));
    const t = cc.js.getClassByName('TeamLevelController').instance;
    const pre = cc.js.getClassByName('PreMatchController').instance;
    await pre.ensureDataLoaded();
    game.saveRoster(pre.playerConfig.players.filter(p => p.quality === 15).slice(0, 12).map((p, i) => ({
      instanceId: 'label-' + i, templateId: p.id, sourcePlayerName: p.sourcePlayerName, displayName: p.displayName,
      position: p.position, qualityId: p.quality, qualityName: p.qualityName, overall: 1000000,
      attributes: pre.allocateAttributes(1000000, p.attributes), acquiredAtMs: Date.now(), lineupSinceMs: Date.now(),
    })));
    game.saveSeasonState({ ...game.loadSeasonState(), officialWins: 82 });
    t.state.teamLevel = 81; t.state.willpower = t.getCurrentRequirement(); t.saveState(); t.refreshView(false);
    game.setBudget(100000);
    e.config = { ...e.config, triggerProbability: 0 };
    r.autoDismissEnabled = true;
    window.__labelQA = { r, e, game, runs: [] };
  });
  for (const count of [58, 56, 230]) {
    await page.evaluate(count => {
      const q = window.__labelQA;
      const run = { count, startedAtMs: Date.now(), frames: [], changes: [], finishedAtMs: 0 };
      q.runs.push(run); q.current = run;
      const cc = window.cc;
      q.sample = () => {
        const text = q.r.continuousRecruitRichText.string.replace(/<[^>]+>/g, '');
        const elapsed = Date.now() - run.startedAtMs;
        run.frames.push({ elapsed, text, actual: q.r.autoDismissCount });
        if (text !== run.changes.at(-1)?.text) run.changes.push({ elapsed, text });
        if (!q.r.continuousRecruitmentActive) run.finishedAtMs = Date.now();
      };
      cc.director.on(cc.Director.EVENT_AFTER_DRAW, q.sample);
      q.r.beginContinuousRecruitment(count);
    }, count);
    await page.waitForFunction(() => !!window.__labelQA.current.finishedAtMs);
    await page.evaluate(() => { const cc = window.cc; cc.director.off(cc.Director.EVENT_AFTER_DRAW, window.__labelQA.sample); });
  }
  return await page.evaluate(() => window.__labelQA.runs.map(run => {
    const finalFrames = run.frames.filter(f => f.text === '自动解雇X' + run.count);
    if (finalFrames.length < 2 || finalFrames.at(-1).elapsed - finalFrames[0].elapsed < 200) throw Error('final count not visible long enough for ' + run.count);
    if (run.frames.at(-1).actual !== run.count || run.frames.at(-1).text.startsWith('自动解雇')) throw Error('wrong final count or default label not restored');
    return { requested: run.count, actualLast: run.frames.at(-1).actual, maxVisible: Math.max(0, ...run.frames.map(f => Number(/^自动解雇X(\d+)$/.exec(f.text)?.[1] ?? 0))), finalFrames: finalFrames.length, finalVisibleMs: finalFrames.length ? finalFrames.at(-1).elapsed - finalFrames[0].elapsed : 0, elapsedMs: run.finishedAtMs - run.startedAtMs, lastChanges: run.changes.slice(-5) };
  }));
}

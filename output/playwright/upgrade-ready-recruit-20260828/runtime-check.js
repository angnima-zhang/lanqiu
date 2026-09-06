async (page) => {
  await page.waitForFunction(() => window.cc?.js.getClassByName('TeamLevelController')?.instance?.getSnapshot()
    && window.cc.director.getScene().getComponentInChildren(window.cc.js.getClassByName('RecruitmentController'))?.ready);
  const result = await page.evaluate(() => {
    const cc = window.cc;
    const team = cc.js.getClassByName('TeamLevelController').instance;
    const c = cc.director.getScene().getComponentInChildren(cc.js.getClassByName('RecruitmentController'));
    const game = [...window.System.entries()].map(([, m]) => m).find(m => m.loadSeasonState);
    team.state.teamLevel = 10;
    team.state.willpower = 200;
    team.saveState();
    game.saveSeasonState({ ...game.loadSeasonState(), officialWins: 11, matchNumber: 12 });
    game.setBudget(1100);
    team.refreshView(false);
    if (!team.getSnapshot().canUpgrade) throw Error('Not upgrade-ready');
    if (c.getMaxContinuousRecruitmentCount() !== 100) throw Error('Willpower still limits recruitment');
    c.onRecruitTouchStart();
    c.unschedule(c.activateContinuousRecruitment);
    c.continuousRecruitHoldStartedAtMs = Date.now() - 1000;
    c.activateContinuousRecruitment();
    c.unschedule(c.growContinuousRecruitment);
    const samples = [];
    for (const [milliseconds, expected] of [[1000, 5], [2000, 15], [3000, 25]]) {
      c.continuousRecruitHoldStartedAtMs = Date.now() - milliseconds;
      c.growContinuousRecruitment();
      const text = c.continuousRecruitRichText.string.replace(/<[^>]+>/g, '');
      if (c.continuousRecruitCount !== expected || !text.includes('松开招募' + expected + '次')) throw Error('Hold count/label mismatch');
      samples.push({ milliseconds, count: c.continuousRecruitCount, text });
    }
    c.onRecruitTouchEnd();
    const selected = c.pendingContinuousRecruitmentCount;
    if (selected !== 25) throw Error('Release count mismatch');
    c.onRecruitClicked();
    if (c.continuousRecruitmentBatchCount !== selected || c.queuedContinuousRecruitments.length !== selected) throw Error('Selected count was truncated');
    if (team.getSnapshot().willpower !== 200) throw Error('Willpower overflowed');
    const spent = 1100 - c.budget;
    if (Math.abs(spent - 275) > 1) throw Error('Budget deduction mismatch');
    return { samples, selected, batch: c.continuousRecruitmentBatchCount, spent, canUpgrade: team.getSnapshot().canUpgrade };
  });
  await page.waitForTimeout(1800);
  return { passed: true, ...result };
}

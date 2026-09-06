async (page) => {
  await page.goto('http://localhost:7456');
  await page.waitForFunction(() => window.cc?.js.getClassByName('PreMatchController')?.instance);
  const preMatch = await page.evaluate(async () => {
    const cc = window.cc;
    const game = [...window.System.entries()].map(([, m]) => m).find(m => m.loadSeasonState);
    const pre = cc.js.getClassByName('PreMatchController').instance;
    await pre.ensureDataLoaded();
    const roster = pre.playerConfig.players.filter(p => p.quality === 15).slice(0, 12).map((p, i) => ({
      instanceId: 'infinite-name-test-' + i, templateId: p.id, sourcePlayerName: p.sourcePlayerName,
      displayName: p.displayName, position: p.position, qualityId: 15, qualityName: 'GOAT',
      overall: 10000000, attributes: { ...p.attributes }, acquiredAtMs: Date.now(), lineupSinceMs: Date.now(),
    }));
    game.saveRoster(roster);
    game.saveSeasonState({ ...game.loadSeasonState(), infiniteMode: true, matchNumber: 100, infiniteMatchNumber: 1, infiniteWins: 0, officialWins: 100 });
    await pre.openPage();
    const name = pre.findByPath(pre.page, '双方阵容/球队总览/对方球队/球队总评/球队名').getComponent(cc.Label).string;
    if (name !== '篮球概念神' || pre.preparedMatch.opponentTeamName !== name) throw Error('Pre-match name mismatch');
    window.__nameQA = { pre, game };
    return { name, snapshotName: pre.preparedMatch.opponentTeamName, schedule: pre.preparedMatch.scheduleLabel };
  });
  await page.waitForTimeout(3200);
  await page.screenshot({ path: 'D:/篮球/output/playwright/infinite-team-name-20260828/pre-match.png' });
  await page.evaluate(() => window.__nameQA.pre.startMatch());
  await page.waitForFunction(() => window.cc.director.getScene()?.name === 'Match' && window.cc.find('Canvas')?.getComponent('MatchController')?.initialized);
  const match = await page.evaluate(() => {
    const cc = window.cc;
    const c = cc.find('Canvas').getComponent('MatchController');
    const label = cc.find('Canvas/比赛页面/比分/对方球队/球队名')?.getComponent(cc.Label);
    if (c.session.opponentTeamName !== '篮球概念神' || label?.string !== '篮球概念神') throw Error('Match name mismatch');
    const name = label.string;
    c.result = c.createMatchResult(true);
    c.finishMatch();
    return { name, snapshotName: c.session.opponentTeamName };
  });
  await page.waitForTimeout(700);
  const resultName = await page.evaluate(() => {
    const cc = window.cc;
    const c = cc.find('Canvas').getComponent('MatchController');
    return c.victoryPage.getChildByName('比分').getChildByName('对手球队名').getComponent(cc.Label).string;
  });
  if (resultName !== '篮球概念神') throw Error('Result name mismatch');
  return { passed: true, preMatch, match, resultName };
}

async (page) => {
  await page.waitForFunction(() => window.cc.director.getScene().name === 'Homepage' && window.cc.js.getClassByName('TeamLevelController').instance?.getSnapshot());
  const level = await page.evaluate(() => {
    const cc = window.cc;
    const team = cc.js.getClassByName('TeamLevelController').instance;
    const before = team.getSnapshot().teamLevel;
    if (before === 0) team.onUpgradeButtonClicked();
    if (team.getSnapshot().teamLevel !== 1) throw Error('Upgrade failed');
    window.__ovrQA.game.setBudget(10000);
    window.__ovrQA.recruit = cc.director.getScene().getComponentInChildren(cc.js.getClassByName('RecruitmentController'));
    return team.getSnapshot().teamLevel;
  });
  const remaining = await page.evaluate(() => 12 - window.__ovrQA.game.loadRoster().filter(Boolean).length);
  for (let index = 0; index < remaining; index++) {
    await page.evaluate(() => window.__ovrQA.recruit.beginRecruitment());
    await page.waitForFunction(() => { const c = window.__ovrQA.recruit; return c.pendingCard && c.resultPage?.activeInHierarchy && !c.processing; });
    await page.evaluate(() => window.__ovrQA.recruit.onReplaceClicked());
    await page.waitForFunction(() => !window.__ovrQA.recruit.resultPage.active && !window.__ovrQA.recruit.pendingCard);
  }
  await page.evaluate(async () => {
    const pre = window.cc.js.getClassByName('PreMatchController').instance;
    window.__ovrQA.pre = pre;
    await pre.openPage();
  });
  await page.waitForTimeout(2300);
  const result = await page.evaluate(() => {
    const cc = window.cc;
    const pre = window.__ovrQA.pre;
    const labels = pre.playerTeamCardsRoot.children.slice(0, 12).map(n => n.getChildByName('总评').getComponent(cc.Label));
    if (labels.some(l => !l.string || l.actualFontSize <= 0 || !l.node.activeInHierarchy)) throw Error('OVR missing after recruitment');
    return { match: pre.preparedMatch.matchNumber, count: pre.preparedMatch.playerRoster.filter(Boolean).length, labels: labels.map(l => l.string) };
  });
  await page.screenshot({ path: 'D:/篮球/output/playwright/prematch-ovr-20260828/second-match.png' });
  return { passed: true, level, ...result };
}

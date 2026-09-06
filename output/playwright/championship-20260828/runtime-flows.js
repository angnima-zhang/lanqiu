async (page) => {
  const waitReady = () => page.waitForFunction(() => {
    const controller = window.cc.find('Canvas')?.getComponent('MatchController');
    return controller?.initialized && controller.championshipPage;
  }, null, { timeout: 30000 });
  const startAndFinish = async (number, infinite = false) => {
    await page.evaluate(({ number, infinite }) => window.__championshipQA.start(number, infinite), { number, infinite });
    await waitReady();
    const data = await page.evaluate(() => {
      const { game } = window.__championshipQA;
      const controller = window.cc.find('Canvas').getComponent('MatchController');
      const before = game.getBudget();
      controller.result = controller.createMatchResult(true);
      controller.finishMatch();
      return {
        gained: game.getBudget() - before,
        championship: controller.championshipPage.activeInHierarchy,
        ordinary: controller.victoryPage.activeInHierarchy,
        ordinaryAd: controller.victoryPage.getChildByName('看广告双倍领取').getComponent(window.cc.Button).interactable,
      };
    });
    await page.waitForTimeout(800);
    return data;
  };
  const lifecycleBefore = await page.evaluate(() => {
    const controller = window.cc.find('Canvas').getComponent('MatchController');
    const root = controller.championshipPage.getChildByName('全胜之后');
    const effect = root.getComponent('RainbowLabelCycle');
    root.active = false;
    const restored = effect.labels.every(({ label, original }) => label.color.equals(original));
    window.__championshipQA.hiddenPhase = effect.phase;
    return restored;
  });
  await page.waitForTimeout(300);
  const lifecycleAfter = await page.evaluate(() => {
    const root = window.cc.find('Canvas').getComponent('MatchController').championshipPage.getChildByName('全胜之后');
    const effect = root.getComponent('RainbowLabelCycle');
    const stopped = effect.phase === window.__championshipQA.hiddenPhase;
    root.active = true;
    return stopped;
  });
  if (!lifecycleBefore || !lifecycleAfter) throw Error('Rainbow lifecycle did not restore/stop');
  // Coordinates are from the inspected 480x900 championship screenshots.
  await page.mouse.click(290, 730);
  await page.waitForFunction(() => window.cc.director.getScene()?.name === 'Homepage', null, { timeout: 30000 });
  await page.waitForFunction(() => {
    const controller = window.cc.js.getClassByName('PreMatchController').instance;
    return controller?.page?.activeInHierarchy && controller?.preparedMatch?.matchId === 'infinite-1';
  }, null, { timeout: 30000 });
  const continueResult = await page.evaluate(() => window.cc.js.getClassByName('PreMatchController').instance.preparedMatch.matchId);
  await page.screenshot({ path: 'continue-endless-prematch.png' });
  const claimResult = await startAndFinish(100);
  if (!claimResult.championship || Math.abs(claimResult.gained - 100000) > 0.000001) throw Error('Second championship fixture failed: ' + JSON.stringify(claimResult));
  await page.mouse.click(240, 665);
  await page.waitForFunction(() => window.cc.director.getScene()?.name === 'Homepage', null, { timeout: 30000 });
  await page.waitForTimeout(800);
  const claimHome = await page.evaluate(() => !window.cc.js.getClassByName('PreMatchController').instance?.page?.activeInHierarchy);
  if (!claimHome) throw Error('Claim did not return home');
  await startAndFinish(100);
  await page.mouse.click(145, 730);
  await page.waitForFunction(() => window.cc.director.getScene()?.name === 'Homepage', null, { timeout: 30000 });
  await page.waitForTimeout(800);
  const returnHome = await page.evaluate(() => !window.cc.js.getClassByName('PreMatchController').instance?.page?.activeInHierarchy);
  if (!returnHome) throw Error('Return did not return home');
  const ordinary = await startAndFinish(99);
  if (ordinary.championship || !ordinary.ordinary || !ordinary.ordinaryAd || Math.abs(ordinary.gained - 149985) > 0.000001) throw Error('Ordinary victory regression: ' + JSON.stringify(ordinary));
  await page.screenshot({ path: 'ordinary-victory.png' });
  const infinite = await startAndFinish(100, true);
  if (infinite.championship || !infinite.ordinary || !infinite.ordinaryAd || Math.abs(infinite.gained - 101000) > 0.000001) throw Error('Infinite match 100 incorrectly treated as championship: ' + JSON.stringify(infinite));
  await page.evaluate(results => { window.__championshipQA.flowResults = results; }, {
    lifecycleBefore, lifecycleAfter, continueResult, claimHome, returnHome, ordinary, infinite,
  });
  return 'PASS: all championship buttons, rainbow lifecycle, ordinary victory, infinite match 100';
}

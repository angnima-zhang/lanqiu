async (page) => {
  await page.waitForFunction(() => window.cc?.js.getClassByName('TeamLevelController')?.instance?.ready);
  await page.evaluate(() => {
    const c = window.cc.js.getClassByName('TeamLevelController').instance;
    const game = [...window.System.entries()].map(([, m]) => m).find(m => m.loadSeasonState);
    window.__pulseQA = { c, game };
  });
  const prepare = (level, full, wins) => page.evaluate(({ level, full, wins }) => {
    const { c, game } = window.__pulseQA;
    game.saveSeasonState({ ...game.loadSeasonState(), officialWins: wins });
    c.state = { version: 2, teamLevel: level, willpower: full ? c.getRequirementForLevel(level) : 0 };
    c.refreshView(false);
  }, { level, full, wins });
  const sample = async () => {
    const scales = [];
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(170);
      scales.push(await page.evaluate(() => window.__pulseQA.c.upgradeButton.node.scale.x));
    }
    const state = await page.evaluate(() => {
      const c = window.__pulseQA.c;
      return { title: c.upgradeButtonLabel.string, level: c.state.teamLevel,
        baseScale: c.buttonBaseScale.x, enabled: c.upgradeButton.interactable, willpower: c.willpowerLabel.string };
    });
    return { ...state, scales, moving: Math.max(...scales) - Math.min(...scales) > 0.001 };
  };
  await prepare(1, false, 0);
  const unavailable = await sample();
  if (unavailable.moving || unavailable.enabled) throw Error('Unavailable upgrade is pulsing');
  await prepare(1, true, 0);
  const winUpgrade = await sample();
  if (!winUpgrade.moving || winUpgrade.title !== '获胜升级') throw Error('Win-upgrade hint lost');
  await prepare(99, true, 100);
  const manualUpgrade = await sample();
  if (!manualUpgrade.moving || manualUpgrade.title !== '升级') throw Error('Manual-upgrade hint lost');
  await page.evaluate(() => window.__pulseQA.c.onUpgradeButtonClicked());
  const maximum = await sample();
  if (maximum.level !== 100 || maximum.title !== '无限赛程' || maximum.willpower !== 'MAX'
    || maximum.moving || !maximum.enabled || maximum.scales.some(v => Math.abs(v - maximum.baseScale) > 0.00001)) throw Error('Max-level button still pulses or lost interaction');
  await page.evaluate(() => window.__pulseQA.c.refreshView(false));
  const refreshed = await sample();
  if (refreshed.moving || !refreshed.enabled) throw Error('Refreshing restarts the pulse');
  return { passed: true, unavailable, winUpgrade, manualUpgrade, maximum, refreshed };
}

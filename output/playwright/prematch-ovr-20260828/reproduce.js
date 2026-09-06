async (page) => {
  await page.waitForFunction(() => window.cc?.js.getClassByName('PreMatchController')?.instance);
  await page.evaluate(async () => {
    const cc = window.cc;
    const game = [...window.System.entries()].map(([, m]) => m).find(m => m.loadSeasonState);
    const pre = cc.js.getClassByName('PreMatchController').instance;
    await pre.ensureDataLoaded();
    const cards = pre.playerConfig.players.filter(p => p.quality === 3).slice(0, 12).map((p, i) => ({
      instanceId: 'ovr-check-' + i, templateId: p.id, sourcePlayerName: p.sourcePlayerName,
      displayName: p.displayName, position: p.position, qualityId: 3, qualityName: p.qualityName,
      overall: 1200 - i * 50, attributes: pre.allocateAttributes(1200 - i * 50, p.attributes),
      acquiredAtMs: Date.now(), lineupSinceMs: Date.now(),
    }));
    window.__ovrQA = { game, pre, cards };
    game.saveRoster([...cards.slice(0, 6), ...Array(6).fill(null)]);
    await pre.openPage();
  });
  await page.waitForTimeout(2300);
  const read = () => page.evaluate(() => {
    const cc = window.cc;
    return window.__ovrQA.pre.playerTeamCardsRoot.children.slice(0, 12).map((node, i) => {
      const label = node.getChildByName('总评').getComponent(cc.Label);
      const tr = label.node.getComponent('cc.UITransform');
      return { slot: i + 1, text: label.string, width: tr.width, height: tr.height,
        active: label.node.activeInHierarchy, enabled: label.enabled, overflow: label.overflow,
        fontSize: label.fontSize, actualFontSize: label.actualFontSize, alpha: label.color.a,
        vertices: label.renderData?.vertexCount,
      };
    });
  });
  const partial = await read();
  await page.evaluate(async () => {
    const { game, pre, cards } = window.__ovrQA;
    pre.closePage();
    game.saveRoster(cards);
    await pre.openPage();
  });
  await page.waitForTimeout(2300);
  const full = await read();
  await page.screenshot({ path: 'D:/篮球/output/playwright/prematch-ovr-20260828/fixed.png' });
  if (partial.some(card => card.width <= 0)) throw Error('Empty slot lost its text width');
  if (full.some(card => !card.text || card.width <= 0 || card.actualFontSize <= 0)) throw Error('Filled slot OVR is invisible');
  return { passed: true, partial, full };
}

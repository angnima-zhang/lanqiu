async (page) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.waitForFunction(() => {
    const cc = window.cc;
    return cc?.director.getScene()?.getComponentInChildren(cc.js.getClassByName('RecruitmentController'))?.conceptGodUpgradeConfig;
  });
  await page.evaluate(async () => {
    const cc = window.cc;
    const c = cc.director.getScene().getComponentInChildren(cc.js.getClassByName('RecruitmentController'));
    const game = [...window.System.entries()].map(([, m]) => m).find(m => m.loadSeasonState);
    game.saveSeasonState({ ...game.loadSeasonState(), infiniteMode: true, matchNumber: 100, infiniteMatchNumber: 1, infiniteWins: 0, officialWins: 100 });
    const qa = window.__conceptQA = { c, game };
    qa.make = (source, overall = 9330000, id = '') => {
      const p = c.playerConfig.players.find(p => p.sourcePlayerName === source && p.quality === 15);
      if (!p) throw Error('Missing GOAT template: ' + source);
      return { instanceId: 'concept-profile-' + source + id, templateId: p.id,
        sourcePlayerName: p.sourcePlayerName, displayName: p.displayName,
        position: p.position, qualityId: 15, qualityName: 'GOAT', overall,
        attributes: c.allocateAttributes(overall, p.attributes), acquiredAtMs: Date.now(), lineupSinceMs: Date.now(),
        ...(id ? { conceptGodId: id } : {}),
      };
    };
    qa.show = async card => {
      c.pendingCard = card;
      c.pendingDecision = c.getCurrentRecruitmentDecision();
      c.pendingUpgradeAdUsed = false;
      c.pendingWillpowerAdded = 0;
      c.resultPage.active = true;
      await c.showRecruitmentResult(card, c.pendingDecision, 0, true);
    };
    qa.snapshot = () => ({
      name: c.pendingCard.displayName, quality: c.pendingCard.qualityId,
      overall: c.pendingCard.overall, title: c.candidateProfileTitleLabel.string,
      lore: c.candidateProfileLabel.string, conceptId: c.pendingCard.conceptGodId,
      adUsed: c.pendingUpgradeAdUsed, adEnabled: c.upgradeAdButton.interactable,
      active: c.candidateProfileLabel.node.activeInHierarchy,
    });
    await qa.show(qa.make('LeBron James'));
    qa.before = qa.snapshot();
    // Force the minimum random result to reproduce the original regression.
    const originalRoll = c.rollOverall;
    c.rollOverall = min => min;
    try { await c.upgradePendingCardFromAd(); } finally { c.rollOverall = originalRoll; }
    qa.after = qa.snapshot();
    if (qa.after.overall < qa.before.overall || qa.after.title !== '这无敌了吧'
      || qa.after.lore !== c.conceptGodUpgradeConfig.conceptGodDefinitions['LeBron James'][0].lore
      || !qa.after.adUsed || qa.after.adEnabled || !qa.after.active) throw Error('GOAT ad upgrade regression: ' + JSON.stringify(qa.after));
    await c.upgradePendingCardFromAd();
    if (JSON.stringify(qa.snapshot()) !== JSON.stringify(qa.after)) throw Error('Repeated ad reward changed the card');
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'D:/篮球/output/playwright/concept-profile-20260828/lebron-concept.png' });
  const result = await page.evaluate(async () => {
    const qa = window.__conceptQA;
    const { c } = qa;
    const variants = [];
    for (const id of ['concept_god_023', 'concept_god_024']) {
      const card = qa.make('Tim Duncan', 9330000, id);
      if (!c.upgradeGoatToConceptGod(card)) throw Error('Duncan upgrade failed');
      await qa.show(card);
      const state = qa.snapshot();
      const definition = c.conceptGodUpgradeConfig.conceptGodDefinitions['Tim Duncan'].find(d => d.conceptGodId === id);
      if (state.lore !== definition.lore || state.title !== '这无敌了吧' || state.name !== definition.displayName) throw Error('Duncan variant lore mismatch');
      variants.push(state);
    }
    if (variants[0].lore === variants[1].lore) throw Error('Duncan variants share wrong lore');
    const jordan = qa.make('Michael Jordan');
    if (!c.upgradeGoatToConceptGod(jordan)) throw Error('Jordan upgrade failed');
    await qa.show(jordan);
    qa.longProfile = qa.snapshot();
    await qa.show(qa.make('LeBron James'));
    qa.normal = qa.snapshot();
    if (qa.normal.title !== '球员资料' || qa.normal.lore !== qa.before.lore || qa.normal.lore === qa.after.lore) throw Error('Normal profile was not restored');
    return { passed: true, before: qa.before, after: qa.after, variants, normal: qa.normal };
  });
  await page.screenshot({ path: 'D:/篮球/output/playwright/concept-profile-20260828/normal-profile-restored.png' });
  if (errors.length) throw Error(errors.join('\n'));
  return { ...result, pageErrors: errors };
}

async (page) => {
  await page.waitForFunction(() => window.cc?.director.getScene()?.getComponentInChildren(window.cc.js.getClassByName('RecruitmentController'))?.conceptGodUpgradeConfig);
  const setup = await page.evaluate(async () => {
    const cc = window.cc;
    const modules = [...window.System.entries()].map(([, m]) => m);
    const game = modules.find(m => m.loadSeasonState);
    const knowledge = modules.find(m => m.loadPlayerKnowledgeConfig);
    const c = cc.director.getScene().getComponentInChildren(cc.js.getClassByName('RecruitmentController'));
    const ui = cc.director.getScene().getComponentInChildren(cc.js.getClassByName('HomeUiController'));
    const definitions = Object.values(c.conceptGodUpgradeConfig.conceptGodDefinitions).flat();
    if (new Set(definitions.map(d => d.conceptGodId)).size !== 49 || definitions.some(d => d.lore.length < 53 || d.lore.length > 67)) throw Error('Runtime loaded stale lore');
    const d = definitions.reduce((a, b) => a.lore.length >= b.lore.length ? a : b);
    const source = Object.entries(c.conceptGodUpgradeConfig.conceptGodDefinitions).find(([, ds]) => ds.some(item => item.conceptGodId === d.conceptGodId))[0];
    const p = c.playerConfig.players.find(p => p.sourcePlayerName === source && p.quality === 15);
    const card = { instanceId: 'jr-copy-layout', templateId: p.id, sourcePlayerName: source, displayName: d.displayName,
      qualityId: 16, qualityName: '概念神', isConceptGod: true, conceptGodId: d.conceptGodId,
      position: p.position, overall: 10000000, attributes: c.allocateAttributes(10000000, p.attributes),
      acquiredAtMs: Date.now(), lineupSinceMs: Date.now() };
    c.pendingCard = card;
    c.pendingDecision = c.getCurrentRecruitmentDecision();
    c.pendingUpgradeAdUsed = false;
    c.resultPage.active = true;
    await c.showRecruitmentResult(card, c.pendingDecision, 0, true);
    if (c.candidateProfileTitleLabel.string !== '这无敌了吧' || c.candidateProfileLabel.string !== d.lore) throw Error('Recruitment profile mismatch');
    window.__jrQA = { c, ui, game, knowledge, card, d };
    return { name: d.displayName, lore: d.lore, length: d.lore.length, runtimeIdentities: 49 };
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'D:/篮球/output/playwright/jr-lore-20260828/recruitment-longest.png' });
  await page.evaluate(async () => {
    const { c, ui, game, knowledge, card } = window.__jrQA;
    c.resultPage.active = false;
    game.saveRoster([card]);
    const config = await knowledge.loadPlayerKnowledgeConfig();
    for (const question of config.players[card.sourcePlayerName].questions) knowledge.recordPlayerKnowledgeAnswer(card.sourcePlayerName, question.id, true);
    ui.openPlayerDetails(0);
  });
  await page.waitForFunction(() => {
    const root = window.__jrQA.ui.playerDetailsPage.getChildByName('球员知识');
    return root.getChildByName('题目').getComponent(window.cc.Label).string === '这无敌了吧';
  });
  await page.waitForTimeout(800);
  const details = await page.evaluate(() => {
    const q = window.__jrQA;
    const root = q.ui.playerDetailsPage.getChildByName('球员知识');
    const title = root.getChildByName('题目').getComponent(window.cc.Label).string;
    const text = root.getChildByName('问题').getComponent(window.cc.Label).string;
    if (text !== q.d.lore) throw Error('Detail profile mismatch');
    return { title, text };
  });
  await page.screenshot({ path: 'D:/篮球/output/playwright/jr-lore-20260828/details-longest.png' });
  return { passed: true, ...setup, details };
}

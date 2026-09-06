async (page) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.waitForFunction(() => window.cc?.director.getScene()?.getComponentInChildren(window.cc.js.getClassByName('RecruitmentController'))?.conceptGodUpgradeConfig);
  await page.evaluate(async () => {
    const cc = window.cc;
    const modules = [...window.System.entries()].map(([, m]) => m);
    const game = modules.find(m => m.loadSeasonState);
    const knowledge = modules.find(m => m.loadPlayerKnowledgeConfig);
    const ui = cc.director.getScene().getComponentInChildren(cc.js.getClassByName('HomeUiController'));
    const recruit = cc.director.getScene().getComponentInChildren(cc.js.getClassByName('RecruitmentController'));
    const config = recruit.conceptGodUpgradeConfig;
    const questions = await knowledge.loadPlayerKnowledgeConfig();
    const qa = window.__detailsQA = { game, knowledge, ui, recruit, config, questions };
    qa.make = (source, definition) => {
      const p = recruit.playerConfig.players.find(p => p.sourcePlayerName === source && p.quality === 15);
      if (!p) throw Error('Missing player template: ' + source);
      return { instanceId: 'concept-details-' + source, templateId: p.id, sourcePlayerName: source,
        displayName: definition?.displayName ?? p.displayName, position: p.position,
        qualityId: definition ? 16 : 15, qualityName: definition ? '概念神' : 'GOAT',
        isConceptGod: !!definition, ...(definition ? { conceptGodId: definition.conceptGodId } : {}),
        overall: 9330000, attributes: recruit.allocateAttributes(9330000, p.attributes),
        acquiredAtMs: Date.now(), lineupSinceMs: Date.now(),
      };
    };
    qa.progress = (source, all = true) => {
      const qs = questions.players[source].questions;
      const store = JSON.parse(cc.sys.localStorage.getItem('basketball.player-knowledge.v1') || '{}');
      store[source] = { currentQuestionIndex: all ? 0 : qs.length - 2,
        correctQuestionIds: [], wrongQuestionIds: qs.slice(0, all ? qs.length : -1).map(q => q.id),
        rewardOverallByQuestionId: {}, answerAllUnlocked: false };
      cc.sys.localStorage.setItem('basketball.player-knowledge.v1', JSON.stringify(store));
    };
    qa.snapshot = () => {
      const root = ui.playerDetailsPage.getChildByName('球员知识');
      const label = root.getChildByName('问题').getComponent(cc.Label);
      return { title: root.getChildByName('题目').getComponent(cc.Label).string,
        content: label.string, labelEnabled: label.enabled,
        richTextEnabled: !!root.getChildByName('问题').getComponent('cc.RichText')?.enabled,
        buttons: ['是', '否', '答对全部', '下一题'].map(n => ({ name: n, active: root.getChildByName(n).active })) };
    };
    const definition = config.conceptGodDefinitions['LeBron James'][0];
    qa.lebron = qa.make('LeBron James', definition);
    game.saveRoster([qa.lebron]);
    qa.progress('LeBron James', false);
    ui.openPlayerDetails(0);
  });
  await page.waitForFunction(() => window.__detailsQA.snapshot().richTextEnabled);
  const before = await page.evaluate(() => window.__detailsQA.snapshot());
  if (before.title === '这无敌了吧') throw Error('Lore shown before all questions answered');
  await page.evaluate(() => window.__detailsQA.ui.showNextPlayerKnowledgeQuestion());
  await page.waitForFunction(() => {
    const q = window.__detailsQA;
    return q.snapshot().title === '球员知识 ' + q.questions.players['LeBron James'].questions.length + '/' + q.questions.players['LeBron James'].questions.length;
  });
  await page.evaluate(() => {
    const q = window.__detailsQA;
    const questions = q.questions.players['LeBron James'].questions;
    return q.ui.answerPlayerKnowledge(questions[questions.length - 1].answer);
  });
  await page.waitForFunction(() => window.__detailsQA.snapshot().title === '这无敌了吧');
  const completed = await page.evaluate(() => {
    const q = window.__detailsQA;
    const state = q.snapshot();
    if (state.content !== q.config.conceptGodDefinitions['LeBron James'][0].lore || !state.labelEnabled
      || state.richTextEnabled || state.buttons.some(b => b.active)) throw Error('Completion UI mismatch');
    const card = q.game.loadRoster()[0];
    if (card.overall <= q.lebron.overall) throw Error('Last question reward was lost');
    return { ...state, rewardedOverall: card.overall };
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'D:/篮球/output/playwright/concept-details-20260828/answered-concept.png' });
  const coverage = await page.evaluate(async () => {
    const q = window.__detailsQA;
    const ids = new Set();
    for (const [source, defs] of Object.entries(q.config.conceptGodDefinitions)) {
      if (!q.questions.players[source]?.questions.length || !q.recruit.playerConfig.players.some(p => p.sourcePlayerName === source && p.quality === 15)) continue;
      q.progress(source);
      for (const d of defs) {
        const card = q.make(source, d);
        q.ui.currentKnowledgeSourceName = source;
        await q.ui.renderPlayerKnowledge(q.ui.playerDetailsPage, card);
        const s = q.snapshot();
        if (s.title !== '这无敌了吧' || s.content !== d.lore || s.buttons.some(b => b.active)) throw Error('Wrong lore: ' + d.conceptGodId);
        ids.add(d.conceptGodId);
      }
    }
    if (ids.size !== 49) throw Error('Incomplete concept coverage: ' + ids.size);
    q.progress('LeBron James');
    const normal = q.make('LeBron James');
    q.game.saveRoster([normal]);
    q.ui.currentKnowledgeSourceName = normal.sourcePlayerName;
    await q.ui.renderDetailedPlayerCard(q.ui.playerDetailsPage, normal);
    await q.ui.renderPlayerKnowledge(q.ui.playerDetailsPage, normal);
    const state = q.snapshot();
    if (state.title !== '球员荣誉' || state.content !== q.knowledge.formatPlayerProfile(q.questions.players['LeBron James'].profile)) throw Error('Normal honors were not restored');
    // Two renders for the same source must not let an old async load overwrite the newer card.
    const oldRender = q.ui.renderPlayerKnowledge(q.ui.playerDetailsPage, q.lebron);
    const latestRender = q.ui.renderPlayerKnowledge(q.ui.playerDetailsPage, normal);
    await Promise.all([oldRender, latestRender]);
    if (q.snapshot().title !== '球员荣誉') throw Error('Stale render overwrote normal profile');
    return { conceptIds: ids.size, normal: state, staleRenderGuard: true };
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'D:/篮球/output/playwright/concept-details-20260828/normal-honors.png' });
  if (errors.length) throw Error(errors.join('\n'));
  return { passed: true, before, completed, coverage, pageErrors: errors };
}

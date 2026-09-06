async (page) => {
  await page.waitForFunction(() => window.cc?.js.getClassByName('PreMatchController')?.instance);
  await page.evaluate(async () => {
    const cc = window.cc;
    const game = [...window.System.entries()].map(([, m]) => m).find(m => m.loadSeasonState);
    const pre = cc.js.getClassByName('PreMatchController').instance;
    await pre.ensureDataLoaded();
    const roster = pre.playerConfig.players.filter(p => p.quality === 15).slice(0, 12).map((p, i) => ({
      instanceId: `endless-roster-test-${i}`, templateId: p.id, sourcePlayerName: p.sourcePlayerName,
      displayName: p.displayName, position: p.position, qualityId: 15, qualityName: 'GOAT',
      overall: 10000000, attributes: { ...p.attributes }, acquiredAtMs: Date.now(), lineupSinceMs: Date.now(),
    }));
    game.saveRoster(roster);
    cc.sys.localStorage.setItem('basketball.team.progression.v2', JSON.stringify({ version: 2, teamLevel: 100, willpower: 0 }));
    game.setBudget(1000000);
    window.__opponentQA = { game, pre };
    window.__opponentQA.prepare = async (infinite, number) => {
      game.saveSeasonState({ ...game.loadSeasonState(), matchNumber: infinite ? 100 : number,
        infiniteMode: infinite, infiniteMatchNumber: infinite ? number : 1, infiniteWins: infinite ? number - 1 : 0,
        officialWins: infinite ? 100 + number - 1 : number - 1, opponentInjuredPlayerIndices: [],
        lastSettledMatchId: null, lastAdvancedMatchId: null, lastBaseRewardMatchId: null, lastAdRewardMatchId: null,
      });
      await pre.openPage();
      return pre.preparedMatch;
    };
    await window.__opponentQA.prepare(false, 100);
  });
  await page.waitForTimeout(3200);
  const snapshot = () => page.evaluate(() => {
    const cc = window.cc;
    const pre = window.__opponentQA.pre;
    const s = pre.preparedMatch;
    const cards = pre.opponentTeamCardsRoot.children.slice(0, 12);
    return {
      title: pre.findByPath(pre.page, '顶部/赛程').getComponent(cc.Label).string,
      roster: s.opponentRoster.map((card, index) => ({
        id: card.instanceId, source: card.sourcePlayerName, name: card.displayName, quality: card.qualityId,
        concept: !!card.isConceptGod, conceptId: card.conceptGodId, overall: card.overall,
        injury: !!card.activeInjury,
        labels: cards[index].getComponentsInChildren(cc.Label).filter(l => l.node.activeInHierarchy).map(l => l.string),
        frame: cards[index].getChildByName('边框').getComponent(cc.Sprite).spriteFrame?.uuid,
      })),
      overall: s.opponentOverall,
    };
  });
  const final = await snapshot();
  if (final.roster.length !== 12 || final.roster.some(card => card.quality !== 15 || card.concept)) throw Error('Final opponent is not all GOAT');
  if (final.overall !== final.roster.reduce((sum, card) => sum + card.overall, 0)) throw Error('Final opponent total mismatch');
  await page.screenshot({ path: 'final-all-goat.png' });
  await page.evaluate(() => window.__opponentQA.prepare(true, 1));
  await page.waitForTimeout(3200);
  const infinite = await snapshot();
  const god = infinite.roster.find(card => card.concept);
  if (infinite.title !== '无限赛程 第1场' || !god || god.quality !== 16 || !god.conceptId || !god.frame) throw Error('Infinite UI/concept mismatch');
  if (!god.labels.includes(god.name)) throw Error('Concept name is missing in visible UI');
  if (infinite.overall !== infinite.roster.reduce((sum, card) => sum + card.overall, 0)) throw Error('Infinite opponent total mismatch');
  await page.screenshot({ path: 'infinite-concept-opponent.png' });
  await page.evaluate(async () => {
    const { pre } = window.__opponentQA;
    pre.closePage();
    await pre.openPage();
  });
  await page.waitForTimeout(900);
  const reopened = await snapshot();
  if (JSON.stringify(reopened) !== JSON.stringify(infinite)) throw Error('Reopening rerolls the opponent');
  const injuredIndex = await page.evaluate(async () => {
    const { game, pre } = window.__opponentQA;
    const index = game.recordRandomOpponentInjuryAfterDefeat(pre.preparedMatch.matchId, pre.preparedMatch.opponentRoster);
    await pre.refreshPage();
    return index;
  });
  const injured = await snapshot();
  if (injured.roster[injuredIndex].injury !== true) throw Error('Opponent injury missing after refresh');
  if (injured.roster.some((card, i) => card.id !== infinite.roster[i].id || card.source !== infinite.roster[i].source || card.conceptId !== infinite.roster[i].conceptId)) throw Error('Defeat rerolls opponent identity');
  await page.evaluate(() => window.__opponentQA.pre.startMatch());
  await page.waitForFunction(() => window.cc.director.getScene()?.name === 'Match'
    && window.cc.find('Canvas')?.getComponent('MatchController')?.initialized, null, { timeout: 30000 });
  const match = await page.evaluate(() => {
    const c = window.cc.find('Canvas').getComponent('MatchController');
    const summary = { title: c.session.scheduleLabel, roster: c.session.opponentRoster.map(p => ({ name: p.displayName, concept: !!p.isConceptGod, id: p.conceptGodId })) };
    c.result = c.createMatchResult(true);
    c.finishMatch();
    return summary;
  });
  if (match.title !== '无限赛程 第1场' || !match.roster.some(card => card.concept && card.id === god.conceptId)) throw Error('Match session lost concept identity/title');
  await page.waitForTimeout(800);
  const resultTitle = await page.evaluate(() => window.cc.find('Canvas').getComponent('MatchController').victoryPage.getChildByName('赛程').getChildByName('赛程').getComponent(window.cc.Label).string);
  if (resultTitle !== '无限赛程 第1场') throw Error('Victory title is stale');
  await page.evaluate(result => { window.__opponentQA.result = result; }, { final, infinite, injuredIndex, match, resultTitle });
  return { passed: true, finalQualities: final.roster.map(card => card.quality), infiniteConcept: god.name, title: infinite.title, injuredIndex, resultTitle };
}

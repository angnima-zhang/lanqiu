async (page) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.waitForFunction(() => window.cc?.js.getClassByName('PreMatchController')?.instance);
  const result = await page.evaluate(async () => {
    const cc = window.cc;
    const game = [...window.System.entries()].map(([, m]) => m).find(m => m.loadSeasonState);
    const pre = cc.js.getClassByName('PreMatchController').instance;
    await pre.ensureDataLoaded();
    const roster = pre.playerConfig.players.filter(p => p.quality === 15).slice(0, 12).map((p, i) => ({
      instanceId: 'infinite-lineup-test-' + i, templateId: p.id, sourcePlayerName: p.sourcePlayerName,
      displayName: p.displayName, position: p.position, qualityId: 15, qualityName: 'GOAT',
      overall: 10000000, attributes: { ...p.attributes }, acquiredAtMs: Date.now(), lineupSinceMs: Date.now(),
    }));
    game.saveRoster(roster);
    cc.sys.localStorage.setItem('basketball.team.progression.v2', JSON.stringify({ version: 2, teamLevel: 100, willpower: 0 }));
    const check = (round) => {
      const s = pre.preparedMatch;
      const gods = s.opponentRoster.filter(c => c.isConceptGod);
      if (s.opponentTeamName !== '篮球概念神') throw Error('Team name changed');
      if (s.scheduleLabel !== '无限赛程 第' + round + '场') throw Error('Schedule mismatch');
      if (s.opponentOverall !== s.opponentRoster.reduce((sum, c) => sum + c.overall, 0)) throw Error('Team OVR mismatch');
      if (round <= 49) {
        if (gods.length !== 1 || gods[0].conceptGodId !== 'concept_god_' + String(round).padStart(3, '0')) throw Error('Wrong leader');
        if (s.opponentRoster.filter(c => c.qualityId === 15).length !== 11) throw Error('Not 11 GOAT');
      } else if (gods.length !== 12 || new Set(gods.map(c => c.conceptGodId)).size !== 12) throw Error('Not 12 unique gods');
      s.opponentRoster.forEach((card, index) => {
        const node = pre.opponentTeamCardsRoot.children[index];
        if (node.getChildByName('名字').getComponent(cc.Label).string !== card.displayName) throw Error('Rendered name mismatch');
        if (!node.getChildByName('头像').getComponent(cc.Sprite).spriteFrame) throw Error('Missing portrait');
        if (!node.getChildByName('边框').getComponent(cc.Sprite).spriteFrame) throw Error('Missing frame');
      });
      return { round, concepts: gods.length, leader: gods[0].displayName, overall: s.opponentOverall };
    };
    const checked = [];
    for (const round of [1, 23, 24, 49]) {
      game.saveSeasonState({ ...game.loadSeasonState(), infiniteMode: true, matchNumber: 100,
        infiniteMatchNumber: round, infiniteWins: round - 1, officialWins: 100 + round - 1,
        opponentInjuredPlayerIndices: [], lastAdvancedMatchId: null,
      });
      await pre.refreshPage();
      checked.push(check(round));
    }
    if (!game.advanceSeasonAfterWin('infinite-49')) throw Error('Could not advance boundary');
    await pre.openPage();
    checked.push(check(50));
    const before = JSON.stringify(pre.preparedMatch.opponentRoster);
    pre.closePage();
    await pre.openPage();
    if (before !== JSON.stringify(pre.preparedMatch.opponentRoster)) throw Error('Reopening rerolls roster');
    const injuredIndex = game.recordRandomOpponentInjuryAfterDefeat('infinite-50', pre.preparedMatch.opponentRoster);
    await pre.refreshPage();
    const injured = JSON.parse(JSON.stringify(pre.preparedMatch.opponentRoster));
    if (!injured[injuredIndex].activeInjury) throw Error('Injury missing');
    if (!pre.opponentTeamCardsRoot.children[injuredIndex].getChildByName('伤病').active) throw Error('Injury icon hidden');
    if (game.loadSeasonState().infiniteMatchNumber !== 50) throw Error('Defeat advanced round');
    const previous = JSON.parse(before);
    if (injured.some((card, i) => card.conceptGodId !== previous[i].conceptGodId)) throw Error('Injury rerolls gods');
    await pre.refreshPage();
    if (JSON.stringify(injured) !== JSON.stringify(pre.preparedMatch.opponentRoster)) throw Error('Repeated injury applied');
    if (!game.advanceSeasonAfterWin('infinite-50')) throw Error('Could not advance to 51');
    await pre.refreshPage();
    checked.push(check(51));
    if (pre.preparedMatch.opponentRoster.some(c => c.activeInjury)) throw Error('Injury carried to next opponent');
    window.__infiniteLineupQA = { pre, game };
    return { checked, injuredIndex, boundaryPassed: true, retryPassed: true };
  });
  await page.waitForTimeout(3200);
  await page.screenshot({ path: 'D:/篮球/output/playwright/infinite-lineup-20260828/all-concept-opponent.png' });
  await page.evaluate(() => window.__infiniteLineupQA.pre.startMatch());
  await page.waitForFunction(() => window.cc.director.getScene()?.name === 'Match' && window.cc.find('Canvas')?.getComponent('MatchController')?.initialized);
  const match = await page.evaluate(() => {
    const c = window.cc.find('Canvas').getComponent('MatchController');
    if (c.session.opponentRoster.length !== 12 || c.session.opponentRoster.some(card => !card.isConceptGod)) throw Error('Match lost concept lineup');
    return { name: c.session.opponentTeamName, concepts: c.session.opponentRoster.length };
  });
  if (errors.length) throw Error(JSON.stringify(errors));
  return { passed: true, ...result, match, errors };
}

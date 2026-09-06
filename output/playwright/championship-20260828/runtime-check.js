async (page) => {
  await page.evaluate(async () => {
    const cc = window.cc;
    const modules = [...window.System.entries()].map(([, value]) => value);
    const game = modules.find(value => value.loadSeasonState);
    const sessionModule = modules.find(value => value.setCurrentMatchSession);
    const { MatchController } = modules.find(value => value.MatchController);
    const config = await game.loadJson('data/player_config_fame_v3');
    const roster = config.players.filter(player => player.quality === 15).slice(0, 12)
      .map((player, index) => ({
        instanceId: `championship-qa-${index}`, templateId: player.id,
        sourcePlayerName: player.sourcePlayerName, displayName: player.displayName,
        position: player.position, qualityId: 15, qualityName: 'GOAT',
        overall: 1000000, attributes: { ...player.attributes },
        acquiredAtMs: Date.now(), lineupSinceMs: Date.now(),
      }));
    game.saveRoster(roster);
    cc.sys.localStorage.setItem('basketball.team.progression.v2', JSON.stringify({
      version: 2, teamLevel: 100, willpower: 0,
    }));
    game.setBudget(1000);
    window.__championshipQA = { game, sessionModule, MatchController, roster };
    window.__championshipQA.start = async (matchNumber, infiniteMode = false) => {
      game.saveSeasonState({
        ...game.loadSeasonState(), matchNumber: infiniteMode ? 100 : matchNumber,
        infiniteMode, infiniteMatchNumber: infiniteMode ? matchNumber : 1,
        infiniteWins: infiniteMode ? matchNumber - 1 : 0,
        officialWins: infiniteMode ? 100 + matchNumber - 1 : matchNumber - 1,
        lastBaseRewardMatchId: null, lastAdRewardMatchId: null,
        lastAdvancedMatchId: null, lastSettledMatchId: null,
      });
      sessionModule.setCurrentMatchSession({
        matchId: game.getCurrentMatchId(), seasonNumber: 1, matchNumber,
        difficultyQualityName: 'GOAT', scheduleLabel: infiniteMode
          ? `概念神无限赛程 第${matchNumber}场` : '季后赛总决赛 第4场',
        playerTeamName: '夺冠测试队', opponentTeamName: '决赛对手',
        playerRoster: roster, opponentRoster: roster.map(card => ({ ...card, overall: 1000 })),
        playerOverall: 12000000, opponentOverall: 12000, opponentLevel: infiniteMode ? 100 : matchNumber,
        operationPresidentBonus: 9, rewardMultiplier: infiniteMode ? 1 : 1.5,
        isStandardProgressionMatch: !infiniteMode, temporaryBonusPercent: 0,
      });
      await new Promise((resolve, reject) => cc.director.loadScene('Match', error => {
        if (error) return reject(error);
        const canvas = cc.find('Canvas');
        if (!canvas.getComponent(MatchController)) canvas.addComponent(MatchController);
        resolve();
      }));
    };
    await window.__championshipQA.start(100);
  });
  await page.waitForFunction(() => {
    const controller = window.cc.find('Canvas')?.getComponent('MatchController');
    return controller?.initialized && controller.championshipPage;
  }, { timeout: 30000 });
  const settled = await page.evaluate(() => {
    const { game } = window.__championshipQA;
    const controller = window.cc.find('Canvas').getComponent('MatchController');
    const before = game.getBudget();
    controller.result = controller.createMatchResult(true);
    controller.finishMatch();
    return { before, after: game.getBudget(), state: game.loadSeasonState() };
  });
  if (settled.after - settled.before !== 100000) throw Error('Championship reward is not exactly 100K');
  if (!settled.state.conceptGodUpgradeUnlocked) throw Error('Championship did not unlock concept gods');
  await page.waitForTimeout(1200);
  const sample = () => page.evaluate(() => {
    const cc = window.cc;
    const controller = cc.find('Canvas').getComponent('MatchController');
    const popup = controller.championshipPage;
    const labels = popup.getChildByName('全胜之后').getComponentsInChildren(cc.Label);
    return {
      championshipVisible: popup.activeInHierarchy,
      victoryVisible: controller.victoryPage.activeInHierarchy,
      title: popup.getChildByName('赛程').getChildByName('赛程').getComponent(cc.Label).string,
      reward: popup.getChildByName('领取').getChildByName('数值').getComponent(cc.Label).string,
      buttons: popup.getComponentsInChildren(cc.Button).map(button => button.node.name),
      labels: labels.map(label => ({ text: label.string, color: [label.color.r, label.color.g, label.color.b, label.color.a] })),
    };
  });
  const first = await sample();
  await page.screenshot({ path: 'championship-rainbow-1.png' });
  await page.waitForTimeout(1200);
  const second = await sample();
  await page.screenshot({ path: 'championship-rainbow-2.png' });
  if (!first.championshipVisible || first.victoryVisible || first.reward !== '100K') throw Error('Wrong result popup/reward');
  if (first.title !== '赛 季 全 胜') throw Error('Prefab title was overwritten');
  if (first.buttons.some(name => name.includes('广告'))) throw Error('Unexpected championship ad button');
  if (first.labels.length !== 3 || first.labels.some((label, i) => JSON.stringify(label.color) === JSON.stringify(second.labels[i].color))) throw Error('Not all labels animate');
  const repeat = await page.evaluate(async () => {
    const { game } = window.__championshipQA;
    const controller = window.cc.find('Canvas').getComponent('MatchController');
    const before = game.getBudget();
    controller.showVictory();
    await controller.claimVictoryAdRewardAsync();
    return { before, after: game.getBudget(), state: game.loadSeasonState() };
  });
  if (repeat.before !== repeat.after || repeat.state.lastAdRewardMatchId) throw Error('Repeated/ad championship reward allowed');
  console.log(JSON.stringify({ settled, first, second, repeat }, null, 2));
}

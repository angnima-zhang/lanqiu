async (page) => {
  for (let index = 0; index < 12; index++) {
    await page.waitForFunction(() => { const r = window.__recruitFix.r; return r.pendingCard && r.resultPage.activeInHierarchy && r.replaceButton.interactable && !r.resultPageClosing; });
    await page.evaluate(() => window.__recruitFix.r.onReplaceClicked());
  }
  return await page.evaluate(() => {
    const q = window.__recruitFix;
    return { checks: q.checks, pending: q.game.loadRoster().filter(c => c?.pendingEvent).length, originalPlayers: q.game.loadRoster().filter(c => c?.instanceId.startsWith('old-')).length, remaining: q.r.queuedContinuousRecruitments.length };
  });
}

// Diagnostic milestones only; never report an artificial interactive state to TapTap.
globalThis.__basketballStartupTiming = { startedAt: Date.now(), origin: 'game-entry', marks: {} };
globalThis.__basketballMarkStartupStage = function (stage) {
    var timing = globalThis.__basketballStartupTiming;
    if (timing.marks[stage] !== undefined) return;
    var elapsedMs = Math.max(0, Date.now() - timing.startedAt);
    timing.marks[stage] = elapsedMs;
    console.info('[StartupTiming] ' + stage + ' +' + elapsedMs + 'ms (from game-entry)');
};
globalThis.__basketballMarkStartupStage('game-entry');

Error.stackTraceLimit = Infinity;

// Some TapPlay Android runtimes do not expose fetch before the adapter starts.
// Missing fetch is valid here: the mini-game adapter will use the wx request APIs.
if (typeof GameGlobal !== 'undefined' && typeof GameGlobal.fetch === 'function') {
    GameGlobal.oldFetch = GameGlobal.fetch;
    GameGlobal.fetch = undefined; // remove fetch to follow wx
}

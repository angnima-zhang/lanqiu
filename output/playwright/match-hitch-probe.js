() => {
    const match = cc.director.getScene().getChildByName('Canvas').getComponent('MatchController');
    const court = match.courtSimulation;
    const result = { callbacks: [], renders: [], frames: [], possessionErrors: [], finished: false, score: null };
    window.hitchResult = result;
    window.hitchMatch = match;
    match.requestedSpeedMultiplier = 3;
    let expectedTeam;
    let latestOutcome;
    for (const name of ['onScore', 'onCommentary', 'onPlayComplete']) {
        const original = court.callbacks[name];
        court.callbacks[name] = (...args) => {
            const start = performance.now();
            const event = args[name === 'onScore' ? 2 : 1];
            if (name === 'onPlayComplete') expectedTeam = args[0];
            const output = original(...args);
            const sample = { name, ms: performance.now() - start, index: event?.index,
                action: event?.action, made: event?.made, rebound: event?.rebound,
                lines: name === 'onCommentary' ? (Array.isArray(args[0]) ? args[0].length : 1) : 0 };
            result.callbacks.push(sample);
            if (name === 'onCommentary') latestOutcome = sample;
            return output;
        };
    }
    const play = court.play;
    court.play = function (event, speed) {
        if (expectedTeam !== undefined && event.offenseTeam !== expectedTeam) {
            result.possessionErrors.push({ index: event.index, expectedTeam, actualTeam: event.offenseTeam });
        }
        expectedTeam = undefined;
        return play.call(this, event, speed);
    };
    const originalLate = match.lateUpdate;
    match.lateUpdate = function () {
        const queued = this.pendingCommentaryLines.length;
        const start = performance.now();
        originalLate.call(this);
        if (queued) result.renders.push({ ms: performance.now() - start, queued });
    };
    let last = performance.now();
    function frame() {
        const now = performance.now();
        result.frames.push({ ms: now - last, outcome: latestOutcome?.index });
        last = now;
        if (match.isValid && !match.finished) requestAnimationFrame(frame);
        else {
            result.finished = match.finished;
            result.score = {
                player: match.playerQuarterScores.reduce((sum, value) => sum + value, 0),
                opponent: match.opponentQuarterScores.reduce((sum, value) => sum + value, 0),
                expectedPlayer: match.result.playerFinalScore,
                expectedOpponent: match.result.opponentFinalScore,
                planned: match.plannedPlays.length,
                played: match.nextPlayIndex,
            };
        }
    }
    requestAnimationFrame(frame);
    return { installed: true, queued: match.pendingCommentaryLines.length, views: match.commentaryViews.length };
}

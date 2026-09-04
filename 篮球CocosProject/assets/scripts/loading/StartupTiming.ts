interface StartupTiming {
    startedAt: number;
    origin: string;
    marks: Record<string, number>;
}

const startupGlobal = globalThis as unknown as { __basketballStartupTiming?: StartupTiming };
// TapTap conversion injects the earlier game.js timestamp. Preview/WeChat start here.
const timing = startupGlobal.__basketballStartupTiming ??= {
    startedAt: Date.now(), origin: 'game-script', marks: {},
};

/** One log per milestone, not per frame; elapsed times share the same origin. */
export function markStartupStage(stage: string): void {
    if (timing.marks[stage] !== undefined) return;
    const elapsedMs = Math.max(0, Date.now() - timing.startedAt);
    timing.marks[stage] = elapsedMs;
    console.info(`[StartupTiming] ${stage} +${elapsedMs}ms (from ${timing.origin})`);
}

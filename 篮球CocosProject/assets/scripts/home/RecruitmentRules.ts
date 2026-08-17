export type RecruitmentResultMode = 'empty-slot' | 'replace' | 'dismiss-only';

export interface RecruitmentResultDecision {
    mode: RecruitmentResultMode;
    targetIndex: number | null;
}

export function evaluateRecruitmentResult(
    rosterOveralls: ReadonlyArray<number | null>,
): RecruitmentResultDecision {
    const emptyIndex = rosterOveralls.findIndex((overall) => overall === null);
    if (emptyIndex >= 0) {
        return { mode: 'empty-slot', targetIndex: emptyIndex };
    }

    let lowestIndex = -1;
    let lowestOverall = Number.POSITIVE_INFINITY;
    for (let index = 0; index < rosterOveralls.length; index += 1) {
        const overall = rosterOveralls[index];
        if (overall !== null && overall < lowestOverall) {
            lowestOverall = overall;
            lowestIndex = index;
        }
    }

    if (lowestIndex >= 0) {
        return { mode: 'replace', targetIndex: lowestIndex };
    }
    return { mode: 'dismiss-only', targetIndex: null };
}

import type { SeasonState } from './GameState';

const OPPONENT_ROSTER_SIZE = 12;
const OPPONENT_BEGINNER_WINDOW_COUNT = 2;
const OPPONENT_DEVELOPMENT_WINDOW_COUNT = 4;
const OPPONENT_BEGINNER_END_HIGHEST_COUNT = 6;
const OPPONENT_DEVELOPMENT_END_HIGHEST_COUNT = 9;
const OPPONENT_HARD_END_HIGHEST_COUNT = 11;

export interface RecruitmentQualityConfig {
    qualityId: number;
    qualityName: string;
}

export interface RecruitmentQualityWindow {
    levelStart: number;
    levelEnd: number;
    lowestQualityId: number;
    highestQualityId: number;
    baseWeights: number[];
}

export interface RecruitmentProbabilityConfig {
    qualities: RecruitmentQualityConfig[];
    qualityWindows: RecruitmentQualityWindow[];
    withinWindowEndWeights?: number[];
    endlessGoatProbability: {
        bonusPerWin: number;
        maximumProbability: number;
        appliesAtTeamLevel: number;
    };
}

export interface ResolvedRecruitmentWindow {
    level: number;
    qualityWindow: RecruitmentQualityWindow;
    baseWeights: number[];
    recruitableQualityIds: number[];
    recruitableQualityNames: string[];
    highestUnlockedQualityId: number;
    highestUnlockedQualityName: string;
}

export interface ResolvedOpponentQualityWeights {
    opponentLevel: number;
    qualityIds: number[];
    qualityNames: string[];
    weights: number[];
}

export function resolveRecruitmentWindow(
    config: RecruitmentProbabilityConfig,
    teamLevel: number,
    seasonState: SeasonState | null = null,
): ResolvedRecruitmentWindow | null {
    const window = config.qualityWindows.find(
        (candidate) => teamLevel >= candidate.levelStart && teamLevel <= candidate.levelEnd,
    ) ?? config.qualityWindows[config.qualityWindows.length - 1];
    if (!window || window.baseWeights.length !== 5) {
        return null;
    }
    const qualities = config.qualities.filter(
        (quality) => quality.qualityId >= window.lowestQualityId
            && quality.qualityId <= window.highestQualityId,
    );
    if (qualities.length !== 5) {
        return null;
    }
    const progress = calculateWindowProgress(window, teamLevel);
    const resolvedWindowWeights = interpolateWindowWeights(
        window.baseWeights,
        config.withinWindowEndWeights,
        progress,
    );
    const baseWeights = Array<number>(config.qualities.length).fill(0);
    qualities.forEach((quality, index) => {
        const qualityIndex = config.qualities.findIndex(
            (candidate) => candidate.qualityId === quality.qualityId,
        );
        if (qualityIndex >= 0) {
            baseWeights[qualityIndex] = Math.max(0, resolvedWindowWeights[index]);
        }
    });
    if (
        seasonState?.infiniteMode
        && teamLevel >= config.endlessGoatProbability.appliesAtTeamLevel
    ) {
        applyEndlessGoatWeight(
            baseWeights,
            config.qualities,
            seasonState.infiniteWins,
            config.endlessGoatProbability,
        );
    }
    return {
        level: teamLevel,
        qualityWindow: window,
        baseWeights,
        recruitableQualityIds: qualities.map((quality) => quality.qualityId),
        recruitableQualityNames: qualities.map((quality) => quality.qualityName),
        highestUnlockedQualityId: qualities[qualities.length - 1].qualityId,
        highestUnlockedQualityName: qualities[qualities.length - 1].qualityName,
    };
}

export function resolveOpponentQualityWeights(
    config: RecruitmentProbabilityConfig,
    opponentLevel: number,
): ResolvedOpponentQualityWeights | null {
    const resolved = resolveRecruitmentWindow(config, opponentLevel);
    if (!resolved) {
        return null;
    }
    const windowIndex = config.qualityWindows.findIndex((window) => (
        window.levelStart === resolved.qualityWindow.levelStart
        && window.levelEnd === resolved.qualityWindow.levelEnd
    ));
    const progress = calculateOpponentWindowProgress(
        resolved.qualityWindow,
        opponentLevel,
        windowIndex,
    );
    const previousWindow = windowIndex > 0
        ? config.qualityWindows[windowIndex - 1]
        : null;
    const endWeights = createOpponentWindowEndWeights(
        resolved.qualityWindow.baseWeights,
        windowIndex,
    );
    const startWeights = previousWindow
        ? mapPreviousOpponentEndWeights(
            config,
            windowIndex - 1,
            resolved.recruitableQualityIds,
        )
        : resolved.qualityWindow.baseWeights;
    return {
        opponentLevel,
        qualityIds: [...resolved.recruitableQualityIds],
        qualityNames: [...resolved.recruitableQualityNames],
        weights: windowIndex === 0
            ? shiftLowestQualityTowardWindowEnd(endWeights, progress)
            : interpolateWindowWeights(startWeights, endWeights, progress),
    };
}

function calculateOpponentWindowProgress(
    window: RecruitmentQualityWindow,
    opponentLevel: number,
    windowIndex: number,
): number {
    const playableStartLevel = windowIndex === 0
        ? Math.max(1, window.levelStart)
        : window.levelStart;
    const span = Math.max(0, window.levelEnd - playableStartLevel);
    if (span <= 0) {
        return 0;
    }
    return Math.max(
        0,
        Math.min(1, (opponentLevel - playableStartLevel) / span),
    );
}

function calculateWindowProgress(window: RecruitmentQualityWindow, teamLevel: number): number {
    const span = Math.max(0, window.levelEnd - window.levelStart);
    if (span <= 0) {
        return 0;
    }
    return Math.max(0, Math.min(1, (teamLevel - window.levelStart) / span));
}

function interpolateWindowWeights(
    startWeights: readonly number[],
    endWeights: readonly number[] | undefined,
    progress: number,
): number[] {
    if (!endWeights || endWeights.length !== startWeights.length || progress <= 0) {
        return startWeights.map((weight) => Math.max(0, weight));
    }
    return startWeights.map((weight, index) => {
        const start = Math.max(0, weight);
        const end = Math.max(0, endWeights[index]);
        return start + (end - start) * progress;
    });
}

function createOpponentWindowEndWeights(
    sourceWeights: readonly number[],
    windowIndex: number,
): number[] {
    const weights = Array<number>(sourceWeights.length).fill(0);
    const totalWeight = sourceWeights.reduce(
        (total, weight) => total + Math.max(0, weight),
        0,
    );
    const highestIndex = sourceWeights.length - 1;
    const secondHighestIndex = Math.max(0, highestIndex - 1);
    const highestQualityRatio = resolveOpponentWindowEndHighestCount(windowIndex)
        / OPPONENT_ROSTER_SIZE;
    weights[secondHighestIndex] = totalWeight
        * (1 - highestQualityRatio);
    weights[highestIndex] += totalWeight
        * highestQualityRatio;
    return weights;
}

function resolveOpponentWindowEndHighestCount(windowIndex: number): number {
    if (windowIndex < OPPONENT_BEGINNER_WINDOW_COUNT) {
        return OPPONENT_BEGINNER_END_HIGHEST_COUNT;
    }
    if (
        windowIndex
        < OPPONENT_BEGINNER_WINDOW_COUNT + OPPONENT_DEVELOPMENT_WINDOW_COUNT
    ) {
        return OPPONENT_DEVELOPMENT_END_HIGHEST_COUNT;
    }
    return OPPONENT_HARD_END_HIGHEST_COUNT;
}

function shiftLowestQualityTowardWindowEnd(
    endWeights: readonly number[],
    progress: number,
): number[] {
    const totalWeight = endWeights.reduce(
        (total, weight) => total + Math.max(0, weight),
        0,
    );
    const endAverageIndex = totalWeight > 0
        ? endWeights.reduce(
            (total, weight, index) => total + Math.max(0, weight) * index,
            0,
        ) / totalWeight
        : 0;
    const shiftedIndex = endAverageIndex * Math.max(0, Math.min(1, progress));
    const lowerIndex = Math.floor(shiftedIndex);
    const upperIndex = Math.min(endWeights.length - 1, lowerIndex + 1);
    const weights = Array<number>(endWeights.length).fill(0);
    const upperRatio = shiftedIndex - lowerIndex;
    weights[lowerIndex] = totalWeight * (1 - upperRatio);
    weights[upperIndex] += totalWeight * upperRatio;
    return weights;
}

function mapPreviousOpponentEndWeights(
    config: RecruitmentProbabilityConfig,
    previousWindowIndex: number,
    targetQualityIds: readonly number[],
): number[] {
    const previousWindow = config.qualityWindows[previousWindowIndex];
    const previousQualityIds = config.qualities
        .filter((quality) => (
            quality.qualityId >= previousWindow.lowestQualityId
            && quality.qualityId <= previousWindow.highestQualityId
        ))
        .map((quality) => quality.qualityId);
    const previousEndWeights = createOpponentWindowEndWeights(
        previousWindow.baseWeights,
        previousWindowIndex,
    );
    const weights = Array<number>(targetQualityIds.length).fill(0);
    previousQualityIds.forEach((qualityId, index) => {
        const targetIndex = targetQualityIds.indexOf(qualityId);
        if (targetIndex >= 0) {
            weights[targetIndex] += Math.max(0, previousEndWeights[index] ?? 0);
        }
    });
    return weights;
}

export function resolveRecruitmentQualityWeights(
    config: RecruitmentProbabilityConfig,
    levelConfig: ResolvedRecruitmentWindow,
    scoutingDirectorHighestQualityWeightBonus: number,
    lowestQualityProtectionCount: number,
    adProbabilityBoost10Active = false,
    adProbabilityBoost5Active = false,
): number[] {
    const weights = levelConfig.baseWeights.map((weight) => Math.max(0, weight));
    const highestQualityIndex = config.qualities.findIndex(
        (quality) => quality.qualityId === levelConfig.highestUnlockedQualityId,
    );
    if (highestQualityIndex >= 0) {
        weights[highestQualityIndex] += Math.max(
            0,
            scoutingDirectorHighestQualityWeightBonus,
        );
    }

    const recruitableIndexes = config.qualities
        .map((quality, index) => ({ quality, index }))
        .filter(({ quality }) => levelConfig.recruitableQualityIds.includes(quality.qualityId))
        .sort((left, right) => left.quality.qualityId - right.quality.qualityId)
        .map(({ index }) => index);
    if (lowestQualityProtectionCount > 0) {
        const lowestIndex = recruitableIndexes[0];
        const nextLowestIndex = recruitableIndexes[1];
        if (lowestIndex !== undefined && nextLowestIndex !== undefined) {
            weights[nextLowestIndex] += weights[lowestIndex];
            weights[lowestIndex] = 0;
        }
    }

    if (adProbabilityBoost10Active) {
        transferProbabilityToTargetRank(weights, recruitableIndexes, 2, 10);
    }
    if (adProbabilityBoost5Active) {
        transferProbabilityToTargetRank(weights, recruitableIndexes, 3, 5);
    }
    return weights;
}

function transferProbabilityToTargetRank(
    weights: number[],
    recruitableIndexes: readonly number[],
    targetRank: number,
    percentagePoints: number,
): void {
    const targetIndex = recruitableIndexes[targetRank];
    const lowestAvailableIndex = recruitableIndexes.find(
        (index) => Math.max(0, weights[index] ?? 0) > 0,
    );
    if (
        targetIndex === undefined
        || lowestAvailableIndex === undefined
        || targetIndex === lowestAvailableIndex
    ) {
        return;
    }
    const totalWeight = weights.reduce(
        (total, weight) => total + Math.max(0, weight),
        0,
    );
    const transferWeight = Math.min(
        Math.max(0, weights[lowestAvailableIndex] ?? 0),
        totalWeight * Math.max(0, percentagePoints) / 100,
    );
    weights[lowestAvailableIndex] -= transferWeight;
    weights[targetIndex] += transferWeight;
}

function applyEndlessGoatWeight(
    weights: number[],
    qualities: readonly RecruitmentQualityConfig[],
    infiniteWins: number,
    config: RecruitmentProbabilityConfig['endlessGoatProbability'],
): void {
    const goatIndex = qualities.length - 1;
    const originalGoatWeight = Math.max(0, weights[goatIndex] ?? 0);
    const targetGoatWeight = Math.min(
        config.maximumProbability * 100,
        originalGoatWeight + Math.max(0, infiniteWins) * config.bonusPerWin * 100,
    );
    const otherTotal = weights.reduce(
        (total, weight, index) => index === goatIndex ? total : total + Math.max(0, weight),
        0,
    );
    if (otherTotal > 0) {
        const ratio = Math.max(0, 100 - targetGoatWeight) / otherTotal;
        weights.forEach((weight, index) => {
            if (index !== goatIndex) {
                weights[index] = Math.max(0, weight) * ratio;
            }
        });
    }
    weights[goatIndex] = targetGoatWeight;
}

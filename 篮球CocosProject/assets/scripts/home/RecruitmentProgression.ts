import type { SeasonState } from './GameState';

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

export function resolveRecruitmentQualityWeights(
    config: RecruitmentProbabilityConfig,
    levelConfig: ResolvedRecruitmentWindow,
    scoutingDirectorHighestQualityWeightBonus: number,
    lowestQualityProtectionCount: number,
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

    if (lowestQualityProtectionCount <= 0) {
        return weights;
    }
    const recruitableIndexes = config.qualities
        .map((quality, index) => ({ quality, index }))
        .filter(({ quality }) => levelConfig.recruitableQualityIds.includes(quality.qualityId))
        .sort((left, right) => left.quality.qualityId - right.quality.qualityId)
        .map(({ index }) => index);
    const lowestIndex = recruitableIndexes[0];
    const nextLowestIndex = recruitableIndexes[1];
    if (lowestIndex === undefined || nextLowestIndex === undefined) {
        return weights;
    }
    weights[nextLowestIndex] += weights[lowestIndex];
    weights[lowestIndex] = 0;
    return weights;
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

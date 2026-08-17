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
    const baseWeights = Array<number>(config.qualities.length).fill(0);
    qualities.forEach((quality, index) => {
        const qualityIndex = config.qualities.findIndex(
            (candidate) => candidate.qualityId === quality.qualityId,
        );
        if (qualityIndex >= 0) {
            baseWeights[qualityIndex] = Math.max(0, window.baseWeights[index]);
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

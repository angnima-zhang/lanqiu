import { INT32_MAX } from './GameState';
import type { SeasonState } from './GameState';
import { getScheduleDescriptor } from './SeasonRoute';

export interface MatchDifficultyAnchor {
    matchNumber: number;
    opponentOvr: number;
    difficultyQualityId: number;
    difficultyQualityName: string;
}

export interface MatchRewardsConfig {
    difficultyAnchors: MatchDifficultyAnchor[];
    specialMatches: {
        cup: MatchSpecialConfig;
        allStar: MatchSpecialConfig;
    };
    playoffRoundRewardMultipliers: number[];
    endless: {
        baseOpponentOvr: number;
        opponentOvrGrowthPerWin: number;
        budgetRewardMultiplier: number;
    };
}

export interface MatchSpecialConfig {
    matchNumber: number;
    displayName: string;
    opponentOvrMultiplier: number;
    budgetRewardMultiplier: number;
}

export interface MatchDefinition {
    opponentOvr: number;
    difficultyQualityId: number;
    difficultyQualityName: string;
    scheduleLabel: string;
    rewardMultiplier: number;
    isStandardProgressionMatch: boolean;
}

export function resolveMatchDefinition(
    config: MatchRewardsConfig,
    seasonState: SeasonState,
): MatchDefinition | null {
    const schedule = getScheduleDescriptor(seasonState);
    if (seasonState.infiniteMode) {
        return {
            opponentOvr: Math.min(
                INT32_MAX,
                Math.floor(
                    config.endless.baseOpponentOvr
                    * Math.pow(
                        config.endless.opponentOvrGrowthPerWin,
                        Math.max(0, seasonState.infiniteMatchNumber - 1),
                    ),
                ),
            ),
            difficultyQualityId: 15,
            difficultyQualityName: 'GOAT',
            scheduleLabel: `${schedule.title} 第${schedule.phaseMatchNumber}场`,
            rewardMultiplier: Math.max(0, config.endless.budgetRewardMultiplier),
            isStandardProgressionMatch: false,
        };
    }

    const base = resolveAnchoredDifficulty(config.difficultyAnchors, seasonState.matchNumber);
    if (!base) {
        return null;
    }
    let opponentOvr = base.opponentOvr;
    let rewardMultiplier = 1;
    if (schedule.phase === 'cup') {
        opponentOvr = Math.floor(opponentOvr * config.specialMatches.cup.opponentOvrMultiplier);
        rewardMultiplier = config.specialMatches.cup.budgetRewardMultiplier;
    } else if (schedule.phase === 'all-star') {
        opponentOvr = Math.floor(opponentOvr * config.specialMatches.allStar.opponentOvrMultiplier);
        rewardMultiplier = config.specialMatches.allStar.budgetRewardMultiplier;
    } else if (schedule.phase === 'playoffs') {
        rewardMultiplier = config.playoffRoundRewardMultipliers[
            Math.max(0, schedule.playoffRound - 1)
        ] ?? 1;
    }
    return {
        opponentOvr: Math.min(INT32_MAX, Math.max(1, opponentOvr)),
        difficultyQualityId: base.difficultyQualityId,
        difficultyQualityName: base.difficultyQualityName,
        scheduleLabel: `${schedule.title} 第${schedule.phaseMatchNumber}场`,
        rewardMultiplier: Math.max(0, rewardMultiplier),
        isStandardProgressionMatch: true,
    };
}

function resolveAnchoredDifficulty(
    anchors: readonly MatchDifficultyAnchor[],
    matchNumber: number,
): MatchDifficultyAnchor | null {
    const sorted = [...anchors].sort((left, right) => left.matchNumber - right.matchNumber);
    const rightIndex = sorted.findIndex((anchor) => anchor.matchNumber >= matchNumber);
    if (rightIndex < 0) {
        return sorted[sorted.length - 1] ?? null;
    }
    const right = sorted[rightIndex];
    const left = sorted[Math.max(0, rightIndex - 1)];
    if (left.matchNumber === right.matchNumber) {
        return { ...right };
    }
    const progress = (matchNumber - left.matchNumber) / (right.matchNumber - left.matchNumber);
    return {
        matchNumber,
        opponentOvr: Math.floor(
            left.opponentOvr * Math.pow(right.opponentOvr / left.opponentOvr, progress),
        ),
        difficultyQualityId: left.difficultyQualityId,
        difficultyQualityName: left.difficultyQualityName,
    };
}

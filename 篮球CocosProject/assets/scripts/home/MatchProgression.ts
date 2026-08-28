import type { SeasonState } from './GameState';
import { getScheduleDescriptor } from './SeasonRoute';

export interface MatchRewardsConfig {
    standardMatchCount: number;
    specialMatches: {
        cup: MatchSpecialConfig;
        allStar: MatchSpecialConfig;
    };
    playoffRoundRewardMultipliers: number[];
    championship: {
        budgetReward: number;
    };
    endless: {
        budgetRewardMultiplier: number;
    };
}

export interface MatchSpecialConfig {
    matchNumber: number;
    displayName: string;
    budgetRewardMultiplier: number;
}

export interface MatchDefinition {
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
            scheduleLabel: `${schedule.title} 第${schedule.phaseMatchNumber}场`,
            rewardMultiplier: Math.max(0, config.endless.budgetRewardMultiplier),
            isStandardProgressionMatch: false,
        };
    }

    let rewardMultiplier = 1;
    if (schedule.phase === 'cup') {
        rewardMultiplier = config.specialMatches.cup.budgetRewardMultiplier;
    } else if (schedule.phase === 'all-star') {
        rewardMultiplier = config.specialMatches.allStar.budgetRewardMultiplier;
    } else if (schedule.phase === 'playoffs') {
        rewardMultiplier = config.playoffRoundRewardMultipliers[
            Math.max(0, schedule.playoffRound - 1)
        ] ?? 1;
    }
    return {
        scheduleLabel: `${schedule.title} 第${schedule.phaseMatchNumber}场`,
        rewardMultiplier: Math.max(0, rewardMultiplier),
        isStandardProgressionMatch: true,
    };
}

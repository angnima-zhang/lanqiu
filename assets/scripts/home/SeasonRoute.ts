import type { SeasonState } from './GameState';

export const STANDARD_MATCH_COUNT = 100;
export const REGULAR_SEASON_MATCH_COUNT = 82;
export const CUP_MATCH_NUMBER = 27;
export const ALL_STAR_MATCH_NUMBER = 43;
export const PLAYOFF_START_MATCH_NUMBER = 85;
export const PLAYOFF_WINS_PER_ROUND = 4;

export interface ScheduleDescriptor {
    phase: SeasonState['schedulePhase'];
    title: string;
    phaseMatchNumber: number;
    playoffRound: number;
    playoffWinsInRound: number;
}

export function getScheduleDescriptor(state: Pick<
    SeasonState,
    'infiniteMode' | 'infiniteMatchNumber' | 'matchNumber'
>): ScheduleDescriptor {
    if (state.infiniteMode) {
        return {
            phase: 'concept-endless',
            title: '概念神无限赛程',
            phaseMatchNumber: state.infiniteMatchNumber,
            playoffRound: 4,
            playoffWinsInRound: 4,
        };
    }
    if (state.matchNumber === CUP_MATCH_NUMBER) {
        return {
            phase: 'cup',
            title: '季中杯',
            phaseMatchNumber: 1,
            playoffRound: 0,
            playoffWinsInRound: 0,
        };
    }
    if (state.matchNumber === ALL_STAR_MATCH_NUMBER) {
        return {
            phase: 'all-star',
            title: '全明星赛',
            phaseMatchNumber: 1,
            playoffRound: 0,
            playoffWinsInRound: 0,
        };
    }
    if (state.matchNumber < PLAYOFF_START_MATCH_NUMBER) {
        const specialMatchesBefore = (state.matchNumber > CUP_MATCH_NUMBER ? 1 : 0)
            + (state.matchNumber > ALL_STAR_MATCH_NUMBER ? 1 : 0);
        return {
            phase: 'regular-season',
            title: '常规赛',
            phaseMatchNumber: state.matchNumber - specialMatchesBefore,
            playoffRound: 0,
            playoffWinsInRound: 0,
        };
    }
    const playoffIndex = state.matchNumber - PLAYOFF_START_MATCH_NUMBER;
    const playoffRound = Math.min(4, Math.floor(playoffIndex / PLAYOFF_WINS_PER_ROUND) + 1);
    return {
        phase: 'playoffs',
        title: `季后赛${['首轮', '次轮', '分区决赛', '总决赛'][playoffRound - 1]}`,
        phaseMatchNumber: playoffIndex % PLAYOFF_WINS_PER_ROUND + 1,
        playoffRound,
        playoffWinsInRound: playoffIndex % PLAYOFF_WINS_PER_ROUND,
    };
}

export function formatScheduleLabel(
    state: Pick<SeasonState, 'infiniteMode' | 'infiniteMatchNumber' | 'matchNumber'>,
): string {
    const schedule = getScheduleDescriptor(state);
    return `${schedule.title} 第${schedule.phaseMatchNumber}场`;
}

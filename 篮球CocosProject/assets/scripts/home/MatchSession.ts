import { PlayerCard } from './GameState';

export type MatchResultBand =
    | 'full-concept'
    | 'auto-win'
    | 'uncertain'
    | 'auto-lose';

export interface MatchSessionSnapshot {
    matchId: string;
    seasonNumber: number;
    matchNumber: number;
    difficultyQualityName: string;
    scheduleLabel: string;
    playerTeamName: string;
    opponentTeamName: string;
    playerRoster: Array<PlayerCard | null>;
    opponentRoster: PlayerCard[];
    playerOverall: number;
    opponentOverall: number;
    opponentLevel: number;
    operationPresidentBonus: number;
    rewardMultiplier: number;
    isStandardProgressionMatch: boolean;
    temporaryBonusPercent: number;
}

export type HomepageReturnTarget = 'home' | 'pre-match';

let currentMatchSession: MatchSessionSnapshot | null = null;
let homepageReturnTarget: HomepageReturnTarget = 'home';

export function setCurrentMatchSession(snapshot: MatchSessionSnapshot): void {
    currentMatchSession = cloneMatchSession(snapshot);
}

export function getCurrentMatchSession(): MatchSessionSnapshot | null {
    return currentMatchSession ? cloneMatchSession(currentMatchSession) : null;
}

export function clearCurrentMatchSession(): void {
    currentMatchSession = null;
}

export function setHomepageReturnTarget(target: HomepageReturnTarget): void {
    homepageReturnTarget = target;
}

export function consumeHomepageReturnTarget(): HomepageReturnTarget {
    const target = homepageReturnTarget;
    homepageReturnTarget = 'home';
    return target;
}

function cloneMatchSession(snapshot: MatchSessionSnapshot): MatchSessionSnapshot {
    return {
        ...snapshot,
        playerRoster: snapshot.playerRoster.map(
            (card) => card ? cloneCard(card) : null,
        ),
        opponentRoster: snapshot.opponentRoster.map(cloneCard),
    };
}

function cloneCard(card: PlayerCard): PlayerCard {
    return {
        ...card,
        attributes: { ...card.attributes },
    };
}

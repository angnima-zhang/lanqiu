import { sys } from 'cc';
import {
    loadJson,
    loadRoster,
    PlayerCard,
    recordPlayerAcquisition,
    saveRoster,
} from './GameState';

const PLAYER_KNOWLEDGE_PATH = 'data/player_knowledge';
const PLAYER_KNOWLEDGE_PROGRESS_STORAGE_KEY = 'basketball.player-knowledge.v1';
const PLAYER_KNOWLEDGE_REWARD_MIN_PERCENT = 0.01;
const PLAYER_KNOWLEDGE_REWARD_MAX_PERCENT = 0.02;

export interface PlayerKnowledgeQuestion {
    id: string;
    text: string;
    answer: boolean;
    rewardOverall: number;
}

export interface PlayerProfile {
    country: string;
    careerSpan: string;
    honors: string[];
    peakSeason: {
        season: number;
        team: string;
        pointsPerGame: number;
        reboundsPerGame: number;
        assistsPerGame: number;
        stealsPerGame: number;
        blocksPerGame: number;
    };
}

export interface PlayerKnowledgeEntry {
    profile: PlayerProfile;
    questions: PlayerKnowledgeQuestion[];
}

export interface PlayerKnowledgeConfig {
    players: Record<string, PlayerKnowledgeEntry>;
}

export interface PlayerKnowledgeProgress {
    currentQuestionIndex: number;
    correctQuestionIds: string[];
    wrongQuestionIds: string[];
    rewardOverallByQuestionId: Record<string, number>;
    answerAllUnlocked: boolean;
}

let configPromise: Promise<PlayerKnowledgeConfig> | null = null;

export function loadPlayerKnowledgeConfig(): Promise<PlayerKnowledgeConfig> {
    configPromise ??= loadJson<PlayerKnowledgeConfig>(PLAYER_KNOWLEDGE_PATH);
    return configPromise;
}

export function getPlayerKnowledgeProgress(sourcePlayerName: string): PlayerKnowledgeProgress {
    const stored = loadProgressByPlayer()[sourcePlayerName];
    return normalizeProgress(stored);
}

export function hasAnsweredPlayerKnowledgeQuestion(
    progress: PlayerKnowledgeProgress,
    questionId: string,
): boolean {
    return progress.correctQuestionIds.includes(questionId)
        || progress.wrongQuestionIds.includes(questionId);
}

/** Records an acquisition and starts a fresh knowledge round for repeat players. */
export function recordPlayerAcquisitionWithKnowledgeReset(card: PlayerCard): number {
    const acquisitionCount = recordPlayerAcquisition(card);
    if (acquisitionCount > 1) {
        resetPlayerKnowledgeProgress(card.sourcePlayerName);
    }
    return acquisitionCount;
}

export function resetPlayerKnowledgeProgress(sourcePlayerName: string): void {
    const allProgress = loadProgressByPlayer();
    delete allProgress[sourcePlayerName];
    saveProgressByPlayer(allProgress);
}

export function recordPlayerKnowledgeAnswer(
    sourcePlayerName: string,
    questionId: string,
    correct: boolean,
): boolean {
    const allProgress = loadProgressByPlayer();
    const progress = normalizeProgress(allProgress[sourcePlayerName]);
    if (correct) {
        if (progress.correctQuestionIds.includes(questionId)) {
            return false;
        }
        progress.correctQuestionIds.push(questionId);
        progress.wrongQuestionIds = progress.wrongQuestionIds.filter((id) => id !== questionId);
    } else if (!progress.wrongQuestionIds.includes(questionId)) {
        progress.wrongQuestionIds.push(questionId);
    }
    allProgress[sourcePlayerName] = progress;
    saveProgressByPlayer(allProgress);
    return correct;
}

export function calculatePlayerKnowledgeReward(
    overall: number,
    randomValue = Math.random(),
): number {
    const rewardPercent = PLAYER_KNOWLEDGE_REWARD_MIN_PERCENT
        + (PLAYER_KNOWLEDGE_REWARD_MAX_PERCENT - PLAYER_KNOWLEDGE_REWARD_MIN_PERCENT)
        * Math.min(1, Math.max(0, randomValue));
    return Math.max(1, Math.ceil(Math.max(1, overall) * rewardPercent));
}

export function recordPlayerKnowledgeReward(
    sourcePlayerName: string,
    questionId: string,
    rewardOverall: number,
): void {
    const reward = Math.max(1, Math.ceil(rewardOverall));
    const allProgress = loadProgressByPlayer();
    const progress = normalizeProgress(allProgress[sourcePlayerName]);
    progress.rewardOverallByQuestionId[questionId] = reward;
    allProgress[sourcePlayerName] = progress;
    saveProgressByPlayer(allProgress);
}

export function unlockPlayerKnowledgeAnswers(sourcePlayerName: string): void {
    const allProgress = loadProgressByPlayer();
    const progress = normalizeProgress(allProgress[sourcePlayerName]);
    progress.answerAllUnlocked = true;
    allProgress[sourcePlayerName] = progress;
    saveProgressByPlayer(allProgress);
}

export function advancePlayerKnowledgeQuestion(
    sourcePlayerName: string,
    questions: readonly PlayerKnowledgeQuestion[],
): void {
    if (questions.length === 0) {
        return;
    }
    const allProgress = loadProgressByPlayer();
    const progress = normalizeProgress(allProgress[sourcePlayerName]);
    const start = Math.max(0, progress.currentQuestionIndex % questions.length);
    for (let offset = 1; offset <= questions.length; offset += 1) {
        const index = (start + offset) % questions.length;
        if (!hasAnsweredPlayerKnowledgeQuestion(progress, questions[index].id)) {
            progress.currentQuestionIndex = index;
            allProgress[sourcePlayerName] = progress;
            saveProgressByPlayer(allProgress);
            return;
        }
    }
    progress.currentQuestionIndex = start;
    allProgress[sourcePlayerName] = progress;
    saveProgressByPlayer(allProgress);
}

/** Grants a one-time knowledge reward to the currently rostered player. */
export function addPermanentOverallForPlayerKnowledge(
    sourcePlayerName: string,
    amount: number,
): PlayerCard | null {
    const reward = Math.max(0, Math.floor(amount));
    if (reward <= 0) {
        return null;
    }
    let rewardedCard: PlayerCard | null = null;
    const roster = loadRoster().map((card) => {
        if (!card || card.sourcePlayerName !== sourcePlayerName) {
            return card;
        }
        const updated = {
            ...card,
            overall: Math.max(1, card.overall + reward),
        };
        rewardedCard = updated;
        return updated;
    });
    if (rewardedCard) {
        saveRoster(roster);
    }
    return rewardedCard;
}

export function formatPlayerKnowledgeText(text: string, displayName: string): string {
    return text.replace(/\{\{playerName\}\}/g, displayName);
}

export function formatPlayerProfile(
    profile: PlayerProfile | undefined,
    maximumHonors?: number,
): string {
    if (!profile) {
        return '资料整理中';
    }
    const peak = profile.peakSeason;
    return [
        formatPlayerHonors(profile, maximumHonors),
        `国籍：${profile.country}`,
        `生涯：${profile.careerSpan}`,
        `代表赛季：${peak.season} ${peak.team}`,
        `场均：${peak.pointsPerGame.toFixed(1)}分 ${peak.reboundsPerGame.toFixed(1)}板 ${peak.assistsPerGame.toFixed(1)}助 ${peak.stealsPerGame.toFixed(1)}断 ${peak.blocksPerGame.toFixed(1)}帽`,
    ].join('\n');
}

export function formatPlayerHonors(
    profile: PlayerProfile | undefined,
    maximumHonors?: number,
): string {
    if (!profile) {
        return '荣誉：资料整理中';
    }
    const honors = maximumHonors === undefined
        ? profile.honors
        : profile.honors.slice(0, Math.max(0, Math.floor(maximumHonors)));
    return `荣誉：${honors.join(' · ')}`;
}

function loadProgressByPlayer(): Record<string, PlayerKnowledgeProgress> {
    const serialized = sys.localStorage.getItem(PLAYER_KNOWLEDGE_PROGRESS_STORAGE_KEY);
    if (!serialized) {
        return {};
    }
    try {
        const parsed = JSON.parse(serialized) as Record<string, unknown>;
        return Object.fromEntries(Object.entries(parsed).map(([sourceName, progress]) => [
            sourceName,
            normalizeProgress(progress),
        ]));
    } catch {
        return {};
    }
}

function saveProgressByPlayer(progressByPlayer: Record<string, PlayerKnowledgeProgress>): void {
    sys.localStorage.setItem(
        PLAYER_KNOWLEDGE_PROGRESS_STORAGE_KEY,
        JSON.stringify(progressByPlayer),
    );
}

function normalizeProgress(value: unknown): PlayerKnowledgeProgress {
    const raw = value && typeof value === 'object'
        ? value as Partial<PlayerKnowledgeProgress>
        : {};
    return {
        currentQuestionIndex: Math.max(0, Math.floor(Number(raw.currentQuestionIndex) || 0)),
        correctQuestionIds: normalizeQuestionIds(raw.correctQuestionIds),
        wrongQuestionIds: normalizeQuestionIds(raw.wrongQuestionIds),
        rewardOverallByQuestionId: normalizeQuestionRewards(raw.rewardOverallByQuestionId),
        answerAllUnlocked: Boolean(raw.answerAllUnlocked),
    };
}

function normalizeQuestionIds(value: unknown): string[] {
    return Array.isArray(value)
        ? Array.from(new Set(value.filter((id): id is string => typeof id === 'string')))
        : [];
}

function normalizeQuestionRewards(value: unknown): Record<string, number> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    const rewards: Record<string, number> = {};
    for (const [questionId, rawReward] of Object.entries(value)) {
        const reward = Math.ceil(Number(rawReward));
        if (questionId && Number.isFinite(reward) && reward >= 1) {
            rewards[questionId] = reward;
        }
    }
    return rewards;
}

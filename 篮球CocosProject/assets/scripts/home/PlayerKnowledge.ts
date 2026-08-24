import { sys } from 'cc';
import {
    loadJson,
    loadRoster,
    PlayerCard,
    saveRoster,
} from './GameState';

const PLAYER_KNOWLEDGE_PATH = 'data/player_knowledge';
const PLAYER_KNOWLEDGE_PROGRESS_STORAGE_KEY = 'basketball.player-knowledge.v1';

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
        if (!progress.correctQuestionIds.includes(questions[index].id)) {
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

export function formatPlayerProfile(profile: PlayerProfile | undefined): string {
    if (!profile) {
        return '资料整理中';
    }
    const peak = profile.peakSeason;
    return [
        `荣誉：${profile.honors.join(' · ')}`,
        `国籍：${profile.country}`,
        `生涯：${profile.careerSpan}`,
        `代表赛季：${peak.season} ${peak.team}`,
        `场均：${peak.pointsPerGame.toFixed(1)}分 ${peak.reboundsPerGame.toFixed(1)}板 ${peak.assistsPerGame.toFixed(1)}助 ${peak.stealsPerGame.toFixed(1)}断 ${peak.blocksPerGame.toFixed(1)}帽`,
    ].join('\n');
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
        answerAllUnlocked: Boolean(raw.answerAllUnlocked),
    };
}

function normalizeQuestionIds(value: unknown): string[] {
    return Array.isArray(value)
        ? [...new Set(value.filter((id): id is string => typeof id === 'string'))]
        : [];
}

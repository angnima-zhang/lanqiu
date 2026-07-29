import { EventTarget, JsonAsset, resources, sys } from 'cc';

export const INT32_MAX = 2_147_483_647;
export const ROSTER_SLOT_COUNT = 12;

export const GAME_STATE_EVENT_BUDGET_CHANGED = 'game-state-budget-changed';
export const GAME_STATE_EVENT_ROSTER_CHANGED = 'game-state-roster-changed';
export const GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED = 'game-state-team-identity-changed';
export const GAME_STATE_EVENT_PLAYER_DETAILS_REQUESTED = 'game-state-player-details-requested';

export const gameStateEvents = new EventTarget();

export const BUDGET_STORAGE_KEY = 'basketball.economy.budget.v1';
export const ROSTER_STORAGE_KEY = 'basketball.roster.v1';
export const TEAM_NAME_STORAGE_KEY = 'basketball.team.name';
export const TEAM_ABBREVIATION_STORAGE_KEY = 'basketball.team.abbreviation';

const MANAGEMENT_STORAGE_KEY = 'basketball.management.v1';
const PLAYER_HISTORY_STORAGE_KEY = 'basketball.player-history.v1';
const SETTINGS_STORAGE_KEY = 'basketball.settings.v1';
const IDLE_STORAGE_KEY = 'basketball.idle.v1';
const SEASON_STORAGE_KEY = 'basketball.season.v1';
const DEFAULT_BUDGET = 100;
const SAVE_VERSION = 1;
const ROSTER_SAVE_VERSION = 2;
const PLAYER_HISTORY_SAVE_VERSION = 3;
const BUDGET_PRECISION = 1_000_000;

export const ATTRIBUTE_KEYS = ['scoring', 'rebound', 'assist', 'steal', 'block'] as const;
export type AttributeKey = typeof ATTRIBUTE_KEYS[number];
export type PlayerAttributes = Record<AttributeKey, number>;

export function getTeamAbbreviation(teamName: string, fallback = '我'): string {
    return Array.from(teamName.trim())[0] ?? fallback;
}

export interface PlayerCard {
    instanceId: string;
    templateId: string;
    sourcePlayerName: string;
    displayName: string;
    position: string;
    qualityId: number;
    qualityName: string;
    isConceptGod?: boolean;
    overall: number;
    attributes: PlayerAttributes;
    acquiredAtMs: number;
    lineupSinceMs: number | null;
}

interface RosterSaveData {
    version: number;
    cards: Array<PlayerCard | null>;
}

export interface ManagementLevels {
    operationPresident: number;
    headCoach: number;
    scoutingDirector: number;
    medicalTeam: number;
    mediaTeam: number;
}

export interface ManagementEffectRow {
    managementLevel: number;
    operationPresidentBudgetBonus: number;
    headCoachBattleOvrBonus: number;
    scoutingDirectorHighestQualityWeightBonus: number;
    medicalTeamOvrRollPercentileShift: number;
    mediaTeamOfflineBudgetBonus: number;
}

export interface ManagementEffectsConfig {
    levelEffects: ManagementEffectRow[];
}

export interface ManagementEffectSnapshot {
    operationPresidentBudgetBonus: number;
    headCoachBattleOvrBonus: number;
    scoutingDirectorHighestQualityWeightBonus: number;
    medicalTeamOvrRollPercentileShift: number;
    mediaTeamOfflineBudgetBonus: number;
}

export interface GameSettings {
    musicEnabled: boolean;
    soundEnabled: boolean;
}

export interface IdleState {
    version: number;
    accrualStartedAtMs: number;
    lastOnlineTickAtMs: number;
    pendingOfflineSeconds: number;
    unpromptedOfflineSeconds: number;
}

export interface SeasonState {
    version: number;
    seasonNumber: number;
    matchNumber: number;
    officialWins: number;
}

interface PlayerHistorySaveData {
    version: number;
    acquiredCounts: Record<string, number>;
    conceptGodAcquiredCount: number;
}

const ZERO_MANAGEMENT_LEVELS: ManagementLevels = {
    operationPresident: 0,
    headCoach: 0,
    scoutingDirector: 0,
    medicalTeam: 0,
    mediaTeam: 0,
};

const ZERO_MANAGEMENT_EFFECTS: ManagementEffectSnapshot = {
    operationPresidentBudgetBonus: 0,
    headCoachBattleOvrBonus: 0,
    scoutingDirectorHighestQualityWeightBonus: 0,
    medicalTeamOvrRollPercentileShift: 0,
    mediaTeamOfflineBudgetBonus: 0,
};

let managementEffectsPromise: Promise<ManagementEffectsConfig> | null = null;

export function getBudget(initialBudget = DEFAULT_BUDGET): number {
    const serialized = sys.localStorage.getItem(BUDGET_STORAGE_KEY);
    if (serialized !== null) {
        const stored = Number(serialized);
        if (Number.isFinite(stored) && stored >= 0) {
            return stored;
        }
    }

    const fallback = normalizeBudget(initialBudget);
    sys.localStorage.setItem(BUDGET_STORAGE_KEY, String(fallback));
    return fallback;
}

export function setBudget(value: number): number {
    const budget = normalizeBudget(value);
    sys.localStorage.setItem(BUDGET_STORAGE_KEY, String(budget));
    gameStateEvents.emit(GAME_STATE_EVENT_BUDGET_CHANGED, budget);
    return budget;
}

export function addBudget(amount: number): number {
    const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
    return setBudget(getBudget() + safeAmount);
}

export function trySpendBudget(amount: number): boolean {
    const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
    const budget = getBudget();
    if (budget + Number.EPSILON < safeAmount) {
        return false;
    }
    setBudget(budget - safeAmount);
    return true;
}

export function getBalance(initialBalance = DEFAULT_BUDGET): number {
    return getBudget(initialBalance);
}

export function trySpend(amount: number): boolean {
    return trySpendBudget(amount);
}

export function add(amount: number): number {
    return addBudget(amount);
}

export function loadRoster(slotCount = ROSTER_SLOT_COUNT): Array<PlayerCard | null> {
    const emptyRoster = Array<PlayerCard | null>(slotCount).fill(null);
    const serialized = sys.localStorage.getItem(ROSTER_STORAGE_KEY);
    if (!serialized) {
        writeRoster(emptyRoster, false);
        return emptyRoster;
    }

    try {
        const parsed = JSON.parse(serialized) as Partial<RosterSaveData>;
        if (!Array.isArray(parsed.cards)) {
            return emptyRoster;
        }

        const now = Date.now();
        const roster = emptyRoster.map((_, index) => normalizePlayerCard(parsed.cards![index], now));
        writeRoster(roster, false);
        ensureCurrentRosterHistory(roster);
        return roster;
    } catch {
        return emptyRoster;
    }
}

export function saveRoster(cards: ReadonlyArray<PlayerCard | null>): void {
    writeRoster(cards, true);
}

function writeRoster(
    cards: ReadonlyArray<PlayerCard | null>,
    emitChange: boolean,
): void {
    const normalizedCards = Array<PlayerCard | null>(ROSTER_SLOT_COUNT)
        .fill(null)
        .map((_, index) => cards[index] ? clonePlayerCard(cards[index]!) : null);
    const data: RosterSaveData = {
        version: ROSTER_SAVE_VERSION,
        cards: normalizedCards,
    };
    sys.localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(data));
    if (emitChange) {
        gameStateEvents.emit(
            GAME_STATE_EVENT_ROSTER_CHANGED,
            getRosterSnapshot(normalizedCards),
        );
    }
}

export function getRosterSnapshot(
    source?: ReadonlyArray<PlayerCard | null>,
): ReadonlyArray<PlayerCard | null> {
    const roster = source ?? loadRoster();
    return roster.map((card) => card ? clonePlayerCard(card) : null);
}

export function recordPlayerAcquisition(card: PlayerCard): number {
    const history = loadPlayerHistory();
    const historyKey = getPlayerHistoryKey(card.displayName);
    const previous = sanitizeInteger(history.acquiredCounts[historyKey], 0);
    history.version = PLAYER_HISTORY_SAVE_VERSION;
    history.acquiredCounts[historyKey] = previous + 1;
    savePlayerHistory(history);
    return history.acquiredCounts[historyKey];
}

export function getPlayerAcquisitionCount(displayName: string): number {
    return sanitizeInteger(
        loadPlayerHistory().acquiredCounts[getPlayerHistoryKey(displayName)],
        0,
    );
}

export function recordConceptGodAcquisition(): number {
    const history = loadPlayerHistory();
    history.version = PLAYER_HISTORY_SAVE_VERSION;
    history.conceptGodAcquiredCount = Math.max(
        0,
        sanitizeInteger(history.conceptGodAcquiredCount, 0),
    ) + 1;
    savePlayerHistory(history);
    return history.conceptGodAcquiredCount;
}

export function getConceptGodAcquisitionCount(): number {
    return Math.max(
        0,
        sanitizeInteger(loadPlayerHistory().conceptGodAcquiredCount, 0),
    );
}

export function migratePlayerHistoryToDisplayNames(
    templates: ReadonlyArray<{ id: string; displayName: string }>,
    roster: ReadonlyArray<PlayerCard | null>,
): void {
    const history = loadPlayerHistory();
    const displayNameByTemplateId = new Map(
        templates.map((template) => [
            template.id,
            getPlayerHistoryKey(template.displayName),
        ]),
    );
    const migratedCounts: Record<string, number> = {};
    for (const [key, rawCount] of Object.entries(history.acquiredCounts)) {
        const count = sanitizeInteger(rawCount, 0);
        if (count <= 0) {
            continue;
        }
        const migratedKey = displayNameByTemplateId.get(key)
            ?? getPlayerHistoryKey(key);
        migratedCounts[migratedKey] = sanitizeInteger(
            migratedCounts[migratedKey],
            0,
        ) + count;
    }

    const activeCounts = countRosterPlayersByDisplayName(roster);
    for (const [displayName, activeCount] of Object.entries(activeCounts)) {
        migratedCounts[displayName] = Math.max(
            sanitizeInteger(migratedCounts[displayName], 0),
            activeCount,
        );
    }
    savePlayerHistory({
        version: PLAYER_HISTORY_SAVE_VERSION,
        acquiredCounts: migratedCounts,
        conceptGodAcquiredCount: history.conceptGodAcquiredCount,
    });
}

export function loadManagementLevels(): ManagementLevels {
    const defaults = { ...ZERO_MANAGEMENT_LEVELS };
    const serialized = sys.localStorage.getItem(MANAGEMENT_STORAGE_KEY);
    if (!serialized) {
        saveManagementLevels(defaults);
        return defaults;
    }

    try {
        const parsed = JSON.parse(serialized) as Partial<ManagementLevels>;
        const levels: ManagementLevels = {
            operationPresident: sanitizeLevel(parsed.operationPresident),
            headCoach: sanitizeLevel(parsed.headCoach),
            scoutingDirector: sanitizeLevel(parsed.scoutingDirector),
            medicalTeam: sanitizeLevel(parsed.medicalTeam),
            mediaTeam: sanitizeLevel(parsed.mediaTeam),
        };
        saveManagementLevels(levels);
        return levels;
    } catch {
        saveManagementLevels(defaults);
        return defaults;
    }
}

export function saveManagementLevels(levels: ManagementLevels): void {
    const data: ManagementLevels = {
        operationPresident: sanitizeLevel(levels.operationPresident),
        headCoach: sanitizeLevel(levels.headCoach),
        scoutingDirector: sanitizeLevel(levels.scoutingDirector),
        medicalTeam: sanitizeLevel(levels.medicalTeam),
        mediaTeam: sanitizeLevel(levels.mediaTeam),
    };
    sys.localStorage.setItem(MANAGEMENT_STORAGE_KEY, JSON.stringify(data));
}

export function loadManagementEffectsConfig(): Promise<ManagementEffectsConfig> {
    managementEffectsPromise ??= loadJson<ManagementEffectsConfig>(
        'data/balance/management_effects',
    ).then((config) => {
        if (!Array.isArray(config.levelEffects) || config.levelEffects.length === 0) {
            throw new Error('Invalid management effects configuration.');
        }
        return config;
    });
    return managementEffectsPromise;
}

export async function getManagementEffects(): Promise<ManagementEffectSnapshot> {
    try {
        const config = await loadManagementEffectsConfig();
        const levels = loadManagementLevels();
        return {
            operationPresidentBudgetBonus: getEffectRow(
                config,
                levels.operationPresident,
            ).operationPresidentBudgetBonus,
            headCoachBattleOvrBonus: getEffectRow(
                config,
                levels.headCoach,
            ).headCoachBattleOvrBonus,
            scoutingDirectorHighestQualityWeightBonus: getEffectRow(
                config,
                levels.scoutingDirector,
            ).scoutingDirectorHighestQualityWeightBonus,
            medicalTeamOvrRollPercentileShift: getEffectRow(
                config,
                levels.medicalTeam,
            ).medicalTeamOvrRollPercentileShift,
            mediaTeamOfflineBudgetBonus: getEffectRow(
                config,
                levels.mediaTeam,
            ).mediaTeamOfflineBudgetBonus,
        };
    } catch (error) {
        console.error('[GameState] Failed to load management effects.', error);
        return { ...ZERO_MANAGEMENT_EFFECTS };
    }
}

export function calculateTeamOverall(
    roster: ReadonlyArray<PlayerCard | null>,
    headCoachBonus: number,
): number {
    const playerTotal = roster.reduce((total, card) => {
        return Math.min(INT32_MAX, total + (card?.overall ?? 0));
    }, 0);
    return Math.min(
        INT32_MAX,
        Math.floor(playerTotal * (1 + Math.max(0, headCoachBonus))),
    );
}

export function loadGameSettings(): GameSettings {
    const defaults: GameSettings = { musicEnabled: true, soundEnabled: true };
    const serialized = sys.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!serialized) {
        saveGameSettings(defaults);
        return defaults;
    }
    try {
        const parsed = JSON.parse(serialized) as Partial<GameSettings>;
        return {
            musicEnabled: typeof parsed.musicEnabled === 'boolean'
                ? parsed.musicEnabled
                : defaults.musicEnabled,
            soundEnabled: typeof parsed.soundEnabled === 'boolean'
                ? parsed.soundEnabled
                : defaults.soundEnabled,
        };
    } catch {
        return defaults;
    }
}

export function saveGameSettings(settings: GameSettings): void {
    sys.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
        musicEnabled: Boolean(settings.musicEnabled),
        soundEnabled: Boolean(settings.soundEnabled),
    }));
}

export function loadIdleState(now = Date.now()): IdleState {
    const defaults: IdleState = {
        version: SAVE_VERSION,
        accrualStartedAtMs: now,
        lastOnlineTickAtMs: now,
        pendingOfflineSeconds: 0,
        unpromptedOfflineSeconds: 0,
    };
    const serialized = sys.localStorage.getItem(IDLE_STORAGE_KEY);
    if (!serialized) {
        saveIdleState(defaults);
        return defaults;
    }
    try {
        const parsed = JSON.parse(serialized) as Partial<IdleState>;
        return {
            version: SAVE_VERSION,
            accrualStartedAtMs: sanitizeTimestamp(parsed.accrualStartedAtMs, now),
            lastOnlineTickAtMs: sanitizeTimestamp(parsed.lastOnlineTickAtMs, now),
            pendingOfflineSeconds: Math.max(
                0,
                Number.isFinite(Number(parsed.pendingOfflineSeconds))
                    ? Number(parsed.pendingOfflineSeconds)
                    : 0,
            ),
            unpromptedOfflineSeconds: Math.max(
                0,
                Number.isFinite(Number(parsed.unpromptedOfflineSeconds))
                    ? Number(parsed.unpromptedOfflineSeconds)
                    : 0,
            ),
        };
    } catch {
        return defaults;
    }
}

export function saveIdleState(state: IdleState): void {
    sys.localStorage.setItem(IDLE_STORAGE_KEY, JSON.stringify({
        version: SAVE_VERSION,
        accrualStartedAtMs: sanitizeTimestamp(state.accrualStartedAtMs, Date.now()),
        lastOnlineTickAtMs: sanitizeTimestamp(state.lastOnlineTickAtMs, Date.now()),
        pendingOfflineSeconds: Math.max(
            0,
            Number.isFinite(state.pendingOfflineSeconds) ? state.pendingOfflineSeconds : 0,
        ),
        unpromptedOfflineSeconds: Math.max(
            0,
            Number.isFinite(state.unpromptedOfflineSeconds)
                ? state.unpromptedOfflineSeconds
                : 0,
        ),
    }));
}

export function loadSeasonState(): SeasonState {
    const defaults: SeasonState = {
        version: SAVE_VERSION,
        seasonNumber: 1,
        matchNumber: 1,
        officialWins: 0,
    };
    const serialized = sys.localStorage.getItem(SEASON_STORAGE_KEY);
    if (!serialized) {
        sys.localStorage.setItem(SEASON_STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
    }
    try {
        const parsed = JSON.parse(serialized) as Partial<SeasonState>;
        return {
            version: SAVE_VERSION,
            seasonNumber: Math.max(1, sanitizeInteger(parsed.seasonNumber, 1)),
            matchNumber: Math.max(1, sanitizeInteger(parsed.matchNumber, 1)),
            officialWins: Math.max(0, sanitizeInteger(parsed.officialWins, 0)),
        };
    } catch {
        return defaults;
    }
}

export function loadJson<T>(path: string): Promise<T> {
    return new Promise((resolve, reject) => {
        resources.load(path, JsonAsset, (error, asset) => {
            if (error || !asset) {
                reject(error ?? new Error(`Missing JSON asset: ${path}`));
                return;
            }
            resolve(asset.json as T);
        });
    });
}

function normalizePlayerCard(value: unknown, now: number): PlayerCard | null {
    if (!value || typeof value !== 'object') {
        return null;
    }
    const card = value as Partial<PlayerCard>;
    const overall = sanitizeInteger(card.overall, 0);
    if (
        !card.instanceId
        || !card.templateId
        || !card.sourcePlayerName
        || !card.displayName
        || overall <= 0
    ) {
        return null;
    }

    const rawAttributes = card.attributes ?? {} as PlayerAttributes;
    const attributes = ATTRIBUTE_KEYS.reduce((result, key) => {
        result[key] = sanitizeInteger(rawAttributes[key], 0);
        return result;
    }, {} as PlayerAttributes);

    return {
        instanceId: String(card.instanceId),
        templateId: String(card.templateId),
        sourcePlayerName: String(card.sourcePlayerName),
        displayName: String(card.displayName),
        position: String(card.position ?? ''),
        qualityId: sanitizeInteger(card.qualityId, 3),
        qualityName: String(card.qualityName ?? ''),
        isConceptGod: Boolean(card.isConceptGod),
        overall,
        attributes,
        acquiredAtMs: sanitizeTimestamp(card.acquiredAtMs, now),
        lineupSinceMs: card.lineupSinceMs === null
            ? null
            : sanitizeTimestamp(card.lineupSinceMs, now),
    };
}

function clonePlayerCard(card: PlayerCard): PlayerCard {
    return {
        ...card,
        attributes: { ...card.attributes },
    };
}

function loadPlayerHistory(): PlayerHistorySaveData {
    const defaults: PlayerHistorySaveData = {
        version: PLAYER_HISTORY_SAVE_VERSION,
        acquiredCounts: {},
        conceptGodAcquiredCount: 0,
    };
    const serialized = sys.localStorage.getItem(PLAYER_HISTORY_STORAGE_KEY);
    if (!serialized) {
        return defaults;
    }
    try {
        const parsed = JSON.parse(serialized) as Partial<PlayerHistorySaveData>;
        return {
            version: sanitizeInteger(parsed.version, SAVE_VERSION),
            acquiredCounts: parsed.acquiredCounts && typeof parsed.acquiredCounts === 'object'
                ? { ...parsed.acquiredCounts }
                : {},
            conceptGodAcquiredCount: Math.max(
                0,
                sanitizeInteger(parsed.conceptGodAcquiredCount, 0),
            ),
        };
    } catch {
        return defaults;
    }
}

function savePlayerHistory(history: PlayerHistorySaveData): void {
    sys.localStorage.setItem(PLAYER_HISTORY_STORAGE_KEY, JSON.stringify(history));
}

function ensureCurrentRosterHistory(roster: ReadonlyArray<PlayerCard | null>): void {
    const history = loadPlayerHistory();
    if (history.version < PLAYER_HISTORY_SAVE_VERSION) {
        return;
    }
    const activeCounts = countRosterPlayersByDisplayName(roster);
    let changed = false;
    for (const [displayName, activeCount] of Object.entries(activeCounts)) {
        if (sanitizeInteger(history.acquiredCounts[displayName], 0) < activeCount) {
            history.acquiredCounts[displayName] = activeCount;
            changed = true;
        }
    }
    if (changed) {
        savePlayerHistory(history);
    }
}

function countRosterPlayersByDisplayName(
    roster: ReadonlyArray<PlayerCard | null>,
): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const card of roster) {
        if (!card) {
            continue;
        }
        const historyKey = getPlayerHistoryKey(card.displayName);
        counts[historyKey] = sanitizeInteger(counts[historyKey], 0) + 1;
    }
    return counts;
}

function getPlayerHistoryKey(displayName: string): string {
    return displayName.trim();
}

function getEffectRow(config: ManagementEffectsConfig, level: number): ManagementEffectRow {
    return config.levelEffects[Math.min(sanitizeLevel(level), config.levelEffects.length - 1)]
        ?? config.levelEffects[0];
}

function normalizeBudget(value: number): number {
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
    return Math.round(Math.min(Number.MAX_SAFE_INTEGER, safeValue) * BUDGET_PRECISION)
        / BUDGET_PRECISION;
}

function sanitizeInteger(value: unknown, fallback: number): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.floor(numericValue) : fallback;
}

function sanitizeLevel(value: unknown): number {
    return Math.min(520, Math.max(0, sanitizeInteger(value, 0)));
}

function sanitizeTimestamp(value: unknown, fallback: number): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0
        ? Math.floor(numericValue)
        : fallback;
}

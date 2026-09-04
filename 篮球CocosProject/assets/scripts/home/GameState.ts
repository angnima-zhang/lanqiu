import { EventTarget, JsonAsset, resources, sys } from 'cc';
import { PREVIEW } from 'cc/env';
import {
    STANDARD_MATCH_COUNT,
    getScheduleDescriptor,
} from './SeasonRoute';

const LOCAL_PREVIEW_RESET_REVISION = '2026-08-25-reset-2';
const LOCAL_PREVIEW_RESET_STORAGE_KEY = 'basketball.local-preview-reset-revision';

export function clearAllBasketballSaveData(): number {
    const basketballKeys: string[] = [];
    for (let index = 0; index < sys.localStorage.length; index += 1) {
        const key = sys.localStorage.key(index);
        if (key?.startsWith('basketball.')) {
            basketballKeys.push(key);
        }
    }
    basketballKeys.forEach((key) => sys.localStorage.removeItem(key));
    return basketballKeys.length;
}

function resetLocalPreviewSaveOnce(): void {
    if (
        !PREVIEW
        || sys.localStorage.getItem(LOCAL_PREVIEW_RESET_STORAGE_KEY) === LOCAL_PREVIEW_RESET_REVISION
    ) {
        return;
    }
    clearAllBasketballSaveData();
    sys.localStorage.setItem(LOCAL_PREVIEW_RESET_STORAGE_KEY, LOCAL_PREVIEW_RESET_REVISION);
}

resetLocalPreviewSaveOnce();

export const INT32_MAX = 2_147_483_647;
export const ROSTER_SLOT_COUNT = 12;
export const OPPONENT_PERMANENT_INJURY_PERCENT = 0.08;
export const FULLY_INJURED_OPPONENT_PLAYER_OVERALL_MULTIPLIER = 1.1;

export const GAME_STATE_EVENT_BUDGET_CHANGED = 'game-state-budget-changed';
export const GAME_STATE_EVENT_ROSTER_CHANGED = 'game-state-roster-changed';
export const GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED = 'game-state-team-identity-changed';
export const GAME_STATE_EVENT_PLAYER_DETAILS_REQUESTED = 'game-state-player-details-requested';
export const GAME_STATE_EVENT_MANAGEMENT_CHANGED = 'game-state-management-changed';
export const GAME_STATE_EVENT_SEASON_CHANGED = 'game-state-season-changed';
export const GAME_STATE_EVENT_MATCH_SETTLED = 'game-state-match-settled';
export const GAME_STATE_EVENT_REWARDED_AD_COMPLETED = 'game-state-rewarded-ad-completed';
export const GAME_STATE_EVENT_VALID_OPERATION_COMPLETED = 'game-state-valid-operation-completed';
export const GAME_STATE_EVENT_RECRUITMENT_PROTECTION_CHANGED = 'game-state-recruitment-protection-changed';
export const GAME_STATE_EVENT_RECRUITMENT_AD_PITY_CHANGED = 'game-state-recruitment-ad-pity-changed';
export const GAME_STATE_EVENT_RECRUITMENT_AD_PROBABILITY_BOOST_CHANGED = 'game-state-recruitment-ad-probability-boost-changed';

export const gameStateEvents = new EventTarget();

/**
 * 只有玩家主动完成了会实际减少预算的操作时才调用。
 * 预算收入只广播预算刷新，不属于有效操作。
 * eventCheckCount 为本次操作的事件判定次数，默认一次；0次不发送判定。
 */
export function notifyValidOperationCompleted(eventCheckCount = 1): void {
    if (eventCheckCount <= 0) return;
    gameStateEvents.emit(GAME_STATE_EVENT_VALID_OPERATION_COMPLETED, eventCheckCount);
}

export const BUDGET_STORAGE_KEY = 'basketball.economy.budget.v2';
export const ROSTER_STORAGE_KEY = 'basketball.roster.v2';
export const TEAM_NAME_STORAGE_KEY = 'basketball.team.name.v2';
export const TEAM_ABBREVIATION_STORAGE_KEY = 'basketball.team.abbreviation.v2';
export const CHEAT_MODE_TEAM_NAME = '怎么作弊啊';
export const RECRUITMENT_LOWEST_QUALITY_PROTECTION_STORAGE_KEY = 'basketball.recruitment.lowest-quality-protection.v1';
export const RECRUITMENT_LOWEST_QUALITY_PROTECTION_RECRUITMENT_COUNT = 10;
export const RECRUITMENT_UPPER_QUALITY_PITY_MISS_STORAGE_KEY = 'basketball.recruitment.upper-quality-pity-miss.v1';
export const RECRUITMENT_UPPER_QUALITY_PITY_MISS_LIMIT = 10;
export const RECRUITMENT_AD_HIGHEST_QUALITY_PITY_STORAGE_KEY = 'basketball.recruitment.ad-highest-quality-pity.v1';
export const RECRUITMENT_AD_HIGHEST_QUALITY_PITY_LIMIT = 10;
export const RECRUITMENT_AD_PROBABILITY_BOOST_DRAW_COUNT = 10;
const RECRUITMENT_AUTO_DISMISS_STORAGE_KEY = 'basketball.recruitment.auto-dismiss.v1';

export type RecruitmentAdProbabilityBoostPercent = 5 | 10;

const RECRUITMENT_AD_PROBABILITY_BOOST_STORAGE_KEYS: Record<
    RecruitmentAdProbabilityBoostPercent,
    string
> = {
    5: 'basketball.recruitment.ad-probability-boost-5.v1',
    10: 'basketball.recruitment.ad-probability-boost-10.v1',
};

const MANAGEMENT_STORAGE_KEY = 'basketball.management.v2';
const PLAYER_HISTORY_STORAGE_KEY = 'basketball.player-history.v2';
const SETTINGS_STORAGE_KEY = 'basketball.settings.v1';
const IDLE_STORAGE_KEY = 'basketball.idle.v2';
const SEASON_STORAGE_KEY = 'basketball.season.v2';
const DEFAULT_BUDGET = 50;
const SAVE_VERSION = 1;
const IDLE_SAVE_VERSION = 2;
const ROSTER_SAVE_VERSION = 2;
const PLAYER_HISTORY_SAVE_VERSION = 4;
const SEASON_SAVE_VERSION = 3;
const MAX_MANAGEMENT_LEVEL = 100;
const BUDGET_PRECISION = 1_000_000;

export const ATTRIBUTE_KEYS = ['scoring', 'rebound', 'assist', 'steal', 'block'] as const;
export type AttributeKey = typeof ATTRIBUTE_KEYS[number];
export type PlayerAttributes = Record<AttributeKey, number>;

export type PlayerEventType = 'injury' | 'retirement' | 'training';

export interface PendingPlayerEvent {
    type: PlayerEventType;
    occurredAtMs: number;
    descriptionTemplate?: string;
    overallDelta: number;
    recoveryMatches: number;
}

export interface ActivePlayerInjury {
    overallPenalty: number;
    remainingMatches: number;
}

export interface ActivePlayerTraining {
    overallBonus: number;
    remainingMatches: number;
}

export function getTeamAbbreviation(teamName: string, fallback = '我'): string {
    return Array.from(teamName.trim())[0] ?? fallback;
}

export function isCheatModeEnabled(): boolean {
    return sys.localStorage.getItem(TEAM_NAME_STORAGE_KEY) === CHEAT_MODE_TEAM_NAME;
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
    conceptGodId?: string;
    overall: number;
    attributes: PlayerAttributes;
    acquiredAtMs: number;
    lineupSinceMs: number | null;
    matchesPlayed?: number;
    retirementMatchLimit?: number;
    lastCountedMatchId?: string;
    pendingEvent?: PendingPlayerEvent;
    activeInjury?: ActivePlayerInjury;
    activeTraining?: ActivePlayerTraining;
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

export type ManagementRole = keyof ManagementLevels;

export type ManagementUpgradeReason =
    | 'ok'
    | 'team-level-cap'
    | 'max-level'
    | 'insufficient-budget'
    | 'invalid-role';

export interface ManagementUpgradeResult {
    success: boolean;
    reason: ManagementUpgradeReason;
    levels: ManagementLevels;
    previousLevel: number;
    newLevel: number;
    budgetCost: number;
}

interface EconomyConfig {
    managementUpgradeCost: {
        maxLevel: number;
        currentLevelBudgetMultiplier: number;
        currentLevelOffset: number;
    };
}

export interface ManagementEffectRow {
    managementLevel: number;
    operationPresidentBudgetBonus: number;
    headCoachBattleOvrBonus: number;
    scoutingDirectorHighestQualityWeightBonus: number;
    medicalTeamInjuryRiskReduction: number;
    mediaTeamOfflineBudgetBonus: number;
}

export interface ManagementEffectsConfig {
    levelEffects: ManagementEffectRow[];
}

export interface ManagementEffectSnapshot {
    operationPresidentBudgetBonus: number;
    headCoachBattleOvrBonus: number;
    scoutingDirectorHighestQualityWeightBonus: number;
    medicalTeamInjuryRiskReduction: number;
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
    offlineStartedAtMs: number | null;
    hasRecordedOfflineSession: boolean;
    pendingOfflineSeconds: number;
    unpromptedOfflineSeconds: number;
}

export interface SeasonState {
    version: number;
    seasonNumber: number;
    matchNumber: number;
    officialWins: number;
    schedulePhase: SeasonSchedulePhase;
    playoffRound: number;
    playoffWinsInRound: number;
    infiniteMode: boolean;
    infiniteMatchNumber: number;
    infiniteWins: number;
    conceptGodUpgradeUnlocked: boolean;
    lastSettledMatchId: string | null;
    lastSettledPlayerInstanceIds: string[];
    lastBaseRewardMatchId: string | null;
    lastAdRewardMatchId: string | null;
    lastAdvancedMatchId: string | null;
    opponentInjuredPlayerIndices: number[];
}

export type SeasonSchedulePhase =
    | 'regular-season'
    | 'cup'
    | 'all-star'
    | 'playoffs'
    | 'concept-endless';

export interface MatchSettlementEvent {
    matchId: string;
    won: boolean;
    baseReward: number;
    adReward: number;
    advanced: boolean;
    participatingPlayerInstanceIds: string[];
    seasonState: SeasonState;
}

interface PlayerHistorySaveData {
    version: number;
    acquiredCounts: Record<string, number>;
    conceptGodAcquiredCount: number;
    serviceDurationMsByDisplayName: Record<string, number>;
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
    medicalTeamInjuryRiskReduction: 0,
    mediaTeamOfflineBudgetBonus: 0,
};

let managementEffectsPromise: Promise<ManagementEffectsConfig> | null = null;
let economyConfigPromise: Promise<EconomyConfig> | null = null;

export function getBudget(initialBudget = DEFAULT_BUDGET): number {
    const serialized = sys.localStorage.getItem(BUDGET_STORAGE_KEY);
    // 小游戏平台缺失存档可能返回空字符串，不能将其转换成有效的 0 预算。
    if (serialized != null && String(serialized).trim() !== '') {
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
    if (isCheatModeEnabled()) {
        return true;
    }
    const budget = getBudget();
    if (budget + Number.EPSILON < safeAmount) {
        return false;
    }
    setBudget(budget - safeAmount);
    return true;
}

export function canAffordBudget(amount: number): boolean {
    if (isCheatModeEnabled()) {
        return true;
    }
    const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
    return getBudget() + Number.EPSILON >= safeAmount;
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

export function getRecruitmentAutoDismissEnabled(): boolean {
    return sys.localStorage.getItem(RECRUITMENT_AUTO_DISMISS_STORAGE_KEY) === 'true';
}

export function setRecruitmentAutoDismissEnabled(enabled: boolean): void {
    sys.localStorage.setItem(RECRUITMENT_AUTO_DISMISS_STORAGE_KEY, String(enabled));
}

export function getLowestRecruitmentQualityProtectionCount(): number {
    return Math.min(
        INT32_MAX,
        Math.max(
            0,
            sanitizeInteger(
                sys.localStorage.getItem(RECRUITMENT_LOWEST_QUALITY_PROTECTION_STORAGE_KEY),
                0,
            ),
        ),
    );
}

export function addLowestRecruitmentQualityProtection(
    count = RECRUITMENT_LOWEST_QUALITY_PROTECTION_RECRUITMENT_COUNT,
): number {
    const nextCount = Math.min(
        INT32_MAX,
        getLowestRecruitmentQualityProtectionCount()
            + Math.max(0, sanitizeInteger(count, 0)),
    );
    writeLowestRecruitmentQualityProtectionCount(nextCount);
    return nextCount;
}

export function consumeLowestRecruitmentQualityProtection(): number {
    const nextCount = Math.max(
        0,
        getLowestRecruitmentQualityProtectionCount() - 1,
    );
    writeLowestRecruitmentQualityProtectionCount(nextCount);
    return nextCount;
}

export function getRecruitmentUpperQualityPityMissCount(): number {
    return Math.min(
        RECRUITMENT_UPPER_QUALITY_PITY_MISS_LIMIT,
        Math.max(
            0,
            sanitizeInteger(
                sys.localStorage.getItem(RECRUITMENT_UPPER_QUALITY_PITY_MISS_STORAGE_KEY),
                0,
            ),
        ),
    );
}

export function recordRecruitmentUpperQualityPityResult(isUpperQuality: boolean): number {
    const nextCount = isUpperQuality
        ? 0
        : Math.min(
            RECRUITMENT_UPPER_QUALITY_PITY_MISS_LIMIT,
            getRecruitmentUpperQualityPityMissCount() + 1,
        );
    sys.localStorage.setItem(
        RECRUITMENT_UPPER_QUALITY_PITY_MISS_STORAGE_KEY,
        String(nextCount),
    );
    return nextCount;
}

export function getRecruitmentAdHighestQualityPityCount(): number {
    return Math.min(
        INT32_MAX,
        Math.max(
            0,
            sanitizeInteger(
                sys.localStorage.getItem(RECRUITMENT_AD_HIGHEST_QUALITY_PITY_STORAGE_KEY),
                0,
            ),
        ),
    );
}

export function recordRewardedAdForRecruitmentPity(): number {
    const nextCount = Math.min(
        INT32_MAX,
        getRecruitmentAdHighestQualityPityCount() + 1,
    );
    writeRecruitmentAdHighestQualityPityCount(nextCount);
    return nextCount;
}

export function consumeRecruitmentAdHighestQualityPity(): void {
    writeRecruitmentAdHighestQualityPityCount(
        getRecruitmentAdHighestQualityPityCount()
            - RECRUITMENT_AD_HIGHEST_QUALITY_PITY_LIMIT,
    );
}

function writeRecruitmentAdHighestQualityPityCount(count: number): void {
    const normalizedCount = Math.min(
        INT32_MAX,
        Math.max(0, sanitizeInteger(count, 0)),
    );
    sys.localStorage.setItem(
        RECRUITMENT_AD_HIGHEST_QUALITY_PITY_STORAGE_KEY,
        String(normalizedCount),
    );
    gameStateEvents.emit(
        GAME_STATE_EVENT_RECRUITMENT_AD_PITY_CHANGED,
        normalizedCount,
    );
}

export function getRecruitmentAdProbabilityBoostCount(
    percent: RecruitmentAdProbabilityBoostPercent,
): number {
    return Math.min(
        INT32_MAX,
        Math.max(
            0,
            sanitizeInteger(
                sys.localStorage.getItem(
                    RECRUITMENT_AD_PROBABILITY_BOOST_STORAGE_KEYS[percent],
                ),
                0,
            ),
        ),
    );
}

export function addRecruitmentAdProbabilityBoost(
    percent: RecruitmentAdProbabilityBoostPercent,
    count = RECRUITMENT_AD_PROBABILITY_BOOST_DRAW_COUNT,
): number {
    const nextCount = Math.min(
        INT32_MAX,
        getRecruitmentAdProbabilityBoostCount(percent)
            + Math.max(0, sanitizeInteger(count, 0)),
    );
    writeRecruitmentAdProbabilityBoostCount(percent, nextCount);
    return nextCount;
}

export function consumeRecruitmentAdProbabilityBoost(
    percent: RecruitmentAdProbabilityBoostPercent,
    count = 1,
): number {
    const nextCount = Math.max(
        0,
        getRecruitmentAdProbabilityBoostCount(percent)
            - Math.max(0, sanitizeInteger(count, 0)),
    );
    writeRecruitmentAdProbabilityBoostCount(percent, nextCount);
    return nextCount;
}

function writeRecruitmentAdProbabilityBoostCount(
    percent: RecruitmentAdProbabilityBoostPercent,
    count: number,
): void {
    const normalizedCount = Math.min(
        INT32_MAX,
        Math.max(0, sanitizeInteger(count, 0)),
    );
    sys.localStorage.setItem(
        RECRUITMENT_AD_PROBABILITY_BOOST_STORAGE_KEYS[percent],
        String(normalizedCount),
    );
    gameStateEvents.emit(
        GAME_STATE_EVENT_RECRUITMENT_AD_PROBABILITY_BOOST_CHANGED,
        percent,
        normalizedCount,
    );
}

function writeLowestRecruitmentQualityProtectionCount(count: number): void {
    const normalizedCount = Math.min(
        INT32_MAX,
        Math.max(0, sanitizeInteger(count, 0)),
    );
    sys.localStorage.setItem(
        RECRUITMENT_LOWEST_QUALITY_PROTECTION_STORAGE_KEY,
        String(normalizedCount),
    );
    gameStateEvents.emit(
        GAME_STATE_EVENT_RECRUITMENT_PROTECTION_CHANGED,
        normalizedCount,
    );
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
    const now = Date.now();
    const normalizedCards = Array<PlayerCard | null>(ROSTER_SLOT_COUNT)
        .fill(null)
        .map((_, index) => cards[index] ? clonePlayerCard(cards[index]!) : null);
    if (emitChange) {
        reconcileRosterServiceHistory(normalizedCards, now);
    }
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

export function getTotalRecruitmentCount(): number {
    return Object.values(loadPlayerHistory().acquiredCounts).reduce(
        (total, rawCount) => Math.min(
            INT32_MAX,
            total + Math.max(0, sanitizeInteger(rawCount, 0)),
        ),
        0,
    );
}

export function getPlayerServiceDurationMs(
    displayName: string,
    roster: ReadonlyArray<PlayerCard | null> = loadRoster(),
    now = Date.now(),
): number {
    const historyKey = getPlayerHistoryKey(displayName);
    const historyDuration = sanitizeDuration(
        loadPlayerHistory().serviceDurationMsByDisplayName[historyKey],
    );
    return roster.reduce((total, card) => {
        if (!card || getPlayerHistoryKey(card.displayName) !== historyKey) {
            return total;
        }
        const startedAtMs = card.lineupSinceMs ?? card.acquiredAtMs;
        const currentDuration = Math.max(0, now - startedAtMs);
        return Math.min(Number.MAX_SAFE_INTEGER, total + currentDuration);
    }, historyDuration);
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
    const migratedServiceDurationMs: Record<string, number> = {};
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
    for (const [key, rawDuration] of Object.entries(
        history.serviceDurationMsByDisplayName,
    )) {
        const migratedKey = displayNameByTemplateId.get(key)
            ?? getPlayerHistoryKey(key);
        migratedServiceDurationMs[migratedKey] = Math.min(
            Number.MAX_SAFE_INTEGER,
            sanitizeDuration(migratedServiceDurationMs[migratedKey])
                + sanitizeDuration(rawDuration),
        );
    }
    savePlayerHistory({
        version: PLAYER_HISTORY_SAVE_VERSION,
        acquiredCounts: migratedCounts,
        conceptGodAcquiredCount: history.conceptGodAcquiredCount,
        serviceDurationMsByDisplayName: migratedServiceDurationMs,
    });
}

export function loadManagementLevels(): ManagementLevels {
    const defaults = { ...ZERO_MANAGEMENT_LEVELS };
    const serialized = sys.localStorage.getItem(MANAGEMENT_STORAGE_KEY);
    if (!serialized) {
        writeManagementLevels(defaults, false);
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
        writeManagementLevels(levels, false);
        return levels;
    } catch {
        writeManagementLevels(defaults, false);
        return defaults;
    }
}

export function saveManagementLevels(levels: ManagementLevels): void {
    writeManagementLevels(levels, true);
}

function writeManagementLevels(levels: ManagementLevels, emitChange: boolean): void {
    const data: ManagementLevels = {
        operationPresident: sanitizeLevel(levels.operationPresident),
        headCoach: sanitizeLevel(levels.headCoach),
        scoutingDirector: sanitizeLevel(levels.scoutingDirector),
        medicalTeam: sanitizeLevel(levels.medicalTeam),
        mediaTeam: sanitizeLevel(levels.mediaTeam),
    };
    sys.localStorage.setItem(MANAGEMENT_STORAGE_KEY, JSON.stringify(data));
    if (emitChange) {
        gameStateEvents.emit(GAME_STATE_EVENT_MANAGEMENT_CHANGED, { ...data });
    }
}

export async function getManagementUpgradeCost(level: number): Promise<number> {
    const config = await loadEconomyConfig();
    const safeLevel = sanitizeLevel(level);
    if (safeLevel >= getManagementMaxLevel(config)) {
        return 0;
    }
    return getManagementCostRow(config, safeLevel)?.budgetCost ?? 0;
}

export async function upgradeManagementWithBudget(
    role: ManagementRole,
    teamLevel: number,
): Promise<ManagementUpgradeResult> {
    let levels = loadManagementLevels();
    if (!isManagementRole(role)) {
        return createManagementUpgradeResult(
            false,
            'invalid-role',
            levels,
            0,
            0,
        );
    }

    const config = await loadEconomyConfig();
    levels = loadManagementLevels();
    const previousLevel = levels[role];
    const maxLevel = getManagementMaxLevel(config);
    if (previousLevel >= maxLevel) {
        return createManagementUpgradeResult(
            false,
            'max-level',
            levels,
            previousLevel,
            0,
        );
    }

    const cost = getManagementCostRow(config, previousLevel)?.budgetCost ?? 0;
    if (previousLevel >= sanitizeTeamLevel(teamLevel)) {
        return createManagementUpgradeResult(
            false,
            'team-level-cap',
            levels,
            previousLevel,
            cost,
        );
    }
    const budgetBeforeSpend = getBudget();
    if (cost > 0 && !trySpendBudget(cost)) {
        return createManagementUpgradeResult(
            false,
            'insufficient-budget',
            levels,
            previousLevel,
            cost,
        );
    }

    levels = {
        ...levels,
        [role]: previousLevel + 1,
    };
    saveManagementLevels(levels);
    const budgetAfterSpend = getBudget();
    if (budgetAfterSpend + Number.EPSILON < budgetBeforeSpend) {
        notifyValidOperationCompleted();
    }
    return createManagementUpgradeResult(
        true,
        'ok',
        levels,
        previousLevel,
        cost,
    );
}

export function upgradeManagementWithAd(
    role: ManagementRole,
    teamLevel: number,
): ManagementUpgradeResult {
    const levels = loadManagementLevels();
    if (!isManagementRole(role)) {
        return createManagementUpgradeResult(
            false,
            'invalid-role',
            levels,
            0,
            0,
        );
    }

    const previousLevel = levels[role];
    if (previousLevel >= MAX_MANAGEMENT_LEVEL) {
        return createManagementUpgradeResult(
            false,
            'max-level',
            levels,
            previousLevel,
            0,
        );
    }
    if (previousLevel >= sanitizeTeamLevel(teamLevel)) {
        return createManagementUpgradeResult(
            false,
            'team-level-cap',
            levels,
            previousLevel,
            0,
        );
    }

    const upgradedLevels: ManagementLevels = {
        ...levels,
        [role]: previousLevel + 1,
    };
    saveManagementLevels(upgradedLevels);
    return createManagementUpgradeResult(
        true,
        'ok',
        upgradedLevels,
        previousLevel,
        0,
    );
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

function loadEconomyConfig(): Promise<EconomyConfig> {
    economyConfigPromise ??= loadJson<EconomyConfig>(
        'data/balance/economy',
    ).then((config) => {
        if (
            !config.managementUpgradeCost
            || !Number.isFinite(
                config.managementUpgradeCost.currentLevelBudgetMultiplier,
            )
            || !Number.isFinite(
                config.managementUpgradeCost.currentLevelOffset,
            )
        ) {
            throw new Error('Invalid management upgrade cost configuration.');
        }
        return config;
    });
    return economyConfigPromise;
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
            medicalTeamInjuryRiskReduction: getEffectRow(
                config,
                levels.medicalTeam,
            ).medicalTeamInjuryRiskReduction,
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
        version: IDLE_SAVE_VERSION,
        accrualStartedAtMs: now,
        lastOnlineTickAtMs: now,
        offlineStartedAtMs: null,
        hasRecordedOfflineSession: false,
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
        const parsedOfflineStartedAtMs = Number(parsed.offlineStartedAtMs);
        return {
            version: IDLE_SAVE_VERSION,
            accrualStartedAtMs: sanitizeTimestamp(parsed.accrualStartedAtMs, now),
            lastOnlineTickAtMs: sanitizeTimestamp(parsed.lastOnlineTickAtMs, now),
            offlineStartedAtMs: Number.isFinite(parsedOfflineStartedAtMs)
                && parsedOfflineStartedAtMs > 0
                ? Math.floor(parsedOfflineStartedAtMs)
                : null,
            hasRecordedOfflineSession: Boolean(parsed.hasRecordedOfflineSession)
                || (Number.isFinite(parsedOfflineStartedAtMs) && parsedOfflineStartedAtMs > 0),
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
        version: IDLE_SAVE_VERSION,
        accrualStartedAtMs: sanitizeTimestamp(state.accrualStartedAtMs, Date.now()),
        lastOnlineTickAtMs: sanitizeTimestamp(state.lastOnlineTickAtMs, Date.now()),
        offlineStartedAtMs: state.offlineStartedAtMs === null
            ? null
            : sanitizeTimestamp(state.offlineStartedAtMs, Date.now()),
        hasRecordedOfflineSession: Boolean(state.hasRecordedOfflineSession),
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
    const defaults = createDefaultSeasonState();
    const serialized = sys.localStorage.getItem(SEASON_STORAGE_KEY);
    if (!serialized) {
        writeSeasonState(defaults, false);
        return defaults;
    }
    try {
        const parsed = JSON.parse(serialized) as Partial<SeasonState>;
        const state = normalizeSeasonState(parsed);
        writeSeasonState(state, false);
        return state;
    } catch {
        return defaults;
    }
}

export function saveSeasonState(state: SeasonState): SeasonState {
    const normalized = normalizeSeasonState(state);
    writeSeasonState(normalized, true);
    return normalized;
}

export function getCurrentMatchId(state: SeasonState = loadSeasonState()): string {
    return state.infiniteMode
        ? `infinite-${state.infiniteMatchNumber}`
        : `standard-${state.matchNumber}`;
}

export function recordRandomOpponentInjuryAfterDefeat(
    matchId: string,
    opponentRoster: ReadonlyArray<PlayerCard>,
): number | null {
    const state = loadSeasonState();
    if (!isCurrentMatchId(state, matchId)) {
        return null;
    }
    const injuredIndices = new Set(state.opponentInjuredPlayerIndices);
    const candidates = opponentRoster
        .map((card, index) => ({ card, index }))
        .filter(({ card, index }) => Boolean(card) && !injuredIndices.has(index));
    if (candidates.length === 0) {
        return null;
    }
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    state.opponentInjuredPlayerIndices = [
        ...state.opponentInjuredPlayerIndices,
        selected.index,
    ];
    saveSeasonState(state);
    return selected.index;
}

export function applyPermanentOpponentInjuries(
    opponentRoster: PlayerCard[],
    injuredPlayerIndices: ReadonlyArray<number>,
    playerTeamOverall: number,
): number {
    const injuredIndices = new Set(
        normalizeOpponentInjuredPlayerIndices(injuredPlayerIndices),
    );
    opponentRoster.forEach((card, index) => {
        if (!injuredIndices.has(index) || card.activeInjury) {
            return;
        }
        const currentOverall = Math.max(1, Math.floor(card.overall));
        const requestedPenalty = Math.max(
            1,
            Math.round(currentOverall * OPPONENT_PERMANENT_INJURY_PERCENT),
        );
        const nextOverall = Math.max(1, currentOverall - requestedPenalty);
        let remainingReduction = currentOverall - nextOverall;
        for (const key of [...ATTRIBUTE_KEYS].sort(
            (left, right) => card.attributes[right] - card.attributes[left],
        )) {
            const reduction = Math.min(card.attributes[key], remainingReduction);
            card.attributes[key] -= reduction;
            remainingReduction -= reduction;
            if (remainingReduction <= 0) {
                break;
            }
        }
        card.overall = nextOverall;
        card.activeInjury = {
            overallPenalty: Math.max(1, currentOverall - nextOverall),
            remainingMatches: INT32_MAX,
        };
    });
    if (
        opponentRoster.length === ROSTER_SLOT_COUNT
        && opponentRoster.every((_card, index) => injuredIndices.has(index))
    ) {
        return balanceFullyInjuredOpponentRoster(opponentRoster, playerTeamOverall);
    }
    return Math.min(
        INT32_MAX,
        opponentRoster.reduce((total, card) => total + Math.max(1, card.overall), 0),
    );
}

function balanceFullyInjuredOpponentRoster(
    opponentRoster: PlayerCard[],
    playerTeamOverall: number,
): number {
    const baselineOveralls = opponentRoster.map((card) => Math.max(
        1,
        Math.floor(card.overall) + Math.max(0, card.activeInjury?.overallPenalty ?? 0),
    ));
    const baselineTotal = baselineOveralls.reduce((total, overall) => total + overall, 0);
    const requestedTarget = Math.min(
        INT32_MAX,
        Math.max(
            opponentRoster.length,
            Math.floor(Math.max(0, playerTeamOverall)
                * FULLY_INJURED_OPPONENT_PLAYER_OVERALL_MULTIPLIER),
        ),
    );
    const targetTotal = Math.min(baselineTotal, requestedTarget);
    const distributableTarget = targetTotal - opponentRoster.length;
    const totalCapacity = baselineTotal - opponentRoster.length;
    const targetOveralls = baselineOveralls.map((baselineOverall) => {
        if (totalCapacity <= 0) {
            return 1;
        }
        const exactShare = (baselineOverall - 1) / totalCapacity * distributableTarget;
        return 1 + Math.floor(exactShare);
    });
    let remainingOverall = targetTotal
        - targetOveralls.reduce((total, overall) => total + overall, 0);
    const remainderOrder = baselineOveralls
        .map((baselineOverall, index) => ({
            index,
            remainder: totalCapacity <= 0
                ? 0
                : (baselineOverall - 1) / totalCapacity * distributableTarget
                    - Math.floor((baselineOverall - 1) / totalCapacity * distributableTarget),
        }))
        .sort((left, right) => right.remainder - left.remainder || left.index - right.index);
    for (const { index } of remainderOrder) {
        if (remainingOverall <= 0) {
            break;
        }
        if (targetOveralls[index] < baselineOveralls[index]) {
            targetOveralls[index] += 1;
            remainingOverall -= 1;
        }
    }

    opponentRoster.forEach((card, index) => {
        const baselineOverall = baselineOveralls[index];
        const targetOverall = targetOveralls[index];
        adjustOpponentCardOverall(card, targetOverall);
        card.activeInjury = {
            overallPenalty: Math.max(0, baselineOverall - targetOverall),
            remainingMatches: INT32_MAX,
        };
    });
    return targetTotal;
}

function adjustOpponentCardOverall(card: PlayerCard, targetOverall: number): void {
    let difference = Math.max(1, Math.floor(card.overall)) - targetOverall;
    if (difference > 0) {
        for (const key of [...ATTRIBUTE_KEYS].sort(
            (left, right) => card.attributes[right] - card.attributes[left],
        )) {
            const reduction = Math.min(card.attributes[key], difference);
            card.attributes[key] -= reduction;
            difference -= reduction;
            if (difference <= 0) {
                break;
            }
        }
    } else if (difference < 0) {
        const strongestAttribute = ATTRIBUTE_KEYS.reduce(
            (strongest, key) => card.attributes[key] > card.attributes[strongest]
                ? key
                : strongest,
            ATTRIBUTE_KEYS[0],
        );
        card.attributes[strongestAttribute] += -difference;
    }
    card.overall = targetOverall;
}

export function isConceptGodUpgradeUnlocked(
    state: SeasonState = loadSeasonState(),
): boolean {
    return state.conceptGodUpgradeUnlocked;
}

export function getInfiniteGoatProbabilityBonus(
    state: SeasonState = loadSeasonState(),
): number {
    return state.infiniteMode
        ? Math.min(0.5, Math.max(0, state.infiniteWins) * 0.005)
        : 0;
}

export function settleBaseMatchReward(matchId: string, amount: number): boolean {
    return settleMatchReward(matchId, amount, 'base');
}

export function settleAdMatchReward(matchId: string, amount: number): boolean {
    return settleMatchReward(matchId, amount, 'ad');
}

export function advanceSeasonAfterWin(
    matchId: string,
): boolean {
    const state = loadSeasonState();
    if (
        !isCurrentMatchId(state, matchId)
        || state.lastAdvancedMatchId === matchId
    ) {
        return false;
    }

    const nextOfficialWins = Math.min(INT32_MAX, state.officialWins + 1);
    state.lastAdvancedMatchId = matchId;
    state.officialWins = nextOfficialWins;
    state.opponentInjuredPlayerIndices = [];
    if (state.infiniteMode) {
        state.infiniteWins = Math.min(INT32_MAX, state.infiniteWins + 1);
        state.infiniteMatchNumber = Math.min(INT32_MAX, state.infiniteMatchNumber + 1);
    } else if (state.matchNumber < STANDARD_MATCH_COUNT) {
        state.matchNumber += 1;
    } else {
        state.infiniteMode = true;
        state.infiniteMatchNumber = 1;
        state.infiniteWins = 0;
    }
    state.conceptGodUpgradeUnlocked = state.infiniteMode;
    saveSeasonState(state);
    return true;
}

export function emitMatchSettled(
    settlement: Omit<MatchSettlementEvent, 'seasonState'>,
): void {
    const matchId = normalizeMatchId(settlement.matchId);
    if (!matchId) {
        return;
    }
    const state = loadSeasonState();
    if (state.lastSettledMatchId !== matchId) {
        state.lastSettledMatchId = matchId;
        state.lastSettledPlayerInstanceIds = normalizePlayerInstanceIds(
            settlement.participatingPlayerInstanceIds,
        );
        saveSeasonState(state);
    }
    const event: MatchSettlementEvent = {
        ...settlement,
        matchId,
        baseReward: normalizeBudget(settlement.baseReward),
        adReward: normalizeBudget(settlement.adReward),
        participatingPlayerInstanceIds: normalizePlayerInstanceIds(
            settlement.participatingPlayerInstanceIds,
        ),
        seasonState: { ...loadSeasonState() },
    };
    gameStateEvents.emit(GAME_STATE_EVENT_MATCH_SETTLED, event);
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

function createManagementUpgradeResult(
    success: boolean,
    reason: ManagementUpgradeReason,
    levels: ManagementLevels,
    previousLevel: number,
    budgetCost: number,
): ManagementUpgradeResult {
    return {
        success,
        reason,
        levels: { ...levels },
        previousLevel,
        newLevel: success ? previousLevel + 1 : previousLevel,
        budgetCost: normalizeBudget(budgetCost),
    };
}

function isManagementRole(value: unknown): value is ManagementRole {
    return typeof value === 'string'
        && Object.prototype.hasOwnProperty.call(ZERO_MANAGEMENT_LEVELS, value);
}

function getManagementMaxLevel(config: EconomyConfig): number {
    return Math.min(
        MAX_MANAGEMENT_LEVEL,
        Math.max(0, sanitizeInteger(
            config.managementUpgradeCost.maxLevel,
            MAX_MANAGEMENT_LEVEL,
        )),
    );
}

function getManagementCostRow(
    config: EconomyConfig,
    fromLevel: number,
): { fromLevel: number; toLevel: number; budgetCost: number } | null {
    if (fromLevel < 0 || fromLevel >= getManagementMaxLevel(config)) {
        return null;
    }
    const multiplier = normalizeBudget(
        config.managementUpgradeCost.currentLevelBudgetMultiplier,
    );
    const levelOffset = Math.max(
        0,
        sanitizeInteger(config.managementUpgradeCost.currentLevelOffset, 0),
    );
    return {
        fromLevel,
        toLevel: fromLevel + 1,
        budgetCost: normalizeBudget((fromLevel + levelOffset) * multiplier),
    };
}

function createDefaultSeasonState(): SeasonState {
    return {
        version: SEASON_SAVE_VERSION,
        seasonNumber: 1,
        matchNumber: 1,
        officialWins: 0,
        schedulePhase: 'regular-season',
        playoffRound: 0,
        playoffWinsInRound: 0,
        infiniteMode: false,
        infiniteMatchNumber: 1,
        infiniteWins: 0,
        conceptGodUpgradeUnlocked: false,
        lastSettledMatchId: null,
        lastSettledPlayerInstanceIds: [],
        lastBaseRewardMatchId: null,
        lastAdRewardMatchId: null,
        lastAdvancedMatchId: null,
        opponentInjuredPlayerIndices: [],
    };
}

function normalizeSeasonState(value: Partial<SeasonState>): SeasonState {
    if (sanitizeInteger(value.version, 0) !== SEASON_SAVE_VERSION) {
        return createDefaultSeasonState();
    }
    const infiniteMode = Boolean(value.infiniteMode);
    const matchNumber = infiniteMode
        ? STANDARD_MATCH_COUNT
        : Math.min(
            STANDARD_MATCH_COUNT,
            Math.max(1, sanitizeInteger(value.matchNumber, 1)),
        );
    const infiniteMatchNumber = Math.max(
        1,
        sanitizeInteger(value.infiniteMatchNumber, 1),
    );
    const infiniteWins = Math.max(0, sanitizeInteger(value.infiniteWins, 0));
    const fallbackOfficialWins = infiniteMode
        ? STANDARD_MATCH_COUNT + infiniteWins
        : matchNumber - 1;
    const storedOfficialWins = Math.max(
        0,
        sanitizeInteger(value.officialWins, fallbackOfficialWins),
    );
    const officialWins = Math.min(
        INT32_MAX,
        Math.max(fallbackOfficialWins, storedOfficialWins),
    );
    const schedule = getSeasonSchedule(matchNumber, infiniteMode);
    return {
        version: SEASON_SAVE_VERSION,
        seasonNumber: 1,
        matchNumber,
        officialWins,
        ...schedule,
        infiniteMode,
        infiniteMatchNumber,
        infiniteWins,
        // 进入无限赛程即已夺冠；旧存档也按此条件补齐解锁状态。
        conceptGodUpgradeUnlocked: infiniteMode,
        lastSettledMatchId: normalizeMatchId(value.lastSettledMatchId),
        lastSettledPlayerInstanceIds: normalizePlayerInstanceIds(
            value.lastSettledPlayerInstanceIds,
        ),
        lastBaseRewardMatchId: normalizeMatchId(value.lastBaseRewardMatchId),
        lastAdRewardMatchId: normalizeMatchId(value.lastAdRewardMatchId),
        lastAdvancedMatchId: normalizeMatchId(value.lastAdvancedMatchId),
        opponentInjuredPlayerIndices: normalizeOpponentInjuredPlayerIndices(
            value.opponentInjuredPlayerIndices,
        ),
    };
}

function getSeasonSchedule(
    matchNumber: number,
    infiniteMode: boolean,
): Pick<SeasonState, 'schedulePhase' | 'playoffRound' | 'playoffWinsInRound'> {
    const schedule = getScheduleDescriptor({
        infiniteMode,
        infiniteMatchNumber: 1,
        matchNumber,
    });
    return {
        schedulePhase: schedule.phase,
        playoffRound: schedule.playoffRound,
        playoffWinsInRound: schedule.playoffWinsInRound,
    };
}

function writeSeasonState(state: SeasonState, emitChange: boolean): void {
    const snapshot = normalizeSeasonState(state);
    sys.localStorage.setItem(SEASON_STORAGE_KEY, JSON.stringify(snapshot));
    if (emitChange) {
        gameStateEvents.emit(GAME_STATE_EVENT_SEASON_CHANGED, { ...snapshot });
    }
}

function settleMatchReward(
    matchId: string,
    amount: number,
    rewardType: 'base' | 'ad',
): boolean {
    const normalizedMatchId = normalizeMatchId(matchId);
    const reward = normalizeBudget(amount);
    if (!normalizedMatchId || reward <= 0) {
        return false;
    }
    const state = loadSeasonState();
    if (
        !isRecentMatchId(state, normalizedMatchId)
        || (
            rewardType === 'base'
                ? state.lastBaseRewardMatchId === normalizedMatchId
                : state.lastAdRewardMatchId === normalizedMatchId
        )
    ) {
        return false;
    }

    if (rewardType === 'base') {
        state.lastBaseRewardMatchId = normalizedMatchId;
    } else {
        state.lastAdRewardMatchId = normalizedMatchId;
    }
    saveSeasonState(state);
    addBudget(reward);
    return true;
}

function isCurrentMatchId(state: SeasonState, matchId: string): boolean {
    const normalizedMatchId = normalizeMatchId(matchId);
    return Boolean(normalizedMatchId)
        && getCurrentMatchId(state) === normalizedMatchId;
}

function isRecentMatchId(state: SeasonState, matchId: string): boolean {
    return isCurrentMatchId(state, matchId)
        || state.lastAdvancedMatchId === matchId
        || state.lastSettledMatchId === matchId;
}

function normalizePlayerInstanceIds(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }
    const uniqueIds = new Set<string>();
    for (const item of value) {
        if (typeof item !== 'string') {
            continue;
        }
        const id = item.trim();
        if (id) {
            uniqueIds.add(id);
        }
        if (uniqueIds.size >= ROSTER_SLOT_COUNT) {
            break;
        }
    }
    return Array.from(uniqueIds);
}

function normalizeOpponentInjuredPlayerIndices(value: unknown): number[] {
    if (!Array.isArray(value)) {
        return [];
    }
    const uniqueIndices = new Set<number>();
    for (const item of value) {
        const index = sanitizeInteger(item, -1);
        if (index >= 0 && index < ROSTER_SLOT_COUNT) {
            uniqueIndices.add(index);
        }
    }
    return Array.from(uniqueIndices).sort((left, right) => left - right);
}

function normalizeMatchId(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }
    const normalized = value.trim();
    return normalized ? normalized : null;
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
    const pendingEvent = normalizePendingPlayerEvent(card.pendingEvent, now);
    const activeInjury = normalizeActivePlayerInjury(card.activeInjury);
    const activeTraining = normalizeActivePlayerTraining(card.activeTraining);
    const conceptGodId = typeof card.conceptGodId === 'string'
        ? card.conceptGodId.trim()
        : '';

    return {
        instanceId: String(card.instanceId),
        templateId: String(card.templateId),
        sourcePlayerName: String(card.sourcePlayerName),
        displayName: String(card.displayName),
        position: String(card.position ?? ''),
        qualityId: sanitizeInteger(card.qualityId, 3),
        qualityName: String(card.qualityName ?? ''),
        isConceptGod: Boolean(card.isConceptGod),
        ...(card.isConceptGod && conceptGodId ? { conceptGodId } : {}),
        overall,
        attributes,
        acquiredAtMs: sanitizeTimestamp(card.acquiredAtMs, now),
        lineupSinceMs: card.lineupSinceMs === null
            ? null
            : sanitizeTimestamp(card.lineupSinceMs, now),
        matchesPlayed: Math.max(0, sanitizeInteger(card.matchesPlayed, 0)),
        retirementMatchLimit: normalizeRetirementMatchLimit(
            card.retirementMatchLimit,
            String(card.instanceId),
        ),
        ...(normalizeMatchId(card.lastCountedMatchId)
            ? { lastCountedMatchId: normalizeMatchId(card.lastCountedMatchId)! }
            : {}),
        ...(pendingEvent ? { pendingEvent } : {}),
        ...(activeInjury ? { activeInjury } : {}),
        ...(activeTraining ? { activeTraining } : {}),
    };
}

function clonePlayerCard(card: PlayerCard): PlayerCard {
    return {
        ...card,
        attributes: { ...card.attributes },
        ...(card.pendingEvent ? { pendingEvent: { ...card.pendingEvent } } : {}),
        ...(card.activeInjury ? { activeInjury: { ...card.activeInjury } } : {}),
        ...(card.activeTraining ? { activeTraining: { ...card.activeTraining } } : {}),
    };
}

function normalizeRetirementMatchLimit(value: unknown, seed: string): number {
    const savedLimit = sanitizeInteger(value, 0);
    if (savedLimit > 0) {
        return Math.min(5, savedLimit);
    }

    let hash = 0;
    for (const character of seed) {
        hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
    }
    return 3 + hash % 3;
}

function normalizePendingPlayerEvent(
    value: unknown,
    now: number,
): PendingPlayerEvent | null {
    if (!value || typeof value !== 'object') {
        return null;
    }
    const event = value as Partial<PendingPlayerEvent>;
    // 旧存档的招募事件已停用，仅清除事件，保留球员及其他状态。
    if (
        event.type !== 'injury'
        && event.type !== 'retirement'
        && event.type !== 'training'
    ) {
        return null;
    }
    return {
        type: event.type,
        occurredAtMs: sanitizeTimestamp(event.occurredAtMs, now),
        descriptionTemplate: typeof event.descriptionTemplate === 'string'
            && event.descriptionTemplate.trim().length > 0
            ? event.descriptionTemplate
            : undefined,
        overallDelta: sanitizeInteger(event.overallDelta, 0),
        recoveryMatches: Math.max(0, sanitizeInteger(event.recoveryMatches, 0)),
    };
}

function normalizeActivePlayerInjury(value: unknown): ActivePlayerInjury | null {
    if (!value || typeof value !== 'object') {
        return null;
    }
    const injury = value as Partial<ActivePlayerInjury>;
    const overallPenalty = sanitizeInteger(injury.overallPenalty, 0);
    const remainingMatches = sanitizeInteger(injury.remainingMatches, 0);
    if (overallPenalty <= 0 || remainingMatches <= 0) {
        return null;
    }
    return { overallPenalty, remainingMatches };
}

function normalizeActivePlayerTraining(value: unknown): ActivePlayerTraining | null {
    if (!value || typeof value !== 'object') {
        return null;
    }
    const training = value as Partial<ActivePlayerTraining>;
    const overallBonus = sanitizeInteger(training.overallBonus, 0);
    const remainingMatches = sanitizeInteger(training.remainingMatches, 0);
    if (overallBonus <= 0 || remainingMatches <= 0) {
        return null;
    }
    return { overallBonus, remainingMatches };
}

function loadPlayerHistory(): PlayerHistorySaveData {
    const defaults: PlayerHistorySaveData = {
        version: PLAYER_HISTORY_SAVE_VERSION,
        acquiredCounts: {},
        conceptGodAcquiredCount: 0,
        serviceDurationMsByDisplayName: {},
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
            serviceDurationMsByDisplayName: parsed.serviceDurationMsByDisplayName
                && typeof parsed.serviceDurationMsByDisplayName === 'object'
                ? sanitizeDurationMap(parsed.serviceDurationMsByDisplayName)
                : {},
        };
    } catch {
        return defaults;
    }
}

function savePlayerHistory(history: PlayerHistorySaveData): void {
    const data: PlayerHistorySaveData = {
        version: PLAYER_HISTORY_SAVE_VERSION,
        acquiredCounts: { ...history.acquiredCounts },
        conceptGodAcquiredCount: Math.max(
            0,
            sanitizeInteger(history.conceptGodAcquiredCount, 0),
        ),
        serviceDurationMsByDisplayName: sanitizeDurationMap(
            history.serviceDurationMsByDisplayName,
        ),
    };
    sys.localStorage.setItem(PLAYER_HISTORY_STORAGE_KEY, JSON.stringify(data));
}

function ensureCurrentRosterHistory(roster: ReadonlyArray<PlayerCard | null>): void {
    const history = loadPlayerHistory();
    let changed = history.version !== PLAYER_HISTORY_SAVE_VERSION;
    history.version = PLAYER_HISTORY_SAVE_VERSION;
    const activeCounts = countRosterPlayersByDisplayName(roster);
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

function reconcileRosterServiceHistory(
    nextRoster: Array<PlayerCard | null>,
    now: number,
): void {
    const previousRoster = readStoredRoster(now);
    const nextInstanceIds = new Set(
        nextRoster.flatMap((card) => card ? [card.instanceId] : []),
    );
    const previousInstanceIds = new Set(
        previousRoster.flatMap((card) => card ? [card.instanceId] : []),
    );
    const history = loadPlayerHistory();
    let historyChanged = false;

    for (const card of previousRoster) {
        if (!card || nextInstanceIds.has(card.instanceId)) {
            continue;
        }
        const historyKey = getPlayerHistoryKey(card.displayName);
        const startedAtMs = card.lineupSinceMs ?? card.acquiredAtMs;
        const segmentDuration = Math.max(0, now - startedAtMs);
        history.serviceDurationMsByDisplayName[historyKey] = Math.min(
            Number.MAX_SAFE_INTEGER,
            sanitizeDuration(history.serviceDurationMsByDisplayName[historyKey])
                + segmentDuration,
        );
        historyChanged = true;
    }

    for (const card of nextRoster) {
        if (card && !previousInstanceIds.has(card.instanceId)) {
            card.lineupSinceMs = now;
        }
    }

    if (historyChanged) {
        savePlayerHistory(history);
    }
}

function readStoredRoster(now: number): Array<PlayerCard | null> {
    const serialized = sys.localStorage.getItem(ROSTER_STORAGE_KEY);
    if (!serialized) {
        return [];
    }
    try {
        const parsed = JSON.parse(serialized) as Partial<RosterSaveData>;
        return Array.isArray(parsed.cards)
            ? parsed.cards.map((card) => normalizePlayerCard(card, now))
            : [];
    } catch {
        return [];
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

function sanitizeDurationMap(value: Record<string, number>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, rawDuration] of Object.entries(value)) {
        const historyKey = getPlayerHistoryKey(key);
        if (!historyKey) {
            continue;
        }
        result[historyKey] = Math.min(
            Number.MAX_SAFE_INTEGER,
            sanitizeDuration(result[historyKey]) + sanitizeDuration(rawDuration),
        );
    }
    return result;
}

function sanitizeDuration(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue)
        ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(numericValue)))
        : 0;
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
    return Math.min(MAX_MANAGEMENT_LEVEL, Math.max(0, sanitizeInteger(value, 0)));
}

function sanitizeTeamLevel(value: unknown): number {
    return Math.min(
        MAX_MANAGEMENT_LEVEL,
        Math.max(0, sanitizeInteger(value, 0)),
    );
}

function sanitizeTimestamp(value: unknown, fallback: number): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0
        ? Math.floor(numericValue)
        : fallback;
}

import {
    _decorator,
    Button,
    Component,
    EventTarget,
    JsonAsset,
    Label,
    ProgressBar,
    resources,
    sys,
    tween,
    Tween,
    Vec3,
} from 'cc';
import { setGrowingNumber } from './NumberGrowthAnimator';
import { gameAudio } from './GameAudio';

const { ccclass, property } = _decorator;

export const TEAM_PROGRESSION_STORAGE_KEY = 'basketball.team.progression.v2';
const DEFAULT_PROGRESSION_RESOURCE_PATH = 'data/balance/team_progression';
const SAVE_VERSION = 2;
const MIN_TEAM_LEVEL = 0;
const MAX_TEAM_LEVEL = 100;

export const TEAM_PROGRESSION_EVENT_WILLPOWER_CHANGED = 'team-progression-willpower-changed';
export const TEAM_PROGRESSION_EVENT_LEVEL_CHANGED = 'team-progression-level-changed';
export const TEAM_PROGRESSION_EVENT_MARKET_VALUE_CHANGED = 'team-progression-market-value-changed';
export const TEAM_PROGRESSION_EVENT_WIN_UPGRADE_REQUESTED = 'team-progression-win-upgrade-requested';

export const teamProgressionEvents = new EventTarget();

export function getStoredMarketValueLevel(fallback = MIN_TEAM_LEVEL): number {
    return getStoredTeamLevel(fallback);
}

export function getStoredTeamLevel(fallback = MIN_TEAM_LEVEL): number {
    const serialized = sys.localStorage.getItem(TEAM_PROGRESSION_STORAGE_KEY);
    if (!serialized) {
        return clampTeamLevel(fallback);
    }
    try {
        const parsed = JSON.parse(serialized) as Partial<TeamProgressionSaveData>;
        if (sanitizeSaveVersion(parsed.version) !== SAVE_VERSION) {
            return clampTeamLevel(fallback);
        }
        const storedLevel = clampTeamLevel(parsed.teamLevel ?? fallback);
        return parsed.wonAtCurrentLevel
            ? Math.min(MAX_TEAM_LEVEL, storedLevel + 1)
            : storedLevel;
    } catch {
        return clampTeamLevel(fallback);
    }
}

export function recordStoredStandardMatchWin(): boolean {
    const serialized = sys.localStorage.getItem(TEAM_PROGRESSION_STORAGE_KEY);
    if (!serialized) {
        return false;
    }
    try {
        const parsed = JSON.parse(serialized) as Partial<TeamProgressionSaveData>;
        if (
            sanitizeSaveVersion(parsed.version) !== SAVE_VERSION
            || clampTeamLevel(parsed.teamLevel ?? MIN_TEAM_LEVEL) >= MAX_TEAM_LEVEL
        ) {
            return false;
        }
        const currentLevel = clampTeamLevel(parsed.teamLevel ?? MIN_TEAM_LEVEL);
        sys.localStorage.setItem(TEAM_PROGRESSION_STORAGE_KEY, JSON.stringify({
            version: SAVE_VERSION,
            teamLevel: Math.min(MAX_TEAM_LEVEL, currentLevel + 1),
            willpower: 0,
            wonAtCurrentLevel: false,
        }));
        return true;
    } catch {
        return false;
    }
}

interface TeamProgressionConfig {
    _meta: {
        teamLevelMin: number;
        totalTeamLevels: number;
        recruitWillpowerReward: number;
    };
    willpowerRequirementFormula: {
        teamLevelMultiplier: number;
        baseRequirement: number;
    };
}

interface TeamProgressionSaveData {
    version: number;
    teamLevel: number;
    willpower: number;
    wonAtCurrentLevel: boolean;
}

export interface TeamProgressionSnapshot {
    teamLevel: number;
    // 兼容现有招募、离线收益和概率弹窗的调用，现与球队等级一一对应。
    marketValueLevel: number;
    marketLevelCap: number;
    willpower: number;
    currentRequirement: number;
    canUpgrade: boolean;
    pendingChampionship: boolean;
    pendingWinUpgrade: boolean;
    maxLevel: boolean;
}

@ccclass('TeamLevelController')
export class TeamLevelController extends Component {
    public static instance: TeamLevelController | null = null;

    @property(Label)
    public teamLevelLabel: Label | null = null;

    @property(Label)
    public willpowerLabel: Label | null = null;

    @property(ProgressBar)
    public willpowerProgress: ProgressBar | null = null;

    @property(Button)
    public upgradeButton: Button | null = null;

    @property(Label)
    public upgradeButtonLabel: Label | null = null;

    @property({ displayName: '等级配置资源路径' })
    public progressionResourcePath = DEFAULT_PROGRESSION_RESOURCE_PATH;

    @property({ min: 0.05, max: 1, step: 0.05, displayName: '进度条动画时长' })
    public progressAnimationDuration = 0.25;

    private config: TeamProgressionConfig | null = null;
    private state: TeamProgressionSaveData = this.createDefaultState();
    private buttonBaseScale = new Vec3(1, 1, 1);
    private ready = false;

    protected onLoad(): void {
        TeamLevelController.instance = this;
        this.resolveSceneReferences();
        if (!this.hasRequiredReferences()) {
            console.error('[TeamLevelController] Missing team level UI references.');
            this.enabled = false;
            return;
        }
        this.buttonBaseScale.set(this.upgradeButton!.node.scale);
        this.showLoadingState();
        this.loadProgressionConfig();
    }

    protected onEnable(): void {
        this.upgradeButton?.node.on(Button.EventType.CLICK, this.onUpgradeButtonClicked, this);
    }

    protected onDisable(): void {
        this.upgradeButton?.node.off(Button.EventType.CLICK, this.onUpgradeButtonClicked, this);
        this.stopButtonPulse();
    }

    protected onDestroy(): void {
        if (TeamLevelController.instance === this) {
            TeamLevelController.instance = null;
        }
    }

    public addRecruitWillpower(): number {
        return this.addWillpower(this.config?._meta.recruitWillpowerReward ?? 0);
    }

    public addWillpower(amount: number): number {
        if (!this.ready || this.isAtMaximumLevel()) {
            return 0;
        }
        const safeAmount = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
        const accepted = Math.min(
            safeAmount,
            Math.max(0, this.getCurrentRequirement() - this.state.willpower),
        );
        if (accepted <= 0) {
            return 0;
        }
        this.state.willpower += accepted;
        this.saveState();
        this.refreshView(true);
        teamProgressionEvents.emit(TEAM_PROGRESSION_EVENT_WILLPOWER_CHANGED, this.getSnapshot());
        return accepted;
    }

    public recordStandardMatchWin(): boolean {
        if (!this.ready || this.isAtMaximumLevel() || !this.isReadyForWinUpgrade()) {
            return false;
        }
        if (!recordStoredStandardMatchWin()) {
            return false;
        }
        this.state = this.loadState();
        this.refreshView(true);
        this.playLevelUpAnimation();
        const snapshot = this.getSnapshot();
        teamProgressionEvents.emit(TEAM_PROGRESSION_EVENT_WILLPOWER_CHANGED, snapshot);
        teamProgressionEvents.emit(TEAM_PROGRESSION_EVENT_LEVEL_CHANGED, snapshot);
        teamProgressionEvents.emit(TEAM_PROGRESSION_EVENT_MARKET_VALUE_CHANGED, snapshot);
        gameAudio.playUpgradeSuccess();
        return true;
    }

    public canStartProgressionMatch(): boolean {
        return this.ready && (this.isAtMaximumLevel() || this.isReadyForWinUpgrade());
    }

    public getSnapshot(): TeamProgressionSnapshot | null {
        if (!this.ready) {
            return null;
        }
        return {
            teamLevel: this.state.teamLevel,
            marketValueLevel: this.state.teamLevel,
            marketLevelCap: this.getMaximumTeamLevel(),
            willpower: this.state.willpower,
            currentRequirement: this.getCurrentRequirement(),
            canUpgrade: false,
            pendingChampionship: false,
            pendingWinUpgrade: false,
            maxLevel: this.isAtMaximumLevel(),
        };
    }

    private resolveSceneReferences(): void {
        const levelNode = this.node.getChildByName('球队等级数值');
        const willpowerNode = this.node.getChildByName('斗志数值');
        const progressNode = this.node.getChildByName('进度框');
        const upgradeNode = this.node.getChildByName('升级');
        this.teamLevelLabel ??= levelNode?.getComponent(Label) ?? null;
        this.willpowerLabel ??= willpowerNode?.getComponent(Label) ?? null;
        this.willpowerProgress ??= progressNode?.getComponent(ProgressBar) ?? null;
        this.upgradeButton ??= upgradeNode?.getComponent(Button) ?? null;
        this.upgradeButtonLabel ??= upgradeNode?.getChildByName('Label')?.getComponent(Label) ?? null;
    }

    private hasRequiredReferences(): boolean {
        return Boolean(
            this.teamLevelLabel
            && this.willpowerLabel
            && this.willpowerProgress
            && this.upgradeButton
            && this.upgradeButtonLabel,
        );
    }

    private showLoadingState(): void {
        this.teamLevelLabel!.string = '0';
        this.willpowerLabel!.string = '-- / --';
        this.willpowerProgress!.progress = 0;
        this.upgradeButton!.interactable = false;
        this.upgradeButtonLabel!.string = '升级';
    }

    private loadProgressionConfig(): void {
        resources.load(this.progressionResourcePath, JsonAsset, (error, asset) => {
            if (error || !asset) {
                console.error('[TeamLevelController] Failed to load progression config.', error);
                return;
            }
            const config = asset.json as unknown as TeamProgressionConfig;
            if (!this.isValidConfig(config)) {
                console.error('[TeamLevelController] Invalid progression config.');
                return;
            }
            this.config = config;
            this.state = this.loadState();
            this.ready = true;
            this.saveState();
            this.refreshView(false);
        });
    }

    private isValidConfig(config: TeamProgressionConfig | null): config is TeamProgressionConfig {
        return Boolean(
            config?._meta
            && config._meta.teamLevelMin === MIN_TEAM_LEVEL
            && config._meta.totalTeamLevels === MAX_TEAM_LEVEL
            && Number.isFinite(config._meta.recruitWillpowerReward)
            && config._meta.recruitWillpowerReward > 0
            && Number.isFinite(config.willpowerRequirementFormula?.teamLevelMultiplier)
            && Number.isFinite(config.willpowerRequirementFormula?.baseRequirement)
            && config.willpowerRequirementFormula.teamLevelMultiplier >= 0
            && config.willpowerRequirementFormula.baseRequirement > 0,
        );
    }

    private loadState(): TeamProgressionSaveData {
        const fallback = this.createDefaultState();
        const serialized = sys.localStorage.getItem(TEAM_PROGRESSION_STORAGE_KEY);
        if (!serialized) {
            return fallback;
        }
        try {
            const parsed = JSON.parse(serialized) as Partial<TeamProgressionSaveData>;
            if (sanitizeSaveVersion(parsed.version) !== SAVE_VERSION) {
                return fallback;
            }
            const storedLevel = clampTeamLevel(parsed.teamLevel ?? fallback.teamLevel);
            const teamLevel = parsed.wonAtCurrentLevel
                ? Math.min(MAX_TEAM_LEVEL, storedLevel + 1)
                : storedLevel;
            const requirement = this.getRequirementForLevel(teamLevel);
            return {
                version: SAVE_VERSION,
                teamLevel,
                willpower: teamLevel >= MAX_TEAM_LEVEL
                    ? 0
                    : Math.min(requirement, Math.max(0, Math.floor(parsed.willpower ?? 0))),
                wonAtCurrentLevel: false,
            };
        } catch {
            return fallback;
        }
    }

    private saveState(): void {
        sys.localStorage.setItem(TEAM_PROGRESSION_STORAGE_KEY, JSON.stringify(this.state));
    }

    private createDefaultState(): TeamProgressionSaveData {
        return {
            version: SAVE_VERSION,
            teamLevel: MIN_TEAM_LEVEL,
            willpower: 0,
            wonAtCurrentLevel: false,
        };
    }

    private refreshView(animateProgress: boolean): void {
        const maximumLevel = this.isAtMaximumLevel();
        const requirement = this.getCurrentRequirement();
        const targetProgress = maximumLevel ? 1 : this.state.willpower / requirement;
        setGrowingNumber(
            this.teamLevelLabel,
            this.state.teamLevel,
            (value) => String(Math.floor(value)),
            { animateGrowth: animateProgress },
        );
        setGrowingNumber(
            this.willpowerLabel,
            this.state.willpower,
            (value) => maximumLevel ? 'MAX' : `${Math.floor(value)} / ${requirement}`,
            { animateGrowth: animateProgress, duration: this.progressAnimationDuration },
        );
        Tween.stopAllByTarget(this.willpowerProgress!);
        if (animateProgress) {
            tween(this.willpowerProgress!)
                .to(this.progressAnimationDuration, { progress: targetProgress })
                .start();
        } else {
            this.willpowerProgress!.progress = targetProgress;
        }

        const pendingWinUpgrade = this.isReadyForWinUpgrade();
        this.upgradeButton!.interactable = maximumLevel || pendingWinUpgrade;
        this.upgradeButtonLabel!.string = maximumLevel
            ? '无限赛程'
            : pendingWinUpgrade
                ? '获胜升级'
                : '升级';
        if (maximumLevel || pendingWinUpgrade) {
            this.startButtonPulse();
        } else {
            this.stopButtonPulse();
        }
    }

    private onUpgradeButtonClicked(): void {
        if (!this.isAtMaximumLevel() && !this.isReadyForWinUpgrade()) {
            return;
        }
        teamProgressionEvents.emit(
            TEAM_PROGRESSION_EVENT_WIN_UPGRADE_REQUESTED,
            this.getSnapshot(),
        );
    }

    private isReadyForWinUpgrade(): boolean {
        return !this.isAtMaximumLevel()
            && this.state.willpower >= this.getCurrentRequirement()
            && !this.state.wonAtCurrentLevel;
    }

    private isAtMaximumLevel(): boolean {
        return this.state.teamLevel >= this.getMaximumTeamLevel();
    }

    private getCurrentRequirement(): number {
        return this.isAtMaximumLevel() ? 0 : this.getRequirementForLevel(this.state.teamLevel);
    }

    private getRequirementForLevel(teamLevel: number): number {
        const formula = this.config?.willpowerRequirementFormula;
        if (!formula) {
            return 100;
        }
        return Math.max(
            1,
            Math.floor(teamLevel) * Math.floor(formula.teamLevelMultiplier)
                + Math.floor(formula.baseRequirement),
        );
    }

    private getMaximumTeamLevel(): number {
        return this.config?._meta.totalTeamLevels ?? MAX_TEAM_LEVEL;
    }

    private playLevelUpAnimation(): void {
        const target = this.teamLevelLabel!.node;
        const baseScale = target.scale.clone();
        const enlargedScale = new Vec3(baseScale.x * 1.2, baseScale.y * 1.2, baseScale.z);
        Tween.stopAllByTarget(target);
        tween(target).to(0.12, { scale: enlargedScale }).to(0.18, { scale: baseScale }).start();
    }

    private startButtonPulse(): void {
        const target = this.upgradeButton!.node;
        const pulseScale = new Vec3(
            this.buttonBaseScale.x * 1.06,
            this.buttonBaseScale.y * 1.06,
            this.buttonBaseScale.z,
        );
        Tween.stopAllByTarget(target);
        target.setScale(this.buttonBaseScale);
        tween(target)
            .to(0.45, { scale: pulseScale })
            .to(0.45, { scale: this.buttonBaseScale })
            .union()
            .repeatForever()
            .start();
    }

    private stopButtonPulse(): void {
        if (!this.upgradeButton) {
            return;
        }
        Tween.stopAllByTarget(this.upgradeButton.node);
        this.upgradeButton.node.setScale(this.buttonBaseScale);
    }
}

function clampTeamLevel(value: number): number {
    return Math.max(MIN_TEAM_LEVEL, Math.min(MAX_TEAM_LEVEL, Math.floor(value)));
}

function sanitizeSaveVersion(value: unknown): number {
    return Number.isFinite(value) ? Math.floor(Number(value)) : 0;
}

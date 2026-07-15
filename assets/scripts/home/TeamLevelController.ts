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

const { ccclass, property } = _decorator;

const TEAM_PROGRESSION_STORAGE_KEY = 'basketball.team.progression.v1';
const DEFAULT_PROGRESSION_RESOURCE_PATH = 'data/balance/team_progression';
const SAVE_VERSION = 1;

export const TEAM_PROGRESSION_EVENT_WILLPOWER_CHANGED = 'team-progression-willpower-changed';
export const TEAM_PROGRESSION_EVENT_LEVEL_CHANGED = 'team-progression-level-changed';
export const TEAM_PROGRESSION_EVENT_MARKET_VALUE_CHANGED = 'team-progression-market-value-changed';
export const TEAM_PROGRESSION_EVENT_CHAMPIONSHIP_REQUESTED = 'team-progression-championship-requested';

export const teamProgressionEvents = new EventTarget();

interface TeamLevelStageConfig {
    marketValueLevel: number;
    teamLevelStart: number;
    teamLevelCap: number;
    willpowerRequirements: number[];
}

interface TeamProgressionConfig {
    _meta: {
        marketValueLevelCount: number;
        teamLevelsPerMarketValue: number;
        totalTeamLevels: number;
        recruitWillpowerReward: number;
    };
    marketValueLevels: TeamLevelStageConfig[];
}

interface TeamProgressionSaveData {
    version: number;
    teamLevel: number;
    marketValueLevel: number;
    willpower: number;
}

export interface TeamProgressionSnapshot {
    teamLevel: number;
    marketValueLevel: number;
    marketLevelCap: number;
    willpower: number;
    currentRequirement: number;
    canUpgrade: boolean;
    pendingChampionship: boolean;
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
        const amount = this.config?._meta.recruitWillpowerReward ?? 0;
        return this.addWillpower(amount);
    }

    public addWillpower(amount: number): number {
        if (!this.ready || this.isAtMaximumLevel()) {
            return 0;
        }

        const safeAmount = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
        if (safeAmount <= 0) {
            return 0;
        }

        this.state.willpower = Math.min(Number.MAX_SAFE_INTEGER, this.state.willpower + safeAmount);
        this.saveState();
        this.refreshView(true);
        teamProgressionEvents.emit(TEAM_PROGRESSION_EVENT_WILLPOWER_CHANGED, this.getSnapshot());
        return safeAmount;
    }

    public upgradeOneLevel(): boolean {
        if (!this.ready || !this.canUpgrade()) {
            return false;
        }

        const requirement = this.getCurrentRequirement();
        this.state.willpower -= requirement;
        this.state.teamLevel += 1;
        this.saveState();
        this.refreshView(true);
        this.playLevelUpAnimation();
        teamProgressionEvents.emit(TEAM_PROGRESSION_EVENT_LEVEL_CHANGED, this.getSnapshot());
        return true;
    }

    public applyChampionshipWin(): boolean {
        if (!this.ready || !this.isPendingChampionship()) {
            return false;
        }

        const maxMarketValue = this.getMaximumMarketValueLevel();
        if (this.state.marketValueLevel >= maxMarketValue) {
            return false;
        }

        this.state.marketValueLevel += 1;
        this.saveState();
        this.refreshView(true);
        teamProgressionEvents.emit(TEAM_PROGRESSION_EVENT_MARKET_VALUE_CHANGED, this.getSnapshot());
        return true;
    }

    public getSnapshot(): TeamProgressionSnapshot | null {
        if (!this.ready) {
            return null;
        }

        return {
            teamLevel: this.state.teamLevel,
            marketValueLevel: this.state.marketValueLevel,
            marketLevelCap: this.getCurrentMarketLevelCap(),
            willpower: this.state.willpower,
            currentRequirement: this.getCurrentRequirement(),
            canUpgrade: this.canUpgrade(),
            pendingChampionship: this.isPendingChampionship(),
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
        this.teamLevelLabel!.string = '1';
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
        if (!config?._meta || !Array.isArray(config.marketValueLevels)) {
            return false;
        }

        const expectedMarketCount = config._meta.marketValueLevelCount;
        if (expectedMarketCount <= 0 || config.marketValueLevels.length !== expectedMarketCount) {
            return false;
        }

        return config.marketValueLevels.every((stage) => (
            stage.marketValueLevel > 0
            && stage.teamLevelStart > 0
            && stage.teamLevelCap >= stage.teamLevelStart
            && Array.isArray(stage.willpowerRequirements)
            && stage.willpowerRequirements.length === config._meta.teamLevelsPerMarketValue
            && stage.willpowerRequirements.every((value) => Number.isFinite(value) && value > 0)
        ));
    }

    private loadState(): TeamProgressionSaveData {
        const fallback = this.createDefaultState();
        const serialized = sys.localStorage.getItem(TEAM_PROGRESSION_STORAGE_KEY);
        if (!serialized) {
            return fallback;
        }

        try {
            const parsed = JSON.parse(serialized) as Partial<TeamProgressionSaveData>;
            const maxTeamLevel = this.getMaximumTeamLevel();
            const maxMarketValue = this.getMaximumMarketValueLevel();
            const teamLevel = this.clampInteger(parsed.teamLevel, 1, maxTeamLevel, fallback.teamLevel);
            const minimumMarketValue = Math.ceil(teamLevel / this.config!._meta.teamLevelsPerMarketValue);
            const maximumUnlockedMarketValue = Math.min(
                maxMarketValue,
                Math.floor(teamLevel / this.config!._meta.teamLevelsPerMarketValue) + 1,
            );
            const marketValueLevel = this.clampInteger(
                parsed.marketValueLevel,
                minimumMarketValue,
                maximumUnlockedMarketValue,
                minimumMarketValue,
            );
            const willpower = this.clampInteger(
                parsed.willpower,
                0,
                Number.MAX_SAFE_INTEGER,
                fallback.willpower,
            );

            return {
                version: SAVE_VERSION,
                teamLevel,
                marketValueLevel,
                willpower: teamLevel >= maxTeamLevel ? 0 : willpower,
            };
        } catch (error) {
            console.warn('[TeamLevelController] Invalid save data, using defaults.', error);
            return fallback;
        }
    }

    private saveState(): void {
        sys.localStorage.setItem(TEAM_PROGRESSION_STORAGE_KEY, JSON.stringify(this.state));
    }

    private createDefaultState(): TeamProgressionSaveData {
        return {
            version: SAVE_VERSION,
            teamLevel: 1,
            marketValueLevel: 1,
            willpower: 0,
        };
    }

    private refreshView(animateProgress: boolean): void {
        const maximumLevel = this.isAtMaximumLevel();
        const requirement = this.getCurrentRequirement();
        const targetProgress = maximumLevel
            ? 1
            : Math.max(0, Math.min(1, this.state.willpower / requirement));

        this.teamLevelLabel!.string = String(this.state.teamLevel);
        this.willpowerLabel!.string = maximumLevel
            ? 'MAX'
            : `${this.state.willpower} / ${requirement}`;

        Tween.stopAllByTarget(this.willpowerProgress!);
        if (animateProgress) {
            tween(this.willpowerProgress!)
                .to(this.progressAnimationDuration, { progress: targetProgress })
                .start();
        } else {
            this.willpowerProgress!.progress = targetProgress;
        }

        const pendingChampionship = this.isPendingChampionship();
        const canUpgrade = this.canUpgrade();
        this.upgradeButton!.interactable = canUpgrade || pendingChampionship;
        this.upgradeButtonLabel!.string = maximumLevel
            ? '已满级'
            : pendingChampionship
                ? '去夺冠'
                : '升级';

        if (canUpgrade || pendingChampionship) {
            this.startButtonPulse();
        } else {
            this.stopButtonPulse();
        }
    }

    private onUpgradeButtonClicked(): void {
        if (this.isPendingChampionship()) {
            const snapshot = this.getSnapshot();
            teamProgressionEvents.emit(TEAM_PROGRESSION_EVENT_CHAMPIONSHIP_REQUESTED, snapshot);
            console.info('[TeamLevelController] Championship requested.', snapshot);
            return;
        }

        this.upgradeOneLevel();
    }

    private canUpgrade(): boolean {
        return !this.isAtMaximumLevel()
            && !this.isAtCurrentMarketCap()
            && this.state.willpower >= this.getCurrentRequirement();
    }

    private isPendingChampionship(): boolean {
        return !this.isAtMaximumLevel()
            && this.isAtCurrentMarketCap()
            && this.state.willpower >= this.getCurrentRequirement();
    }

    private isAtCurrentMarketCap(): boolean {
        return this.state.teamLevel >= this.getCurrentMarketLevelCap();
    }

    private isAtMaximumLevel(): boolean {
        return this.state.teamLevel >= this.getMaximumTeamLevel();
    }

    private getCurrentMarketLevelCap(): number {
        return this.config!.marketValueLevels[this.state.marketValueLevel - 1].teamLevelCap;
    }

    private getCurrentRequirement(): number {
        const levelsPerMarket = this.config!._meta.teamLevelsPerMarketValue;
        const stageIndex = Math.min(
            this.config!.marketValueLevels.length - 1,
            Math.floor((this.state.teamLevel - 1) / levelsPerMarket),
        );
        const localLevelIndex = (this.state.teamLevel - 1) % levelsPerMarket;
        return this.config!.marketValueLevels[stageIndex].willpowerRequirements[localLevelIndex];
    }

    private getMaximumTeamLevel(): number {
        return this.config?._meta.totalTeamLevels ?? 520;
    }

    private getMaximumMarketValueLevel(): number {
        return this.config?._meta.marketValueLevelCount ?? 130;
    }

    private playLevelUpAnimation(): void {
        const target = this.teamLevelLabel!.node;
        const baseScale = target.scale.clone();
        const enlargedScale = new Vec3(
            baseScale.x * 1.2,
            baseScale.y * 1.2,
            baseScale.z,
        );

        Tween.stopAllByTarget(target);
        tween(target)
            .to(0.12, { scale: enlargedScale })
            .to(0.18, { scale: baseScale })
            .start();
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

    private clampInteger(
        value: number | undefined,
        minimum: number,
        maximum: number,
        fallback: number,
    ): number {
        if (!Number.isFinite(value)) {
            return fallback;
        }
        return Math.max(minimum, Math.min(maximum, Math.floor(value!)));
    }
}

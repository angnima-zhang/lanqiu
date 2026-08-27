import {
    _decorator,
    Button,
    Component,
    game,
    Game,
    Label,
    Node,
} from 'cc';
import {
    add as addBalance,
    GAME_STATE_EVENT_MANAGEMENT_CHANGED,
    getBalance,
    getManagementEffects,
    gameStateEvents,
    IdleState,
    loadIdleState,
    loadJson,
    saveIdleState,
} from './GameState';
import { formatPlayerOverall } from './RosterSlotView';
import {
    getStoredMarketValueLevel,
    getStoredTeamLevel,
    TEAM_PROGRESSION_EVENT_LEVEL_CHANGED,
    TeamLevelController,
    teamProgressionEvents,
} from './TeamLevelController';
import { setGrowingNumber } from './NumberGrowthAnimator';
import { showRewardedVideo } from './RewardedAdService';
import {
    playFullScreenEntrance,
    stopFullScreenEntrance,
} from './FullScreenEntrance';
import { playFullScreenExit as exitWithFade } from './FullScreenEntrance';

const { ccclass } = _decorator;

interface EconomyConfig {
    initialBudget: number;
    budgetSources: {
        onlineIdle: {
            claimTickSeconds: number;
        };
        offlineIdle: {
            maxAccrualHours: number;
            autoOpenMinimumMinutes: number;
        };
    };
}

interface OfflineRewardSnapshot {
    seconds: number;
    baseReward: number;
    mediaBonusReward: number;
    totalReward: number;
}

@ccclass('IdleIncomeController')
export class IdleIncomeController extends Component {
    private homeRoot: Node | null = null;
    private page: Node | null = null;
    private closeButton: Button | null = null;
    private claimButton: Button | null = null;
    private adClaimButton: Button | null = null;
    private durationLabel: Label | null = null;
    private remainingLabel: Label | null = null;
    private reachedCapLabel: Label | null = null;
    private baseRewardLabel: Label | null = null;
    private mediaBonusLabel: Label | null = null;
    private claimRewardLabel: Label | null = null;
    private adRewardLabel: Label | null = null;
    private offlineIncomeRateLabel: Label | null = null;
    private onlineIncomeRateLabel: Label | null = null;

    private config: EconomyConfig | null = null;
    private idleState: IdleState | null = null;
    private operationPresidentBonus = 0;
    private mediaTeamBonus = 0;
    private initialized = false;
    private adClaimProcessing = false;

    protected onLoad(): void {
        this.resolveSceneReferences();
        if (!this.page || !this.closeButton || !this.claimButton || !this.adClaimButton) {
            console.error('[IdleIncomeController] Missing offline income UI references.');
            this.enabled = false;
            return;
        }
        this.page.active = false;
    }

    protected onEnable(): void {
        this.closeButton?.node.on(Button.EventType.CLICK, this.closePage, this);
        this.claimButton?.node.on(Button.EventType.CLICK, this.claimOfflineIncome, this);
        this.adClaimButton?.node.on(Button.EventType.CLICK, this.onAdClaimClicked, this);
        game.on(Game.EVENT_HIDE, this.onGameHide, this);
        game.on(Game.EVENT_SHOW, this.onGameShow, this);
        gameStateEvents.on(
            GAME_STATE_EVENT_MANAGEMENT_CHANGED,
            this.onManagementChanged,
            this,
        );
        teamProgressionEvents.on(
            TEAM_PROGRESSION_EVENT_LEVEL_CHANGED,
            this.onTeamLevelChanged,
            this,
        );
    }

    protected start(): void {
        this.scheduleOnce(() => void this.initialize(), 0.5);
    }

    protected onDisable(): void {
        this.closeButton?.node.off(Button.EventType.CLICK, this.closePage, this);
        this.claimButton?.node.off(Button.EventType.CLICK, this.claimOfflineIncome, this);
        this.adClaimButton?.node.off(Button.EventType.CLICK, this.onAdClaimClicked, this);
        game.off(Game.EVENT_HIDE, this.onGameHide, this);
        game.off(Game.EVENT_SHOW, this.onGameShow, this);
        gameStateEvents.off(
            GAME_STATE_EVENT_MANAGEMENT_CHANGED,
            this.onManagementChanged,
            this,
        );
        teamProgressionEvents.off(
            TEAM_PROGRESSION_EVENT_LEVEL_CHANGED,
            this.onTeamLevelChanged,
            this,
        );
        this.unschedule(this.onOnlineTick);
    }

    private async initialize(): Promise<void> {
        try {
            const [config, effects] = await Promise.all([
                loadJson<EconomyConfig>('data/balance/economy'),
                getManagementEffects(),
            ]);
            this.config = config;
            this.operationPresidentBonus = effects.operationPresidentBudgetBonus;
            this.mediaTeamBonus = effects.mediaTeamOfflineBudgetBonus;
            this.refreshHomeIncomeRateLabels();
            getBalance(config.initialBudget);

            const now = Date.now();
            this.idleState = loadIdleState(now);
            if (this.idleState.offlineStartedAtMs !== null) {
                this.accumulateOfflineSeconds(now);
            } else {
                await this.flushOnlineIncome(now);
            }
            this.initialized = true;

            const tickSeconds = Math.max(
                1,
                Math.floor(config.budgetSources.onlineIdle.claimTickSeconds),
            );
            this.schedule(this.onOnlineTick, tickSeconds);
            this.refreshPage();
            if (this.shouldAutoOpenPage()) {
                this.scheduleOnce(() => this.openPageForNewOfflineIncome(), 0);
            }
        } catch (error) {
            console.error('[IdleIncomeController] Failed to initialize.', error);
        }
    }

    private onOnlineTick = (): void => {
        if (!this.initialized) {
            return;
        }
        void this.flushOnlineIncome(Date.now());
    };

    private onGameHide(): void {
        if (!this.initialized) {
            return;
        }
        const now = Date.now();
        void this.flushOnlineIncome(now).finally(() => {
            if (!this.idleState) {
                return;
            }
            this.idleState.accrualStartedAtMs = now;
            this.idleState.lastOnlineTickAtMs = now;
            this.idleState.offlineStartedAtMs = now;
            this.idleState.hasRecordedOfflineSession = true;
            saveIdleState(this.idleState);
        });
    }

    private onGameShow(): void {
        if (!this.initialized) {
            return;
        }
        void this.refreshManagementEffects().then(() => {
            if (this.idleState?.offlineStartedAtMs === null) {
                return;
            }
            const now = Date.now();
            this.accumulateOfflineSeconds(now);
            this.refreshPage();
            if (this.shouldAutoOpenPage()) {
                this.openPageForNewOfflineIncome();
            }
        });
    }

    private onManagementChanged = (): void => {
        void this.refreshManagementEffects().then(() => this.refreshPage());
    };

    private onTeamLevelChanged = (): void => {
        this.refreshHomeIncomeRateLabels();
        this.refreshPage();
    };

    private async flushOnlineIncome(now: number): Promise<void> {
        if (!this.config || !this.idleState) {
            return;
        }
        await this.refreshManagementEffects();
        const elapsedSeconds = Math.max(
            0,
            (now - this.idleState.lastOnlineTickAtMs) / 1000,
        );
        if (elapsedSeconds > 0) {
            const marketMultiplier = this.getMarketValueMultiplier();
            const basePerMinute = this.getOnlineBaseRewardPerMinute();
            const reward = elapsedSeconds / 60
                * basePerMinute
                * marketMultiplier
                * (1 + this.operationPresidentBonus);
            if (reward > 0) {
                addBalance(reward);
            }
        }
        this.idleState.lastOnlineTickAtMs = now;
        this.idleState.accrualStartedAtMs = now;
        saveIdleState(this.idleState);
    }

    private accumulateOfflineSeconds(now: number): void {
        if (!this.config || !this.idleState) {
            return;
        }
        const maxSeconds = Math.max(
            0,
            this.config.budgetSources.offlineIdle.maxAccrualHours * 3600,
        );
        const offlineStartedAtMs = this.idleState.offlineStartedAtMs;
        if (offlineStartedAtMs === null) {
            return;
        }
        const elapsedSeconds = Math.max(
            0,
            (now - offlineStartedAtMs) / 1000,
        );
        this.idleState.pendingOfflineSeconds = Math.min(
            maxSeconds,
            this.idleState.pendingOfflineSeconds + elapsedSeconds,
        );
        this.idleState.unpromptedOfflineSeconds = Math.min(
            maxSeconds,
            this.idleState.unpromptedOfflineSeconds + elapsedSeconds,
        );
        this.idleState.accrualStartedAtMs = now;
        this.idleState.lastOnlineTickAtMs = now;
        this.idleState.offlineStartedAtMs = null;
        saveIdleState(this.idleState);
    }

    private async refreshManagementEffects(): Promise<void> {
        const effects = await getManagementEffects();
        this.operationPresidentBonus = effects.operationPresidentBudgetBonus;
        this.mediaTeamBonus = effects.mediaTeamOfflineBudgetBonus;
        this.refreshHomeIncomeRateLabels();
    }

    private claimOfflineIncome(): void {
        if (this.adClaimProcessing) {
            return;
        }
        this.settleOfflineIncome(1);
    }

    private onAdClaimClicked(): void {
        void this.claimDoubleOfflineIncome();
    }

    private async claimDoubleOfflineIncome(): Promise<void> {
        if (this.adClaimProcessing || this.getRewardSnapshot().totalReward < 1) {
            return;
        }

        this.adClaimProcessing = true;
        this.refreshPage();
        try {
            const completed = await showRewardedVideo();
            if (completed) {
                this.settleOfflineIncome(2);
            }
        } finally {
            this.adClaimProcessing = false;
            if (this.page?.active) {
                this.refreshPage();
            }
        }
    }

    private settleOfflineIncome(multiplier: number): void {
        if (!this.idleState) {
            return;
        }
        const snapshot = this.getRewardSnapshot(multiplier);
        if (snapshot.totalReward < 1) {
            return;
        }
        addBalance(snapshot.totalReward);
        const now = Date.now();
        this.idleState.pendingOfflineSeconds = 0;
        this.idleState.unpromptedOfflineSeconds = 0;
        this.idleState.accrualStartedAtMs = now;
        this.idleState.lastOnlineTickAtMs = now;
        this.idleState.offlineStartedAtMs = null;
        saveIdleState(this.idleState);
        this.closePage();
    }

    public openPage(): void {
        if (!this.page) {
            return;
        }
        const parent = this.page.parent;
        if (parent) {
            this.page.setSiblingIndex(parent.children.length - 1);
        }
        this.refreshPage(true);
        void this.refreshManagementEffects().then(() => this.refreshPage(true));
        void playFullScreenEntrance(this.page, {
            backgroundNodes: [
                this.page.getChildByName('遮罩'),
                this.page.getChildByName('bg'),
            ].filter((node): node is Node => Boolean(node)),
            moduleGroups: [
                {
                    nodes: [
                        this.page.getChildByName('标题'),
                        this.page.getChildByName('关闭'),
                    ].filter((node): node is Node => Boolean(node)),
                    order: 0,
                },
                { nodes: this.namedChildren(['计时']), order: 1 },
                { nodes: this.namedChildren(['基础收益']), order: 2 },
                { nodes: this.namedChildren(['媒体团队加成']), order: 3 },
                { nodes: this.namedChildren(['领取']), order: 4 },
                { nodes: this.namedChildren(['看广告双倍领取']), order: 5 },
            ],
        });
    }

    private openPageForNewOfflineIncome(): void {
        if (!this.idleState || !this.shouldAutoOpenPage()) {
            return;
        }
        this.idleState.unpromptedOfflineSeconds = 0;
        saveIdleState(this.idleState);
        this.openPage();
    }

    private closePage(): void {
        if (this.page) {
            void exitWithFade(this.page).then(() => {
                this.page!.active = false;
            });
        }
    }

    private refreshPage(animateRewards = false): void {
        if (!this.config || !this.idleState) {
            return;
        }
        const snapshot = this.getRewardSnapshot();
        const adSnapshot = this.getRewardSnapshot(2);
        const maxSeconds = this.config.budgetSources.offlineIdle.maxAccrualHours * 3600;
        const remainingSeconds = Math.max(0, maxSeconds - snapshot.seconds);
        if (this.durationLabel) {
            this.durationLabel.string = `已离线 ${this.formatDuration(snapshot.seconds)}`;
        }
        if (this.remainingLabel) {
            this.remainingLabel.node.active = remainingSeconds > 0;
            this.remainingLabel.string = remainingSeconds > 0
                ? `距离上限还有 ${this.formatDuration(remainingSeconds)}`
                : '离线收益已达到上限';
        }
        if (this.reachedCapLabel) {
            this.reachedCapLabel.node.active = remainingSeconds <= 0;
        }
        this.setRewardLabel(this.baseRewardLabel, snapshot.baseReward, animateRewards);
        this.setRewardLabel(this.mediaBonusLabel, snapshot.mediaBonusReward, animateRewards);
        this.setRewardLabel(this.claimRewardLabel, snapshot.totalReward, animateRewards);
        this.setRewardLabel(this.adRewardLabel, adSnapshot.totalReward, animateRewards);
        if (this.claimButton) {
            this.claimButton.interactable = snapshot.totalReward >= 1
                && !this.adClaimProcessing;
        }
        if (this.adClaimButton) {
            this.adClaimButton.interactable = snapshot.totalReward >= 1
                && !this.adClaimProcessing;
        }
    }

    private getRewardSnapshot(multiplier = 1): OfflineRewardSnapshot {
        if (!this.config || !this.idleState) {
            return {
                seconds: 0,
                baseReward: 0,
                mediaBonusReward: 0,
                totalReward: 0,
            };
        }
        return this.getRewardSnapshotForSeconds(
            this.idleState.pendingOfflineSeconds,
            multiplier,
        );
    }

    private getRewardSnapshotForSeconds(
        secondsValue: number,
        multiplier = 1,
    ): OfflineRewardSnapshot {
        if (!this.config) {
            return {
                seconds: 0,
                baseReward: 0,
                mediaBonusReward: 0,
                totalReward: 0,
            };
        }
        const seconds = Math.max(0, secondsValue);
        const safeMultiplier = Math.max(1, Math.floor(multiplier));
        const oneTimeBaseReward = this.floorReward(seconds / 60
            * this.getOfflineBaseRewardPerMinute()
            * this.getMarketValueMultiplier());
        // First settle the single-claim reward exactly as it is displayed, then
        // apply the advertisement multiplier. This keeps the double claim equal
        // to the displayed claim amount × 2 instead of re-rounding its bonus.
        const oneTimeMediaBonusReward = this.floorReward(
            oneTimeBaseReward * Math.max(0, this.mediaTeamBonus),
        );
        const baseReward = oneTimeBaseReward * safeMultiplier;
        const mediaBonusReward = oneTimeMediaBonusReward * safeMultiplier;
        return {
            seconds,
            baseReward,
            mediaBonusReward,
            totalReward: baseReward + mediaBonusReward,
        };
    }

    private shouldAutoOpenPage(): boolean {
        if (!this.idleState) {
            return false;
        }
        const minimumOfflineSeconds = Math.max(
            0,
            this.config?.budgetSources.offlineIdle.autoOpenMinimumMinutes ?? 30,
        ) * 60;
        return this.idleState.hasRecordedOfflineSession
            && this.idleState.unpromptedOfflineSeconds >= minimumOfflineSeconds
            && this.getRewardSnapshot().totalReward >= 1;
    }

    private getMarketValueMultiplier(): number {
        const marketValueLevel = TeamLevelController.instance
            ?.getSnapshot()
            ?.marketValueLevel ?? getStoredMarketValueLevel();
        return 1 + 0.02 * Math.max(0, marketValueLevel);
    }

    private getCurrentTeamLevel(): number {
        return Math.max(
            0,
            TeamLevelController.instance?.getSnapshot()?.teamLevel
                ?? getStoredTeamLevel(),
        );
    }

    private getOnlineBaseRewardPerMinute(): number {
        return this.getCurrentTeamLevel();
    }

    private getOfflineBaseRewardPerMinute(): number {
        return this.getCurrentTeamLevel() / 2;
    }

    private refreshHomeIncomeRateLabels(): void {
        if (!this.config) {
            return;
        }
        const marketMultiplier = this.getMarketValueMultiplier();
        const onlinePerMinute = this.getOnlineBaseRewardPerMinute()
            * marketMultiplier
            * (1 + this.operationPresidentBonus);
        const offlinePerMinute = this.getOfflineBaseRewardPerMinute()
            * marketMultiplier
            * (1 + this.mediaTeamBonus);
        if (this.offlineIncomeRateLabel) {
            this.offlineIncomeRateLabel.string = `离线奖励：每分钟${this.formatIncomeRate(offlinePerMinute)}`;
        }
        if (this.onlineIncomeRateLabel) {
            this.onlineIncomeRateLabel.string = `在线奖励：每分钟${this.formatIncomeRate(onlinePerMinute)}`;
        }
    }

    private formatIncomeRate(value: number): string {
        const truncatedValue = Math.floor(Math.max(0, value) * 10) / 10;
        return truncatedValue.toFixed(1);
    }

    private setRewardLabel(
        label: Label | null,
        value: number,
        animateFromZero = false,
    ): void {
        const safeValue = this.floorReward(value);
        setGrowingNumber(
            label,
            safeValue,
            (displayedValue) => formatPlayerOverall(Math.floor(Math.max(0, displayedValue))),
            {
                animateGrowth: true,
                from: animateFromZero ? 0 : undefined,
            },
        );
    }

    private floorReward(value: number): number {
        return Math.floor(Math.max(0, value));
    }

    private formatDuration(totalSeconds: number): string {
        const safeSeconds = Math.max(0, Math.floor(totalSeconds));
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor((safeSeconds % 3600) / 60);
        return `${hours}小时${String(minutes).padStart(2, '0')}分`;
    }

    private resolveSceneReferences(): void {
        const canvas = this.node.parent;
        this.homeRoot = canvas?.getChildByName('主页') ?? null;
        this.page = canvas?.getChildByName('离线收益弹窗') ?? null;
        this.closeButton = this.page?.getChildByName('关闭')?.getComponent(Button) ?? null;
        this.claimButton = this.page?.getChildByName('领取')?.getComponent(Button) ?? null;
        this.adClaimButton = this.page
            ?.getChildByName('看广告双倍领取')
            ?.getComponent(Button) ?? null;
        this.durationLabel = this.findByPath(this.page, '计时/离线时长')?.getComponent(Label)
            ?? null;
        this.remainingLabel = this.findByPath(this.page, '计时/剩余时间')?.getComponent(Label)
            ?? null;
        this.reachedCapLabel = this.findByPath(this.page, '计时/已到上限')?.getComponent(Label)
            ?? null;
        this.baseRewardLabel = this.findByPath(this.page, '基础收益/基础数值')
            ?.getComponent(Label) ?? null;
        this.mediaBonusLabel = this.findByPath(this.page, '媒体团队加成/加成数值')
            ?.getComponent(Label) ?? null;
        this.claimRewardLabel = this.findByPath(this.page, '领取/基础数值')
            ?.getComponent(Label) ?? null;
        this.adRewardLabel = this.findByPath(this.page, '看广告双倍领取/数值')
            ?.getComponent(Label) ?? null;
        this.offlineIncomeRateLabel = this.findDescendantByName(this.homeRoot, '离线奖励')
            ?.getComponent(Label) ?? null;
        this.onlineIncomeRateLabel = this.findDescendantByName(this.homeRoot, '在线奖励')
            ?.getComponent(Label) ?? null;
    }

    private findByPath(root: Node | null, path: string): Node | null {
        let current = root;
        for (const segment of path.split('/')) {
            current = current?.getChildByName(segment) ?? null;
            if (!current) {
                return null;
            }
        }
        return current;
    }

    private findDescendantByName(root: Node | null, name: string): Node | null {
        if (!root) {
            return null;
        }
        const nodesToCheck = [root];
        while (nodesToCheck.length > 0) {
            const current = nodesToCheck.pop()!;
            if (current.name === name) {
                return current;
            }
            nodesToCheck.push(...current.children);
        }
        return null;
    }

    private namedChildren(names: readonly string[]): Node[] {
        if (!this.page) {
            return [];
        }
        return names.flatMap((name) => {
            const node = this.page!.getChildByName(name);
            return node ? [node] : [];
        });
    }
}

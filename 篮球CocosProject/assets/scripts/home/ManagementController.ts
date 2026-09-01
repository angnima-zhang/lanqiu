import {
    _decorator,
    Button,
    Color,
    Component,
    director,
    Label,
    Node,
    ProgressBar,
    Sprite,
    SpriteFrame,
} from 'cc';
import {
    canAffordBudget,
    GAME_STATE_EVENT_BUDGET_CHANGED,
    GAME_STATE_EVENT_MANAGEMENT_CHANGED,
    gameStateEvents,
    getBudget,
    loadJson,
    loadManagementEffectsConfig,
    loadManagementLevels,
    ManagementEffectRow,
    ManagementEffectsConfig,
    ManagementLevels,
    ManagementRole,
    upgradeManagementWithAd,
    upgradeManagementWithBudget,
} from './GameState';
import {
    playFullScreenEntrance,
    stopFullScreenEntrance,
} from './FullScreenEntrance';
import { playFullScreenExit as exitWithFade } from './FullScreenEntrance';
import { setGrowingNumber } from './NumberGrowthAnimator';
import {
    isWechatSharePlatform,
    showRewardedVideo,
    toRewardedActionCopy,
} from './RewardedAdService';
import { gameAudio } from './GameAudio';
import {
    getStoredTeamLevel,
    TEAM_PROGRESSION_EVENT_LEVEL_CHANGED,
    teamProgressionEvents,
} from './TeamLevelController';

const { ccclass } = _decorator;

const MAX_MANAGEMENT_LEVEL = 100;
const DISABLED_COLOR = new Color(112, 112, 112, 255);

const ROLES: readonly ManagementRole[] = [
    'operationPresident',
    'headCoach',
    'scoutingDirector',
    'medicalTeam',
    'mediaTeam',
];

interface EconomyConfig {
    managementUpgradeCost: {
        maxLevel: number;
        currentLevelBudgetMultiplier: number;
        currentLevelOffset: number;
    };
}

interface RoleDefinition {
    nodeName: string;
    tabName: string;
    effectDescription: string;
    effectKey: keyof Omit<ManagementEffectRow, 'managementLevel'>;
    percentDisplay: boolean;
    percentagePointDisplay?: boolean;
}

interface RoleView {
    root: Node;
    levelLabel: Label | null;
    progressBar: ProgressBar | null;
    currentDescriptionLabel: Label | null;
    currentEffectLabel: Label | null;
    nextDescriptionLabel: Label | null;
    nextEffectLabel: Label | null;
    deltaEffectLabel: Label | null;
    hintLabel: Label | null;
    costLabel: Label | null;
    budgetUpgradeButton: Button | null;
    budgetUpgradeButtonLabel: Label | null;
    adUpgradeButton: Button | null;
    adUpgradeButtonLabel: Label | null;
}

const ROLE_DEFINITIONS: Record<ManagementRole, RoleDefinition> = {
    operationPresident: {
        nodeName: '管理层-运营',
        tabName: '运营',
        effectDescription: '在线收益和比赛预算奖励',
        effectKey: 'operationPresidentBudgetBonus',
        percentDisplay: true,
    },
    headCoach: {
        nodeName: '管理层-教练',
        tabName: '教练',
        effectDescription: '比赛球队总评',
        effectKey: 'headCoachBattleOvrBonus',
        percentDisplay: true,
    },
    scoutingDirector: {
        nodeName: '管理层-球探',
        tabName: '球探',
        effectDescription: '招募池最高品质概率',
        effectKey: 'scoutingDirectorHighestQualityWeightBonus',
        percentDisplay: false,
        percentagePointDisplay: true,
    },
    medicalTeam: {
        nodeName: '管理层-队医',
        tabName: '队医',
        effectDescription: '伤病发生风险降低',
        effectKey: 'medicalTeamInjuryRiskReduction',
        percentDisplay: true,
    },
    mediaTeam: {
        nodeName: '管理层-媒体',
        tabName: '媒体',
        effectDescription: '离线收益',
        effectKey: 'mediaTeamOfflineBudgetBonus',
        percentDisplay: true,
    },
};

@ccclass('ManagementController')
export class ManagementController extends Component {
    public static instance: ManagementController | null = null;

    private navigationRoot: Node | null = null;
    private budgetLabel: Label | null = null;
    private backButton: Button | null = null;
    private readonly roleViews = new Map<ManagementRole, RoleView>();
    private readonly tabButtons = new Map<ManagementRole, Button>();
    private readonly tabHandlers = new Map<ManagementRole, () => void>();
    private readonly budgetUpgradeHandlers = new Map<ManagementRole, () => void>();
    private readonly adUpgradeHandlers = new Map<ManagementRole, () => void>();
    private readonly originalSpriteGrayscale = new WeakMap<Sprite, boolean>();
    private readonly originalLabelColors = new WeakMap<Label, Color>();
    private selectedTabSpriteFrame: SpriteFrame | null = null;
    private unselectedTabSpriteFrame: SpriteFrame | null = null;
    private selectedTabLabelColor: Color | null = null;
    private unselectedTabLabelColor: Color | null = null;

    private selectedRole: ManagementRole = 'operationPresident';
    private effectsConfig: ManagementEffectsConfig | null = null;
    private economyConfig: EconomyConfig | null = null;
    private loadingPromise: Promise<void> | null = null;
    private budgetUpgradeProcessing = false;
    private adUpgradeProcessing = false;
    private eventsBound = false;

    public get currentRole(): ManagementRole {
        return this.selectedRole;
    }

    public get managementLevelsSnapshot(): ManagementLevels {
        return { ...loadManagementLevels() };
    }

    protected onLoad(): void {
        ManagementController.instance = this;
        this.resolveHierarchy();
        this.initializeVisibility();
    }

    protected onEnable(): void {
        this.resolveHierarchy();
        this.bindEvents();
    }

    protected onDisable(): void {
        this.unbindEvents();
    }

    protected onDestroy(): void {
        this.unbindEvents();
        if (ManagementController.instance === this) {
            ManagementController.instance = null;
        }
    }

    public openManagement(role?: ManagementRole): void {
        this.resolveHierarchy();
        if (!this.navigationRoot || this.roleViews.size !== ROLES.length) {
            console.error('[ManagementController] Management navigation or role content is missing.');
            return;
        }

        const targetRole = role && ROLES.includes(role)
            ? role
            : this.selectedRole;
        this.selectedRole = targetRole;
        for (const [candidate, view] of this.roleViews) {
            view.root.active = candidate === targetRole;
        }
        this.refreshTabStates();
        this.navigationRoot.active = true;
        this.navigationRoot.setSiblingIndex(Math.max(
            0,
            (this.navigationRoot.parent?.children.length ?? 1) - 1,
        ));
        this.refreshCurrentRole(false);
        void this.ensureConfigurations().then(() => this.refreshCurrentRole(false));
        this.playCombinedEntrance(targetRole);
    }

    public switchRole(role: ManagementRole): void {
        if (!ROLES.includes(role)) {
            console.warn('[ManagementController] Unknown management role.', role);
            return;
        }

        this.resolveHierarchy();
        if (!this.navigationRoot || !this.navigationRoot.active) {
            this.openManagement(role);
            return;
        }
        if (role === this.selectedRole && this.roleViews.get(role)?.root.active) {
            return;
        }

        stopFullScreenEntrance(this.navigationRoot);
        for (const [candidate, view] of this.roleViews) {
            this.resetEntrance(view.root);
            view.root.active = candidate === role;
        }
        this.selectedRole = role;
        this.refreshTabStates();
        this.refreshCurrentRole(false);
        void this.ensureConfigurations().then(() => this.refreshCurrentRole(false));

        const target = this.roleViews.get(role)?.root;
        if (target) {
            void playFullScreenEntrance(target);
        }
    }

    public closeManagement(): void {
        this.resolveHierarchy();
        if (!this.navigationRoot || !this.navigationRoot.active) {
            return;
        }

        void exitWithFade(this.navigationRoot).then(() => {
            for (const view of this.roleViews.values()) {
                view.root.active = false;
            }
            this.navigationRoot!.active = false;
        });
    }

    private resolveHierarchy(): void {
        const scene = director.getScene();
        if (!scene) {
            return;
        }

        this.navigationRoot = this.findDescendantByName(scene, '管理层-导航')
            ?? this.findCompatibleNavigationRoot(scene);
        if (!this.navigationRoot) {
            return;
        }

        this.budgetLabel = this.findByPath(
            this.navigationRoot,
            '顶部/预算/预算数量',
        )?.getComponent(Label) ?? null;
        this.backButton = this.findByPath(
            this.navigationRoot,
            '顶部/返回',
        )?.getComponent(Button) ?? null;

        for (const role of ROLES) {
            const definition = ROLE_DEFINITIONS[role];
            const root = this.findDescendantByName(
                this.navigationRoot,
                definition.nodeName,
            );
            if (!root) {
                continue;
            }

            const view = this.createRoleView(root);
            this.roleViews.set(role, view);
            const tab = this.findByPath(
                this.navigationRoot,
                `五个管理层/${definition.tabName}`,
            )?.getComponent(Button);
            if (tab) {
                this.tabButtons.set(role, tab);
            }
        }
        this.captureTabVisualTemplates();
    }

    private captureTabVisualTemplates(): void {
        if (
            this.selectedTabSpriteFrame
            && this.unselectedTabSpriteFrame
            && this.selectedTabLabelColor
            && this.unselectedTabLabelColor
        ) {
            return;
        }

        const selectedTab = this.tabButtons.get('operationPresident');
        const unselectedTab = this.tabButtons.get('headCoach');
        this.selectedTabSpriteFrame = selectedTab?.normalSprite
            ?? selectedTab?.target?.getComponent(Sprite)?.spriteFrame
            ?? null;
        this.unselectedTabSpriteFrame = unselectedTab?.normalSprite
            ?? unselectedTab?.target?.getComponent(Sprite)?.spriteFrame
            ?? null;
        this.selectedTabLabelColor = selectedTab?.node
            .getChildByName('Label')
            ?.getComponent(Label)
            ?.color.clone() ?? null;
        this.unselectedTabLabelColor = unselectedTab?.node
            .getChildByName('Label')
            ?.getComponent(Label)
            ?.color.clone() ?? null;
    }

    private refreshTabStates(): void {
        this.captureTabVisualTemplates();
        for (const [role, button] of this.tabButtons) {
            const selected = role === this.selectedRole;
            const spriteFrame = selected
                ? this.selectedTabSpriteFrame
                : this.unselectedTabSpriteFrame;
            const targetSprite = button.target?.getComponent(Sprite)
                ?? button.node.getComponent(Sprite);
            if (spriteFrame) {
                button.normalSprite = spriteFrame;
                if (targetSprite) {
                    targetSprite.spriteFrame = spriteFrame;
                }
            }

            const labelColor = selected
                ? this.selectedTabLabelColor
                : this.unselectedTabLabelColor;
            const label = button.node.getChildByName('Label')?.getComponent(Label);
            if (labelColor && label) {
                label.color = labelColor.clone();
            }
        }
    }

    private createRoleView(root: Node): RoleView {
        const effectSection = root.getChildByName('效果');
        const currentPanel = effectSection?.children.find((child) => (
            child.name === '当前效果'
            && child.getChildByName('效果数值') !== null
        )) ?? null;
        const nextPanel = effectSection?.getChildByName('下级效果') ?? null;
        const budgetUpgradeButton = root.getChildByName('使用预算升级')
            ?.getComponent(Button) ?? null;
        const adUpgradeButton = root.getChildByName('看广告升级')
            ?.getComponent(Button) ?? null;

        return {
            root,
            levelLabel: this.findByPath(root, '图/等级')?.getComponent(Label) ?? null,
            progressBar: this.findByPath(root, '图/ProgressBar')
                ?.getComponent(ProgressBar) ?? null,
            currentDescriptionLabel: currentPanel?.getChildByName('效果描述')
                ?.getComponent(Label) ?? null,
            currentEffectLabel: currentPanel?.getChildByName('效果数值')
                ?.getComponent(Label) ?? null,
            nextDescriptionLabel: nextPanel?.getChildByName('效果描述')
                ?.getComponent(Label) ?? null,
            nextEffectLabel: nextPanel?.getChildByName('下级效果数值')
                ?.getComponent(Label) ?? null,
            deltaEffectLabel: nextPanel?.getChildByName('升级提升数值')
                ?.getComponent(Label) ?? null,
            hintLabel: this.findByPath(effectSection, '提示/提示')
                ?.getComponent(Label) ?? null,
            costLabel: this.findByPath(root, '升级消耗/消耗数值')
                ?.getComponent(Label) ?? null,
            budgetUpgradeButton,
            budgetUpgradeButtonLabel: budgetUpgradeButton?.node
                .getChildByName('Label')?.getComponent(Label) ?? null,
            adUpgradeButton,
            adUpgradeButtonLabel: adUpgradeButton?.node
                .getChildByName('Label')?.getComponent(Label) ?? null,
        };
    }

    private initializeVisibility(): void {
        if (!this.navigationRoot) {
            return;
        }
        if (this.roleViews.size !== ROLES.length) {
            this.navigationRoot.active = false;
            return;
        }

        if (this.navigationRoot.active) {
            for (const [role, view] of this.roleViews) {
                view.root.active = role === this.selectedRole;
            }
            return;
        }
        for (const view of this.roleViews.values()) {
            view.root.active = false;
        }
    }

    private bindEvents(): void {
        if (this.eventsBound) {
            return;
        }
        this.eventsBound = true;

        this.backButton?.node.on(Button.EventType.CLICK, this.closeManagement, this);
        for (const role of ROLES) {
            const tabHandler = (): void => this.switchRole(role);
            const budgetHandler = (): void => {
                void this.onBudgetUpgradeClicked(role);
            };
            const adHandler = (): void => {
                void this.onAdUpgradeClicked(role);
            };
            this.tabHandlers.set(role, tabHandler);
            this.budgetUpgradeHandlers.set(role, budgetHandler);
            this.adUpgradeHandlers.set(role, adHandler);
            this.tabButtons.get(role)?.node.on(Button.EventType.CLICK, tabHandler, this);
            this.roleViews.get(role)?.budgetUpgradeButton?.node.on(
                Button.EventType.CLICK,
                budgetHandler,
                this,
            );
            this.roleViews.get(role)?.adUpgradeButton?.node.on(
                Button.EventType.CLICK,
                adHandler,
                this,
            );
        }

        gameStateEvents.on(
            GAME_STATE_EVENT_BUDGET_CHANGED,
            this.onBudgetChanged,
            this,
        );
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

    private unbindEvents(): void {
        if (!this.eventsBound) {
            return;
        }
        this.eventsBound = false;

        this.backButton?.node.off(Button.EventType.CLICK, this.closeManagement, this);
        for (const role of ROLES) {
            const tabHandler = this.tabHandlers.get(role);
            const budgetHandler = this.budgetUpgradeHandlers.get(role);
            const adHandler = this.adUpgradeHandlers.get(role);
            if (tabHandler) {
                this.tabButtons.get(role)?.node.off(
                    Button.EventType.CLICK,
                    tabHandler,
                    this,
                );
            }
            if (budgetHandler) {
                this.roleViews.get(role)?.budgetUpgradeButton?.node.off(
                    Button.EventType.CLICK,
                    budgetHandler,
                    this,
                );
            }
            if (adHandler) {
                this.roleViews.get(role)?.adUpgradeButton?.node.off(
                    Button.EventType.CLICK,
                    adHandler,
                    this,
                );
            }
        }
        this.tabHandlers.clear();
        this.budgetUpgradeHandlers.clear();
        this.adUpgradeHandlers.clear();

        gameStateEvents.off(
            GAME_STATE_EVENT_BUDGET_CHANGED,
            this.onBudgetChanged,
            this,
        );
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
    }

    private async onBudgetUpgradeClicked(role: ManagementRole): Promise<void> {
        if (this.budgetUpgradeProcessing || this.adUpgradeProcessing) {
            return;
        }
        const before = loadManagementLevels()[role];
        if (!this.canUpgrade(role, true)) {
            return;
        }

        this.budgetUpgradeProcessing = true;
        this.refreshCurrentRole(false);
        try {
            await upgradeManagementWithBudget(role, getStoredTeamLevel());
            const upgraded = loadManagementLevels()[role] > before;
            if (upgraded) {
                gameAudio.playUpgradeSuccess();
            }
            this.refreshCurrentRole(upgraded);
        } catch (error) {
            console.error('[ManagementController] Budget upgrade failed.', error);
        } finally {
            this.budgetUpgradeProcessing = false;
            this.refreshCurrentRole(false);
        }
    }

    private async onAdUpgradeClicked(role: ManagementRole): Promise<void> {
        if (this.adUpgradeProcessing || this.budgetUpgradeProcessing) {
            return;
        }
        if (!this.canUpgrade(role, false)) {
            return;
        }

        this.adUpgradeProcessing = true;
        this.refreshCurrentRole(false);
        try {
            const completed = await showRewardedVideo();
            if (!completed) {
                return;
            }

            const before = loadManagementLevels()[role];
            upgradeManagementWithAd(role, getStoredTeamLevel());
            const upgraded = loadManagementLevels()[role] > before;
            this.refreshCurrentRole(upgraded);
        } catch (error) {
            console.error('[ManagementController] Ad upgrade failed.', error);
        } finally {
            this.adUpgradeProcessing = false;
            this.refreshCurrentRole(false);
        }
    }

    private onBudgetChanged(): void {
        this.refreshCurrentRole(false);
    }

    private onManagementChanged(): void {
        this.refreshCurrentRole(true);
    }

    private onTeamLevelChanged(): void {
        this.refreshCurrentRole(false);
    }

    private ensureConfigurations(): Promise<void> {
        this.loadingPromise ??= Promise.all([
            loadManagementEffectsConfig(),
            loadJson<EconomyConfig>('data/balance/economy'),
        ]).then(([effectsConfig, economyConfig]) => {
            this.effectsConfig = effectsConfig;
            this.economyConfig = economyConfig;
        }).catch((error) => {
            console.error('[ManagementController] Failed to load management configuration.', error);
        });
        return this.loadingPromise;
    }

    private refreshCurrentRole(animateGrowth: boolean): void {
        const view = this.roleViews.get(this.selectedRole);
        if (!view) {
            return;
        }

        const role = this.selectedRole;
        const definition = ROLE_DEFINITIONS[role];
        const level = loadManagementLevels()[role];
        const teamLevel = getStoredTeamLevel();
        const upgradeLevelCap = Math.min(MAX_MANAGEMENT_LEVEL, teamLevel);
        const capped = level >= upgradeLevelCap;
        const currentRow = this.getEffectRow(level);
        const nextRow = this.getEffectRow(level + 1);
        const currentEffect = currentRow?.[definition.effectKey] ?? 0;
        const nextEffect = nextRow?.[definition.effectKey] ?? currentEffect;
        const deltaEffect = Math.max(0, nextEffect - currentEffect);
        const cost = this.getUpgradeCost(level);
        const budget = getBudget();
        const budgetEnabled = !capped
            && cost !== null
            && canAffordBudget(cost)
            && !this.budgetUpgradeProcessing
            && !this.adUpgradeProcessing;
        const adEnabled = !capped
            && !this.budgetUpgradeProcessing
            && !this.adUpgradeProcessing;

        setGrowingNumber(
            this.budgetLabel,
            budget,
            (value) => String(Math.floor(value)),
            { animateGrowth },
        );
        setGrowingNumber(
            view.levelLabel,
            level,
            (value) => `Lv. ${Math.floor(value)} / ${MAX_MANAGEMENT_LEVEL}`,
            { animateGrowth },
        );
        if (view.progressBar) {
            view.progressBar.progress = Math.max(
                0,
                Math.min(1, level / MAX_MANAGEMENT_LEVEL),
            );
        }

        if (view.currentDescriptionLabel) {
            view.currentDescriptionLabel.string = definition.effectDescription;
        }
        if (view.nextDescriptionLabel) {
            view.nextDescriptionLabel.string = definition.effectDescription;
        }
        setGrowingNumber(
            view.currentEffectLabel,
            currentEffect,
            (value) => this.formatEffect(
                value,
                definition.percentDisplay,
                definition.percentagePointDisplay,
            ),
            { animateGrowth },
        );
        setGrowingNumber(
            view.nextEffectLabel,
            nextEffect,
            (value) => this.formatEffect(
                value,
                definition.percentDisplay,
                definition.percentagePointDisplay,
            ),
            { animateGrowth },
        );
        setGrowingNumber(
            view.deltaEffectLabel,
            deltaEffect,
            (value) => this.formatEffect(
                value,
                definition.percentDisplay,
                definition.percentagePointDisplay,
            ),
            { animateGrowth },
        );
        setGrowingNumber(
            view.costLabel,
            cost ?? 0,
            (value) => capped ? 'MAX' : String(Math.floor(value)),
            { animateGrowth },
        );

        if (view.hintLabel) {
            view.hintLabel.string = level >= MAX_MANAGEMENT_LEVEL
                ? '已达到100级上限'
                : level >= teamLevel
                    ? '管理层等级不能超过球队等级'
                    : budgetEnabled
                        ? '升级后效果立即生效'
                        : toRewardedActionCopy('预算不足，可观看广告免费升级');
        }
        if (view.budgetUpgradeButtonLabel) {
            view.budgetUpgradeButtonLabel.string = capped
                ? '已达上限'
                : budgetEnabled
                    ? '升级'
                    : '预算不足';
        }
        if (view.adUpgradeButtonLabel) {
            view.adUpgradeButtonLabel.string = capped
                ? '已达上限'
                : isWechatSharePlatform()
                    ? '分享升级'
                    : '免费升级';
        }

        this.setButtonAvailable(view.budgetUpgradeButton, budgetEnabled);
        this.setButtonAvailable(view.adUpgradeButton, adEnabled);
    }

    private canUpgrade(role: ManagementRole, requireBudget: boolean): boolean {
        const level = loadManagementLevels()[role];
        if (level >= Math.min(MAX_MANAGEMENT_LEVEL, getStoredTeamLevel())) {
            return false;
        }
        if (!requireBudget) {
            return true;
        }
        const cost = this.getUpgradeCost(level);
        return cost !== null && canAffordBudget(cost);
    }

    private getEffectRow(level: number): ManagementEffectRow | null {
        if (!this.effectsConfig?.levelEffects.length) {
            return null;
        }
        const safeLevel = Math.min(
            MAX_MANAGEMENT_LEVEL,
            Math.max(0, Math.floor(level)),
        );
        return this.effectsConfig.levelEffects.find(
            (row) => row.managementLevel === safeLevel,
        ) ?? this.effectsConfig.levelEffects[
            Math.min(safeLevel, this.effectsConfig.levelEffects.length - 1)
        ] ?? null;
    }

    private getUpgradeCost(level: number): number | null {
        const config = this.economyConfig?.managementUpgradeCost;
        if (!config || level >= Math.min(MAX_MANAGEMENT_LEVEL, config.maxLevel)) {
            return null;
        }
        if (
            !Number.isFinite(config.currentLevelBudgetMultiplier)
            || !Number.isFinite(config.currentLevelOffset)
        ) {
            return null;
        }
        return (
            Math.max(0, Math.floor(level))
            + Math.max(0, Math.floor(config.currentLevelOffset))
        )
            * Math.max(0, Math.floor(config.currentLevelBudgetMultiplier));
    }

    private formatEffect(
        value: number,
        percentDisplay: boolean,
        percentagePointDisplay = false,
    ): string {
        const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
        if (percentDisplay) {
            return `+${this.trimTrailingZeros(safeValue * 100)}%`;
        }
        if (percentagePointDisplay) {
            return `+${this.trimTrailingZeros(safeValue)}%`;
        }
        return `+${this.trimTrailingZeros(safeValue)}`;
    }

    private trimTrailingZeros(value: number): string {
        return value.toFixed(2).replace(/\.?0+$/, '');
    }

    private setButtonAvailable(button: Button | null, available: boolean): void {
        if (!button) {
            return;
        }

        button.enabled = true;
        button.interactable = available;
        button.hoverSprite = null;
        button.disabledSprite = null;
        for (const sprite of button.node.getComponentsInChildren(Sprite)) {
            const original = this.originalSpriteGrayscale.get(sprite)
                ?? sprite.grayscale;
            this.originalSpriteGrayscale.set(sprite, original);
            sprite.grayscale = available ? original : true;
        }
        for (const label of button.node.getComponentsInChildren(Label)) {
            const original = this.originalLabelColors.get(label)
                ?? label.color.clone();
            this.originalLabelColors.set(label, original);
            label.color = available ? original.clone() : DISABLED_COLOR.clone();
        }
    }

    private playCombinedEntrance(role: ManagementRole): void {
        if (!this.navigationRoot) {
            return;
        }
        const roleRoot = this.roleViews.get(role)?.root;
        if (!roleRoot) {
            return;
        }

        const navigationBackground = this.navigationRoot.getChildByName('bg');
        const top = this.navigationRoot.getChildByName('顶部');
        const tabs = this.navigationRoot.getChildByName('五个管理层');
        const illustration = roleRoot.getChildByName('图');
        const effects = roleRoot.getChildByName('效果');
        const cost = roleRoot.getChildByName('升级消耗');
        const budgetButton = roleRoot.getChildByName('使用预算升级');
        const adButton = roleRoot.getChildByName('看广告升级');

        void playFullScreenEntrance(this.navigationRoot, {
            backgroundNodes: navigationBackground ? [navigationBackground] : [],
            moduleGroups: [
                {
                    nodes: [top, tabs].filter((node): node is Node => Boolean(node)),
                    order: 0,
                },
                {
                    nodes: [illustration].filter((node): node is Node => Boolean(node)),
                    order: 1,
                },
                {
                    nodes: [effects].filter((node): node is Node => Boolean(node)),
                    order: 2,
                },
                {
                    nodes: [cost].filter((node): node is Node => Boolean(node)),
                    order: 3,
                },
                {
                    nodes: [budgetButton, adButton]
                        .filter((node): node is Node => Boolean(node)),
                    order: 4,
                },
            ],
        });
    }

    private resetEntrance(root: Node): void {
        stopFullScreenEntrance(root);
    }

    private findCompatibleNavigationRoot(root: Node): Node | null {
        const candidate = this.findDescendantByName(root, '管理层页面');
        if (!candidate) {
            return null;
        }
        return ROLES.every((role) => this.findDescendantByName(
            candidate,
            ROLE_DEFINITIONS[role].nodeName,
        )) ? candidate : null;
    }

    private findDescendantByName(root: Node, name: string): Node | null {
        if (root.name === name) {
            return root;
        }
        for (const child of root.children) {
            const result = this.findDescendantByName(child, name);
            if (result) {
                return result;
            }
        }
        return null;
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
}

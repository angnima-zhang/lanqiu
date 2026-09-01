import {
    _decorator,
    BlockInputEvents,
    Button,
    Color,
    Component,
    EffectAsset,
    EventTouch,
    Graphics,
    JsonAsset,
    Label,
    Material,
    Node,
    RichText,
    resources,
    Sprite,
    SpriteFrame,
    TTFFont,
    UITransform,
    Vec4,
} from 'cc';
import {
    formatPlayerOverall,
    getQualityFrameIndex,
    RosterSlotView,
} from './RosterSlotView';
import {
    getStoredMarketValueLevel,
    getStoredTeamLevel,
    TEAM_PROGRESSION_EVENT_LEVEL_CHANGED,
    TEAM_PROGRESSION_EVENT_WILLPOWER_CHANGED,
    TeamLevelController,
    teamProgressionEvents,
} from './TeamLevelController';
import { TopTeamInfoController } from './TopTeamInfoController';
import {
    evaluateRecruitmentResult,
    RecruitmentResultDecision,
} from './RecruitmentRules';
import { CourtSimulationController } from './CourtSimulationController';
import {
    ATTRIBUTE_KEYS,
    calculateTeamOverall,
    GAME_STATE_EVENT_BUDGET_CHANGED,
    GAME_STATE_EVENT_RECRUITMENT_PROTECTION_CHANGED,
    gameStateEvents,
    consumeRecruitmentAdHighestQualityPity,
    consumeRecruitmentAdProbabilityBoost,
    consumeLowestRecruitmentQualityProtection,
    getBalance,
    getLowestRecruitmentQualityProtectionCount,
    getRecruitmentUpperQualityPityMissCount,
    getRecruitmentAdHighestQualityPityCount,
    getRecruitmentAdProbabilityBoostCount,
    getRecruitmentAutoDismissEnabled,
    setRecruitmentAutoDismissEnabled,
    getManagementEffects,
    getRosterSnapshot as cloneRosterSnapshot,
    loadRoster,
    ManagementEffectSnapshot,
    migratePlayerHistoryToDisplayNames,
    notifyValidOperationCompleted,
    isCheatModeEnabled,
    isConceptGodUpgradeUnlocked,
    loadSeasonState,
    PlayerAttributes,
    PlayerCard,
    recordConceptGodAcquisition,
    recordRecruitmentUpperQualityPityResult,
    RECRUITMENT_UPPER_QUALITY_PITY_MISS_LIMIT,
    RECRUITMENT_AD_HIGHEST_QUALITY_PITY_LIMIT,
    saveRoster,
    trySpend,
} from './GameState';
import {
    RecruitmentProbabilityConfig,
    resolveRecruitmentQualityWeights,
    resolveRecruitmentWindow,
} from './RecruitmentProgression';
import {
    loadPlayerPortrait,
    loadQualityBadge,
    loadQualityFrame,
    loadQualityNameplate,
    loadQualityPosition,
    loadQualityWheat,
    loadRecruitmentBackground,
    loadSpriteFrame,
} from './PlayerAssets';
import { playFullScreenEntrance } from './FullScreenEntrance';
import { playFullScreenExit as exitWithFade } from './FullScreenEntrance';

import {
    configureRewardedAdUnitIds,
    isWechatSharePlatform,
    showRewardedVideo,
    toRewardedActionCopy,
} from './RewardedAdService';
import { setGrowingNumber } from './NumberGrowthAnimator';
import { gameAudio } from './GameAudio';
import {
    applyOverallNumberQuality,
    applyPlayerQualityVisuals,
    triggerOverallNumberQualityImpact,
} from './PlayerQualityVisuals';
import { PlayerEventController } from './PlayerEventController';
import { PortraitUpgradeReveal } from '../effects/PortraitUpgradeReveal';
import {
    formatPlayerProfile,
    loadPlayerKnowledgeConfig,
    recordPlayerAcquisitionWithKnowledgeReset,
} from './PlayerKnowledge';

const { ccclass, property } = _decorator;

const PLAYER_CONFIG_PATH = 'data/player_config_fame_v3';
const OVR_RANGES_PATH = 'data/balance/player_ovr_ranges';
const RECRUITMENT_PROBABILITY_PATH = 'data/balance/recruitment_probability';
const ECONOMY_PATH = 'data/balance/economy';
const CONCEPT_GOD_UPGRADE_PATH = 'data/balance/concept_god_upgrade';
const DEFAULT_BUDGET = 20;
const RECRUITING_BUTTON_SPRITE_PATH = 'images/UI/按钮/招募中/spriteFrame';
const RECRUIT_BUTTON_SWEEP_EFFECT_PATH = 'effects/recruit-button-sweep';
const DISSOLVE_EFFECT_PATH = 'effects/dissolve';
const RECRUITING_DELAY_SECONDS = 1;
const AD_RECRUIT_COUNT = 10;
const AD_RECRUIT_LABEL = `${AD_RECRUIT_COUNT}连抽`;
const RECRUITMENT_PROFILE_HONOR_LIMIT = 5;
const NEGATIVE_OVERALL_COLOR = new Color(220, 55, 55, 255);
const CONTINUOUS_RECRUIT_START_DELAY_SECONDS = 1;
const CONTINUOUS_RECRUIT_MAX_HOLD_SECONDS = 3;
const CONTINUOUS_RECRUIT_UPGRADE_READY_GROWTH_PER_SECOND = 10;
const CONTINUOUS_RECRUIT_MAX_LEVEL_GROWTH_PER_SECOND = 50;
const CONTINUOUS_RECRUIT_GROWTH_INTERVAL_SECONDS = 0.1;
const CONTINUOUS_RECRUIT_MINIMUM_COUNT = 2;
const CONTINUOUS_RECRUIT_DEFAULT_COUNT = 5;
const CONTINUOUS_RECRUIT_EVENT_CHECK_INTERVAL = 10;
const CONTINUOUS_RECRUIT_MAX_FONT_SIZE = 50;
const AUTO_DISMISS_HOLD_SECONDS = 2;
const AUTO_DISMISS_SEGMENT_SECONDS = 1.5;
const AUTO_DISMISS_FINAL_COUNT_HOLD_SECONDS = 0.3;

type AttributeKey = typeof ATTRIBUTE_KEYS[number];

interface RecruitmentQualityDraw {
    qualityId: number;
    secondHighestQualityId: number | null;
    adHighestQualityPityApplied: boolean;
}

interface QualityTextHighlight {
    value: string;
    color: string;
}

interface RecruitmentHint {
    text: string;
    highlights: string[];
    qualityHighlights: QualityTextHighlight[];
}

const BRIGHT_QUALITY_HINT_COLORS = [
    '#F0B27A', // 铜
    '#F4FBFF', // 银
    '#FFE06A', // 金
    '#7BFF9C', // 绿
    '#79BCFF', // 蓝
    '#FF8590', // 红
    '#E39AFF', // 紫
    '#C9EEFF', // 冰蓝
    '#FF9CCD', // 粉
    '#FFF2FF', // 幻彩
    '#A3FAFF', // 青蓝
    '#B8E9FF', // 浅蓝
    '#FFEE9A', // GOAT金
] as const;

interface PlayerTemplate {
    id: string;
    sourcePlayerName: string;
    displayName: string;
    position: string;
    quality: number;
    qualityName: string;
    attributes: PlayerAttributes;
}

interface PlayerConfig {
    players: PlayerTemplate[];
}

interface OvrRange {
    qualityId: number;
    qualityName: string;
    minOvr: number;
    maxOvr: number;
}

interface OvrRangesConfig {
    ranges: OvrRange[];
}

interface EconomyConfig {
    initialBudget: number;
    recruit: {
        budgetCostFormula: {
            teamLevelMultiplier: number;
            baseCost: number;
        };
        willpowerReward: number;
    };
}

interface ConceptGodDefinition {
    conceptGodId: string;
    displayName: string;
    lore: string;
}

interface ConceptGodUpgradeConfig {
    quality: {
        goatQualityId: number;
        conceptGodQualityId: number;
        conceptGodQualityName: string;
    };
    attributeUpgrade: {
        randomAttributeCount: number;
        increasePercent: number;
        minimumIncrease: number;
        integerMaximum: number;
    };
    goatOverallUpgrade: {
        increasePercent: number;
        integerMaximum: number;
    };
    frontend: {
        normalQualityButtonLabel: string;
        eligibleGoatButtonLabel: string;
        ineligibleGoatButtonLabel: string;
        attributeButtonLabel: string;
    };
    eligibleSourcePlayerNames: string[];
    conceptGodDefinitions: Record<string, ConceptGodDefinition[]>;
}

interface QueuedRecruitmentResult {
    card: PlayerCard;
    willpowerAdded: number;
}

@ccclass('RecruitmentController')
export class RecruitmentController extends Component {
    @property({
        displayName: '微信激励视频广告位ID',
        tooltip: '微信小游戏后台创建的激励视频广告位ID。Creator预览无需填写。',
    })
    private wechatRewardedAdUnitId = '';

    @property({
        displayName: 'TapTap激励视频广告位ID',
        tooltip: 'TapTap小游戏后台创建的激励视频广告位ID。Creator预览无需填写。',
    })
    private tapRewardedAdUnitId = '';

    private homeRoot: Node | null = null;
    private resultPage: Node | null = null;
    private rosterSlots: RosterSlotView[] = [];
    private recruitButton: Button | null = null;
    private recruitButtonTargetSprite: Sprite | null = null;
    private recruitButtonNormalSprite: SpriteFrame | null = null;
    private recruitButtonTransition = Button.Transition.NONE;
    private recruitingButtonSprite: SpriteFrame | null = null;
    private recruitButtonOriginalMaterial: Material | null = null;
    private recruitButtonEffectMaterial: Material | null = null;
    private dissolveEffectAsset: EffectAsset | null = null;
    private dissolveMaterial: Material | null = null;
    private readonly dissolveParams = new Vec4(0, 0.12, 8.0, 0);
    private cancelDissolve: (() => void) | null = null;
    private budgetLabel: Label | null = null;
    private continuousRecruitLabel: Label | null = null;
    private continuousRecruitRichText: RichText | null = null;
    private continuousRecruitLabelBaseFontSize = 0;
    private continuousRecruitLabelLocked = false;
    private continuousRecruitLockedCount = 0;
    private dismissButton: Button | null = null;
    private autoDismissLabel: Label | null = null;
    private autoDismissDefaultText = '';
    private autoDismissEnabled = false;
    private autoDismissCount = 0;
    private autoDismissBatchLocked = false;
    private recruitmentInputBlocker: Node | null = null;
    private dismissHoldStartedAtMs = 0;
    private suppressNextDismissClick = false;
    private dismissHoldFill: Graphics | null = null;
    private replaceButton: Button | null = null;
    private replaceButtonLabel: Label | null = null;
    private upgradeAdButton: Button | null = null;
    private upgradeAdButtonLabel: Label | null = null;
    private replacementPanel: Node | null = null;
    private replacedSlot: RosterSlotView | null = null;
    private replacedNameLabel: Label | null = null;
    private overallIncreaseValueLabel: Label | null = null;
    private overallIncreaseValueDefaultColor: Color | null = null;
    private candidatePortrait: Sprite | null = null;
    private recruitBackground: Sprite | null = null;
    private wheatSprites: Sprite[] = [];
    private candidateFrame: Sprite | null = null;
    private candidateNameplate: Sprite | null = null;
    private candidateQualityBadge: Sprite | null = null;
    private candidatePositionBadge: Sprite | null = null;
    private candidateNameLabel: Label | null = null;
    private candidateQualityLabel: Label | null = null;
    private candidatePositionLabel: Label | null = null;
    private candidateOverallLabel: Label | null = null;
    private candidateProfileTitleLabel: Label | null = null;
    private candidateProfileLabel: Label | null = null;
    private willpowerTextLabel: Label | null = null;
    private willpowerValueLabel: Label | null = null;
    private teamLevelController: TeamLevelController | null = null;
    private topTeamInfoController: TopTeamInfoController | null = null;
    private courtSimulationController: CourtSimulationController | null = null;

    private playerConfig: PlayerConfig | null = null;
    private ovrConfig: OvrRangesConfig | null = null;
    private probabilityConfig: RecruitmentProbabilityConfig | null = null;
    private economyConfig: EconomyConfig | null = null;
    private conceptGodUpgradeConfig: ConceptGodUpgradeConfig | null = null;
    private managementEffects: ManagementEffectSnapshot = {
        operationPresidentBudgetBonus: 0,
        headCoachBattleOvrBonus: 0,
        scoutingDirectorHighestQualityWeightBonus: 0,
        medicalTeamInjuryRiskReduction: 0,
        mediaTeamOfflineBudgetBonus: 0,
    };
    private roster: Array<PlayerCard | null> = [];
    private budget = DEFAULT_BUDGET;
    private pendingCard: PlayerCard | null = null;
    private pendingDecision: RecruitmentResultDecision | null = null;
    private pendingWillpowerAdded = 0;
    private upgradeAdProcessing = false;
    private pendingUpgradeAdUsed = false;
    private queuedAdRecruitments: QueuedRecruitmentResult[] = [];
    private queuedContinuousRecruitments: QueuedRecruitmentResult[] = [];
    private adTripleRecruitmentActive = false;
    private continuousRecruitmentActive = false;
    private continuousRecruitmentBatchCount = 0;
    private continuousRecruitmentEventCheckCount = 0;
    private resultPageClosing = false;
    private pendingContinuousRecruitmentCount = 0;
    private continuousRecruitCount = 0;
    private continuousRecruitHolding = false;
    private continuousRecruitHoldStartedAtMs = 0;
    private continuousRecruitReady = false;
    private ready = false;
    private processing = false;

    protected onLoad(): void {
        configureRewardedAdUnitIds({
            wechat: this.wechatRewardedAdUnitId,
            tapTap: this.tapRewardedAdUnitId,
        });
        this.autoDismissEnabled = getRecruitmentAutoDismissEnabled();
        this.resolveSceneReferences();
        if (!this.hasRequiredReferences()) {
            console.error('[RecruitmentController] Missing recruitment UI references.');
            this.enabled = false;
            return;
        }
        this.resultPage!.active = false;
    }

    protected onEnable(): void {
        this.recruitButton?.node.on(Button.EventType.CLICK, this.onRecruitClicked, this);
        this.recruitButton?.node.on(
            Node.EventType.TOUCH_START,
            this.onRecruitTouchStart,
            this,
            true,
        );
        this.recruitButton?.node.on(
            Node.EventType.TOUCH_END,
            this.onRecruitTouchEnd,
            this,
            true,
        );
        this.recruitButton?.node.on(
            Node.EventType.TOUCH_CANCEL,
            this.onRecruitTouchCancel,
            this,
            true,
        );
        this.dismissButton?.node.on(Button.EventType.CLICK, this.onDismissClicked, this);
        this.dismissButton?.node.on(Node.EventType.TOUCH_START, this.onDismissTouchStart, this, true);
        this.dismissButton?.node.on(Node.EventType.TOUCH_MOVE, this.onDismissTouchMove, this, true);
        this.dismissButton?.node.on(Node.EventType.TOUCH_END, this.onDismissTouchEnd, this, true);
        this.dismissButton?.node.on(Node.EventType.TOUCH_CANCEL, this.onDismissTouchCancel, this, true);
        this.replaceButton?.node.on(Button.EventType.CLICK, this.onReplaceClicked, this);
        this.upgradeAdButton?.node.on(
            Button.EventType.CLICK,
            this.onUpgradeAdClicked,
            this,
        );
        gameStateEvents.on(
            GAME_STATE_EVENT_BUDGET_CHANGED,
            this.onBudgetChanged,
            this,
        );
        gameStateEvents.on(
            GAME_STATE_EVENT_RECRUITMENT_PROTECTION_CHANGED,
            this.refreshBudgetView,
            this,
        );
        teamProgressionEvents.on(
            TEAM_PROGRESSION_EVENT_LEVEL_CHANGED,
            this.refreshBudgetView,
            this,
        );
        teamProgressionEvents.on(TEAM_PROGRESSION_EVENT_WILLPOWER_CHANGED, this.refreshBudgetView, this);
    }

    protected start(): void {
        this.scheduleOnce(() => void this.initialize(), 0.75);
    }

    protected onDisable(): void {
        this.cancelDissolve?.();
        this.recruitButton?.node.off(Button.EventType.CLICK, this.onRecruitClicked, this);
        this.recruitButton?.node.off(
            Node.EventType.TOUCH_START,
            this.onRecruitTouchStart,
            this,
            true,
        );
        this.recruitButton?.node.off(
            Node.EventType.TOUCH_END,
            this.onRecruitTouchEnd,
            this,
            true,
        );
        this.recruitButton?.node.off(
            Node.EventType.TOUCH_CANCEL,
            this.onRecruitTouchCancel,
            this,
            true,
        );
        this.dismissButton?.node.off(Button.EventType.CLICK, this.onDismissClicked, this);
        this.dismissButton?.node.off(Node.EventType.TOUCH_START, this.onDismissTouchStart, this, true);
        this.dismissButton?.node.off(Node.EventType.TOUCH_MOVE, this.onDismissTouchMove, this, true);
        this.dismissButton?.node.off(Node.EventType.TOUCH_END, this.onDismissTouchEnd, this, true);
        this.dismissButton?.node.off(Node.EventType.TOUCH_CANCEL, this.onDismissTouchCancel, this, true);
        this.stopDismissHold();
        this.setAutoDismissBatchLocked(false);
        this.replaceButton?.node.off(Button.EventType.CLICK, this.onReplaceClicked, this);
        this.upgradeAdButton?.node.off(
            Button.EventType.CLICK,
            this.onUpgradeAdClicked,
            this,
        );
        gameStateEvents.off(
            GAME_STATE_EVENT_BUDGET_CHANGED,
            this.onBudgetChanged,
            this,
        );
        gameStateEvents.off(
            GAME_STATE_EVENT_RECRUITMENT_PROTECTION_CHANGED,
            this.refreshBudgetView,
            this,
        );
        teamProgressionEvents.off(
            TEAM_PROGRESSION_EVENT_LEVEL_CHANGED,
            this.refreshBudgetView,
            this,
        );
        teamProgressionEvents.off(TEAM_PROGRESSION_EVENT_WILLPOWER_CHANGED, this.refreshBudgetView, this);
    }

    private resolveSceneReferences(): void {
        const canvas = this.node.parent;
        this.homeRoot = canvas?.getChildByName('主页') ?? null;
        this.resultPage = canvas?.getChildByName('招募结果页面') ?? null;

        const rosterRoot = this.findByPath(this.homeRoot, '球队/阵容槽位');
        this.rosterSlots = rosterRoot
            ? rosterRoot.children
                .map((child) => child.getComponent(RosterSlotView))
                .filter((slot): slot is RosterSlotView => Boolean(slot))
                .sort((a, b) => a.node.name.localeCompare(b.node.name, 'zh-CN', { numeric: true }))
            : [];

        this.recruitButton = this.findByPath(this.homeRoot, '底部按钮/招募/招募')
            ?.getComponent(Button) ?? null;
        this.recruitButtonTargetSprite = this.recruitButton?.target?.getComponent(Sprite)
            ?? this.recruitButton?.node.getComponent(Sprite)
            ?? null;
        this.recruitButtonOriginalMaterial = this.recruitButtonTargetSprite?.customMaterial ?? null;
        this.recruitButtonNormalSprite = this.recruitButton?.normalSprite
            ?? this.recruitButtonTargetSprite?.spriteFrame
            ?? null;
        this.recruitButtonTransition = this.recruitButton?.transition
            ?? Button.Transition.NONE;
        this.budgetLabel = this.findByPath(this.homeRoot, '底部按钮/招募/预算余额')
            ?.getComponent(Label) ?? null;
        this.continuousRecruitLabel = this.findByPath(
            this.homeRoot,
            '底部按钮/招募/连续招募',
        )?.getComponent(Label) ?? null;
        this.continuousRecruitLabelBaseFontSize = this.continuousRecruitLabel?.fontSize ?? 0;
        if (this.continuousRecruitLabel) {
            const labelNode = this.continuousRecruitLabel.node;
            this.continuousRecruitRichText = labelNode.getComponent(RichText)
                ?? labelNode.addComponent(RichText);
            this.continuousRecruitRichText.font = this.continuousRecruitLabel.font as TTFFont | null;
            this.continuousRecruitRichText.fontSize = this.continuousRecruitLabel.fontSize;
            this.continuousRecruitRichText.lineHeight = this.continuousRecruitLabel.lineHeight;
            this.continuousRecruitRichText.horizontalAlign = this.continuousRecruitLabel.horizontalAlign;
            this.continuousRecruitRichText.fontColor = this.continuousRecruitLabel.color;
            // 连招文案在松手后会放大到 50 号；保持单行比自动换行更重要。
            this.continuousRecruitRichText.maxWidth = 0;
            this.continuousRecruitRichText.handleTouchEvent = false;
            this.continuousRecruitLabel.enabled = false;
        }
        this.teamLevelController = this.homeRoot?.getComponentInChildren(TeamLevelController) ?? null;
        this.topTeamInfoController = this.homeRoot?.getComponentInChildren(TopTeamInfoController) ?? null;
        this.courtSimulationController = this.homeRoot
            ?.getComponentInChildren(CourtSimulationController) ?? null;

        if (!this.resultPage) {
            return;
        }

        const portraitRoot = this.resultPage.getChildByName('球员头像');
        this.candidatePortrait = portraitRoot?.getChildByName('头像')
            ?.getComponent(Sprite)
            ?? portraitRoot?.children
                .find((child) => child.name.includes('_'))
                ?.getComponent(Sprite)
            ?? null;
        this.recruitBackground = portraitRoot?.getChildByName('bg')?.getComponent(Sprite) ?? null;
        this.wheatSprites = portraitRoot?.children
            .filter((child) => child.name === '麦穗')
            .map((child) => child.getComponent(Sprite))
            .filter((sprite): sprite is Sprite => Boolean(sprite)) ?? [];
        this.candidateFrame = portraitRoot?.getChildByName('头像框')?.getComponent(Sprite) ?? null;
        this.candidateNameplate = portraitRoot?.getChildByName('名牌')?.getComponent(Sprite) ?? null;
        this.candidateQualityBadge = portraitRoot?.getChildByName('品质标签')?.getComponent(Sprite) ?? null;
        this.candidatePositionBadge = portraitRoot?.getChildByName('位置')?.getComponent(Sprite) ?? null;
        this.candidateNameLabel = this.findByPath(portraitRoot, '名牌/名字')?.getComponent(Label) ?? null;
        this.candidateQualityLabel = this.findByPath(portraitRoot, '品质标签/品质')?.getComponent(Label) ?? null;
        this.candidatePositionLabel = this.findByPath(portraitRoot, '位置/位置')?.getComponent(Label) ?? null;
        this.candidateOverallLabel = this.findByPath(this.resultPage, '总评/数值')?.getComponent(Label) ?? null;
        applyOverallNumberQuality(this.candidateOverallLabel, 3);

        this.candidateProfileTitleLabel = this.findByPath(
            this.resultPage,
            '球员资料/题目',
        )?.getComponent(Label) ?? null;
        this.candidateProfileLabel = this.findByPath(
            this.resultPage,
            '球员资料/资料',
        )?.getComponent(Label) ?? null;

        this.replacementPanel = this.resultPage.children
            .find((child) => child.name === '替换' && !child.getComponent(Button)) ?? null;
        this.replacedSlot = this.replacementPanel?.getComponentInChildren(RosterSlotView) ?? null;
        this.replacedNameLabel = this.replacementPanel
            ?.getChildByName('被替换球员名字')
            ?.getComponent(Label) ?? null;
        this.overallIncreaseValueLabel = this.replacementPanel
            ?.getChildByName('总评提升数值')
            ?.getComponent(Label) ?? null;
        this.overallIncreaseValueDefaultColor = this.overallIncreaseValueLabel
            ?.color.clone() ?? null;

        this.dismissButton = this.resultPage.getChildByName('解雇')?.getComponent(Button) ?? null;
        this.autoDismissLabel = this.dismissButton?.node.getChildByName('自动解雇')
            ?.getComponent(Label) ?? null;
        this.autoDismissDefaultText = this.autoDismissLabel?.string ?? '';
        this.refreshAutoDismissLabel();
        this.replaceButton = this.resultPage.children
            .find((child) => child.name === '替换' && Boolean(child.getComponent(Button)))
            ?.getComponent(Button) ?? null;
        this.replaceButtonLabel = this.replaceButton?.node
            .getChildByName('Label')
            ?.getComponent(Label) ?? null;
        this.upgradeAdButton = this.resultPage
            .getChildByName('看广告升级')
            ?.getComponent(Button) ?? null;
        this.upgradeAdButtonLabel = this.upgradeAdButton?.node
            .getChildByName('Label')
            ?.getComponent(Label) ?? null;
        this.willpowerTextLabel = this.resultPage.getChildByName('获得斗志')?.getComponent(Label) ?? null;
        this.willpowerValueLabel = this.findByPath(this.resultPage, '获得斗志/斗志数值')
            ?.getComponent(Label) ?? null;
    }

    private hasRequiredReferences(): boolean {
        return Boolean(
            this.homeRoot
            && this.resultPage
            && this.rosterSlots.length === 12
            && this.recruitButton
            && this.budgetLabel
            && this.dismissButton
            && this.replaceButton
            && this.replaceButtonLabel
            && this.upgradeAdButton
            && this.upgradeAdButtonLabel
            && this.replacementPanel
            && this.replacedSlot
            && this.candidatePortrait
            && this.candidateNameLabel
            && this.candidateQualityLabel
            && this.candidatePositionLabel
            && this.candidateOverallLabel,
        );
    }

    private async initialize(): Promise<void> {
        try {
            const [
                playerConfig,
                ovrConfig,
                probabilityConfig,
                economyConfig,
                conceptGodUpgradeConfig,
                managementEffects,
                recruitingButtonSprite,
                recruitButtonSweepEffect,
                dissolveEffect,
            ] = await Promise.all([
                this.loadJson<PlayerConfig>(PLAYER_CONFIG_PATH),
                this.loadJson<OvrRangesConfig>(OVR_RANGES_PATH),
                this.loadJson<RecruitmentProbabilityConfig>(RECRUITMENT_PROBABILITY_PATH),
                this.loadJson<EconomyConfig>(ECONOMY_PATH),
                this.loadJson<ConceptGodUpgradeConfig>(CONCEPT_GOD_UPGRADE_PATH),
                getManagementEffects(),
                loadSpriteFrame(RECRUITING_BUTTON_SPRITE_PATH),
                this.loadRecruitButtonEffect(),
                this.loadDissolveEffect(),
            ]);
            if (
                !Array.isArray(playerConfig.players)
                || !Array.isArray(ovrConfig.ranges)
                || !Array.isArray(probabilityConfig.qualityWindows)
                || !Number.isFinite(economyConfig.initialBudget)
                || !economyConfig.recruit
                || !Number.isFinite(economyConfig.recruit.budgetCostFormula?.teamLevelMultiplier)
                || !Number.isFinite(economyConfig.recruit.budgetCostFormula?.baseCost)
                || !Array.isArray(conceptGodUpgradeConfig.eligibleSourcePlayerNames)
                || !conceptGodUpgradeConfig.conceptGodDefinitions
            ) {
                throw new Error('Invalid recruitment configuration.');
            }

            this.playerConfig = playerConfig;
            this.ovrConfig = ovrConfig;
            this.probabilityConfig = probabilityConfig;
            this.economyConfig = economyConfig;
            this.conceptGodUpgradeConfig = conceptGodUpgradeConfig;
            this.managementEffects = managementEffects;
            this.recruitingButtonSprite = recruitingButtonSprite;
            if (recruitButtonSweepEffect) {
                this.installRecruitButtonEffect(recruitButtonSweepEffect);
            }
            if (dissolveEffect) {
                this.dissolveEffectAsset = dissolveEffect;
                this.prepareDissolveMaterial();
            }
            this.budget = getBalance(economyConfig.initialBudget);
            this.roster = loadRoster(this.rosterSlots.length);
            this.migrateRosterDisplayNames();
            migratePlayerHistoryToDisplayNames(playerConfig.players, this.roster);
            await this.refreshRosterSlots();
            this.refreshCourtSimulation();
            this.ready = true;
            this.refreshBudgetView();
            this.topTeamInfoController?.refreshOverallFromRoster();
        } catch (error) {
            console.error('[RecruitmentController] Failed to initialize.', error);
            this.refreshBudgetView();
        }
    }

    private onRecruitClicked(): void {
        if (!this.ready || this.processing || !this.economyConfig) {
            return;
        }
        const continuousCount = this.pendingContinuousRecruitmentCount;
        this.pendingContinuousRecruitmentCount = 0;
        const recruitmentAction = continuousCount >= CONTINUOUS_RECRUIT_MINIMUM_COUNT
            ? () => this.beginContinuousRecruitment(continuousCount)
            : this.beginRecruitment;
        const playerEventController = this.node.getComponent(PlayerEventController)
            ?? this.node.parent?.getComponent(PlayerEventController)
            ?? null;
        if (playerEventController?.runAfterPendingEvents(recruitmentAction)) {
            return;
        }
        recruitmentAction();
    }

    private onRecruitTouchStart = (): void => {
        if (!this.ready || this.processing || this.getMaxContinuousRecruitmentCount() < 2) {
            return;
        }
        this.continuousRecruitHolding = true;
        this.continuousRecruitHoldStartedAtMs = Date.now();
        this.continuousRecruitReady = false;
        this.continuousRecruitCount = 0;
        this.scheduleOnce(
            this.activateContinuousRecruitment,
            CONTINUOUS_RECRUIT_START_DELAY_SECONDS,
        );
    };

    private onRecruitTouchEnd = (): void => {
        if (this.continuousRecruitReady) {
            this.growContinuousRecruitment();
        }
        const batchCount = this.continuousRecruitReady
            ? this.continuousRecruitCount
            : 0;
        this.stopContinuousRecruitHold();
        if (batchCount >= CONTINUOUS_RECRUIT_MINIMUM_COUNT) {
            this.lockContinuousRecruitLabel(batchCount);
            this.pendingContinuousRecruitmentCount = batchCount;
        }
    };

    private onRecruitTouchCancel = (): void => {
        this.stopContinuousRecruitHold();
    };

    private activateContinuousRecruitment = (): void => {
        if (!this.continuousRecruitHolding) {
            return;
        }
        const maximum = this.getMaxContinuousRecruitmentCount();
        if (maximum < CONTINUOUS_RECRUIT_MINIMUM_COUNT) {
            this.stopContinuousRecruitHold();
            return;
        }
        this.continuousRecruitReady = true;
        this.growContinuousRecruitment();
        if (this.continuousRecruitCount < maximum) {
            this.schedule(
                this.growContinuousRecruitment,
                CONTINUOUS_RECRUIT_GROWTH_INTERVAL_SECONDS,
            );
        }
    };

    private growContinuousRecruitment = (): void => {
        if (!this.continuousRecruitHolding) {
            this.unschedule(this.growContinuousRecruitment);
            return;
        }
        const maximum = this.getMaxContinuousRecruitmentCount();
        const initialCount = Math.min(CONTINUOUS_RECRUIT_DEFAULT_COUNT, maximum);
        const growthMilliseconds = Math.max(0, Date.now() - this.continuousRecruitHoldStartedAtMs
            - CONTINUOUS_RECRUIT_START_DELAY_SECONDS * 1000);
        const progression = this.teamLevelController?.getSnapshot();
        const maximumLevel = progression?.maxLevel
            ?? getStoredTeamLevel() >= 100;
        const fixedGrowthPerSecond = maximumLevel
            ? CONTINUOUS_RECRUIT_MAX_LEVEL_GROWTH_PER_SECOND
            : progression && progression.willpower >= progression.currentRequirement
                ? CONTINUOUS_RECRUIT_UPGRADE_READY_GROWTH_PER_SECOND : 0;
        const growthCount = fixedGrowthPerSecond > 0
            ? growthMilliseconds * fixedGrowthPerSecond / 1000
            : (maximum - initialCount) * Math.min(1, growthMilliseconds
                / ((CONTINUOUS_RECRUIT_MAX_HOLD_SECONDS - CONTINUOUS_RECRUIT_START_DELAY_SECONDS) * 1000));
        this.continuousRecruitCount = Math.min(maximum, Math.floor(initialCount + growthCount));
        this.refreshContinuousRecruitLabel();
        if (this.continuousRecruitCount >= maximum) {
            this.unschedule(this.growContinuousRecruitment);
        }
    };

    private stopContinuousRecruitHold(): void {
        this.continuousRecruitHolding = false;
        this.continuousRecruitHoldStartedAtMs = 0;
        this.continuousRecruitReady = false;
        this.continuousRecruitCount = 0;
        this.unschedule(this.activateContinuousRecruitment);
        this.unschedule(this.growContinuousRecruitment);
        this.refreshContinuousRecruitLabel();
    }

    private beginContinuousRecruitment = (requestedCount: number): void => {
        if (!this.ready || this.processing || !this.economyConfig) {
            return;
        }
        const count = Math.min(
            Math.max(0, Math.floor(requestedCount)),
            this.getMaxContinuousRecruitmentCount(),
        );
        if (count < CONTINUOUS_RECRUIT_MINIMUM_COUNT) {
            this.resetContinuousRecruitLabel();
            this.beginRecruitment();
            return;
        }

        const cards: PlayerCard[] = [];
        const excludedSourceNames = new Set(
            loadRoster(this.rosterSlots.length).flatMap((card) => (
                card ? [card.sourcePlayerName] : []
            )),
        );
        const protectedDrawCount = getLowestRecruitmentQualityProtectionCount();
        const probabilityBoost10DrawCount = getRecruitmentAdProbabilityBoostCount(10);
        const probabilityBoost5DrawCount = getRecruitmentAdProbabilityBoostCount(5);
        for (let index = 0; index < count; index += 1) {
            const card = this.createRecruitedCard(
                index < protectedDrawCount,
                excludedSourceNames,
                index < probabilityBoost10DrawCount,
                index < probabilityBoost5DrawCount,
            );
            if (!card) {
                break;
            }
            cards.push(card);
            excludedSourceNames.add(card.sourcePlayerName);
        }
        if (cards.length < CONTINUOUS_RECRUIT_MINIMUM_COUNT) {
            this.resetContinuousRecruitLabel();
            this.beginRecruitment();
            return;
        }

        const cost = this.getRecruitmentCost();
        const budgetBeforeSpend = getBalance(this.economyConfig.initialBudget);
        const spentCards: PlayerCard[] = [];
        for (const card of cards) {
            if (!trySpend(cost)) {
                break;
            }
            spentCards.push(card);
        }
        if (spentCards.length === 0) {
            this.resetContinuousRecruitLabel();
            this.budget = getBalance(this.economyConfig.initialBudget);
            this.refreshBudgetView();
            return;
        }
        for (let index = 0; index < Math.min(protectedDrawCount, spentCards.length); index += 1) {
            consumeLowestRecruitmentQualityProtection();
        }
        if (probabilityBoost10DrawCount > 0) {
            consumeRecruitmentAdProbabilityBoost(
                10,
                Math.min(probabilityBoost10DrawCount, spentCards.length),
            );
        }
        if (probabilityBoost5DrawCount > 0) {
            consumeRecruitmentAdProbabilityBoost(
                5,
                Math.min(probabilityBoost5DrawCount, spentCards.length),
            );
        }

        const budgetAfterSpend = getBalance(this.economyConfig.initialBudget);
        this.processing = true;
        this.continuousRecruitmentActive = true;
        this.continuousRecruitmentBatchCount = spentCards.length;
        this.autoDismissCount = 0;
        this.setAutoDismissBatchLocked(this.autoDismissEnabled);
        this.showRecruitingButtonVisual();
        this.budget = budgetAfterSpend;
        this.refreshBudgetView();
        // 先记录判定次数，整轮结果结算后再对最终阵容生成事件，避免事件随旧球员被替换掉。
        this.continuousRecruitmentEventCheckCount = budgetAfterSpend + Number.EPSILON < budgetBeforeSpend
            ? Math.floor(spentCards.length / CONTINUOUS_RECRUIT_EVENT_CHECK_INTERVAL)
            : 0;
        this.queuedContinuousRecruitments = spentCards.map((card) => {
            recordPlayerAcquisitionWithKnowledgeReset(card);
            return {
                card,
                willpowerAdded: this.teamLevelController?.addRecruitWillpower() ?? 0,
            };
        });
        void (this.autoDismissEnabled ? Promise.resolve() : this.waitForSeconds(RECRUITING_DELAY_SECONDS))
            .then(() => this.showNextContinuousRecruitmentResult())
            .catch((error) => {
                console.error('[RecruitmentController] Continuous recruitment failed.', error);
                this.finishContinuousRecruitment();
            });
    };

    private beginRecruitment = (): void => {
        if (!this.ready || this.processing || !this.economyConfig) {
            return;
        }

        const cost = this.getRecruitmentCost();
        if (!isCheatModeEnabled() && this.budget < cost) {
            void this.recruitTripleFromAd();
            return;
        }

        const lowQualityProtectionActive = getLowestRecruitmentQualityProtectionCount() > 0;
        const probabilityBoost10Active = getRecruitmentAdProbabilityBoostCount(10) > 0;
        const probabilityBoost5Active = getRecruitmentAdProbabilityBoostCount(5) > 0;
        const card = this.createRecruitedCard(
            lowQualityProtectionActive,
            new Set<string>(),
            probabilityBoost10Active,
            probabilityBoost5Active,
        );
        if (!card) {
            return;
        }

        const budgetBeforeSpend = getBalance(this.economyConfig.initialBudget);
        if (!trySpend(cost)) {
            this.budget = getBalance(this.economyConfig.initialBudget);
            this.refreshBudgetView();
            return;
        }
        if (lowQualityProtectionActive) {
            consumeLowestRecruitmentQualityProtection();
        }
        if (probabilityBoost10Active) {
            consumeRecruitmentAdProbabilityBoost(10);
        }
        if (probabilityBoost5Active) {
            consumeRecruitmentAdProbabilityBoost(5);
        }

        const budgetAfterSpend = getBalance(this.economyConfig.initialBudget);
        this.processing = true;
        this.showRecruitingButtonVisual();
        this.budget = budgetAfterSpend;
        this.refreshBudgetView();
        if (budgetAfterSpend + Number.EPSILON < budgetBeforeSpend) {
            notifyValidOperationCompleted();
        }
        recordPlayerAcquisitionWithKnowledgeReset(card);

        const willpowerAdded = this.teamLevelController?.addRecruitWillpower() ?? 0;
        this.pendingCard = card;
        this.pendingWillpowerAdded = willpowerAdded;
        this.upgradeAdProcessing = false;
        this.pendingUpgradeAdUsed = false;
        this.pendingDecision = this.getCurrentRecruitmentDecision();

        void this.showRecruitmentResultAfterDelay(
            card,
            this.pendingDecision,
            willpowerAdded,
        )
            .finally(() => {
                this.restoreRecruitButtonVisual();
                this.processing = false;
                this.refreshBudgetView();
            });
    }

    private async recruitTripleFromAd(): Promise<void> {
        if (this.processing) {
            return;
        }

        this.processing = true;
        this.showRecruitingButtonVisual();
        this.refreshBudgetView();
        try {
            const completed = await showRewardedVideo({
                wechat: this.wechatRewardedAdUnitId,
                tapTap: this.tapRewardedAdUnitId,
            });
            if (!completed) {
                return;
            }

            await this.waitForPendingPlayerEvents();
            if (!this.node.isValid) {
                return;
            }

            const cards: PlayerCard[] = [];
            const availableLowQualityProtection = getLowestRecruitmentQualityProtectionCount();
            const probabilityBoost10DrawCount = getRecruitmentAdProbabilityBoostCount(10);
            const probabilityBoost5DrawCount = getRecruitmentAdProbabilityBoostCount(5);
            let consumedLowQualityProtection = 0;
            const excludedSourceNames = new Set(
                loadRoster(this.rosterSlots.length).flatMap((card) => (
                    card ? [card.sourcePlayerName] : []
                )),
            );
            for (let index = 0; index < AD_RECRUIT_COUNT; index += 1) {
                const lowQualityProtectionActive = index < availableLowQualityProtection;
                const card = this.createRecruitedCard(
                    lowQualityProtectionActive,
                    excludedSourceNames,
                    index < probabilityBoost10DrawCount,
                    index < probabilityBoost5DrawCount,
                );
                if (!card) {
                    throw new Error('Failed to create an ad recruitment result.');
                }
                cards.push(card);
                excludedSourceNames.add(card.sourcePlayerName);
                if (lowQualityProtectionActive) {
                    consumedLowQualityProtection += 1;
                }
            }
            for (let index = 0; index < consumedLowQualityProtection; index += 1) {
                consumeLowestRecruitmentQualityProtection();
            }
            if (probabilityBoost10DrawCount > 0) {
                consumeRecruitmentAdProbabilityBoost(
                    10,
                    Math.min(probabilityBoost10DrawCount, cards.length),
                );
            }
            if (probabilityBoost5DrawCount > 0) {
                consumeRecruitmentAdProbabilityBoost(
                    5,
                    Math.min(probabilityBoost5DrawCount, cards.length),
                );
            }

            this.queuedAdRecruitments = cards.map((card) => {
                recordPlayerAcquisitionWithKnowledgeReset(card);
                return {
                    card,
                    willpowerAdded: this.teamLevelController?.addRecruitWillpower() ?? 0,
                };
            });
            this.adTripleRecruitmentActive = true;
            this.autoDismissCount = 0;
            this.setAutoDismissBatchLocked(this.autoDismissEnabled);
            this.refreshBudgetView();
            await this.showNextAdRecruitmentResult();
        } catch (error) {
            console.error('[RecruitmentController] Ad triple recruitment failed.', error);
            this.queuedAdRecruitments = [];
            this.adTripleRecruitmentActive = false;
        } finally {
            if (!this.adTripleRecruitmentActive) {
                this.setAutoDismissBatchLocked(false);
                this.processing = false;
                this.restoreRecruitButtonVisual();
                this.refreshBudgetView();
            }
        }
    }

    private waitForPendingPlayerEvents(): Promise<void> {
        const playerEventController = this.node.getComponent(PlayerEventController)
            ?? this.node.parent?.getComponent(PlayerEventController)
            ?? null;
        if (!playerEventController) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            if (!playerEventController.runAfterPendingEvents(resolve)) {
                resolve();
            }
        });
    }

    private async showNextAdRecruitmentResult(): Promise<void> {
        await this.showNextQueuedRecruitmentResult(
            this.queuedAdRecruitments,
            () => this.finishAdTripleRecruitment(),
        );
    }

    private async showNextContinuousRecruitmentResult(): Promise<void> {
        await this.showNextQueuedRecruitmentResult(
            this.queuedContinuousRecruitments,
            () => this.finishContinuousRecruitment(),
        );
    }

    private async showNextQueuedRecruitmentResult(
        queue: QueuedRecruitmentResult[],
        finish: () => void,
    ): Promise<void> {
        const paced = this.autoDismissEnabled;
        const initialAutoDismissCount = this.autoDismissCount;
        let nextStepAtMs = Date.now();
        const showAtMs = nextStepAtMs + AUTO_DISMISS_SEGMENT_SECONDS * 1000;
        if (paced) {
            this.setAutoDismissBatchLocked(true);
            this.refreshBudgetView();
        }
        while (queue.length > 0) {
            if (paced) {
                const decision = this.getCurrentRecruitmentDecision();
                // 只预估下一张可展示结果的位置，不提前移除后续球员或累计计数。
                const visibleIndex = queue.findIndex((result) => !this.shouldAutoDismiss(result.card, decision));
                const remainingSteps = visibleIndex < 0 ? queue.length : visibleIndex + 1;
                // 按绝对时间推进，抵消逐次等待产生的帧误差；全解雇时预留最终计数的展示时间。
                const stepsEndAtMs = showAtMs - (visibleIndex < 0 ? AUTO_DISMISS_FINAL_COUNT_HOLD_SECONDS * 1000 : 0);
                nextStepAtMs += Math.max(0, stepsEndAtMs - nextStepAtMs) / remainingSteps;
                const delay = Math.max(0, nextStepAtMs - Date.now()) / 1000;
                if (delay > 0) {
                    await this.waitForSeconds(delay);
                }
                if (!this.isValid || !this.enabledInHierarchy) {
                    return;
                }
            }
            const next = queue[0];
            let decision = this.getCurrentRecruitmentDecision();
            if (paced && !this.shouldAutoDismiss(next.card, decision)) {
                // 若等待期间阵容发生变化、提前遇到可保留球员，仍等到本段的 1.5 秒再展示。
                const remainingSeconds = Math.max(0, showAtMs - Date.now()) / 1000;
                if (remainingSeconds > 0) {
                    await this.waitForSeconds(remainingSeconds);
                    if (!this.isValid || !this.enabledInHierarchy) {
                        return;
                    }
                    decision = this.getCurrentRecruitmentDecision();
                }
            }
            queue.shift();
            if (this.shouldAutoDismiss(next.card, decision)) {
                this.autoDismissCount += 1;
                this.refreshContinuousRecruitLabel();
                continue;
            }
            this.pendingCard = next.card;
            this.pendingWillpowerAdded = next.willpowerAdded;
            this.upgradeAdProcessing = false;
            this.pendingUpgradeAdUsed = false;
            this.pendingDecision = decision;
            await this.showRecruitmentResult(next.card, decision, next.willpowerAdded);
            return;
        }
        if (paced && this.autoDismissCount > initialAutoDismissCount) {
            // 让最后一个数字真正显示出来，不能在同一帧被默认招募提示覆盖。
            await this.waitForSeconds(Math.max(
                AUTO_DISMISS_FINAL_COUNT_HOLD_SECONDS,
                (showAtMs - Date.now()) / 1000,
            ));
            if (!this.isValid || !this.enabledInHierarchy) {
                return;
            }
        }
        finish();
    }

    private setAutoDismissBatchLocked(locked: boolean): void {
        this.autoDismissBatchLocked = locked;
        const canvas = this.resultPage?.parent;
        if (locked && canvas) {
            if (!this.recruitmentInputBlocker) {
                const blocker = new Node('自动解雇输入锁');
                blocker.layer = canvas.layer;
                canvas.addChild(blocker);
                blocker.addComponent(UITransform);
                blocker.addComponent(BlockInputEvents);
                this.recruitmentInputBlocker = blocker;
            }
            const canvasTransform = canvas.getComponent(UITransform)!;
            const transform = this.recruitmentInputBlocker.getComponent(UITransform)!;
            transform.setContentSize(canvasTransform.contentSize);
            transform.setAnchorPoint(canvasTransform.anchorPoint);
            // 结果展示时会自行移到最上层；其余界面一直锁到整轮结算完。
            this.recruitmentInputBlocker.setSiblingIndex(canvas.children.length - 1);
        }
        if (this.recruitmentInputBlocker?.isValid) {
            this.recruitmentInputBlocker.active = locked;
        }
    }

    private async showRecruitmentResultAfterDelay(
        card: PlayerCard,
        decision: RecruitmentResultDecision,
        willpowerAdded: number,
    ): Promise<void> {
        await this.waitForSeconds(RECRUITING_DELAY_SECONDS);
        await this.showRecruitmentResult(card, decision, willpowerAdded);
    }

    private getCurrentRecruitmentDecision(): RecruitmentResultDecision {
        this.roster = loadRoster(this.rosterSlots.length);
        return evaluateRecruitmentResult(
            this.roster.map((player) => player?.overall ?? null),
        );
    }

    private refreshAutoDismissLabel(): void {
        if (this.autoDismissLabel) {
            this.autoDismissLabel.string = this.autoDismissEnabled
                ? '长按2秒关闭自动解雇'
                : this.autoDismissDefaultText;
        }
    }

    private onDismissTouchStart(): void {
        this.stopDismissHold();
        this.suppressNextDismissClick = false;
        if (!this.dismissButton?.interactable || !this.resultPage?.activeInHierarchy
            || this.resultPageClosing || !this.pendingCard) {
            return;
        }
        const transform = this.dismissButton.node.getComponent(UITransform);
        if (transform) {
            if (!this.dismissHoldFill) {
                const fillNode = new Node('自动解雇长按进度');
                fillNode.active = false;
                fillNode.layer = this.dismissButton.node.layer;
                this.dismissButton.node.addChild(fillNode);
                fillNode.setSiblingIndex(0);
                fillNode.addComponent(UITransform);
                this.dismissHoldFill = fillNode.addComponent(Graphics);
                this.dismissHoldFill.fillColor = new Color(48, 220, 170, 150);
            }
            const fillTransform = this.dismissHoldFill.node.getComponent(UITransform)!;
            fillTransform.setContentSize(transform.contentSize);
            fillTransform.setAnchorPoint(transform.anchorPoint);
            this.dismissHoldFill.clear();
            this.dismissHoldFill.node.active = true;
        }
        this.dismissHoldStartedAtMs = Date.now();
    }

    private updateDismissHoldProgress(): void {
        if (!this.dismissHoldStartedAtMs) {
            return;
        }
        if (!this.dismissButton?.interactable || !this.resultPage?.activeInHierarchy
            || this.resultPageClosing) {
            this.stopDismissHold();
            return;
        }
        const progress = Math.min(1,
            (Date.now() - this.dismissHoldStartedAtMs) / (AUTO_DISMISS_HOLD_SECONDS * 1000));
        if (this.dismissHoldFill) {
            const transform = this.dismissHoldFill.node.getComponent(UITransform)!;
            this.dismissHoldFill.clear();
            this.dismissHoldFill.rect(
                -transform.width * transform.anchorX + 6,
                -transform.height * transform.anchorY + 6,
                Math.max(0, transform.width - 12) * progress,
                Math.max(0, transform.height - 12),
            );
            this.dismissHoldFill.fill();
        }
        if (progress >= 1) {
            this.dismissHoldStartedAtMs = 0;
            this.suppressNextDismissClick = true;
            this.autoDismissEnabled = !this.autoDismissEnabled;
            setRecruitmentAutoDismissEnabled(this.autoDismissEnabled);
            this.refreshAutoDismissLabel();
            if (this.autoDismissEnabled) {
                if (this.continuousRecruitmentActive || this.adTripleRecruitmentActive) {
                    this.autoDismissCount += 1;
                    this.setAutoDismissBatchLocked(true);
                    this.refreshBudgetView();
                }
                this.closeResultPage('dissolve');
            }
            this.refreshContinuousRecruitLabel();
        }
    }

    private onDismissTouchMove(event: EventTouch): void {
        const transform = this.dismissButton?.node.getComponent(UITransform);
        if (event.touch && transform && !transform.hitTest(event.touch.getLocation(), event.windowId)) {
            this.onDismissTouchCancel();
        }
    }

    private onDismissTouchEnd(): void {
        this.updateDismissHoldProgress();
        this.stopDismissHold();
    }

    private onDismissTouchCancel(): void {
        this.stopDismissHold();
        this.suppressNextDismissClick = true;
    }

    private stopDismissHold(): void {
        this.dismissHoldStartedAtMs = 0;
        if (this.dismissHoldFill?.isValid) {
            this.dismissHoldFill.node.active = false;
        }
    }

    private shouldAutoDismiss(card: PlayerCard, decision: RecruitmentResultDecision): boolean {
        if (this.isGoat(card)) {
            return false;
        }
        if (!this.autoDismissEnabled || (!this.continuousRecruitmentActive && !this.adTripleRecruitmentActive)
            || decision.mode !== 'replace' || decision.targetIndex === null) {
            return false;
        }
        const replacedPlayer = this.roster[decision.targetIndex];
        return Boolean(replacedPlayer && card.qualityId < replacedPlayer.qualityId);
    }

    private onDismissClicked(): void {
        if (this.suppressNextDismissClick) {
            this.suppressNextDismissClick = false;
            return;
        }
        if (
            this.resultPageClosing
            || !this.pendingCard
            || this.pendingDecision?.mode === 'empty-slot'
        ) {
            return;
        }
        this.closeResultPage('dissolve');
    }

    private onReplaceClicked(): void {
        if (this.resultPageClosing) {
            return;
        }
        const card = this.pendingCard;
        const targetIndex = this.pendingDecision?.targetIndex;
        if (!card || targetIndex === null || targetIndex === undefined) {
            return;
        }

        this.replaceButton!.interactable = false;
        // 扣除招募预算后，球员事件可能在结果页展示期间异步写入存档。
        // 保存上阵结果前重读阵容，避免用旧缓存覆盖刚产生的 pendingEvent。
        this.roster = loadRoster(this.rosterSlots.length);
        card.lineupSinceMs = Date.now();
        this.roster[targetIndex] = card;
        saveRoster(this.roster);
        this.applyCardToSlot(this.rosterSlots[targetIndex], card, true);
        this.topTeamInfoController?.refreshOverallFromRoster();
        this.refreshCourtSimulation();
        this.closeResultPage('fade');
    }

    private onUpgradeAdClicked(): void {
        void this.upgradePendingCardFromAd();
    }

    private async upgradePendingCardFromAd(): Promise<void> {
        const card = this.pendingCard;
        if (
            !card
            || !this.pendingDecision
            || this.resultPageClosing
            || !this.conceptGodUpgradeConfig
            || this.upgradeAdProcessing
            || this.pendingUpgradeAdUsed
            || !this.canUpgradeFromAd(card)
        ) {
            return;
        }

        this.upgradeAdProcessing = true;
        this.dismissButton!.interactable = false;
        this.replaceButton!.interactable = false;
        this.refreshUpgradeAdButton(card, true);
        try {
            const completed = await showRewardedVideo({
                wechat: this.wechatRewardedAdUnitId,
                tapTap: this.tapRewardedAdUnitId,
            });
            if (!completed || this.pendingCard !== card || !this.isValid
                || !this.resultPage?.activeInHierarchy || this.resultPageClosing) {
                return;
            }

            this.pendingUpgradeAdUsed = true;
            const previousQuality = card.qualityId;
            const upgraded = this.isConceptGod(card)
                ? this.upgradeRandomAttribute(card)
                : this.isGoat(card)
                    ? this.canBecomeConceptGod(card)
                        ? this.upgradeGoatToConceptGod(card)
                        : this.upgradeGoatOverall(card)
                    : this.upgradeNormalQuality(card);
            if (!upgraded) {
                this.pendingUpgradeAdUsed = false;
                return;
            }

            this.pendingDecision = this.getCurrentRecruitmentDecision();
            const refreshVisuals = () => this.showRecruitmentResult(
                card, this.pendingDecision!, this.pendingWillpowerAdded, false,
            );
            const portraitRoot = this.resultPage?.getChildByName('球员头像');
            if (portraitRoot && card.qualityId !== previousQuality) {
                const reveal = portraitRoot.getComponent(PortraitUpgradeReveal)
                    ?? portraitRoot.addComponent(PortraitUpgradeReveal);
                await reveal.play(refreshVisuals);
            } else {
                await refreshVisuals();
            }
        } finally {
            this.upgradeAdProcessing = false;
            if (this.isValid && this.resultPage?.activeInHierarchy && this.pendingCard && this.pendingDecision) {
                this.restoreResultButtons(this.pendingDecision);
                this.refreshUpgradeAdButton(this.pendingCard);
            }
        }
    }

    private upgradeNormalQuality(card: PlayerCard): boolean {
        if (!this.ovrConfig || !this.playerConfig) {
            return false;
        }
        const currentRange = this.ovrConfig.ranges.find(
            (range) => range.qualityId === card.qualityId,
        );
        const nextRange = this.getNextNormalQualityRange(card.qualityId);
        if (!currentRange || !nextRange) {
            return false;
        }

        const currentSpan = Math.max(1, currentRange.maxOvr - currentRange.minOvr);
        const percentile = Math.min(
            1,
            Math.max(0, (card.overall - currentRange.minOvr) / currentSpan),
        );
        const nextOverall = Math.round(
            nextRange.minOvr
            + percentile * (nextRange.maxOvr - nextRange.minOvr),
        );
        const nextTemplate = this.playerConfig.players.find((template) => {
            return template.sourcePlayerName === card.sourcePlayerName
                && template.quality === nextRange.qualityId;
        });

        card.templateId = nextTemplate?.id ?? card.templateId;
        card.qualityId = nextRange.qualityId;
        card.qualityName = nextRange.qualityName;
        card.overall = nextOverall;
        card.attributes = this.allocateAttributes(nextOverall, card.attributes);
        return true;
    }

    private upgradeGoatToConceptGod(card: PlayerCard): boolean {
        const config = this.conceptGodUpgradeConfig;
        const goatRange = this.ovrConfig?.ranges.find(
            (range) => range.qualityId === config?.quality.goatQualityId,
        );
        const definition = this.selectConceptGodDefinition(card);
        if (!config || !goatRange || !definition || !this.canBecomeConceptGod(card)) {
            return false;
        }

        const cumulativeCount = recordConceptGodAcquisition();
        const multiplier = 1 + 0.01 * cumulativeCount;
        const minOvr = Math.floor(goatRange.minOvr * multiplier);
        const maxOvr = Math.floor(goatRange.maxOvr * multiplier);
        const conceptOverall = Math.max(card.overall, this.rollOverall(minOvr, maxOvr));

        card.qualityId = config.quality.conceptGodQualityId;
        card.qualityName = config.quality.conceptGodQualityName;
        card.isConceptGod = true;
        card.conceptGodId = definition.conceptGodId;
        card.displayName = definition.displayName;
        card.overall = conceptOverall;
        card.attributes = this.allocateAttributes(conceptOverall, card.attributes);
        return true;
    }

    private migrateRosterDisplayNames(): void {
        if (!this.playerConfig) {
            return;
        }
        let changed = false;
        for (const card of this.roster) {
            if (!card) {
                continue;
            }
            if (this.isConceptGod(card)) {
                const definition = this.selectConceptGodDefinition(card);
                const config = this.conceptGodUpgradeConfig;
                if (!definition || !config) {
                    continue;
                }
                if (
                    !card.isConceptGod
                    || card.conceptGodId !== definition.conceptGodId
                    || card.displayName !== definition.displayName
                    || card.qualityId !== config.quality.conceptGodQualityId
                    || card.qualityName !== config.quality.conceptGodQualityName
                ) {
                    card.isConceptGod = true;
                    card.conceptGodId = definition.conceptGodId;
                    card.displayName = definition.displayName;
                    card.qualityId = config.quality.conceptGodQualityId;
                    card.qualityName = config.quality.conceptGodQualityName;
                    changed = true;
                }
                continue;
            }
            // Generated template IDs are position-based and can change when a
            // player pool is rebuilt. The source player plus quality is the
            // stable identity for an already-owned card.
            const template = this.playerConfig.players.find((candidate) => {
                return candidate.sourcePlayerName === card.sourcePlayerName
                    && candidate.quality === card.qualityId;
            });
            const displayName = template?.displayName;
            if (!template || !displayName) {
                continue;
            }
            if (
                card.templateId !== template.id
                || card.displayName !== displayName
                || card.position !== template.position
                || card.qualityName !== template.qualityName
            ) {
                card.templateId = template.id;
                card.displayName = displayName;
                card.position = template.position;
                card.qualityName = template.qualityName;
                changed = true;
            }
        }
        if (changed) {
            saveRoster(this.roster);
        }
    }

    private upgradeGoatOverall(card: PlayerCard): boolean {
        const config = this.conceptGodUpgradeConfig?.goatOverallUpgrade;
        if (!config || card.overall >= config.integerMaximum) {
            return false;
        }
        const previousOverall = card.overall;
        card.overall = Math.min(
            config.integerMaximum,
            Math.round(previousOverall * (1 + config.increasePercent)),
        );
        return card.overall > previousOverall;
    }

    private upgradeRandomAttribute(card: PlayerCard): boolean {
        const config = this.conceptGodUpgradeConfig?.attributeUpgrade;
        if (!config) {
            return false;
        }
        const upgradeableKeys = ATTRIBUTE_KEYS.filter((key) => {
            return card.attributes[key] < config.integerMaximum;
        });
        if (upgradeableKeys.length === 0) {
            return false;
        }
        const key = upgradeableKeys[
            Math.floor(Math.random() * upgradeableKeys.length)
        ];
        const previousValue = Math.max(0, card.attributes[key]);
        const increase = Math.max(
            config.minimumIncrease,
            Math.ceil(previousValue * config.increasePercent),
        );
        const nextValue = Math.min(
            config.integerMaximum,
            previousValue + increase,
        );
        card.attributes[key] = nextValue;
        card.overall = Math.min(
            config.integerMaximum,
            card.overall + nextValue - previousValue,
        );
        return nextValue > previousValue;
    }

    private getNextNormalQualityRange(qualityId: number): OvrRange | null {
        return this.ovrConfig?.ranges
            .filter((range) => range.qualityId > qualityId)
            .sort((left, right) => left.qualityId - right.qualityId)[0] ?? null;
    }

    private isGoat(card: PlayerCard): boolean {
        return card.qualityId
            === this.conceptGodUpgradeConfig?.quality.goatQualityId;
    }

    private isConceptGod(card: PlayerCard): boolean {
        const config = this.conceptGodUpgradeConfig;
        return Boolean(
            card.isConceptGod
            || (
                config
                && (
                    card.qualityId === config.quality.conceptGodQualityId
                    || card.qualityName === config.quality.conceptGodQualityName
                )
            ),
        );
    }

    private canBecomeConceptGod(card: PlayerCard): boolean {
        return Boolean(
            this.isGoat(card)
            && isConceptGodUpgradeUnlocked()
            && this.conceptGodUpgradeConfig?.eligibleSourcePlayerNames
                .includes(card.sourcePlayerName)
            && this.getConceptGodDefinitions(card).length > 0,
        );
    }

    private getConceptGodDefinitions(card: PlayerCard): ConceptGodDefinition[] {
        return this.conceptGodUpgradeConfig
            ?.conceptGodDefinitions[card.sourcePlayerName] ?? [];
    }

    private selectConceptGodDefinition(card: PlayerCard): ConceptGodDefinition | null {
        const definitions = this.getConceptGodDefinitions(card);
        if (definitions.length === 0) {
            return null;
        }
        const existing = definitions.find(
            (definition) => definition.conceptGodId === card.conceptGodId,
        );
        if (existing) {
            return existing;
        }
        return definitions[this.stableIndex(card.instanceId, definitions.length)];
    }

    private stableIndex(value: string, count: number): number {
        let hash = 0;
        for (let index = 0; index < value.length; index += 1) {
            hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
        }
        return hash % count;
    }

    private canUpgradeAttribute(card: PlayerCard): boolean {
        const maximum = this.conceptGodUpgradeConfig
            ?.attributeUpgrade.integerMaximum;
        if (maximum === undefined || !Number.isFinite(maximum)) {
            return false;
        }
        return ATTRIBUTE_KEYS.some((key) => card.attributes[key] < maximum);
    }

    private canUpgradeFromAd(card: PlayerCard): boolean {
        if (this.isConceptGod(card)) {
            return this.canUpgradeAttribute(card);
        }
        if (this.isGoat(card)) {
            const config = this.conceptGodUpgradeConfig?.goatOverallUpgrade;
            return this.canBecomeConceptGod(card)
                || Boolean(config && card.overall < config.integerMaximum);
        }
        return Boolean(this.getNextNormalQualityRange(card.qualityId));
    }

    private refreshUpgradeAdButton(
        card: PlayerCard,
        forceDisabled = false,
    ): void {
        const config = this.conceptGodUpgradeConfig;
        if (!this.upgradeAdButton || !this.upgradeAdButtonLabel || !config) {
            return;
        }

        const canUpgrade = this.canUpgradeFromAd(card);
        let buttonLabel: string;
        if (this.isConceptGod(card)) {
            buttonLabel = config.frontend.attributeButtonLabel;
        } else if (this.isGoat(card)) {
            buttonLabel = this.canBecomeConceptGod(card)
                ? config.frontend.eligibleGoatButtonLabel
                : config.frontend.ineligibleGoatButtonLabel;
        } else {
            buttonLabel = config.frontend.normalQualityButtonLabel;
        }
        this.upgradeAdButtonLabel.string = isWechatSharePlatform()
            ? `分享${buttonLabel}`
            : buttonLabel;

        this.upgradeAdButton.interactable = canUpgrade
            && !forceDisabled
            && !this.upgradeAdProcessing
            && !this.pendingUpgradeAdUsed;
        const buttonSprite = this.upgradeAdButton.target?.getComponent(Sprite);
        if (buttonSprite) {
            buttonSprite.grayscale = !this.upgradeAdButton.interactable;
        }
    }

    private restoreResultButtons(decision: RecruitmentResultDecision): void {
        this.dismissButton!.interactable = decision.mode !== 'empty-slot';
        this.replaceButton!.interactable = decision.mode !== 'dismiss-only';
    }

    private createRecruitedCard(
        lowQualityProtectionActive = false,
        excludedSourceNames: ReadonlySet<string> = new Set<string>(),
        probabilityBoost10Active = false,
        probabilityBoost5Active = false,
    ): PlayerCard | null {
        if (!this.playerConfig || !this.ovrConfig || !this.probabilityConfig) {
            return null;
        }

        const draw = this.drawQualityId(
            lowQualityProtectionActive,
            probabilityBoost10Active,
            probabilityBoost5Active,
        );
        const teamLevel = this.teamLevelController?.getSnapshot()?.teamLevel ?? getStoredTeamLevel();
        const allowDuplicatePlayers = isCheatModeEnabled() || teamLevel > 80;
        const recruitedSourceNames = allowDuplicatePlayers
            ? new Set<string>()
            : new Set(
                loadRoster(this.rosterSlots.length).flatMap((card) => (
                    card ? [card.sourcePlayerName] : []
                )),
            );
        const pool = this.playerConfig.players.filter((player) => (
            player.quality === draw.qualityId
            && !recruitedSourceNames.has(player.sourcePlayerName)
            && (allowDuplicatePlayers || !excludedSourceNames.has(player.sourcePlayerName))
        ));
        const range = this.ovrConfig.ranges.find((item) => item.qualityId === draw.qualityId);
        if (pool.length === 0 || !range) {
            console.error('[RecruitmentController] Empty player pool or missing OVR range.', draw.qualityId);
            return null;
        }

        if (draw.adHighestQualityPityApplied) {
            consumeRecruitmentAdHighestQualityPity();
        }

        if (draw.secondHighestQualityId !== null) {
            recordRecruitmentUpperQualityPityResult(
                draw.qualityId >= draw.secondHighestQualityId,
            );
        }
        const template = pool[Math.floor(Math.random() * pool.length)];
        const overall = this.rollOverall(range.minOvr, range.maxOvr);
        const now = Date.now();
        return {
            instanceId: `recruit-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`,
            templateId: template.id,
            sourcePlayerName: template.sourcePlayerName,
            displayName: template.displayName,
            position: template.position,
            qualityId: template.quality,
            qualityName: template.qualityName,
            overall,
            attributes: this.allocateAttributes(overall, template.attributes),
            acquiredAtMs: now,
            lineupSinceMs: null,
        };
    }

    private drawQualityId(
        lowQualityProtectionActive = false,
        probabilityBoost10Active = false,
        probabilityBoost5Active = false,
    ): RecruitmentQualityDraw {
        const snapshot = this.teamLevelController?.getSnapshot();
        const marketValueLevel = snapshot?.marketValueLevel
            ?? getStoredMarketValueLevel();
        const levelConfig = resolveRecruitmentWindow(
            this.probabilityConfig!,
            marketValueLevel,
            loadSeasonState(),
        );
        if (!levelConfig) {
            console.error('[RecruitmentController] Missing recruitment window.', marketValueLevel);
            return {
                qualityId: 3,
                secondHighestQualityId: null,
                adHighestQualityPityApplied: false,
            };
        }

        const sortedRecruitableQualityIds = [...levelConfig.recruitableQualityIds]
            .sort((left, right) => left - right);
        const secondHighestQualityId = sortedRecruitableQualityIds[
            sortedRecruitableQualityIds.length - 2
        ] ?? null;
        const highestQualityId = sortedRecruitableQualityIds[
            sortedRecruitableQualityIds.length - 1
        ] ?? 3;
        if (
            getRecruitmentAdHighestQualityPityCount()
                >= RECRUITMENT_AD_HIGHEST_QUALITY_PITY_LIMIT
        ) {
            return {
                qualityId: highestQualityId,
                secondHighestQualityId,
                adHighestQualityPityApplied: true,
            };
        }
        if (isCheatModeEnabled()) {
            return {
                qualityId: highestQualityId,
                secondHighestQualityId,
                adHighestQualityPityApplied: false,
            };
        }
        if (
            secondHighestQualityId !== null
            && getRecruitmentUpperQualityPityMissCount()
                >= RECRUITMENT_UPPER_QUALITY_PITY_MISS_LIMIT
        ) {
            return {
                qualityId: secondHighestQualityId,
                secondHighestQualityId,
                adHighestQualityPityApplied: false,
            };
        }

        const weights = resolveRecruitmentQualityWeights(
            this.probabilityConfig!,
            levelConfig,
            this.managementEffects.scoutingDirectorHighestQualityWeightBonus,
            lowQualityProtectionActive ? 1 : 0,
            probabilityBoost10Active,
            probabilityBoost5Active,
        );
        const weightedQualities = this.probabilityConfig!.qualities
            .map((quality, index) => ({
                qualityId: quality.qualityId,
                weight: Math.max(0, weights[index] ?? 0),
            }))
            .filter((item) => item.weight > 0);
        const totalWeight = weightedQualities.reduce((total, item) => total + item.weight, 0);
        let roll = Math.random() * totalWeight;
        for (const item of weightedQualities) {
            roll -= item.weight;
            if (roll <= 0) {
                return {
                    qualityId: item.qualityId,
                    secondHighestQualityId,
                    adHighestQualityPityApplied: false,
                };
            }
        }
        return {
            qualityId: weightedQualities[weightedQualities.length - 1]?.qualityId ?? 3,
            secondHighestQualityId,
            adHighestQualityPityApplied: false,
        };
    }

    private allocateAttributes(overall: number, template: PlayerAttributes): PlayerAttributes {
        const weights = ATTRIBUTE_KEYS.map((key) => Math.max(0, template[key] ?? 0));
        const totalWeight = weights.reduce((total, value) => total + value, 0);
        const effectiveWeights = totalWeight > 0
            ? weights
            : ATTRIBUTE_KEYS.map(() => 1);
        const effectiveTotal = effectiveWeights.reduce((total, value) => total + value, 0);
        const rawValues = effectiveWeights.map((weight) => overall * weight / effectiveTotal);
        const values = rawValues.map(Math.floor);
        let remainder = overall - values.reduce((total, value) => total + value, 0);
        const remainderOrder = rawValues
            .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
            .sort((a, b) => b.fraction - a.fraction);
        for (let index = 0; index < remainder; index += 1) {
            values[remainderOrder[index % remainderOrder.length].index] += 1;
        }

        return {
            scoring: values[0],
            rebound: values[1],
            assist: values[2],
            steal: values[3],
            block: values[4],
        };
    }

    private async showRecruitmentResult(
        card: PlayerCard,
        decision: RecruitmentResultDecision,
        willpowerAdded: number,
        playEntrance = true,
    ): Promise<void> {
        this.resultPageClosing = false;
        this.stopDismissHold();
        this.suppressNextDismissClick = false;
        if (playEntrance) {
            // 单抽始终展示；连招的自动解雇已在顺序队列中处理。
            decision = this.getCurrentRecruitmentDecision();
            this.pendingDecision = decision;
        }
        const [
            portrait,
            background,
            wheat,
            frame,
            nameplate,
            qualityBadge,
            positionBadge,
            playerKnowledge,
        ] = await Promise.all([
            loadPlayerPortrait(card),
            loadRecruitmentBackground(card.qualityId),
            loadQualityWheat(card.qualityId),
            loadQualityFrame(card.qualityId),
            loadQualityNameplate(card.qualityId),
            loadQualityBadge(card.qualityId),
            loadQualityPosition(card.qualityId),
            loadPlayerKnowledgeConfig().catch((error) => {
                console.error('[RecruitmentController] Failed to load player profile.', error);
                return null;
            }),
        ]);

        this.candidatePortrait!.spriteFrame = portrait;
        if (background && this.recruitBackground) {
            this.recruitBackground.spriteFrame = background;
        }
        if (wheat) {
            this.wheatSprites.forEach((sprite) => {
                sprite.spriteFrame = wheat;
            });
        }
        if (frame && this.candidateFrame) {
            this.candidateFrame.spriteFrame = frame;
        }
        if (nameplate && this.candidateNameplate) {
            this.candidateNameplate.spriteFrame = nameplate;
        }
        if (qualityBadge && this.candidateQualityBadge) {
            this.candidateQualityBadge.spriteFrame = qualityBadge;
        }
        if (positionBadge && this.candidatePositionBadge) {
            this.candidatePositionBadge.spriteFrame = positionBadge;
        }
        applyPlayerQualityVisuals(
            this.resultPage?.getChildByName('球员头像') ?? null,
            card.qualityId,
        );
        applyOverallNumberQuality(this.candidateOverallLabel, card.qualityId);

        this.candidateNameLabel!.string = card.displayName;
        this.candidateQualityLabel!.string = card.qualityName;
        this.candidatePositionLabel!.string = card.position;
        const conceptDefinition = this.isConceptGod(card)
            ? this.selectConceptGodDefinition(card)
            : null;
        if (this.candidateProfileTitleLabel) {
            this.candidateProfileTitleLabel.string = conceptDefinition ? '这无敌了吧' : '球员资料';
        }
        if (this.candidateProfileLabel) {
            this.candidateProfileLabel.string = conceptDefinition?.lore ?? formatPlayerProfile(
                playerKnowledge?.players[card.sourcePlayerName]?.profile,
                RECRUITMENT_PROFILE_HONOR_LIMIT,
            );
        }
        setGrowingNumber(
            this.candidateOverallLabel,
            card.overall,
            (value) => formatPlayerOverall(Math.floor(value)),
            {
                animateGrowth: !playEntrance,
                duration: 0.55,
                onComplete: playEntrance
                    ? undefined
                    : () => triggerOverallNumberQualityImpact(
                        this.candidateOverallLabel,
                        card.qualityId,
                    ),
            },
        );
        this.willpowerTextLabel && (this.willpowerTextLabel.string = '招募获得      斗志');
        setGrowingNumber(
            this.willpowerValueLabel,
            willpowerAdded,
            (value) => String(Math.floor(value)),
            {
                animateGrowth: playEntrance,
                from: playEntrance ? 0 : undefined,
            },
        );
        const resultParent = this.resultPage!.parent;
        if (resultParent) {
            this.resultPage!.setSiblingIndex(resultParent.children.length - 1);
        }
        const replacedPlayer = decision.mode === 'replace' && decision.targetIndex !== null
            ? this.roster[decision.targetIndex]
            : null;
        this.replacementPanel!.active = Boolean(replacedPlayer);
        if (replacedPlayer) {
            this.replacedNameLabel && (this.replacedNameLabel.string = replacedPlayer.displayName);
            const replacementRoster = this.roster.map((player, index) => {
                return index === decision.targetIndex ? card : player;
            });
            const currentTeamOverall = calculateTeamOverall(
                this.roster,
                this.managementEffects.headCoachBattleOvrBonus,
            );
            const replacementTeamOverall = calculateTeamOverall(
                replacementRoster,
                this.managementEffects.headCoachBattleOvrBonus,
            );
            const overallDifference = replacementTeamOverall - currentTeamOverall;
            if (this.overallIncreaseValueLabel) {
                const sign = overallDifference < 0 ? '-' : '+';
                setGrowingNumber(
                    this.overallIncreaseValueLabel,
                    Math.abs(overallDifference),
                    (value) => `${sign}${formatPlayerOverall(Math.floor(value))}`,
                    {
                        animateGrowth: playEntrance,
                        from: playEntrance ? 0 : undefined,
                    },
                );
                this.overallIncreaseValueLabel.color = overallDifference < 0
                    ? NEGATIVE_OVERALL_COLOR
                    : this.overallIncreaseValueDefaultColor ?? Color.WHITE;
            }
            this.replacedSlot!.setup(
                replacedPlayer.overall,
                replacedPlayer.qualityId,
                await loadPlayerPortrait(replacedPlayer),
            );
        }

        const dismissInteractable = decision.mode !== 'empty-slot';
        const replaceInteractable = decision.mode !== 'dismiss-only';
        this.dismissButton!.interactable = false;
        this.replaceButton!.interactable = false;
        if (this.upgradeAdButton) {
            this.upgradeAdButton.interactable = false;
        }
        this.replaceButtonLabel!.string = decision.mode === 'empty-slot' ? '上阵' : '替换上阵';
        this.refreshUpgradeAdButton(card, true);
        if (playEntrance) {
            gameAudio.playVictory();
            await playFullScreenEntrance(this.resultPage!, {
                speedMultiplier: this.getResultPageSpeedMultiplier(),
            });
            triggerOverallNumberQualityImpact(
                this.candidateOverallLabel,
                card.qualityId,
            );
        }
        this.dismissButton!.interactable = dismissInteractable && !this.upgradeAdProcessing;
        this.replaceButton!.interactable = replaceInteractable && !this.upgradeAdProcessing;
        this.refreshUpgradeAdButton(card);
    }

    private showRecruitingButtonVisual(): void {
        if (
            !this.recruitButton
            || !this.recruitButtonTargetSprite
            || !this.recruitingButtonSprite
        ) {
            return;
        }
        this.recruitButton.transition = Button.Transition.NONE;
        this.recruitButtonTargetSprite.spriteFrame = this.recruitingButtonSprite;
    }

    private restoreRecruitButtonVisual(): void {
        if (!this.recruitButton || !this.recruitButtonTargetSprite) {
            return;
        }
        if (this.recruitButtonNormalSprite) {
            this.recruitButtonTargetSprite.spriteFrame = this.recruitButtonNormalSprite;
        }
        this.recruitButton.transition = this.recruitButtonTransition;
    }

    private waitForSeconds(seconds: number): Promise<void> {
        return new Promise((resolve) => {
            this.scheduleOnce(resolve, seconds);
        });
    }

    private closeResultPage(mode: 'dissolve' | 'fade'): void {
        if (this.resultPageClosing) {
            return;
        }
        this.resultPageClosing = true;
        this.stopDismissHold();
        if (this.dismissButton) {
            this.dismissButton.interactable = false;
        }
        if (this.replaceButton) {
            this.replaceButton.interactable = false;
        }
        if (this.upgradeAdButton) {
            this.upgradeAdButton.interactable = false;
        }
        if (mode === 'dissolve' && this.resultPage?.active && this.dissolveEffectAsset) {
            this.dissolveResultPage();
            return;
        }
        // fade out
        if (this.resultPage?.active) {
            void exitWithFade(
                this.resultPage,
                this.getResultPageSpeedMultiplier(),
            ).then(() => {
                this.finishCloseResultPage();
            });
        } else {
            this.finishCloseResultPage();
        }
    }

    private finishCloseResultPage(): void {
        this.resultPage!.active = false;
        if (this.upgradeAdButton) {
            this.upgradeAdButton.interactable = false;
        }
        this.pendingCard = null;
        this.pendingDecision = null;
        this.pendingWillpowerAdded = 0;
        this.upgradeAdProcessing = false;
        this.pendingUpgradeAdUsed = false;
        if (this.adTripleRecruitmentActive) {
            if (this.queuedAdRecruitments.length > 0) {
                this.scheduleOnce(() => {
                    void this.showNextAdRecruitmentResult().catch((error) => {
                        console.error(
                            '[RecruitmentController] Failed to show queued recruitment result.',
                            error,
                        );
                        this.finishAdTripleRecruitment();
                    });
                });
                return;
            }
            this.finishAdTripleRecruitment();
            return;
        }
        if (this.continuousRecruitmentActive) {
            if (this.queuedContinuousRecruitments.length > 0) {
                this.scheduleOnce(() => {
                    void this.showNextContinuousRecruitmentResult().catch((error) => {
                        console.error(
                            '[RecruitmentController] Failed to show continuous recruitment result.',
                            error,
                        );
                        this.finishContinuousRecruitment();
                    });
                });
                return;
            }
            this.finishContinuousRecruitment();
        }
        this.refreshBudgetView();
    }

    // ---- Dissolve effect ----

    private getResultPageSpeedMultiplier(): number {
        if (!this.continuousRecruitmentActive) {
            return 1;
        }
        return this.continuousRecruitmentBatchCount > 30 ? 4 : 2;
    }

    private prepareDissolveMaterial(): Material {
        if (!this.dissolveMaterial) {
            const material = new Material();
            material.initialize({
                effectAsset: this.dissolveEffectAsset!,
                defines: { USE_TEXTURE: true },
            });
            material.setProperty('edgeColor', new Color(255, 160, 30, 255));
            this.dissolveMaterial = material;
        }
        return this.dissolveMaterial;
    }

    private dissolveResultPage(): void {
        const material = this.prepareDissolveMaterial();
        const sprites: Sprite[] = [];
        const originalMaterials: Array<Material | null> = [];
        const labels: { label: Label; originalColor: Color; fadeColor: Color }[] = [];

        // 所有图片的溶解参数相同，共用材质和参数，避免每次关闭逐图创建 GPU 资源。
        this.dissolveParams.x = 0;
        material.setProperty('dissolveParams', this.dissolveParams);

        this.collectSprites(this.resultPage!, (sprite) => {
            originalMaterials.push(sprite.customMaterial);
            sprite.customMaterial = material;
            sprites.push(sprite);
        });

        this.collectLabels(this.resultPage!, (label) => {
            labels.push({ label, originalColor: label.color.clone(), fadeColor: label.color.clone() });
        });

        const duration = 0.5 / this.getResultPageSpeedMultiplier();
        let elapsed = 0;
        const restore = (): void => {
            this.unschedule(tick);
            this.cancelDissolve = null;
            // 溶解只是临时材质，不能清掉 bg 等节点的常驻 Shader。
            sprites.forEach((sprite, index) => {
                if (sprite.isValid && sprite.customMaterial === material) {
                    const original = originalMaterials[index];
                    sprite.customMaterial = original?.isValid ? original : null;
                }
            });
            labels.forEach(({ label, originalColor }) => {
                if (label.isValid) label.color = originalColor;
            });
        };
        const tick = (deltaTime: number): void => {
            elapsed += deltaTime;
            const t = Math.min(elapsed / duration, 1);
            this.dissolveParams.x = t;
            material.setProperty('dissolveParams', this.dissolveParams);
            labels.forEach(({ label, originalColor, fadeColor }) => {
                if (!label.isValid) return;
                fadeColor.a = Math.round(originalColor.a * (1 - t));
                label.color = fadeColor;
            });
            if (t >= 1) {
                restore();
                this.finishCloseResultPage();
            }
        };
        this.cancelDissolve = restore;
        this.schedule(tick);
    }

    private collectLabels(node: Node, fn: (label: Label) => void): void {
        if (!node.activeInHierarchy) return;
        const label = node.getComponent(Label);
        if (label?.enabled && label.string.trim()) {
            fn(label);
        }
        for (const child of node.children) {
            this.collectLabels(child, fn);
        }
    }

    private collectSprites(node: Node, fn: (sprite: Sprite) => void): void {
        if (!node.activeInHierarchy) return;
        const sprite = node.getComponent(Sprite);
        if (sprite?.enabled && sprite.spriteFrame) {
            fn(sprite);
        }
        for (const child of node.children) {
            this.collectSprites(child, fn);
        }
    }

    private finishAdTripleRecruitment(): void {
        this.queuedAdRecruitments = [];
        this.adTripleRecruitmentActive = false;
        this.setAutoDismissBatchLocked(false);
        this.processing = false;
        this.restoreRecruitButtonVisual();
        this.refreshBudgetView();
    }

    private finishContinuousRecruitment(): void {
        const eventCheckCount = this.continuousRecruitmentEventCheckCount;
        this.continuousRecruitmentEventCheckCount = 0;
        this.queuedContinuousRecruitments = [];
        this.continuousRecruitmentActive = false;
        this.continuousRecruitmentBatchCount = 0;
        this.setAutoDismissBatchLocked(false);
        this.processing = false;
        this.restoreRecruitButtonVisual();
        this.resetContinuousRecruitLabel();
        this.refreshBudgetView();
        if (eventCheckCount > 0) {
            notifyValidOperationCompleted(eventCheckCount);
        }
    }

    private async refreshRosterSlots(): Promise<void> {
        await Promise.all(this.rosterSlots.map(async (slot, index) => {
            const card = this.roster[index] ?? null;
            if (!card) {
                slot.clear();
                return;
            }
            slot.setup(card.overall, card.qualityId, await loadPlayerPortrait(card));
        }));
    }

    private applyCardToSlot(
        slot: RosterSlotView,
        card: PlayerCard,
        highlightNewPlayer = false,
    ): void {
        slot.setup(card.overall, card.qualityId);
        void loadPlayerPortrait(card).then((portrait) => {
            slot.setPortrait(portrait);
            if (highlightNewPlayer) {
                slot.playNewPlayerHighlight();
            }
        });
    }

    private refreshCourtSimulation(): void {
        this.courtSimulationController?.refreshRosterBindings();
        this.courtSimulationController?.restartSimulation();
    }

    private refreshBudgetView(): void {
        setGrowingNumber(
            this.budgetLabel,
            Math.floor(this.budget),
            (value) => formatPlayerOverall(Math.floor(value))
                .replace(/\.00(?=[KMBTQ]$)/, ''),
        );
        if (this.recruitButton) {
            this.recruitButton.interactable = !this.autoDismissBatchLocked && (this.processing
                || (
                    this.ready
                    && !this.resultPage?.active
                ));
        }
        if (this.recruitButtonTargetSprite) {
            this.recruitButtonTargetSprite.grayscale = false;
        }
        if (!this.continuousRecruitHolding) {
            this.refreshContinuousRecruitLabel();
        }
    }

    private getBudgetRecruitmentCount(): number {
        const cost = this.getRecruitmentCost();
        if (!Number.isFinite(cost) || cost <= 0) {
            return 0;
        }
        return isCheatModeEnabled()
            ? Number.MAX_SAFE_INTEGER
            : Math.max(0, Math.floor(this.budget / cost));
    }

    private getMaxContinuousRecruitmentCount(): number {
        const budgetLimit = this.getBudgetRecruitmentCount();
        const progression = this.teamLevelController?.getSnapshot();
        if (progression && (progression.maxLevel || progression.willpower >= progression.currentRequirement)) {
            return budgetLimit;
        }
        // 斗志未满时限制到本级所需抽数；满斗志后不因尚缺胜场阻止连抽补强。
        const progressionLimit = Math.max(
            1,
            this.teamLevelController?.getRecruitmentsUntilWillpowerFull() ?? Number.MAX_SAFE_INTEGER,
        );
        return Math.min(budgetLimit, progressionLimit);
    }

    private refreshContinuousRecruitLabel(): void {
        if (!this.continuousRecruitLabel || !this.continuousRecruitRichText) {
            return;
        }
        if (this.autoDismissEnabled && (this.continuousRecruitmentActive || this.adTripleRecruitmentActive)) {
            this.setContinuousRecruitLabel(
                `自动解雇X${this.autoDismissCount}`,
                CONTINUOUS_RECRUIT_MAX_FONT_SIZE,
                [String(this.autoDismissCount)],
                [],
            );
            return;
        }
        if (this.continuousRecruitLabelLocked) {
            const protectionHint = this.getLowestQualityProtectionHint();
            const pityHint = this.getUpperQualityPityHint();
            const recruitmentHints = this.combineRecruitmentHints(protectionHint, pityHint);
            this.setContinuousRecruitLabel(
                `松开招募${this.continuousRecruitLockedCount}次${recruitmentHints.text}`,
                CONTINUOUS_RECRUIT_MAX_FONT_SIZE,
                [String(this.continuousRecruitLockedCount), ...recruitmentHints.highlights],
                recruitmentHints.qualityHighlights,
            );
            return;
        }
        // 普通提示只看预算；长按选定数量仍遵守实际招募上限。
        const maximum = this.continuousRecruitReady
            ? this.getMaxContinuousRecruitmentCount()
            : this.getBudgetRecruitmentCount();
        const activeCount = Math.max(0, this.continuousRecruitCount);
        const displayCount = this.continuousRecruitReady
            ? activeCount
            : Math.min(CONTINUOUS_RECRUIT_DEFAULT_COUNT, Math.max(0, maximum));
        const protectionHint = this.getLowestQualityProtectionHint();
        const pityHint = this.getUpperQualityPityHint();
        const recruitmentHints = this.combineRecruitmentHints(protectionHint, pityHint);
        const text = maximum < 1
            ? toRewardedActionCopy(`看广告${AD_RECRUIT_LABEL}${recruitmentHints.text}`)
            : displayCount < CONTINUOUS_RECRUIT_MINIMUM_COUNT
                ? `点击进行${displayCount}次招募${recruitmentHints.text}`
                : this.continuousRecruitReady
                    ? `松开招募${displayCount}次${recruitmentHints.text}`
                    : `长按进行${displayCount}连抽${recruitmentHints.text}`;
        const baseFontSize = Math.min(
            CONTINUOUS_RECRUIT_MAX_FONT_SIZE,
            this.continuousRecruitLabelBaseFontSize || this.continuousRecruitLabel.fontSize,
        );
        const progress = this.continuousRecruitReady
            ? Math.min(1, activeCount / Math.max(1, maximum))
            : 0;
        const fontSize = maximum < 1
            ? CONTINUOUS_RECRUIT_MAX_FONT_SIZE
            : Math.round(
                baseFontSize + (CONTINUOUS_RECRUIT_MAX_FONT_SIZE - baseFontSize) * progress,
            );
        const highlights = maximum < 1
            ? [String(AD_RECRUIT_COUNT), ...recruitmentHints.highlights]
            : [String(displayCount), ...recruitmentHints.highlights];
        this.setContinuousRecruitLabel(
            text,
            fontSize,
            highlights,
            recruitmentHints.qualityHighlights,
        );
    }

    private lockContinuousRecruitLabel(count: number): void {
        this.continuousRecruitLabelLocked = true;
        this.continuousRecruitLockedCount = count;
        this.refreshContinuousRecruitLabel();
    }

    private resetContinuousRecruitLabel(): void {
        this.continuousRecruitLabelLocked = false;
        this.continuousRecruitLockedCount = 0;
        this.refreshContinuousRecruitLabel();
    }

    private getLowestQualityProtectionHint(): RecruitmentHint {
        const protectedDrawCount = getLowestRecruitmentQualityProtectionCount();
        if (protectedDrawCount <= 0 || !this.probabilityConfig) {
            return { text: '', highlights: [], qualityHighlights: [] };
        }
        const marketValueLevel = this.teamLevelController?.getSnapshot().marketValueLevel
            ?? getStoredMarketValueLevel();
        const window = resolveRecruitmentWindow(
            this.probabilityConfig,
            marketValueLevel,
            loadSeasonState(),
        );
        const lowestQualityName = window?.recruitableQualityNames[0];
        const lowestQualityId = window?.recruitableQualityIds[0];
        if (!lowestQualityName || lowestQualityId === undefined) {
            return { text: '', highlights: [], qualityHighlights: [] };
        }
        return {
            text: `，${protectedDrawCount}抽必没有${lowestQualityName}`,
            highlights: [String(protectedDrawCount), lowestQualityName],
            qualityHighlights: [{
                value: lowestQualityName,
                color: this.getBrightQualityHintColor(lowestQualityId),
            }],
        };
    }

    private getUpperQualityPityHint(): RecruitmentHint {
        if (
            getRecruitmentUpperQualityPityMissCount()
                < RECRUITMENT_UPPER_QUALITY_PITY_MISS_LIMIT
            || !this.probabilityConfig
        ) {
            return { text: '', highlights: [], qualityHighlights: [] };
        }
        const marketValueLevel = this.teamLevelController?.getSnapshot().marketValueLevel
            ?? getStoredMarketValueLevel();
        const window = resolveRecruitmentWindow(
            this.probabilityConfig,
            marketValueLevel,
            loadSeasonState(),
        );
        const qualityIds = [...(window?.recruitableQualityIds ?? [])]
            .sort((left, right) => left - right);
        const secondHighestQualityId = qualityIds[qualityIds.length - 2];
        const qualityName = this.probabilityConfig.qualities.find(
            (quality) => quality.qualityId === secondHighestQualityId,
        )?.qualityName;
        if (!qualityName || secondHighestQualityId === undefined) {
            return { text: '', highlights: [], qualityHighlights: [] };
        }
        return {
            text: `，下一次必是${qualityName}`,
            highlights: [qualityName],
            qualityHighlights: [{
                value: qualityName,
                color: this.getBrightQualityHintColor(secondHighestQualityId),
            }],
        };
    }

    private combineRecruitmentHints(
        ...hints: ReadonlyArray<RecruitmentHint>
    ): RecruitmentHint {
        return {
            text: hints.map((hint) => hint.text).join(''),
            highlights: hints.flatMap((hint) => hint.highlights),
            qualityHighlights: hints.flatMap((hint) => hint.qualityHighlights),
        };
    }

    private getBrightQualityHintColor(qualityId: number): string {
        return BRIGHT_QUALITY_HINT_COLORS[getQualityFrameIndex(qualityId)] ?? '#FFFFFF';
    }

    private setContinuousRecruitLabel(
        text: string,
        fontSize: number,
        highlightedValues: readonly string[],
        qualityHighlights: readonly QualityTextHighlight[],
    ): void {
        if (!this.continuousRecruitLabel || !this.continuousRecruitRichText) {
            return;
        }
        const colorByValue = new Map<string, string>();
        highlightedValues.forEach((value) => {
            const normalizedValue = value == null ? '' : String(value);
            if (normalizedValue) {
                colorByValue.set(normalizedValue, '#FFD85A');
            }
        });
        qualityHighlights.forEach(({ value, color }) => {
            const normalizedValue = value == null ? '' : String(value);
            if (normalizedValue) {
                colorByValue.set(normalizedValue, color);
            }
        });
        const escapedValues = Array.from(colorByValue.keys())
            .sort((left, right) => right.length - left.length)
            .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const highlightedText = escapedValues.length > 0
            ? text.replace(
                new RegExp(`(${escapedValues.join('|')})`, 'g'),
                (matched) => `<color=${colorByValue.get(matched)}><b>${matched}</b></color>`,
            )
            : text;
        this.continuousRecruitLabel.enabled = false;
        this.continuousRecruitRichText.fontSize = fontSize;
        this.continuousRecruitRichText.lineHeight = fontSize;
        this.continuousRecruitRichText.string = highlightedText;
    }

    private getRecruitmentCost(): number {
        const formula = this.economyConfig?.recruit.budgetCostFormula;
        if (!formula) {
            return Number.POSITIVE_INFINITY;
        }
        const teamLevel = this.teamLevelController?.getSnapshot().teamLevel
            ?? getStoredTeamLevel();
        return Math.max(
            0,
            Math.floor(
                Math.max(0, teamLevel) * Math.max(0, formula.teamLevelMultiplier)
                + Math.max(0, formula.baseCost),
            ),
        );
    }

    protected lateUpdate(): void {
        this.syncRecruitButtonEffect();
        this.updateDismissHoldProgress();
    }

    protected onDestroy(): void {
        this.dissolveMaterial?.destroy();
        this.dissolveMaterial = null;
        this.recruitmentInputBlocker?.destroy();
        this.recruitmentInputBlocker = null;
        if (
            this.recruitButtonTargetSprite?.isValid
            && this.recruitButtonTargetSprite.customMaterial === this.recruitButtonEffectMaterial
        ) {
            this.recruitButtonTargetSprite.customMaterial = this.recruitButtonOriginalMaterial;
        }
        this.recruitButtonEffectMaterial?.destroy();
        this.recruitButtonEffectMaterial = null;
    }

    private installRecruitButtonEffect(effectAsset: EffectAsset): void {
        const sprite = this.recruitButtonTargetSprite;
        const transform = sprite?.node.getComponent(UITransform);
        if (!sprite || !transform) {
            return;
        }

        const material = new Material();
        material.initialize({
            effectAsset,
            defines: {
                IS_GRAY: false,
                USE_TEXTURE: true,
            },
        });
        material.setProperty(
            'sweepParams',
            new Vec4(0.14, 1.5, 0.16, 0.36),
        );
        material.setProperty(
            'diffracParams',
            new Vec4(0.12, 1.6, 0, 0),
        );
        this.recruitButtonEffectMaterial = material;
        this.syncRecruitButtonEffect();
    }

    private syncRecruitButtonEffect(): void {
        const sprite = this.recruitButtonTargetSprite;
        const effectMaterial = this.recruitButtonEffectMaterial;
        if (!sprite || !effectMaterial) {
            return;
        }

        const desiredMaterial = sprite.grayscale
            ? this.recruitButtonOriginalMaterial
            : effectMaterial;
        if (sprite.customMaterial !== desiredMaterial) {
            sprite.customMaterial = desiredMaterial;
        }
    }

    private loadRecruitButtonEffect(): Promise<EffectAsset | null> {
        return new Promise((resolve) => {
            resources.load(
                RECRUIT_BUTTON_SWEEP_EFFECT_PATH,
                EffectAsset,
                (error, asset) => {
                    if (error || !asset) {
                        console.warn(
                            '[RecruitmentController] Recruit button glow is unavailable.',
                            error,
                        );
                        resolve(null);
                        return;
                    }
                    resolve(asset);
                },
            );
        });
    }

    private loadDissolveEffect(): Promise<EffectAsset | null> {
        return new Promise((resolve) => {
            resources.load(DISSOLVE_EFFECT_PATH, EffectAsset, (error, asset) => {
                if (error || !asset) {
                    console.warn('[RecruitmentController] Dissolve effect unavailable.', error);
                    resolve(null);
                    return;
                }
                resolve(asset);
            });
        });
    }

    private loadJson<T>(path: string): Promise<T> {
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

    public getRosterSnapshot(): ReadonlyArray<PlayerCard | null> {
        return cloneRosterSnapshot(this.roster);
    }

    private onBudgetChanged(budget: number): void {
        this.budget = budget;
        this.refreshBudgetView();
    }

    private rollOverall(minimum: number, maximum: number): number {
        const min = Math.ceil(Math.min(minimum, maximum));
        const max = Math.floor(Math.max(minimum, maximum));
        const percentile = Math.random();
        return Math.min(max, min + Math.floor(percentile * (max - min + 1)));
    }
}

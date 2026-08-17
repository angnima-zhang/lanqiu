import {
    _decorator,
    Button,
    Color,
    Component,
    EffectAsset,
    JsonAsset,
    Label,
    Material,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    UITransform,
    Vec4,
} from 'cc';
import {
    formatPlayerOverall,
    RosterSlotView,
} from './RosterSlotView';
import {
    getStoredMarketValueLevel,
    getStoredTeamLevel,
    TEAM_PROGRESSION_EVENT_LEVEL_CHANGED,
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
    gameStateEvents,
    getBalance,
    getManagementEffects,
    getRosterSnapshot as cloneRosterSnapshot,
    loadRoster,
    ManagementEffectSnapshot,
    migratePlayerHistoryToDisplayNames,
    isConceptGodUpgradeUnlocked,
    loadSeasonState,
    PlayerAttributes,
    PlayerCard,
    recordConceptGodAcquisition,
    recordPlayerAcquisition,
    saveRoster,
    trySpend,
} from './GameState';
import {
    RecruitmentProbabilityConfig,
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
    showRewardedVideo,
} from './RewardedAdService';
import { setGrowingNumber } from './NumberGrowthAnimator';
import { gameAudio } from './GameAudio';
import {
    applyOverallNumberQuality,
    applyPlayerQualityVisuals,
    playHighQualityPortraitReveal,
    triggerOverallNumberQualityImpact,
} from './PlayerQualityVisuals';

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
const AD_RECRUIT_COUNT = 3;
const AD_RECRUIT_LABEL = '3连抽';
const NEGATIVE_OVERALL_COLOR = new Color(220, 55, 55, 255);

type AttributeKey = typeof ATTRIBUTE_KEYS[number];

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
    frontend: {
        normalQualityButtonLabel: string;
        eligibleGoatButtonLabel: string;
        attributeButtonLabel: string;
    };
    eligibleSourcePlayerNames: string[];
    conceptGodDisplayNameOverrides?: Record<string, string>;
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
    private budgetLabel: Label | null = null;
    private dismissButton: Button | null = null;
    private replaceButton: Button | null = null;
    private replaceButtonLabel: Label | null = null;
    private upgradeAdButton: Button | null = null;
    private upgradeAdButtonLabel: Label | null = null;
    private replacementPanel: Node | null = null;
    private replacedSlot: RosterSlotView | null = null;
    private replacedNameLabel: Label | null = null;
    private overallIncreaseLabel: Label | null = null;
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
    private candidateAttributeLabels = new Map<AttributeKey, Label>();
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
        medicalTeamOvrRollPercentileShift: 0,
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
    private adTripleRecruitmentActive = false;
    private ready = false;
    private processing = false;

    protected onLoad(): void {
        configureRewardedAdUnitIds({
            wechat: this.wechatRewardedAdUnitId,
            tapTap: this.tapRewardedAdUnitId,
        });
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
        this.dismissButton?.node.on(Button.EventType.CLICK, this.onDismissClicked, this);
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
        teamProgressionEvents.on(
            TEAM_PROGRESSION_EVENT_LEVEL_CHANGED,
            this.refreshBudgetView,
            this,
        );
    }

    protected start(): void {
        this.scheduleOnce(() => void this.initialize(), 0.75);
    }

    protected onDisable(): void {
        this.recruitButton?.node.off(Button.EventType.CLICK, this.onRecruitClicked, this);
        this.dismissButton?.node.off(Button.EventType.CLICK, this.onDismissClicked, this);
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
        teamProgressionEvents.off(
            TEAM_PROGRESSION_EVENT_LEVEL_CHANGED,
            this.refreshBudgetView,
            this,
        );
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

        const attributeRoot = this.resultPage.getChildByName('五项数据');
        const attributeNodes: ReadonlyArray<[AttributeKey, string]> = [
            ['scoring', '得分'],
            ['rebound', '篮板'],
            ['assist', '助攻'],
            ['steal', '抢断'],
            ['block', '盖帽'],
        ];
        for (const [key, nodeName] of attributeNodes) {
            const label = this.findByPath(attributeRoot, `${nodeName}/数值`)?.getComponent(Label);
            if (label) {
                this.candidateAttributeLabels.set(key, label);
            }
        }

        this.replacementPanel = this.resultPage.children
            .find((child) => child.name === '替换' && !child.getComponent(Button)) ?? null;
        this.replacedSlot = this.replacementPanel?.getComponentInChildren(RosterSlotView) ?? null;
        this.replacedNameLabel = this.replacementPanel
            ?.getChildByName('被替换球员名字')
            ?.getComponent(Label) ?? null;
        this.overallIncreaseLabel = this.replacementPanel
            ?.getChildByName('总评提升')
            ?.getComponent(Label) ?? null;
        this.overallIncreaseValueLabel = this.replacementPanel
            ?.getChildByName('总评提升数值')
            ?.getComponent(Label) ?? null;
        this.overallIncreaseValueDefaultColor = this.overallIncreaseValueLabel
            ?.color.clone() ?? null;

        this.dismissButton = this.resultPage.getChildByName('解雇')?.getComponent(Button) ?? null;
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
            && this.candidateOverallLabel
            && this.candidateAttributeLabels.size === ATTRIBUTE_KEYS.length,
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

        const cost = this.getRecruitmentCost();
        if (this.budget < cost) {
            void this.recruitTripleFromAd();
            return;
        }

        const card = this.createRecruitedCard();
        if (!card) {
            return;
        }

        if (!trySpend(cost)) {
            this.budget = getBalance(this.economyConfig.initialBudget);
            this.refreshBudgetView();
            return;
        }

        this.processing = true;
        this.showRecruitingButtonVisual();
        this.budget = getBalance(this.economyConfig.initialBudget);
        this.refreshBudgetView();
        recordPlayerAcquisition(card);

        const willpowerAdded = this.teamLevelController?.addRecruitWillpower() ?? 0;
        this.pendingCard = card;
        this.pendingWillpowerAdded = willpowerAdded;
        this.upgradeAdProcessing = false;
        this.pendingUpgradeAdUsed = false;
        this.pendingDecision = evaluateRecruitmentResult(
            this.roster.map((player) => player?.overall ?? null),
        );

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

            const cards: PlayerCard[] = [];
            for (let index = 0; index < AD_RECRUIT_COUNT; index += 1) {
                const card = this.createRecruitedCard();
                if (!card) {
                    throw new Error('Failed to create an ad recruitment result.');
                }
                cards.push(card);
            }

            this.queuedAdRecruitments = cards.map((card) => {
                recordPlayerAcquisition(card);
                return {
                    card,
                    willpowerAdded: this.teamLevelController?.addRecruitWillpower() ?? 0,
                };
            });
            this.adTripleRecruitmentActive = true;
            await this.showNextAdRecruitmentResult();
        } catch (error) {
            console.error('[RecruitmentController] Ad triple recruitment failed.', error);
            this.queuedAdRecruitments = [];
            this.adTripleRecruitmentActive = false;
        } finally {
            if (!this.adTripleRecruitmentActive) {
                this.processing = false;
                this.restoreRecruitButtonVisual();
                this.refreshBudgetView();
            }
        }
    }

    private async showNextAdRecruitmentResult(): Promise<void> {
        const next = this.queuedAdRecruitments.shift();
        if (!next) {
            this.finishAdTripleRecruitment();
            return;
        }

        this.pendingCard = next.card;
        this.pendingWillpowerAdded = next.willpowerAdded;
        this.upgradeAdProcessing = false;
        this.pendingUpgradeAdUsed = false;
        this.pendingDecision = evaluateRecruitmentResult(
            this.roster.map((player) => player?.overall ?? null),
        );
        await this.showRecruitmentResult(
            next.card,
            this.pendingDecision,
            next.willpowerAdded,
        );
    }

    private async showRecruitmentResultAfterDelay(
        card: PlayerCard,
        decision: RecruitmentResultDecision,
        willpowerAdded: number,
    ): Promise<void> {
        await this.waitForSeconds(RECRUITING_DELAY_SECONDS);
        await this.showRecruitmentResult(card, decision, willpowerAdded);
    }

    private onDismissClicked(): void {
        if (!this.pendingCard || this.pendingDecision?.mode === 'empty-slot') {
            return;
        }
        this.closeResultPage('dissolve');
    }

    private onReplaceClicked(): void {
        const card = this.pendingCard;
        const targetIndex = this.pendingDecision?.targetIndex;
        if (!card || targetIndex === null || targetIndex === undefined) {
            return;
        }

        this.replaceButton!.interactable = false;
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
            if (!completed || this.pendingCard !== card) {
                return;
            }

            this.pendingUpgradeAdUsed = true;
            const upgraded = (
                this.isConceptGod(card)
                || (this.isGoat(card) && !this.canBecomeConceptGod(card))
            )
                ? this.upgradeRandomAttribute(card)
                : this.isGoat(card)
                    ? this.upgradeGoatToConceptGod(card)
                    : this.upgradeNormalQuality(card);
            if (!upgraded) {
                this.pendingUpgradeAdUsed = false;
                return;
            }

            this.pendingDecision = evaluateRecruitmentResult(
                this.roster.map((player) => player?.overall ?? null),
            );
            await this.showRecruitmentResult(
                card,
                this.pendingDecision,
                this.pendingWillpowerAdded,
                false,
            );
        } finally {
            this.upgradeAdProcessing = false;
            if (this.pendingCard && this.pendingDecision) {
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
        if (!config || !goatRange || !this.canBecomeConceptGod(card)) {
            return false;
        }

        const cumulativeCount = recordConceptGodAcquisition();
        const multiplier = 1 + 0.01 * cumulativeCount;
        const minOvr = Math.floor(goatRange.minOvr * multiplier);
        const maxOvr = Math.floor(goatRange.maxOvr * multiplier);
        const conceptOverall = this.rollOverall(minOvr, maxOvr, 0);

        card.qualityId = config.quality.conceptGodQualityId;
        card.qualityName = config.quality.conceptGodQualityName;
        card.isConceptGod = true;
        card.displayName = config.conceptGodDisplayNameOverrides?.[card.sourcePlayerName]
            ?? card.displayName;
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
            // Generated template IDs are position-based and can change when a
            // player pool is rebuilt. The source player plus quality is the
            // stable identity for an already-owned card.
            const template = this.playerConfig.players.find((candidate) => {
                return candidate.sourcePlayerName === card.sourcePlayerName
                    && candidate.quality === card.qualityId;
            });
            const displayName = this.isConceptGod(card)
                ? this.conceptGodUpgradeConfig?.conceptGodDisplayNameOverrides?.[
                    card.sourcePlayerName
                ] ?? template?.displayName
                : template?.displayName;
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
                .includes(card.sourcePlayerName),
        );
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
            return this.canBecomeConceptGod(card)
                || this.canUpgradeAttribute(card);
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

        let canUpgrade = true;
        if (this.isConceptGod(card)) {
            this.upgradeAdButtonLabel.string = config.frontend.attributeButtonLabel;
            canUpgrade = this.canUpgradeAttribute(card);
        } else if (this.isGoat(card)) {
            if (this.canBecomeConceptGod(card)) {
                this.upgradeAdButtonLabel.string = config.frontend.eligibleGoatButtonLabel;
            } else {
                this.upgradeAdButtonLabel.string = config.frontend.attributeButtonLabel;
                canUpgrade = this.canUpgradeAttribute(card);
            }
        } else {
            canUpgrade = Boolean(this.getNextNormalQualityRange(card.qualityId));
            this.upgradeAdButtonLabel.string = config.frontend.normalQualityButtonLabel;
        }

        this.upgradeAdButton.interactable = canUpgrade
            && !forceDisabled
            && !this.upgradeAdProcessing
            && !this.pendingUpgradeAdUsed;
    }

    private restoreResultButtons(decision: RecruitmentResultDecision): void {
        this.dismissButton!.interactable = decision.mode !== 'empty-slot';
        this.replaceButton!.interactable = decision.mode !== 'dismiss-only';
    }

    private createRecruitedCard(): PlayerCard | null {
        if (!this.playerConfig || !this.ovrConfig || !this.probabilityConfig) {
            return null;
        }

        const qualityId = this.drawQualityId();
        const pool = this.playerConfig.players.filter((player) => player.quality === qualityId);
        const range = this.ovrConfig.ranges.find((item) => item.qualityId === qualityId);
        if (pool.length === 0 || !range) {
            console.error('[RecruitmentController] Empty player pool or missing OVR range.', qualityId);
            return null;
        }

        const template = pool[Math.floor(Math.random() * pool.length)];
        const overall = this.rollOverall(
            range.minOvr,
            range.maxOvr,
            this.managementEffects.medicalTeamOvrRollPercentileShift,
        );
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

    private drawQualityId(): number {
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
            return 3;
        }

        const highestRecruitableIndex = levelConfig.baseWeights.reduce(
            (highest, weight, index) => weight > 0 ? index : highest,
            -1,
        );
        const weightedQualities = this.probabilityConfig!.qualities
            .map((quality, index) => ({
                qualityId: quality.qualityId,
                weight: Math.max(
                    0,
                    (levelConfig.baseWeights[index] ?? 0)
                    + (
                        index === highestRecruitableIndex
                            ? this.managementEffects
                                .scoutingDirectorHighestQualityWeightBonus
                            : 0
                    ),
                ),
            }))
            .filter((item) => item.weight > 0);
        const totalWeight = weightedQualities.reduce((total, item) => total + item.weight, 0);
        let roll = Math.random() * totalWeight;
        for (const item of weightedQualities) {
            roll -= item.weight;
            if (roll <= 0) {
                return item.qualityId;
            }
        }
        return weightedQualities[weightedQualities.length - 1]?.qualityId ?? 3;
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
        const [
            portrait,
            background,
            wheat,
            frame,
            nameplate,
            qualityBadge,
            positionBadge,
        ] = await Promise.all([
            loadPlayerPortrait(card),
            loadRecruitmentBackground(card.qualityId),
            loadQualityWheat(card.qualityId),
            loadQualityFrame(card.qualityId),
            loadQualityNameplate(card.qualityId),
            loadQualityBadge(card.qualityId),
            loadQualityPosition(card.qualityId),
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
        for (const key of ATTRIBUTE_KEYS) {
            setGrowingNumber(
                this.candidateAttributeLabels.get(key) ?? null,
                card.attributes[key],
                (value) => formatPlayerOverall(Math.floor(value)),
                {
                    animateGrowth: !playEntrance,
                    duration: 0.55,
                },
            );
        }

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
            this.overallIncreaseLabel && (this.overallIncreaseLabel.string = '总评提升');
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
            await playFullScreenEntrance(this.resultPage!);
            triggerOverallNumberQualityImpact(
                this.candidateOverallLabel,
                card.qualityId,
            );
            playHighQualityPortraitReveal(this.candidatePortrait, card.qualityId);
        }
        this.dismissButton!.interactable = dismissInteractable;
        this.replaceButton!.interactable = replaceInteractable;
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
        if (mode === 'dissolve' && this.resultPage?.active && this.dissolveEffectAsset) {
            this.dissolveResultPage();
            return;
        }
        // fade out
        if (this.resultPage?.active) {
            void exitWithFade(this.resultPage).then(() => {
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
        this.refreshBudgetView();
    }

    // ---- Dissolve effect ----

    private dissolveResultPage(): void {
        const effect = this.dissolveEffectAsset!;
        const materials: Material[] = [];
        const sprites: Sprite[] = [];
        const labels: { label: Label; originalColor: Color }[] = [];

        this.collectSprites(this.resultPage!, (sprite) => {
            const mat = new Material();
            mat.initialize({ effectAsset: effect, defines: { USE_TEXTURE: true } });
            mat.setProperty('dissolveParams', new Vec4(0, 0.12, 8.0, 0));
            mat.setProperty('edgeColor', new Color(255, 160, 30, 255));
            sprite.customMaterial = mat;
            materials.push(mat);
            sprites.push(sprite);
        });

        this.collectLabels(this.resultPage!, (label) => {
            labels.push({ label, originalColor: label.color.clone() });
        });

        const duration = 0.5;
        const startTime = Date.now();
        const tick = (): void => {
            const elapsed = (Date.now() - startTime) / 1000;
            const t = Math.min(elapsed / duration, 1);
            materials.forEach((m) => {
                m.setProperty('dissolveParams', new Vec4(t, 0.12, 8.0, 0));
            });
            labels.forEach(({ label, originalColor }) => {
                const c = originalColor.clone();
                c.a = Math.round(originalColor.a * (1 - t));
                label.color = c;
            });
            if (t >= 1) {
                sprites.forEach((s) => { s.customMaterial = null; });
                labels.forEach(({ label, originalColor }) => { label.color = originalColor; });
                materials.forEach((m) => m.destroy());
                this.finishCloseResultPage();
            } else {
                setTimeout(tick, 16);
            }
        };
        tick();
    }

    private collectLabels(node: Node, fn: (label: Label) => void): void {
        const label = node.getComponent(Label);
        if (label && label.string.trim()) {
            fn(label);
        }
        for (const child of node.children) {
            this.collectLabels(child, fn);
        }
    }

    private collectSprites(node: Node, fn: (sprite: Sprite) => void): void {
        const sprite = node.getComponent(Sprite);
        if (sprite && sprite.spriteFrame) {
            fn(sprite);
        }
        for (const child of node.children) {
            this.collectSprites(child, fn);
        }
    }

    private finishAdTripleRecruitment(): void {
        this.queuedAdRecruitments = [];
        this.adTripleRecruitmentActive = false;
        this.processing = false;
        this.restoreRecruitButtonVisual();
        this.refreshBudgetView();
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
        const cost = this.economyConfig
            ? this.getRecruitmentCost()
            : Number.POSITIVE_INFINITY;
        const hasRecruitmentBudget = !this.economyConfig
            || this.budget >= cost;
        setGrowingNumber(
            this.budgetLabel,
            Math.floor(this.budget),
            hasRecruitmentBudget
                ? (value) => formatPlayerOverall(Math.floor(value))
                    .replace(/\.00(?=[KMBTQ]$)/, '')
                : () => AD_RECRUIT_LABEL,
        );
        if (this.recruitButton) {
            this.recruitButton.interactable = this.processing
                || (
                    this.ready
                    && !this.resultPage?.active
                );
        }
        if (this.recruitButtonTargetSprite) {
            this.recruitButtonTargetSprite.grayscale = !hasRecruitmentBudget;
        }
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
    }

    protected onDestroy(): void {
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

    private rollOverall(minimum: number, maximum: number, percentileShift: number): number {
        const min = Math.ceil(Math.min(minimum, maximum));
        const max = Math.floor(Math.max(minimum, maximum));
        const percentile = Math.min(1, Math.random() + Math.max(0, percentileShift));
        return Math.min(max, min + Math.floor(percentile * (max - min + 1)));
    }
}

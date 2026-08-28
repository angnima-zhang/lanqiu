import {
    _decorator,
    Button,
    Color,
    Component,
    Font,
    instantiate,
    JsonAsset,
    Label,
    Node,
    Prefab,
    RichText,
    resources,
    Sprite,
    TTFFont,
    UITransform,
} from 'cc';
import {
    ATTRIBUTE_KEYS,
    GAME_STATE_EVENT_MATCH_SETTLED,
    GAME_STATE_EVENT_REWARDED_AD_COMPLETED,
    GAME_STATE_EVENT_ROSTER_CHANGED,
    GAME_STATE_EVENT_VALID_OPERATION_COMPLETED,
    gameStateEvents,
    MatchSettlementEvent,
    PendingPlayerEvent,
    PlayerCard,
    PlayerEventType,
    getManagementEffects,
    loadSeasonState,
    ROSTER_SLOT_COUNT,
    loadRoster,
    saveRoster,
} from './GameState';
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
import {
    applyOverallTrendArrow,
    applyOverallNumberQuality,
    applyPlayerQualityVisuals,
    getOverallDefaultColor,
    getOverallTrendColor,
    OverallTrend,
} from './PlayerQualityVisuals';
import { formatPlayerOverall, RosterSlotView } from './RosterSlotView';
import { setGrowingNumber } from './NumberGrowthAnimator';
import { showRewardedVideo } from './RewardedAdService';
import {
    playFullScreenEntrance,
    playFullScreenExit,
} from './FullScreenEntrance';
import { applyGameFont } from '../loading/GameFont';

const { ccclass } = _decorator;

const PLAYER_EVENT_CONFIG_PATH = 'data/player_events';
const POSITIVE_EVENT_COLOR = new Color(91, 220, 128, 255);
const NEGATIVE_EVENT_COLOR = new Color(220, 55, 55, 255);
const EVENT_VALUE_HIGHLIGHT_COLOR = '#FFD15A';
const EVENT_TEXT_OUTLINE_COLOR = '#000000';
const EVENT_OVERALL_ANIMATION_DELAY_SECONDS = 0.5;
const DISABLED_AD_BUTTON_COLOR = new Color(160, 160, 160, 255);
const DIRECT_INJURY_AD_SUMMARIES = [
    ['食物中毒', '食物中毒'],
    ['发烧', '发烧'],
    ['旧伤', '旧伤复发'],
] as const;
const OCCURRED_INJURY_AD_SUMMARIES = [
    ['手指', '手指骨折'],
    ['脚底筋膜', '足底筋膜炎'],
    ['脚踝', '脚踝伤病'],
    ['膝盖', '膝盖伤病'],
    ['大腿', '大腿拉伤'],
    ['小腿', '小腿拉伤'],
    ['腰部', '腰部扭伤'],
    ['脚部', '脚部伤病'],
    ['肩部', '肩部拉伤'],
    ['手腕', '手腕挫伤'],
] as const;

type EventTone = 'positive' | 'negative';

interface PlayerEventDefinition {
    id: PlayerEventType;
    selectionWeight?: number;
    iconPath: string;
    title: string;
    description: string;
    descriptionVariants?: string[];
    tone: EventTone;
    confirmLabel: string;
    adLabel: string;
    overallPercent?: number;
    minimumOverallDelta?: number;
    recoveryMatches?: number;
    adResolvedDescription?: string;
}

interface PlayerEventTraits {
    health: number;
    age: number;
    training: number;
}

interface PlayerEventConfig {
    triggerProbability: number;
    events: PlayerEventDefinition[];
    defaultPlayerTraits: PlayerEventTraits;
    playerTraitOverrides?: Record<string, Partial<PlayerEventTraits>>;
    playerEventDescriptionVariants?: Record<string, Partial<Record<PlayerEventType, string[]>>>;
}

interface RosterCandidate {
    card: PlayerCard;
    index: number;
}

interface SlotEventBinding {
    button: Button;
    callback: () => void;
}

@ccclass('PlayerEventController')
export class PlayerEventController extends Component {
    private canvas: Node | null = null;
    private page: Node | null = null;
    private confirmButton: Button | null = null;
    private adButton: Button | null = null;
    private config: PlayerEventConfig | null = null;
    private definitions = new Map<PlayerEventType, PlayerEventDefinition>();
    private rosterSlots: RosterSlotView[] = [];
    private slotEventBindings: SlotEventBinding[] = [];
    private initializationPromise: Promise<void> | null = null;
    private initialized = false;
    private generatingEvent = false;
    private resolvingEvent = false;
    private eventPageRenderVersion = 0;
    private eventIndicatorRenderVersion = 0;
    private activePlayerInstanceId: string | null = null;
    private activeEventOccurredAtMs = 0;
    private queuedActionAfterPendingEvents: (() => void) | null = null;
    private adResultShown = false;

    protected onLoad(): void {
        this.canvas = this.node.parent;
        this.initializationPromise = this.initialize();
    }

    protected onEnable(): void {
        if (this.initialized) {
            this.reconcileLastSettledMatch();
        }
        gameStateEvents.on(
            GAME_STATE_EVENT_VALID_OPERATION_COMPLETED,
            this.onValidOperationCompleted,
            this,
        );
        gameStateEvents.on(
            GAME_STATE_EVENT_REWARDED_AD_COMPLETED,
            this.onRewardedAdCompleted,
            this,
        );
        gameStateEvents.on(
            GAME_STATE_EVENT_ROSTER_CHANGED,
            this.onRosterChanged,
            this,
        );
        gameStateEvents.on(
            GAME_STATE_EVENT_MATCH_SETTLED,
            this.onMatchSettled,
            this,
        );
    }

    protected onDisable(): void {
        gameStateEvents.off(
            GAME_STATE_EVENT_VALID_OPERATION_COMPLETED,
            this.onValidOperationCompleted,
            this,
        );
        gameStateEvents.off(
            GAME_STATE_EVENT_REWARDED_AD_COMPLETED,
            this.onRewardedAdCompleted,
            this,
        );
        gameStateEvents.off(
            GAME_STATE_EVENT_ROSTER_CHANGED,
            this.onRosterChanged,
            this,
        );
        gameStateEvents.off(
            GAME_STATE_EVENT_MATCH_SETTLED,
            this.onMatchSettled,
            this,
        );
    }

    protected onDestroy(): void {
        this.unbindSlotEventButtons();
        this.confirmButton?.node.off(Button.EventType.CLICK, this.confirmEvent, this);
        this.adButton?.node.off(Button.EventType.CLICK, this.resolveEventWithAd, this);
        this.page?.destroy();
        this.page = null;
    }

    public closePage(): void {
        void this.closePageAndWait();
    }

    /**
     * 有未查看事件时，先按发生时间逐个展示；所有事件处理完毕后再继续后续操作。
     * 返回 true 代表后续操作已被事件队列接管。
     */
    public runAfterPendingEvents(action: () => void): boolean {
        if (this.queuedActionAfterPendingEvents) {
            return true;
        }
        this.queuedActionAfterPendingEvents = action;
        if (!this.initialized) {
            void (this.initializationPromise ?? this.initialize()).then(() => {
                this.openNextQueuedEventOrRunAction();
            });
            return true;
        }
        if (this.generatingEvent) {
            return true;
        }
        if (this.findNextPendingEventIndex() === null) {
            this.queuedActionAfterPendingEvents = null;
            return false;
        }
        this.openNextQueuedEventOrRunAction();
        return true;
    }

    private async closePageAndWait(): Promise<void> {
        this.eventPageRenderVersion += 1;
        this.activePlayerInstanceId = null;
        this.activeEventOccurredAtMs = 0;
        if (this.page?.active) {
            await playFullScreenExit(this.page);
            if (this.page?.isValid) {
                this.page.active = false;
            }
        }
    }

    private async initialize(): Promise<void> {
        try {
            const [config, prefab, gameFont] = await Promise.all([
                this.loadJson<PlayerEventConfig>(PLAYER_EVENT_CONFIG_PATH),
                this.loadPrefab(),
                this.loadGameFont(),
            ]);
            if (!this.node.isValid || !this.canvas || !this.isConfigValid(config)) {
                throw new Error('Invalid player event configuration.');
            }

            this.config = config;
            this.definitions = new Map(config.events.map((event) => [event.id, event]));
            this.page = instantiate(prefab);
            this.canvas.addChild(this.page);
            applyGameFont(this.page, gameFont);
            this.page.active = false;
            this.resolvePageButtons();
            this.resolveRosterSlots();
            this.bindSlotEventButtons();
            this.initialized = true;
            this.reconcileLastSettledMatch();
            await this.syncEventIndicators();
        } catch (error) {
            console.error('[PlayerEventController] Failed to initialize player events.', error);
        }
    }

    private onValidOperationCompleted = (eventCheckCount = 1): void => {
        void this.tryCreateRandomEvent(eventCheckCount);
    };

    private onRewardedAdCompleted = (): void => {
        if (!this.resolvingEvent) {
            void this.tryCreateRandomEvent();
        }
    };

    private onRosterChanged = (roster: ReadonlyArray<PlayerCard | null>): void => {
        this.syncRosterSlotOveralls(roster);
        void this.syncEventIndicators();
    };

    private onMatchSettled = (event: MatchSettlementEvent): void => {
        if (event?.matchId) {
            this.advancePlayerMatchState(
                event.matchId,
                event.participatingPlayerInstanceIds,
            );
        }
    };

    private async tryCreateRandomEvent(eventCheckCount = 1): Promise<void> {
        if (
            !this.initialized
            || !this.config
            || this.generatingEvent
            || this.resolvingEvent
            || this.page?.active
        ) {
            return;
        }
        this.generatingEvent = true;
        try {
            // 同一批次串行判定，持锁到全部完成，避免后续判定被跳过。
            for (let index = 0; index < eventCheckCount; index += 1) {
                await this.createRandomEvent();
            }
        } finally {
            this.generatingEvent = false;
            if (this.queuedActionAfterPendingEvents) {
                this.openNextQueuedEventOrRunAction();
            }
        }
    }

    private async createRandomEvent(): Promise<void> {
        if (Math.random() >= this.config!.triggerProbability) {
            return;
        }

        const roster = loadRoster(ROSTER_SLOT_COUNT);
        const playerCandidates = roster
            .map((card, index) => ({ card, index }))
            .filter((entry): entry is RosterCandidate => Boolean(entry.card))
            .filter(({ card }) => !card.pendingEvent);
        const temporaryOverallCandidates = playerCandidates.filter(({ card }) => (
            !card.activeInjury && !card.activeTraining
        ));
        if (playerCandidates.length === 0) {
            return;
        }

        const retirementCandidates = playerCandidates.filter(({ card }) => {
            return (card.matchesPlayed ?? 0) >= this.getRetirementMatchLimit(card);
        });
        const definitions = this.config!.events.filter((definition) => {
            if (definition.id === 'retirement') {
                return retirementCandidates.length > 0;
            }
            return temporaryOverallCandidates.length > 0;
        });
        if (definitions.length === 0) {
            return;
        }

        const managementEffects = await getManagementEffects();
        const definitionWeights = new Map<PlayerEventDefinition, number>(
            definitions.map((candidate) => [
                candidate,
                Math.max(0.01, Number(candidate.selectionWeight) || 1),
            ]),
        );
        const injuryDefinition = definitions.find((candidate) => candidate.id === 'injury');
        const injuryWeight = injuryDefinition
            ? definitionWeights.get(injuryDefinition) ?? 0
            : 0;
        const otherWeight = Array.from(definitionWeights.entries())
            .filter(([candidate]) => candidate !== injuryDefinition)
            .reduce((total, [, weight]) => total + weight, 0);
        if (injuryDefinition && injuryWeight > 0 && otherWeight > 0) {
            const injuryRiskReduction = Math.max(
                0,
                Math.min(1, managementEffects.medicalTeamInjuryRiskReduction),
            );
            const baseInjuryProbability = injuryWeight / (injuryWeight + otherWeight);
            const targetInjuryProbability = baseInjuryProbability * (1 - injuryRiskReduction);
            definitionWeights.set(
                injuryDefinition,
                otherWeight * targetInjuryProbability / (1 - targetInjuryProbability),
            );
        }
        const definition = this.pickWeighted(
            definitions,
            (candidate) => definitionWeights.get(candidate) ?? 1,
        );
        if (!definition) {
            return;
        }
        const targets = definition.id === 'retirement'
            ? retirementCandidates
            : temporaryOverallCandidates;
        const targetIndex = this.pickEventTarget(definition.id, targets)?.index;
        if (targetIndex === undefined) {
            return;
        }
        const card = roster[targetIndex];
        if (!card) {
            return;
        }
        if (
            (definition.id === 'injury' || definition.id === 'training')
            && (card.activeInjury || card.activeTraining)
        ) {
            return;
        }

        card.pendingEvent = {
            type: definition.id,
            occurredAtMs: Date.now(),
            descriptionTemplate: this.pickEventDescription(card, definition),
            overallDelta: this.resolveOverallDelta(definition, card.overall),
            recoveryMatches: Math.max(0, Math.floor(definition.recoveryMatches ?? 0)),
        };
        saveRoster(roster);
    }

    private openEventAt(slotIndex: number): void {
        const card = loadRoster(this.rosterSlots.length)[slotIndex];
        if (!card?.pendingEvent || !this.page || !this.initialized) {
            return;
        }
        const event = card.pendingEvent;
        void this.renderEventPage(card, event).then(() => {
            if (
                this.page
                && this.activePlayerInstanceId === card.instanceId
                && this.activeEventOccurredAtMs === event.occurredAtMs
            ) {
                this.page.setSiblingIndex(Math.max(0, (this.page.parent?.children.length ?? 1) - 1));
                const renderVersion = this.eventPageRenderVersion;
                void playFullScreenEntrance(this.page).then(() => {
                    if (!this.isCurrentEventPresentation(card, event, renderVersion)) {
                        return;
                    }
                    this.scheduleOnce(() => {
                        if (!this.isCurrentEventPresentation(card, event, renderVersion)) {
                            return;
                        }
                        const overallLabel = this.page?.getChildByName('总评')
                            ?.getChildByName('数值')?.getComponent(Label) ?? null;
                        this.animateEventOverall(overallLabel, card, event);
                    }, EVENT_OVERALL_ANIMATION_DELAY_SECONDS);
                });
            }
        });
    }

    private isCurrentEventPresentation(
        card: PlayerCard,
        event: PendingPlayerEvent,
        renderVersion: number,
    ): boolean {
        return this.page?.active === true
            && this.eventPageRenderVersion === renderVersion
            && this.activePlayerInstanceId === card.instanceId
            && this.activeEventOccurredAtMs === event.occurredAtMs;
    }

    private async renderEventPage(
        card: PlayerCard,
        event: PendingPlayerEvent,
    ): Promise<void> {
        const definition = this.definitions.get(event.type);
        if (!this.page || !definition) {
            return;
        }
        const renderVersion = ++this.eventPageRenderVersion;
        this.activePlayerInstanceId = card.instanceId;
        this.activeEventOccurredAtMs = event.occurredAtMs;
        this.adResultShown = false;

        const eventRoot = this.page.getChildByName('事件');
        const eventName = eventRoot?.getChildByName('事件名称')?.getComponent(Label) ?? null;
        const eventDescriptionNode = eventRoot?.getChildByName('事件描述') ?? null;
        const eventIcon = eventRoot?.getChildByName('图标')?.getComponent(Sprite) ?? null;
        const eventColor = definition.tone === 'positive'
            ? POSITIVE_EVENT_COLOR
            : NEGATIVE_EVENT_COLOR;
        if (eventName) {
            eventName.string = definition.title;
            eventName.color = eventColor;
        }
        if (eventDescriptionNode) {
            this.setEventDescriptionRichText(
                eventDescriptionNode,
                this.formatDescription(
                    event.descriptionTemplate ?? definition.description,
                    card,
                    event,
                ),
                eventColor,
            );
        }
        this.setButtonLabel(this.confirmButton, definition.confirmLabel);
        this.setButtonLabel(this.adButton, definition.adLabel);
        this.setAdButtonResolvedVisual(false);
        this.setButtonsInteractable(true);

        const [icon] = await Promise.all([
            loadSpriteFrame(definition.iconPath),
            this.renderPlayerPresentation(this.page, card, renderVersion),
        ]);
        if (renderVersion !== this.eventPageRenderVersion) {
            return;
        }
        if (eventIcon && icon) {
            eventIcon.spriteFrame = icon;
        }
        const overallRoot = this.page.getChildByName('总评') ?? null;
        const overallLabel = overallRoot?.getChildByName('数值')?.getComponent(Label) ?? null;
        applyOverallTrendArrow(overallRoot, this.getOverallTrend(card, event));
    }

    private async renderPlayerPresentation(
        root: Node,
        card: PlayerCard,
        renderVersion: number,
    ): Promise<void> {
        const portraitRoot = root.getChildByName('球员');
        const portraitSprite = portraitRoot?.getChildByName('头像')?.getComponent(Sprite) ?? null;
        const backgroundSprite = portraitRoot?.getChildByName('bg')?.getComponent(Sprite) ?? null;
        const wheatSprites = portraitRoot?.children
            .filter((child) => child.name === '麦穗')
            .map((child) => child.getComponent(Sprite))
            .filter((sprite): sprite is Sprite => Boolean(sprite)) ?? [];
        const frameSprite = portraitRoot?.getChildByName('头像框')?.getComponent(Sprite) ?? null;
        const nameplateSprite = portraitRoot?.getChildByName('名牌')?.getComponent(Sprite) ?? null;
        const qualityBadgeSprite = portraitRoot?.getChildByName('品质标签')?.getComponent(Sprite) ?? null;
        const positionBadgeSprite = portraitRoot?.getChildByName('位置')?.getComponent(Sprite) ?? null;

        this.setLabel('球员/名牌/名字', card.displayName, root);
        this.setLabel('球员/品质标签/品质', card.qualityName, root);
        this.setLabel('球员/位置/位置', card.position, root);
        const overallLabel = root.getChildByName('总评')?.getChildByName('数值')
            ?.getComponent(Label) ?? null;
        if (overallLabel) {
            overallLabel.string = formatPlayerOverall(card.overall);
        }
        applyOverallNumberQuality(
            overallLabel,
            card.qualityId,
        );

        const [portrait, background, wheat, frame, nameplate, qualityBadge, positionBadge] = await Promise.all([
            loadPlayerPortrait(card),
            loadRecruitmentBackground(card.qualityId),
            loadQualityWheat(card.qualityId),
            loadQualityFrame(card.qualityId),
            loadQualityNameplate(card.qualityId),
            loadQualityBadge(card.qualityId),
            loadQualityPosition(card.qualityId),
        ]);
        if (renderVersion !== this.eventPageRenderVersion) {
            return;
        }
        if (portraitSprite && portrait) {
            portraitSprite.spriteFrame = portrait;
        }
        if (backgroundSprite && background) {
            backgroundSprite.spriteFrame = background;
        }
        if (wheat) {
            wheatSprites.forEach((sprite) => { sprite.spriteFrame = wheat; });
        }
        if (frameSprite && frame) {
            frameSprite.spriteFrame = frame;
        }
        if (nameplateSprite && nameplate) {
            nameplateSprite.spriteFrame = nameplate;
        }
        if (qualityBadgeSprite && qualityBadge) {
            qualityBadgeSprite.spriteFrame = qualityBadge;
        }
        if (positionBadgeSprite && positionBadge) {
            positionBadgeSprite.spriteFrame = positionBadge;
        }
        applyPlayerQualityVisuals(portraitRoot ?? null, card.qualityId);
    }

    private animateEventOverall(
        label: Label | null,
        card: PlayerCard,
        event: PendingPlayerEvent,
    ): void {
        const from = card.overall;
        const delta = Math.max(1, Math.abs(event.overallDelta));
        const target = event.type === 'injury'
            ? Math.max(1, from - delta)
            : event.type === 'training'
                ? from + delta
                : from;
        const trend = this.getOverallTrend(card, event);
        setGrowingNumber(
            label,
            target,
            (value) => formatPlayerOverall(Math.floor(value)),
            {
                from,
                duration: 1.5,
                animateDecrease: target < from,
                colorFrom: getOverallDefaultColor(label),
                colorTo: trend
                    ? getOverallTrendColor(trend)
                    : getOverallDefaultColor(label),
            },
        );
    }

    private confirmEvent = (): void => {
        void this.resolveActiveEvent(false);
    };

    private resolveEventWithAd = (): void => {
        void this.resolveActiveEvent(true);
    };

    private async resolveActiveEvent(withAd: boolean): Promise<void> {
        if (this.resolvingEvent || !this.activePlayerInstanceId) {
            return;
        }
        this.resolvingEvent = true;
        this.setButtonsInteractable(false);
        try {
            if (withAd && !await showRewardedVideo()) {
                return;
            }
            const roster = loadRoster(ROSTER_SLOT_COUNT);
            const targetIndex = roster.findIndex((card) => {
                return card?.instanceId === this.activePlayerInstanceId
                    && card.pendingEvent?.occurredAtMs === this.activeEventOccurredAtMs;
            });
            const card = targetIndex >= 0 ? roster[targetIndex] : null;
            if (!card?.pendingEvent) {
                await this.closePageAndWait();
                this.openNextQueuedEventOrRunAction();
                return;
            }
            const resolvedEvent = card.pendingEvent;
            this.applyEventResolution(roster, targetIndex, card, withAd);
            saveRoster(roster);
            if (withAd) {
                this.showAdResolvedEventResult(card, resolvedEvent);
                return;
            }
            await this.closePageAndWait();
            this.openNextQueuedEventOrRunAction();
        } finally {
            this.resolvingEvent = false;
            if (this.page?.active) {
                this.setButtonsInteractable(!this.adResultShown);
                if (this.adResultShown && this.confirmButton) {
                    this.confirmButton.interactable = true;
                }
            }
        }
    }

    private showAdResolvedEventResult(card: PlayerCard, event: PendingPlayerEvent): void {
        this.eventPageRenderVersion += 1;
        this.adResultShown = true;
        this.setButtonLabel(this.confirmButton, this.getAdResolvedConfirmLabel(event.type));
        this.updateAdResolvedDescription(card, event);
        this.setAdButtonResolvedVisual(true);
        const overallRoot = this.page?.getChildByName('总评') ?? null;
        const overallLabel = overallRoot?.getChildByName('数值')?.getComponent(Label) ?? null;
        const trend = event.type === 'training'
            ? 'training'
            : card.activeInjury
                ? 'injury'
                : null;
        applyOverallTrendArrow(overallRoot, trend);
        if (event.type === 'retirement') {
            if (overallLabel) {
                overallLabel.color = getOverallDefaultColor(overallLabel);
            }
            return;
        }
        const previewOverall = Math.max(
            1,
            card.overall - Math.max(1, Math.abs(event.overallDelta)),
        );
        setGrowingNumber(
            overallLabel,
            card.overall,
            (value) => formatPlayerOverall(Math.floor(value)),
            {
                from: previewOverall,
                duration: 1.5,
                colorFrom: event.type === 'injury'
                    ? getOverallTrendColor('injury')
                    : getOverallDefaultColor(overallLabel),
                colorTo: trend
                    ? getOverallTrendColor(trend)
                    : getOverallDefaultColor(overallLabel),
            },
        );
    }

    private getOverallTrend(card: PlayerCard, event: PendingPlayerEvent): OverallTrend {
        if (event.type === 'injury') {
            return 'injury';
        }
        if (event.type === 'training') {
            return 'training';
        }
        return card.activeInjury
            ? 'injury'
            : card.activeTraining
                ? 'training'
                : null;
    }

    private getAdResolvedConfirmLabel(type: PlayerEventType): string {
        if (type === 'injury') {
            return '爷复活辣！';
        }
        if (type === 'training') {
            return '堪比去少林寺！';
        }
        return '我要破出勤记录！';
    }

    private updateAdResolvedDescription(card: PlayerCard, event: PendingPlayerEvent): void {
        const definition = this.definitions.get(event.type);
        const eventDescriptionNode = this.page
            ?.getChildByName('事件')
            ?.getChildByName('事件描述') ?? null;
        if (!definition?.adResolvedDescription || !eventDescriptionNode) {
            return;
        }
        const baseDescription = this.getAdResolvedBaseDescription(card, event);
        const resolvedDescription = this.resolveDescriptionTemplate(
            definition.adResolvedDescription,
            card,
            event,
        );
        const eventColor = definition.tone === 'positive'
            ? POSITIVE_EVENT_COLOR
            : NEGATIVE_EVENT_COLOR;
        this.setEventDescriptionRichText(
            eventDescriptionNode,
            `${baseDescription}${resolvedDescription}`,
            eventColor,
        );
    }

    private applyEventResolution(
        roster: Array<PlayerCard | null>,
        targetIndex: number,
        card: PlayerCard,
        withAd: boolean,
    ): void {
        const event = card.pendingEvent!;
        if (event.type === 'injury') {
            if (!withAd) {
                const penalty = Math.max(1, Math.abs(event.overallDelta));
                this.applyOverallDelta(card, -penalty);
                card.activeInjury = {
                    overallPenalty: penalty,
                    remainingMatches: Math.max(1, event.recoveryMatches),
                };
            }
            delete card.pendingEvent;
            return;
        }
        if (event.type === 'retirement') {
            if (withAd) {
                delete card.pendingEvent;
            } else {
                roster[targetIndex] = null;
            }
            return;
        }
        if (event.type === 'training') {
            const bonus = Math.max(1, event.overallDelta) * (withAd ? 2 : 1);
            this.applyOverallDelta(card, bonus);
            card.activeTraining = {
                overallBonus: bonus,
                remainingMatches: Math.max(1, event.recoveryMatches),
            };
            delete card.pendingEvent;
            return;
        }
    }

    private reconcileLastSettledMatch(): void {
        const seasonState = loadSeasonState();
        if (!seasonState.lastSettledMatchId) {
            return;
        }
        this.advancePlayerMatchState(
            seasonState.lastSettledMatchId,
            seasonState.lastSettledPlayerInstanceIds,
        );
    }

    private advancePlayerMatchState(
        matchId: string,
        participatingPlayerInstanceIds: ReadonlyArray<string>,
    ): void {
        const participatingIds = new Set(participatingPlayerInstanceIds);
        if (participatingIds.size === 0) {
            return;
        }
        const roster = loadRoster(ROSTER_SLOT_COUNT);
        let changed = false;
        for (const card of roster) {
            if (
                !card
                || !participatingIds.has(card.instanceId)
                || card.lastCountedMatchId === matchId
            ) {
                continue;
            }
            card.lastCountedMatchId = matchId;
            card.matchesPlayed = Math.min(
                2_147_483_647,
                Math.max(0, card.matchesPlayed ?? 0) + 1,
            );
            if (card.activeInjury) {
                card.activeInjury.remainingMatches -= 1;
                if (card.activeInjury.remainingMatches <= 0) {
                    this.applyOverallDelta(card, card.activeInjury.overallPenalty);
                    delete card.activeInjury;
                }
            }
            if (card.activeTraining) {
                card.activeTraining.remainingMatches -= 1;
                if (card.activeTraining.remainingMatches <= 0) {
                    this.applyOverallDelta(card, -card.activeTraining.overallBonus);
                    delete card.activeTraining;
                }
            }
            changed = true;
        }
        if (changed) {
            saveRoster(roster);
        }
    }

    private applyOverallDelta(card: PlayerCard, delta: number): void {
        const currentOverall = Math.max(1, Math.floor(card.overall));
        const nextOverall = Math.max(1, currentOverall + Math.floor(delta));
        let remaining = nextOverall - currentOverall;
        if (remaining > 0) {
            card.attributes.scoring += remaining;
        } else {
            for (const key of [...ATTRIBUTE_KEYS].sort(
                (left, right) => card.attributes[right] - card.attributes[left],
            )) {
                const reduction = Math.min(card.attributes[key], Math.abs(remaining));
                card.attributes[key] -= reduction;
                remaining += reduction;
                if (remaining === 0) {
                    break;
                }
            }
        }
        card.overall = nextOverall;
    }

    private resolveOverallDelta(
        definition: PlayerEventDefinition,
        overall: number,
    ): number {
        const percent = Number(definition.overallPercent) || 0;
        if (percent === 0) {
            return 0;
        }
        const amount = Math.max(
            Math.max(1, Math.floor(definition.minimumOverallDelta ?? 1)),
            Math.round(Math.max(1, overall) * Math.abs(percent)),
        );
        return percent < 0 ? -amount : amount;
    }

    private pickEventDescription(
        card: PlayerCard,
        definition: PlayerEventDefinition,
    ): string {
        const playerVariants = this.config?.playerEventDescriptionVariants?.[
            card.sourcePlayerName
        ]?.[definition.id] ?? [];
        const variants = [
            definition.description,
            ...(definition.descriptionVariants ?? []),
            ...playerVariants,
        ].filter((variant) => typeof variant === 'string' && variant.trim().length > 0);
        return variants[Math.floor(Math.random() * variants.length)] ?? definition.description;
    }

    private pickEventTarget(
        type: PlayerEventType,
        candidates: ReadonlyArray<RosterCandidate>,
    ): RosterCandidate | null {
        if (type === 'injury') {
            return this.pickWeighted(
                candidates,
                ({ card }) => 1 - this.getPlayerTraits(card).health,
            );
        }
        if (type === 'training') {
            return this.pickWeighted(
                candidates,
                ({ card }) => this.getPlayerTraits(card).training,
            );
        }
        if (type === 'retirement') {
            return this.pickWeighted(
                candidates,
                ({ card }) => this.getPlayerTraits(card).age - 17,
            );
        }
        return this.pickWeighted(candidates, () => 1);
    }

    private pickWeighted<T>(
        candidates: ReadonlyArray<T>,
        getWeight: (candidate: T) => number,
    ): T | null {
        const weights = candidates.map((candidate) => Math.max(0.01, getWeight(candidate)));
        const total = weights.reduce((sum, weight) => sum + weight, 0);
        let roll = Math.random() * total;
        for (let index = 0; index < candidates.length; index += 1) {
            roll -= weights[index];
            if (roll <= 0) {
                return candidates[index];
            }
        }
        return candidates[candidates.length - 1] ?? null;
    }

    private getPlayerTraits(card: PlayerCard): PlayerEventTraits {
        const defaults = this.config?.defaultPlayerTraits ?? {
            health: 0.6,
            age: 28,
            training: 0.5,
        };
        const override = this.config?.playerTraitOverrides?.[card.sourcePlayerName];
        return {
            health: this.clampTrait(override?.health ?? defaults.health),
            age: Math.min(50, Math.max(18, Math.floor(override?.age ?? defaults.age))),
            training: this.clampTrait(override?.training ?? defaults.training),
        };
    }

    private getRetirementMatchLimit(card: PlayerCard): number {
        const randomizedLimit = Math.max(1, Math.min(5, card.retirementMatchLimit ?? 3));
        const age = this.getPlayerTraits(card).age;
        const ageAdjustment = age >= 38 ? 2 : age >= 33 ? 1 : 0;
        return Math.max(1, randomizedLimit - ageAdjustment);
    }

    private clampTrait(value: number): number {
        return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
    }

    private formatDescription(
        template: string,
        card: PlayerCard,
        event: PendingPlayerEvent,
    ): string {
        const description = this.resolveDescriptionTemplate(template, card, event);
        const value = formatPlayerOverall(Math.abs(event.overallDelta));
        const matches = Math.max(1, event.recoveryMatches);
        if (event.type === 'injury') {
            return `${description} 接下来${matches}场比赛中总评暂时下降${value}。`;
        }
        if (event.type === 'training') {
            return `${description} 接下来${matches}场比赛中总评暂时提升${value}。`;
        }
        return description;
    }

    private resolveDescriptionTemplate(
        template: string,
        card: PlayerCard,
        event: PendingPlayerEvent,
    ): string {
        return template
            .replace(/\{\{player\}\}/g, card.displayName)
            .replace(/\{\{value\}\}/g, formatPlayerOverall(Math.abs(event.overallDelta)))
            .replace(/\{\{matches\}\}/g, String(Math.max(1, event.recoveryMatches)));
    }

    private getAdResolvedBaseDescription(
        card: PlayerCard,
        event: PendingPlayerEvent,
    ): string {
        const value = formatPlayerOverall(Math.abs(event.overallDelta));
        if (event.type === 'injury') {
            const template = event.descriptionTemplate ?? '';
            const directSummary = DIRECT_INJURY_AD_SUMMARIES.find(([keyword]) => (
                template.includes(keyword)
            ))?.[1];
            if (directSummary) {
                return `${card.displayName}${directSummary}，总评下降${value}。`;
            }
            const injurySummary = OCCURRED_INJURY_AD_SUMMARIES.find(([keyword]) => (
                template.includes(keyword)
            ))?.[1] ?? '伤病';
            return `${card.displayName}发生了${injurySummary}，总评下降${value}。`;
        }
        if (event.type === 'training') {
            return `${card.displayName}参加训练，总评提升${value}。`;
        }
        return `${card.displayName}宣布退役。`;
    }

    private setEventDescriptionRichText(
        node: Node,
        description: string,
        eventColor: Readonly<Color>,
    ): void {
        const label = node.getComponent(Label);
        let richText = node.getComponent(RichText);
        if (!richText && label) {
            richText = node.addComponent(RichText);
            richText.fontSize = label.fontSize;
            richText.lineHeight = label.lineHeight;
            richText.horizontalAlign = label.horizontalAlign;
            richText.verticalAlign = label.verticalAlign;
            richText.fontColor = eventColor.clone();
            richText.maxWidth = node.getComponent(UITransform)?.width ?? 0;
            richText.useSystemFont = label.useSystemFont;
            richText.fontFamily = label.fontFamily;
            if (label.font instanceof TTFFont) {
                richText.font = label.font;
            }
            richText.handleTouchEvent = false;
            label.enabled = false;
        }
        if (richText) {
            richText.string = this.createEventDescriptionRichText(description, eventColor);
        }
    }

    private createEventDescriptionRichText(
        description: string,
        eventColor: Readonly<Color>,
    ): string {
        const plainText = this.escapeRichText(description);
        const highlightedText = plainText.replace(
            /(?:\d+场比赛|(?:下降|提升)[\d.]+[KMBTQ]?)/g,
            (value) => `<color=${EVENT_VALUE_HIGHLIGHT_COLOR}>${value}</color>`,
        );
        return `<outline color=${EVENT_TEXT_OUTLINE_COLOR} width=2><b><color=${this.colorToHex(eventColor)}>${highlightedText}</color></b></outline>`;
    }

    private colorToHex(color: Readonly<Color>): string {
        return `#${[color.r, color.g, color.b]
            .map((value) => value.toString(16).padStart(2, '0'))
            .join('')}`;
    }

    private escapeRichText(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    private async syncEventIndicators(): Promise<void> {
        if (!this.initialized) {
            return;
        }
        const renderVersion = ++this.eventIndicatorRenderVersion;
        const roster = loadRoster(this.rosterSlots.length);
        const icons = await Promise.all(roster.map((card) => {
            const definition = card?.pendingEvent
                ? this.definitions.get(card.pendingEvent.type)
                : null;
            return definition ? loadSpriteFrame(definition.iconPath) : Promise.resolve(null);
        }));
        if (renderVersion !== this.eventIndicatorRenderVersion) {
            return;
        }
        this.rosterSlots.forEach((slot, index) => {
            slot.setEventIcon(icons[index] ?? null);
        });
    }

    private syncRosterSlotOveralls(
        roster: ReadonlyArray<PlayerCard | null>,
    ): void {
        this.rosterSlots.forEach((slot, index) => {
            const card = roster[index] ?? null;
            if (card) {
                slot.setOverall(card.overall);
            } else if (slot.getOverall() > 0) {
                slot.clear();
            }
        });
    }

    private resolvePageButtons(): void {
        this.confirmButton = this.page?.getChildByName('确认')?.getComponent(Button) ?? null;
        this.adButton = this.page?.getChildByName('看广告')?.getComponent(Button) ?? null;
        if (this.adButton) {
            this.adButton.transition = Button.Transition.COLOR;
            this.adButton.normalColor = Color.WHITE;
            this.adButton.hoverColor = Color.WHITE;
            this.adButton.pressedColor = new Color(225, 225, 225, 255);
            this.adButton.disabledColor = DISABLED_AD_BUTTON_COLOR;
        }
        this.confirmButton?.node.on(Button.EventType.CLICK, this.confirmEvent, this);
        this.adButton?.node.on(Button.EventType.CLICK, this.resolveEventWithAd, this);
    }

    private resolveRosterSlots(): void {
        const rosterRoot = this.canvas
            ?.getChildByName('主页')
            ?.getChildByName('球队')
            ?.getChildByName('阵容槽位') ?? null;
        this.rosterSlots = rosterRoot
            ? rosterRoot.children
                .map((child) => child.getComponent(RosterSlotView))
                .filter((slot): slot is RosterSlotView => Boolean(slot))
                .sort((left, right) => left.node.name.localeCompare(
                    right.node.name,
                    'zh-CN',
                    { numeric: true },
                ))
            : [];
    }

    private bindSlotEventButtons(): void {
        this.unbindSlotEventButtons();
        this.rosterSlots.forEach((slot, index) => {
            const button = slot.eventButton;
            if (!button) {
                return;
            }
            const callback = (): void => this.openEventAt(index);
            button.node.on(Button.EventType.CLICK, callback, this);
            this.slotEventBindings.push({ button, callback });
        });
    }

    private unbindSlotEventButtons(): void {
        for (const binding of this.slotEventBindings) {
            binding.button.node.off(Button.EventType.CLICK, binding.callback, this);
        }
        this.slotEventBindings = [];
    }

    private setButtonLabel(button: Button | null, value: string): void {
        const label = button?.node.getChildByName('Label')?.getComponent(Label) ?? null;
        if (label) {
            label.string = value;
        }
    }

    private setAdButtonResolvedVisual(disabled: boolean): void {
        if (!this.adButton) {
            return;
        }
        for (const sprite of this.adButton.node.getComponentsInChildren(Sprite)) {
            sprite.grayscale = disabled;
        }
    }

    private setButtonsInteractable(interactable: boolean): void {
        if (this.confirmButton) {
            this.confirmButton.interactable = interactable;
        }
        if (this.adButton) {
            this.adButton.interactable = interactable;
        }
    }

    private findNextPendingEventIndex(): number | null {
        const next = loadRoster(ROSTER_SLOT_COUNT)
            .map((card, index) => ({ card, index }))
            .filter((entry): entry is RosterCandidate & { card: PlayerCard & {
                pendingEvent: PendingPlayerEvent;
            } } => Boolean(entry.card?.pendingEvent))
            .sort((left, right) => {
                return left.card.pendingEvent.occurredAtMs - right.card.pendingEvent.occurredAtMs
                    || left.index - right.index;
            })[0];
        return next?.index ?? null;
    }

    private openNextQueuedEventOrRunAction(): void {
        const action = this.queuedActionAfterPendingEvents;
        if (!action) {
            return;
        }
        if (!this.initialized) {
            this.queuedActionAfterPendingEvents = null;
            action();
            return;
        }
        const nextIndex = this.findNextPendingEventIndex();
        if (nextIndex !== null) {
            this.openEventAt(nextIndex);
            return;
        }
        this.queuedActionAfterPendingEvents = null;
        action();
    }

    private setLabel(path: string, value: string, root: Node): void {
        const label = this.findByPath(root, path)?.getComponent(Label) ?? null;
        if (label) {
            label.string = value;
        }
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

    private loadPrefab(): Promise<Prefab> {
        return new Promise((resolve, reject) => {
            resources.load('prefabs/球员/事件页面', Prefab, (error, prefab) => {
                if (error || !prefab) {
                    reject(error ?? new Error('Missing event page prefab.'));
                    return;
                }
                resolve(prefab);
            });
        });
    }

    private loadGameFont(): Promise<Font> {
        return new Promise((resolve, reject) => {
            resources.load('fonts/zpix', Font, (error, font) => {
                if (error || !font) {
                    reject(error ?? new Error('Missing game font: fonts/zpix'));
                    return;
                }
                resolve(font);
            });
        });
    }

    private isConfigValid(config: PlayerEventConfig): boolean {
        return Number.isFinite(config.triggerProbability)
            && Array.isArray(config.events)
            && config.events.length > 0
            && config.events.every((event) => (
                event.id === 'injury' || event.id === 'training' || event.id === 'retirement'
            ))
            && Boolean(config.defaultPlayerTraits);
    }
}

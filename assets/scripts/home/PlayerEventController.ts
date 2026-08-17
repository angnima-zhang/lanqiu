import {
    _decorator,
    Button,
    Color,
    Component,
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
    GAME_STATE_EVENT_BUDGET_CHANGED,
    GAME_STATE_EVENT_MATCH_SETTLED,
    GAME_STATE_EVENT_REWARDED_AD_COMPLETED,
    GAME_STATE_EVENT_ROSTER_CHANGED,
    gameStateEvents,
    MatchSettlementEvent,
    PendingEventRecruit,
    PendingPlayerEvent,
    PlayerAttributes,
    PlayerCard,
    PlayerEventType,
    recordPlayerAcquisition,
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
    applyOverallNumberQuality,
    applyPlayerQualityVisuals,
} from './PlayerQualityVisuals';
import { formatPlayerOverall, RosterSlotView } from './RosterSlotView';
import { setGrowingNumber } from './NumberGrowthAnimator';
import { showRewardedVideo } from './RewardedAdService';
import {
    playFullScreenEntrance,
    playFullScreenExit,
} from './FullScreenEntrance';

const { ccclass } = _decorator;

const PLAYER_EVENT_CONFIG_PATH = 'data/player_events';
const PLAYER_CONFIG_PATH = 'data/player_config_fame_v3';
const POSITIVE_EVENT_COLOR = new Color(91, 220, 128, 255);
const NEGATIVE_EVENT_COLOR = new Color(220, 55, 55, 255);
const EVENT_VALUE_HIGHLIGHT_COLOR = '#FFD15A';
const EVENT_TEXT_OUTLINE_COLOR = '#000000';
const EVENT_OVERALL_ANIMATION_DELAY_SECONDS = 0.5;

type EventTone = 'positive' | 'negative';

interface PlayerEventDefinition {
    id: PlayerEventType;
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
}

interface RecruitmentCombo {
    requiredSourcePlayerNames: string[];
    recruitSourcePlayerName: string;
}

interface PlayerEventTraits {
    health: number;
    age: number;
    training: number;
    bond: number;
}

interface PlayerEventConfig {
    triggerProbability: number;
    events: PlayerEventDefinition[];
    recruitmentCombos: RecruitmentCombo[];
    defaultPlayerTraits: PlayerEventTraits;
    playerTraitOverrides?: Record<string, Partial<PlayerEventTraits>>;
    playerEventDescriptionVariants?: Record<string, Partial<Record<PlayerEventType, string[]>>>;
}

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

interface RecruitmentEventCandidate {
    triggerIndex: number;
    recruit: PendingEventRecruit;
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
    private templates: PlayerTemplate[] = [];
    private rosterSlots: RosterSlotView[] = [];
    private slotEventBindings: SlotEventBinding[] = [];
    private initialized = false;
    private generatingEvent = false;
    private resolvingEvent = false;
    private eventPageRenderVersion = 0;
    private eventIndicatorRenderVersion = 0;
    private activePlayerInstanceId: string | null = null;
    private activeEventOccurredAtMs = 0;

    protected onLoad(): void {
        this.canvas = this.node.parent;
        void this.initialize();
    }

    protected onEnable(): void {
        gameStateEvents.on(
            GAME_STATE_EVENT_BUDGET_CHANGED,
            this.onBudgetChanged,
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
            GAME_STATE_EVENT_BUDGET_CHANGED,
            this.onBudgetChanged,
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
        this.eventPageRenderVersion += 1;
        this.activePlayerInstanceId = null;
        this.activeEventOccurredAtMs = 0;
        if (this.page?.active) {
            void playFullScreenExit(this.page).then(() => {
                if (this.page?.isValid) {
                    this.page.active = false;
                }
            });
        }
    }

    private async initialize(): Promise<void> {
        try {
            const [config, playerConfig, prefab] = await Promise.all([
                this.loadJson<PlayerEventConfig>(PLAYER_EVENT_CONFIG_PATH),
                this.loadJson<PlayerConfig>(PLAYER_CONFIG_PATH),
                this.loadPrefab(),
            ]);
            if (!this.node.isValid || !this.canvas || !this.isConfigValid(config, playerConfig)) {
                throw new Error('Invalid player event configuration.');
            }

            this.config = config;
            this.templates = playerConfig.players;
            this.definitions = new Map(config.events.map((event) => [event.id, event]));
            this.page = instantiate(prefab);
            this.canvas.addChild(this.page);
            this.page.active = false;
            this.resolvePageButtons();
            this.resolveRosterSlots();
            this.bindSlotEventButtons();
            this.initialized = true;
            await this.syncEventIndicators();
        } catch (error) {
            console.error('[PlayerEventController] Failed to initialize player events.', error);
        }
    }

    private onBudgetChanged = (): void => {
        void this.tryCreateRandomEvent();
    };

    private onRewardedAdCompleted = (): void => {
        if (!this.resolvingEvent) {
            void this.tryCreateRandomEvent();
        }
    };

    private onRosterChanged = (): void => {
        void this.syncEventIndicators();
    };

    private onMatchSettled = (event: MatchSettlementEvent): void => {
        if (event?.matchId) {
            this.advancePlayerMatchState(event.matchId);
        }
    };

    private async tryCreateRandomEvent(): Promise<void> {
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
            if (Math.random() >= this.config.triggerProbability) {
                return;
            }

            const roster = loadRoster(ROSTER_SLOT_COUNT);
            const playerCandidates = roster
                .map((card, index) => ({ card, index }))
                .filter((entry): entry is RosterCandidate => Boolean(entry.card))
                .filter(({ card }) => !card.pendingEvent);
            if (playerCandidates.length === 0) {
                return;
            }

            const recruitmentCandidate = this.getRecruitmentCandidate(roster);
            const retirementCandidates = playerCandidates.filter(({ card }) => {
                return (card.matchesPlayed ?? 0) >= this.getRetirementMatchLimit(card);
            });
            const definitions = this.config.events.filter((definition) => {
                if (definition.id === 'recruitment') {
                    return Boolean(recruitmentCandidate);
                }
                if (definition.id === 'retirement') {
                    return retirementCandidates.length > 0;
                }
                return definition.id !== 'injury'
                    || playerCandidates.some(({ card }) => !card.activeInjury);
            });
            if (definitions.length === 0) {
                return;
            }

            const definition = definitions[Math.floor(Math.random() * definitions.length)];
            const targets = definition.id === 'injury'
                ? playerCandidates.filter(({ card }) => !card.activeInjury)
                : definition.id === 'retirement'
                    ? retirementCandidates
                    : playerCandidates;
            const targetIndex = definition.id === 'recruitment'
                ? recruitmentCandidate?.triggerIndex
                : this.pickEventTarget(definition.id, targets)?.index;
            if (targetIndex === undefined) {
                return;
            }
            const card = roster[targetIndex];
            if (!card) {
                return;
            }
            if (definition.id === 'injury' && card.activeInjury) {
                return;
            }

            card.pendingEvent = {
                type: definition.id,
                occurredAtMs: Date.now(),
                descriptionTemplate: this.pickEventDescription(card, definition),
                overallDelta: this.resolveOverallDelta(definition, card.overall),
                recoveryMatches: Math.max(0, Math.floor(definition.recoveryMatches ?? 0)),
                recruit: definition.id === 'recruitment'
                    ? recruitmentCandidate?.recruit ?? null
                    : null,
            };
            saveRoster(roster);
        } finally {
            this.generatingEvent = false;
        }
    }

    private getRecruitmentCandidate(
        roster: ReadonlyArray<PlayerCard | null>,
    ): RecruitmentEventCandidate | null {
        if (!this.config || !roster.some((card) => card === null)) {
            return null;
        }
        const sourceNames = new Set(
            roster.flatMap((card) => card ? [card.sourcePlayerName] : []),
        );
        const combos = this.config.recruitmentCombos.filter((combo) => {
            return !sourceNames.has(combo.recruitSourcePlayerName)
                && combo.requiredSourcePlayerNames.every((name) => sourceNames.has(name));
        });
        if (combos.length === 0) {
            return null;
        }
        const candidates = combos.flatMap((combo) => {
            const template = this.templates
                .filter((candidate) => candidate.sourcePlayerName === combo.recruitSourcePlayerName)
                .sort((left, right) => left.quality - right.quality)[0];
            if (!template) {
                return [];
            }
            return roster.flatMap((card, index) => {
                if (
                    !card
                    || card.pendingEvent
                    || !combo.requiredSourcePlayerNames.includes(card.sourcePlayerName)
                ) {
                    return [];
                }
                return [{
                    triggerIndex: index,
                    recruit: this.toPendingEventRecruit(template),
                    bond: this.getPlayerTraits(card).bond,
                }];
            });
        });
        return this.pickWeighted(candidates, (candidate) => candidate.bond) ?? null;
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
        setGrowingNumber(
            label,
            target,
            (value) => formatPlayerOverall(Math.floor(value)),
            {
                from,
                duration: 1.5,
                animateDecrease: target < from,
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
                this.closePage();
                return;
            }
            this.applyEventResolution(roster, targetIndex, card, withAd);
            saveRoster(roster);
            this.closePage();
        } finally {
            this.resolvingEvent = false;
            if (this.page?.active) {
                this.setButtonsInteractable(true);
            }
        }
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
            this.applyOverallDelta(
                card,
                Math.max(1, event.overallDelta) * (withAd ? 2 : 1),
            );
            delete card.pendingEvent;
            return;
        }
        const recruit = event.recruit;
        const emptyIndex = roster.findIndex((entry) => entry === null);
        if (!recruit || emptyIndex < 0) {
            delete card.pendingEvent;
            return;
        }
        const rewardedRecruit = withAd ? this.upgradeRecruit(recruit) : recruit;
        const recruitedCard = this.createRecruitedCard(rewardedRecruit);
        roster[emptyIndex] = recruitedCard;
        recordPlayerAcquisition(recruitedCard);
        delete card.pendingEvent;
    }

    private advancePlayerMatchState(matchId: string): void {
        const roster = loadRoster(ROSTER_SLOT_COUNT);
        let changed = false;
        for (const card of roster) {
            if (!card || card.lastCountedMatchId === matchId) {
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

    private upgradeRecruit(recruit: PendingEventRecruit): PendingEventRecruit {
        const template = this.templates
            .filter((candidate) => candidate.sourcePlayerName === recruit.sourcePlayerName)
            .filter((candidate) => candidate.quality > recruit.qualityId)
            .sort((left, right) => left.quality - right.quality)[0];
        return template ? this.toPendingEventRecruit(template) : recruit;
    }

    private createRecruitedCard(recruit: PendingEventRecruit): PlayerCard {
        const now = Date.now();
        return {
            instanceId: `event-${now}-${Math.random().toString(36).slice(2, 8)}`,
            templateId: recruit.templateId,
            sourcePlayerName: recruit.sourcePlayerName,
            displayName: recruit.displayName,
            position: recruit.position,
            qualityId: recruit.qualityId,
            qualityName: recruit.qualityName,
            overall: recruit.overall,
            attributes: { ...recruit.attributes },
            acquiredAtMs: now,
            lineupSinceMs: now,
        };
    }

    private toPendingEventRecruit(template: PlayerTemplate): PendingEventRecruit {
        const attributes = { ...template.attributes };
        return {
            templateId: template.id,
            sourcePlayerName: template.sourcePlayerName,
            displayName: template.displayName,
            position: template.position,
            qualityId: template.quality,
            qualityName: template.qualityName,
            overall: ATTRIBUTE_KEYS.reduce(
                (sum, key) => sum + Math.max(0, attributes[key]),
                0,
            ),
            attributes,
        };
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
            bond: 0.5,
        };
        const override = this.config?.playerTraitOverrides?.[card.sourcePlayerName];
        return {
            health: this.clampTrait(override?.health ?? defaults.health),
            age: Math.min(50, Math.max(18, Math.floor(override?.age ?? defaults.age))),
            training: this.clampTrait(override?.training ?? defaults.training),
            bond: this.clampTrait(override?.bond ?? defaults.bond),
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
        return template
            .replace(/\{\{player\}\}/g, card.displayName)
            .replace(/\{\{recruit\}\}/g, event.recruit?.displayName ?? '')
            .replace(/\{\{value\}\}/g, formatPlayerOverall(Math.abs(event.overallDelta)))
            .replace(/\{\{matches\}\}/g, String(Math.max(1, event.recoveryMatches)));
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

    private resolvePageButtons(): void {
        this.confirmButton = this.page?.getChildByName('确认')?.getComponent(Button) ?? null;
        this.adButton = this.page?.getChildByName('看广告')?.getComponent(Button) ?? null;
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

    private setButtonsInteractable(interactable: boolean): void {
        if (this.confirmButton) {
            this.confirmButton.interactable = interactable;
        }
        if (this.adButton) {
            this.adButton.interactable = interactable;
        }
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

    private isConfigValid(config: PlayerEventConfig, playerConfig: PlayerConfig): boolean {
        return Number.isFinite(config.triggerProbability)
            && Array.isArray(config.events)
            && config.events.length > 0
            && Array.isArray(config.recruitmentCombos)
            && Boolean(config.defaultPlayerTraits)
            && Array.isArray(playerConfig.players)
            && playerConfig.players.length > 0;
    }
}

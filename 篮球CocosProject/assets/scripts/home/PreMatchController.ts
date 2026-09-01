import {
    _decorator,
    Button,
    Color,
    Component,
    director,
    find,
    Label,
    Node,
    Size,
    Sprite,
    sys,
    UIOpacity,
    UITransform,
} from 'cc';
import {
    applyPermanentOpponentInjuries,
    ATTRIBUTE_KEYS,
    calculateTeamOverall,
    GAME_STATE_EVENT_MANAGEMENT_CHANGED,
    GAME_STATE_EVENT_PLAYER_DETAILS_REQUESTED,
    GAME_STATE_EVENT_ROSTER_CHANGED,
    GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED,
    gameStateEvents,
    getManagementEffects,
    getCurrentMatchId,
    INT32_MAX,
    loadJson,
    loadRoster,
    loadSeasonState,
    PlayerAttributes,
    PlayerCard,
    SeasonState,
    TEAM_NAME_STORAGE_KEY,
} from './GameState';
import {
    MatchRewardsConfig,
    resolveMatchDefinition,
} from './MatchProgression';
import { loadPlayerPortrait, loadThinQualityFrame } from './PlayerAssets';
import { formatPlayerOverall } from './RosterSlotView';
import {
    playFullScreenEntrance,
    stopFullScreenEntrance,
} from './FullScreenEntrance';
import { playFullScreenExit as exitWithFade } from './FullScreenEntrance';
import { playPreMatchEntrance, stopPreMatchEntrance } from './PreMatchEntrance';
import { MatchController } from './MatchController';
import { preloadMatchAssets } from './MatchPreloader';
import {
    MatchSessionSnapshot,
    setCurrentMatchSession,
} from './MatchSession';
import { TeamLevelController } from './TeamLevelController';
import { STANDARD_MATCH_COUNT } from './SeasonRoute';
import { PlayerEventController } from './PlayerEventController';
import {
    RecruitmentProbabilityConfig,
    resolveOpponentQualityWeights,
} from './RecruitmentProgression';

const { ccclass } = _decorator;

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

interface PlayerOvrRange {
    qualityId: number;
    qualityName: string;
    minOvr: number;
    maxOvr: number;
}

interface PlayerOvrRangesConfig {
    ranges: PlayerOvrRange[];
}

interface OpponentConceptGodConfig {
    quality: {
        goatQualityId: number;
        conceptGodQualityId: number;
        conceptGodQualityName: string;
    };
    eligibleSourcePlayerNames: string[];
    conceptGodDefinitions: Record<string, Array<{ conceptGodId: string; displayName: string }>>;
}

const OPPONENT_ROSTER_SIZE = 12;
const STANDARD_OPPONENT_TEAM_NAMES = [
    '投一个试试',
    '太久没打了',
    '膝盖有伤',
    '鲲鲲',
    '走步观光团',
    '篮板搬运工',
    '五大囧常客',
    '打铁基建队',
    '发配CBA',
    '三拒投',
    '勾手老大爷',
    '矮壮篮板怪',
    '灵活死胖子',
    '高瘦远投王',
    '半裸暴汗男',
    '装备党',
    '好球！',
    '我系个鞋带',
    '加一个，不太会',
    '把球给我我要回家',
] as const;

@ccclass('PreMatchController')
export class PreMatchController extends Component {
    public static instance: PreMatchController | null = null;

    private page: Node | null = null;
    private returnButton: Button | null = null;
    private startButton: Button | null = null;
    private playerTeamCardsRoot: Node | null = null;
    private opponentTeamCardsRoot: Node | null = null;
    private playerConfig: PlayerConfig | null = null;
    private playerOvrRanges: PlayerOvrRangesConfig | null = null;
    private matchRewards: MatchRewardsConfig | null = null;
    private recruitmentProbability: RecruitmentProbabilityConfig | null = null;
    private conceptGodConfig: OpponentConceptGodConfig | null = null;
    private loadPromise: Promise<void> | null = null;
    private cardRenderVersion = 0;
    private pageRequestVersion = 0;
    private playerCardButtons: Array<{ button: Button; callback: () => void }> = [];
    private previewPlayerRoster: Array<PlayerCard | null> = [];
    private preparedMatch: MatchSessionSnapshot | null = null;
    private readonly defaultQualityFrames = new WeakMap<Sprite, Sprite['spriteFrame']>();
    private startingMatch = false;
    private readonly portraitBounds = new WeakMap<UITransform, Size>();

    protected onLoad(): void {
        PreMatchController.instance = this;
        this.resolveSceneReferences();
        if (!this.page || !this.returnButton || !this.startButton) {
            console.error('[PreMatchController] Missing pre-match UI references.');
            this.enabled = false;
            return;
        }
        this.page.active = false;
        this.startButton.interactable = false;
    }

    protected onEnable(): void {
        this.returnButton?.node.on(Button.EventType.CLICK, this.closePage, this);
        this.startButton?.node.on(Button.EventType.CLICK, this.startMatch, this);
        gameStateEvents.on(
            GAME_STATE_EVENT_ROSTER_CHANGED,
            this.onDataChanged,
            this,
        );
        gameStateEvents.on(
            GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED,
            this.onDataChanged,
            this,
        );
        gameStateEvents.on(
            GAME_STATE_EVENT_MANAGEMENT_CHANGED,
            this.onDataChanged,
            this,
        );
        this.bindPlayerCardButtons();
    }

    protected onDisable(): void {
        this.pageRequestVersion += 1;
        this.cardRenderVersion += 1;
        if (this.page) stopPreMatchEntrance(this.page);
        this.returnButton?.node.off(Button.EventType.CLICK, this.closePage, this);
        this.startButton?.node.off(Button.EventType.CLICK, this.startMatch, this);
        gameStateEvents.off(
            GAME_STATE_EVENT_ROSTER_CHANGED,
            this.onDataChanged,
            this,
        );
        gameStateEvents.off(
            GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED,
            this.onDataChanged,
            this,
        );
        gameStateEvents.off(
            GAME_STATE_EVENT_MANAGEMENT_CHANGED,
            this.onDataChanged,
            this,
        );
        for (const binding of this.playerCardButtons) {
            binding.button.node.off(Button.EventType.CLICK, binding.callback, this);
        }
        this.playerCardButtons = [];
    }

    protected onDestroy(): void {
        if (PreMatchController.instance === this) {
            PreMatchController.instance = null;
        }
    }

    public async openPage(): Promise<void> {
        if (!this.page) {
            return;
        }
        void preloadMatchAssets().catch((error) => {
            console.warn('[PreMatchController] Match preload failed; entry will retry.', error);
        });
        const requestVersion = ++this.pageRequestVersion;
        const parent = this.page.parent;
        if (parent) {
            this.page.setSiblingIndex(parent.children.length - 1);
        }
        await this.ensureDataLoaded();
        if (requestVersion !== this.pageRequestVersion) return;
        await this.refreshPage();
        if (requestVersion === this.pageRequestVersion) {
            // ---- NEW: custom collision entrance ----
            const playerTeamPanel = this.findByPath(
                this.page, '双方阵容/球队总览/我方球队',
            )!;
            const opponentTeamPanel = this.findByPath(
                this.page, '双方阵容/球队总览/对方球队',
            )!;
            const playerCards = this.playerTeamCardsRoot?.children.filter(
                (c) => c.active,
            ) ?? [];
            const opponentCards = this.opponentTeamCardsRoot?.children.filter(
                (c) => c.active,
            ) ?? [];

            void playPreMatchEntrance(
                this.page,
                { playerTeam: playerTeamPanel, opponentTeam: opponentTeamPanel },
                playerCards,
                opponentCards,
                this.namedChildren(['bg']),
                this.namedChildren(['顶部']),
                this.namedChildren(['管理层加成']),
                this.namedChildren(['底部按钮']),
            );

            // ---- OLD: fade-in entrance (keep for restore) ----
            // void playFullScreenEntrance(this.page, {
            //     backgroundNodes: this.namedChildren(['bg']),
            //     moduleGroups: [
            //         { nodes: this.namedChildren(['顶部']), order: 0 },
            //         { nodes: this.namedChildren(['双方阵容']), order: 1 },
            //         { nodes: this.namedChildren(['管理层加成']), order: 2 },
            //         { nodes: this.namedChildren(['底部按钮']), order: 3 },
            //     ],
            // });
        }
    }

    public closePage = (): void => {
        const requestVersion = ++this.pageRequestVersion;
        this.cardRenderVersion += 1;
        if (this.page) {
            const page = this.page;
            stopPreMatchEntrance(page);
            stopFullScreenEntrance(page);
            if (!page.active) return;
            void exitWithFade(page).then(() => {
                if (page.isValid && requestVersion === this.pageRequestVersion) {
                    page.active = false;
                }
            });
        }
    };

    private ensureDataLoaded(): Promise<void> {
        this.loadPromise ??= Promise.all([
            loadJson<PlayerConfig>('data/player_config_fame_v3'),
            loadJson<PlayerOvrRangesConfig>('data/balance/player_ovr_ranges'),
            loadJson<MatchRewardsConfig>('data/balance/match_rewards'),
            loadJson<RecruitmentProbabilityConfig>('data/balance/recruitment_probability'),
            loadJson<OpponentConceptGodConfig>('data/balance/concept_god_upgrade'),
        ]).then(([
            playerConfig,
            playerOvrRanges,
            matchRewards,
            recruitmentProbability,
            conceptGodConfig,
        ]) => {
            if (
                !Array.isArray(playerConfig.players)
                || !Array.isArray(playerOvrRanges.ranges)
                || !Array.isArray(recruitmentProbability.qualities)
                || !Array.isArray(recruitmentProbability.qualityWindows)
                || recruitmentProbability.qualityWindows.some((window) => (
                    !Array.isArray(window.baseWeights)
                    || window.baseWeights.length !== 5
                ))
            ) {
                throw new Error('Invalid pre-match configuration.');
            }
            this.playerConfig = playerConfig;
            this.playerOvrRanges = playerOvrRanges;
            this.matchRewards = matchRewards;
            this.recruitmentProbability = recruitmentProbability;
            this.conceptGodConfig = conceptGodConfig;
        }).catch((error) => {
            console.error('[PreMatchController] Failed to load pre-match data.', error);
        });
        return this.loadPromise;
    }

    private async refreshPage(): Promise<void> {
        if (
            !this.page
            || !this.playerConfig
            || !this.playerOvrRanges
            || !this.matchRewards
            || !this.recruitmentProbability
            || !this.conceptGodConfig
        ) {
            return;
        }
        const seasonState = loadSeasonState();
        const scheduleMatch = resolveMatchDefinition(this.matchRewards, seasonState);
        if (!scheduleMatch) {
            return;
        }

        const renderVersion = ++this.cardRenderVersion;
        const roster = loadRoster();
        const effects = await getManagementEffects();
        if (renderVersion !== this.cardRenderVersion) return;
        const playerOverall = calculateTeamOverall(
            roster,
            effects.headCoachBattleOvrBonus,
        );
        const matchId = getCurrentMatchId(seasonState);
        const opponentLevel = this.resolveOpponentLevel(seasonState);
        const opponentRoster = this.createOpponentRoster(
            opponentLevel,
            matchId,
        );
        const opponentOverall = applyPermanentOpponentInjuries(
            opponentRoster,
            seasonState.opponentInjuredPlayerIndices,
            playerOverall,
        );
        const strongestOpponent = opponentRoster.reduce(
            (strongest, card) => !strongest || card.qualityId > strongest.qualityId
                ? card
                : strongest,
            null as PlayerCard | null,
        );
        const match = {
            ...scheduleMatch,
            opponentOvr: opponentOverall,
            difficultyQualityId: strongestOpponent?.qualityId ?? 3,
            difficultyQualityName: strongestOpponent?.qualityName ?? '新秀',
        };
        const teamName = sys.localStorage.getItem(TEAM_NAME_STORAGE_KEY)?.trim()
            || '我的球队';
        const opponentTeamName = this.getOpponentTeamName(seasonState);
        const occupiedRosterCount = roster.filter(Boolean).length;

        this.setLabel(
            '顶部/赛程',
            match.scheduleLabel,
        );
        this.setLabel(
            '双方阵容/球队总览/我方球队/球队总评/球队名',
            teamName,
        );
        this.setLabel(
            '双方阵容/球队总览/我方球队/球队总评/球队总评',
            this.formatOverall(playerOverall),
        );
        this.setLabel(
            '双方阵容/球队总览/对方球队/球队总评/球队名',
            opponentTeamName,
        );
        this.setLabel(
            '双方阵容/球队总览/对方球队/球队总评/球队总评',
            this.formatOverall(match.opponentOvr),
        );
        this.setLabel(
            '管理层加成/总裁/数值',
            `+${(effects.operationPresidentBudgetBonus * 100).toFixed(2)}%`,
        );
        this.setLabel(
            '管理层加成/教练/数值',
            `+${(effects.headCoachBattleOvrBonus * 100).toFixed(2)}%`,
        );
        this.preparedMatch = {
            matchId,
            seasonNumber: seasonState.seasonNumber,
            matchNumber: seasonState.infiniteMode
                ? seasonState.infiniteMatchNumber
                : seasonState.matchNumber,
            difficultyQualityName: match.difficultyQualityName,
            scheduleLabel: match.scheduleLabel,
            playerTeamName: teamName,
            opponentTeamName,
            playerRoster: roster,
            opponentRoster,
            playerOverall,
            opponentOverall: match.opponentOvr,
            opponentLevel,
            operationPresidentBonus: effects.operationPresidentBudgetBonus,
            rewardMultiplier: match.rewardMultiplier,
            isStandardProgressionMatch: match.isStandardProgressionMatch,
            temporaryBonusPercent: 0,
        };
        void preloadMatchAssets(this.preparedMatch).catch((error) => {
            console.warn('[PreMatchController] Match lineup preload failed.', error);
        });
        if (this.startButton) {
            this.startButton.interactable = occupiedRosterCount >= 5
                && !this.startingMatch
                && Boolean(this.preparedMatch)
                && (TeamLevelController.instance?.canStartProgressionMatch() ?? false);
        }

        const playerCardNodes = this.playerTeamCardsRoot?.children ?? [];
        const opponentCardNodes = this.opponentTeamCardsRoot?.children ?? [];
        this.previewPlayerRoster = [
            ...roster
                .filter((card): card is PlayerCard => Boolean(card))
                .sort((left, right) => right.overall - left.overall),
            ...Array<PlayerCard | null>(Math.max(0, 12 - occupiedRosterCount)).fill(null),
        ];
        await Promise.all([
            ...playerCardNodes.slice(0, 12).map((node, index) => {
                return this.renderCompactCard(
                    node,
                    this.previewPlayerRoster[index] ?? null,
                    renderVersion,
                );
            }),
            ...opponentCardNodes.slice(0, 12).map((node, index) => {
                return this.renderCompactCard(
                    node,
                    opponentRoster[index] ?? null,
                    renderVersion,
                );
            }),
        ]);
    }

    private createOpponentRoster(
        opponentLevel: number,
        matchId: string,
    ): PlayerCard[] {
        const profile = resolveOpponentQualityWeights(
            this.recruitmentProbability!,
            opponentLevel,
        );
        if (!profile) {
            console.error('[PreMatchController] Missing opponent recruitment profile.', opponentLevel);
            return [];
        }
        const poolsByQuality = new Map<number, PlayerTemplate[]>();
        const numericSeedPrefix = matchId.startsWith('standard-')
            ? 'standard-opponent-progression'
            : `${matchId}-opponent-recruitment`;
        const qualityRolls = this.shuffleDeterministically(
            Array.from(
                { length: OPPONENT_ROSTER_SIZE },
                (_, index) => (index + 0.5) / OPPONENT_ROSTER_SIZE,
            ),
            this.getStableSeed(`${numericSeedPrefix}-quality-order`),
        );

        const finalMatch = matchId === `standard-${STANDARD_MATCH_COUNT}`;
        const infiniteMatch = matchId.startsWith('infinite-');
        const roster: PlayerCard[] = Array.from({ length: OPPONENT_ROSTER_SIZE }, (_, index) => {
            const qualityRoll = qualityRolls[index];
            const overallRoll = this.createDeterministicRandom(
                `${numericSeedPrefix}-overall-${index}`,
            )();
            const qualityIndex = this.drawWeightedIndex(profile.weights, qualityRoll);
            const qualityId = finalMatch || infiniteMatch
                ? this.conceptGodConfig!.quality.goatQualityId
                : profile.qualityIds[qualityIndex];
            const range = this.playerOvrRanges!.ranges.find(
                (candidate) => candidate.qualityId === qualityId,
            );
            const qualityName = range?.qualityName ?? profile.qualityNames[qualityIndex];
            const minimumOverall = Math.max(1, Math.floor(range?.minOvr ?? 1));
            const maximumOverall = Math.max(
                minimumOverall,
                Math.floor(range?.maxOvr ?? minimumOverall),
            );
            const overall = minimumOverall + Math.floor(
                overallRoll * (maximumOverall - minimumOverall + 1),
            );
            let pool = poolsByQuality.get(qualityId);
            if (!pool) {
                const matchingPlayers = this.playerConfig!.players.filter(
                    (player) => player.quality === qualityId,
                );
                pool = this.shuffleDeterministically(
                    matchingPlayers.length > 0
                        ? matchingPlayers
                        : this.playerConfig!.players,
                    this.getStableSeed(`${matchId}-${qualityId}`),
                );
                poolsByQuality.set(qualityId, pool);
            }
            const template = pool[index % pool.length];
            return {
                instanceId: `opponent-${matchId}-${index}`,
                templateId: template.id,
                sourcePlayerName: template.sourcePlayerName,
                displayName: template.displayName,
                position: template.position,
                qualityId,
                qualityName,
                overall,
                attributes: this.allocateAttributes(overall, template.attributes),
                acquiredAtMs: 0,
                lineupSinceMs: null,
            };
        });
        if (infiniteMatch) {
            this.applyInfiniteOpponentLineup(roster, matchId);
        }
        return roster;
    }

    private applyInfiniteOpponentLineup(roster: PlayerCard[], matchId: string): void {
        const config = this.conceptGodConfig!;
        const goatRange = this.playerOvrRanges!.ranges.find(
            (range) => range.qualityId === config.quality.goatQualityId,
        );
        // 同一概念神可能配置了中英文原型别名，轮换时只占一个场次。
        const seenConceptGodIds = new Set<string>();
        const candidates = this.playerConfig!.players.filter((player) => (
            player.quality === config.quality.goatQualityId
            && config.eligibleSourcePlayerNames.includes(player.sourcePlayerName)
        )).flatMap((template) => (
            (config.conceptGodDefinitions[template.sourcePlayerName] ?? [])
                .map((definition) => ({ template, definition }))
        )).filter(({ definition }) => {
            if (seenConceptGodIds.has(definition.conceptGodId)) return false;
            seenConceptGodIds.add(definition.conceptGodId);
            return true;
        }).sort((left, right) => (
            left.definition.conceptGodId.localeCompare(right.definition.conceptGodId)
        ));
        if (!goatRange || candidates.length === 0) {
            throw new Error('Missing opponent concept-god templates or GOAT OVR range.');
        }
        const roundIndex = Number(matchId.slice('infinite-'.length)) - 1;
        const selected = roundIndex < candidates.length
            ? [candidates[roundIndex]]
            : this.shuffleDeterministically(
                candidates,
                this.getStableSeed(`${matchId}-concept-god-lineup`),
            ).slice(0, OPPONENT_ROSTER_SIZE);
        const random = this.createDeterministicRandom(`${matchId}-opponent-concept-god`);
        // 沿用首名概念神的区间，不读取或增加玩家累计获得数量。
        const minimumOverall = Math.floor(goatRange.minOvr * 1.01);
        const maximumOverall = Math.floor(goatRange.maxOvr * 1.01);
        selected.forEach(({ template, definition }, index) => {
            const overall = minimumOverall + Math.floor(
                random() * (maximumOverall - minimumOverall + 1),
            );
            roster[index] = {
                ...roster[index],
                templateId: template.id,
                sourcePlayerName: template.sourcePlayerName,
                displayName: definition.displayName,
                position: template.position,
                qualityId: config.quality.conceptGodQualityId,
                qualityName: config.quality.conceptGodQualityName,
                isConceptGod: true,
                conceptGodId: definition.conceptGodId,
                overall,
                attributes: this.allocateAttributes(overall, template.attributes),
            };
        });
    }

    private resolveOpponentLevel(seasonState: SeasonState): number {
        return seasonState.infiniteMode
            ? 100
            : Math.max(0, Math.min(100, Math.floor(seasonState.matchNumber)));
    }

    private getOpponentTeamName(seasonState: SeasonState): string {
        if (seasonState.infiniteMode) {
            return '篮球概念神';
        }
        const standardMatchCount = Math.max(
            1,
            Math.floor(this.matchRewards?.standardMatchCount ?? 100),
        );
        const matchNumber = Math.max(
            1,
            Math.min(standardMatchCount, Math.floor(seasonState.matchNumber)),
        );
        const index = Math.min(
            STANDARD_OPPONENT_TEAM_NAMES.length - 1,
            Math.floor(
                (matchNumber - 1)
                * STANDARD_OPPONENT_TEAM_NAMES.length
                / standardMatchCount,
            ),
        );
        return STANDARD_OPPONENT_TEAM_NAMES[index];
    }

    private async renderCompactCard(
        root: Node,
        card: PlayerCard | null,
        renderVersion: number,
    ): Promise<void> {
        const portrait = root.getChildByName('头像')?.getComponent(Sprite) ?? null;
        const nameLabel = root.getChildByName('名字')?.getComponent(Label) ?? null;
        const overallLabel = root.getChildByName('总评')?.getComponent(Label) ?? null;
        const qualityFrame = root.getChildByName('边框')?.getComponent(Sprite) ?? null;
        if (overallLabel) {
            // 空槽位也保留文本区域，避免清空文字后宽度归零、补人时字号缩为0。
            overallLabel.overflow = Label.Overflow.SHRINK;
            overallLabel.enableWrapText = false;
            overallLabel.node.active = true;
            overallLabel.enabled = true;
            overallLabel.color = new Color(234, 158, 2, 255);
            const overallOpacity = overallLabel.node.getComponent(UIOpacity);
            if (overallOpacity) {
                overallOpacity.opacity = 255;
            }
            overallLabel.node.setSiblingIndex(root.children.length - 1);
        }
        const injuryState = root.getChildByName('伤病');
        const trainingState = root.getChildByName('训练');
        if (injuryState) {
            injuryState.active = Boolean(card?.activeInjury);
        }
        if (trainingState) {
            trainingState.active = Boolean(card?.activeTraining);
        }
        if (qualityFrame && !this.defaultQualityFrames.has(qualityFrame)) {
            this.defaultQualityFrames.set(qualityFrame, qualityFrame.spriteFrame);
        }
        if (!card) {
            if (portrait) {
                portrait.spriteFrame = null;
            }
            if (qualityFrame) {
                qualityFrame.spriteFrame = this.defaultQualityFrames.get(qualityFrame) ?? null;
            }
            if (nameLabel) {
                nameLabel.string = '空缺';
            }
            if (overallLabel) {
                overallLabel.string = '';
            }
            return;
        }

        if (nameLabel) {
            nameLabel.string = card.displayName;
        }
        if (overallLabel) {
            overallLabel.string = this.formatOverall(card.overall);
        }
        const [portraitFrame, qualityFrameAsset] = await Promise.all([
            loadPlayerPortrait(card),
            loadThinQualityFrame(card.qualityId),
        ]);
        if (renderVersion !== this.cardRenderVersion) {
            return;
        }
        if (portrait) {
            this.setPortraitFramePreservingAspect(portrait, portraitFrame);
        }
        if (qualityFrame && qualityFrameAsset) {
            qualityFrame.spriteFrame = qualityFrameAsset;
        }
    }

    private setPortraitFramePreservingAspect(
        portrait: Sprite,
        spriteFrame: Sprite['spriteFrame'],
    ): void {
        const transform = portrait.getComponent(UITransform);
        if (!transform) {
            portrait.spriteFrame = spriteFrame;
            return;
        }
        let bounds = this.portraitBounds.get(transform);
        if (!bounds) {
            bounds = transform.contentSize.clone();
            this.portraitBounds.set(transform, bounds);
        }
        portrait.sizeMode = Sprite.SizeMode.CUSTOM;
        portrait.spriteFrame = spriteFrame;
        const sourceSize = spriteFrame?.originalSize;
        if (!sourceSize || sourceSize.width <= 0 || sourceSize.height <= 0) {
            transform.setContentSize(bounds);
            return;
        }
        const scale = Math.min(
            bounds.width / sourceSize.width,
            bounds.height / sourceSize.height,
        );
        transform.setContentSize(
            sourceSize.width * scale,
            sourceSize.height * scale,
        );
    }

    private bindPlayerCardButtons(): void {
        const nodes = this.playerTeamCardsRoot?.children.slice(0, 12) ?? [];
        nodes.forEach((node, index) => {
            const button = node.getComponent(Button) ?? node.addComponent(Button);
            const callback = (): void => {
                const card = this.previewPlayerRoster[index];
                const rosterIndex = card
                    ? loadRoster().findIndex((candidate) => (
                        candidate?.instanceId === card.instanceId
                    ))
                    : -1;
                if (rosterIndex >= 0) {
                    gameStateEvents.emit(
                        GAME_STATE_EVENT_PLAYER_DETAILS_REQUESTED,
                        rosterIndex,
                    );
                }
            };
            button.node.on(Button.EventType.CLICK, callback, this);
            this.playerCardButtons.push({ button, callback });
        });
    }

    private onDataChanged(): void {
        if (this.page?.active) {
            void this.ensureDataLoaded().then(() => this.refreshPage());
        }
    }

    private startMatch = (): void => {
        if (
            this.startingMatch
            || !this.preparedMatch
            || loadRoster().filter(Boolean).length < 5
            || !TeamLevelController.instance?.canStartProgressionMatch()
        ) {
            return;
        }
        const playerEventController = this.node.getComponent(PlayerEventController)
            ?? this.node.parent?.getComponent(PlayerEventController)
            ?? null;
        if (playerEventController?.runAfterPendingEvents(this.startMatch)) {
            return;
        }
        this.startingMatch = true;
        if (this.startButton) {
            this.startButton.interactable = false;
        }
        setCurrentMatchSession(this.preparedMatch);
        director.loadScene('Match', (error) => {
            if (error) {
                console.error('[PreMatchController] Failed to load Match scene.', error);
                this.startingMatch = false;
                if (this.startButton) {
                    this.startButton.interactable = true;
                }
                return;
            }
            const canvas = find('Canvas');
            if (!canvas) {
                console.error('[PreMatchController] Match scene is missing Canvas.');
                return;
            }
            if (!canvas.getComponent(MatchController)) {
                canvas.addComponent(MatchController);
            }
        });
    };

    private allocateAttributes(
        overall: number,
        templateAttributes: PlayerAttributes,
    ): PlayerAttributes {
        const weights = ATTRIBUTE_KEYS.map(
            (key) => Math.max(0, templateAttributes[key] ?? 0),
        );
        const totalWeight = weights.reduce((total, value) => total + value, 0);
        const effectiveWeights = totalWeight > 0 ? weights : ATTRIBUTE_KEYS.map(() => 1);
        const effectiveTotal = effectiveWeights.reduce((total, value) => total + value, 0);
        const rawValues = effectiveWeights.map((weight) => overall * weight / effectiveTotal);
        const values = rawValues.map(Math.floor);
        let remainder = overall - values.reduce((total, value) => total + value, 0);
        const order = rawValues
            .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
            .sort((a, b) => b.fraction - a.fraction);
        while (remainder > 0) {
            values[order[(overall - remainder) % order.length].index] += 1;
            remainder -= 1;
        }
        return {
            scoring: values[0],
            rebound: values[1],
            assist: values[2],
            steal: values[3],
            block: values[4],
        };
    }

    private shuffleDeterministically<T>(source: ReadonlyArray<T>, seed: number): T[] {
        const result = [...source];
        const random = this.createDeterministicRandom(seed);
        for (let index = result.length - 1; index > 0; index -= 1) {
            const target = Math.floor(random() * (index + 1));
            [result[index], result[target]] = [result[target], result[index]];
        }
        return result;
    }

    private drawWeightedIndex(weights: readonly number[], roll: number): number {
        const totalWeight = weights.reduce(
            (total, weight) => total + Math.max(0, weight),
            0,
        );
        if (totalWeight <= 0) {
            return Math.max(0, weights.length - 1);
        }
        let remaining = Math.max(0, Math.min(1, roll)) * totalWeight;
        for (let index = 0; index < weights.length; index += 1) {
            remaining -= Math.max(0, weights[index]);
            if (remaining < 0) {
                return index;
            }
        }
        return Math.max(0, weights.length - 1);
    }

    private createDeterministicRandom(seed: string | number): () => number {
        let state = (typeof seed === 'number' ? seed : this.getStableSeed(seed)) || 1;
        return (): number => {
            state ^= state << 13;
            state ^= state >>> 17;
            state ^= state << 5;
            return (state >>> 0) / 4_294_967_296;
        };
    }

    private getStableSeed(value: string): number {
        let hash = 2_166_136_261;
        for (const character of value) {
            hash ^= character.charCodeAt(0);
            hash = Math.imul(hash, 16_777_619);
        }
        return hash >>> 0;
    }

    private setLabel(path: string, value: string): void {
        const label = this.findByPath(this.page, path)?.getComponent(Label);
        if (label) {
            label.string = value;
        }
    }

    private formatOverall(value: number): string {
        return value >= INT32_MAX ? 'MAX' : String(Math.round(Math.max(0, value)));
    }

    private resolveSceneReferences(): void {
        const canvas = this.node.parent;
        this.page = canvas?.getChildByName('备赛页面') ?? null;
        this.returnButton = this.findByPath(this.page, '顶部/返回')?.getComponent(Button)
            ?? null;
        this.startButton = this.findByPath(this.page, '底部按钮/Button')
            ?.getComponent(Button) ?? null;
        this.playerTeamCardsRoot = this.findByPath(
            this.page,
            '双方阵容/球队总览/我方球队/球员',
        );
        this.opponentTeamCardsRoot = this.findByPath(
            this.page,
            '双方阵容/球队总览/对方球队/球员',
        );
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

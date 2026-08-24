import {
    _decorator,
    Button,
    Component,
    director,
    find,
    Label,
    Node,
    Size,
    Sprite,
    sys,
    Tween,
    UITransform,
} from 'cc';
import {
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
    MatchDefinition,
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
import { playPreMatchEntrance } from './PreMatchEntrance';
import { MatchController } from './MatchController';
import {
    MatchSessionSnapshot,
    setCurrentMatchSession,
} from './MatchSession';
import { TeamLevelController } from './TeamLevelController';
import { PlayerEventController } from './PlayerEventController';

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

const OPPONENT_ROSTER_SIZE = 12;
const OPPONENT_OVERALL_WEIGHTS = [42, 20, 12, 8, 5, 4, 3, 2, 1, 1, 1, 1];
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
        const requestVersion = ++this.pageRequestVersion;
        const parent = this.page.parent;
        if (parent) {
            this.page.setSiblingIndex(parent.children.length - 1);
        }
        await this.ensureDataLoaded();
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
        this.pageRequestVersion += 1;
        this.cardRenderVersion += 1;
        if (this.page) {
            stopFullScreenEntrance(this.page);
            this.stopAllChildTweens(this.page);
            void exitWithFade(this.page).then(() => {
                this.page!.active = false;
            });
        }
    };

    private stopAllChildTweens(node: Node): void {
        Tween.stopAllByTarget(node);
        for (const child of node.children) {
            this.stopAllChildTweens(child);
        }
    }

    private ensureDataLoaded(): Promise<void> {
        this.loadPromise ??= Promise.all([
            loadJson<PlayerConfig>('data/player_config_fame_v3'),
            loadJson<PlayerOvrRangesConfig>('data/balance/player_ovr_ranges'),
            loadJson<MatchRewardsConfig>('data/balance/match_rewards'),
        ]).then(([playerConfig, playerOvrRanges, matchRewards]) => {
            if (
                !Array.isArray(playerConfig.players)
                || !Array.isArray(playerOvrRanges.ranges)
                || !Array.isArray(matchRewards.difficultyAnchors)
                || !Number.isFinite(
                    matchRewards.opponentProgression?.firstMatchPlayerOverallMultiplier,
                )
                || matchRewards.opponentProgression
                    .firstMatchPlayerOverallMultiplier <= 0
                || !Number.isFinite(
                    matchRewards.opponentProgression?.nextOpponentPlayerOverallMultiplier,
                )
                || matchRewards.opponentProgression
                    .nextOpponentPlayerOverallMultiplier <= 0
            ) {
                throw new Error('Invalid pre-match configuration.');
            }
            this.playerConfig = playerConfig;
            this.playerOvrRanges = playerOvrRanges;
            this.matchRewards = matchRewards;
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
        const playerOverall = calculateTeamOverall(
            roster,
            effects.headCoachBattleOvrBonus,
        );
        const opponentOverall = this.resolveOpponentOverall(
            seasonState,
            playerOverall,
        );
        const opponentRoster = this.createOpponentRoster(
            { ...scheduleMatch, opponentOvr: opponentOverall },
            getCurrentMatchId(seasonState),
        );
        const strongestOpponent = opponentRoster.reduce(
            (strongest, card) => !strongest || card.qualityId > strongest.qualityId
                ? card
                : strongest,
            null as PlayerCard | null,
        );
        const match = strongestOpponent
            ? {
                ...scheduleMatch,
                opponentOvr: opponentOverall,
                difficultyQualityId: strongestOpponent.qualityId,
                difficultyQualityName: strongestOpponent.qualityName,
            }
            : { ...scheduleMatch, opponentOvr: opponentOverall };
        const teamName = sys.localStorage.getItem(TEAM_NAME_STORAGE_KEY)?.trim()
            || '我的球队';
        const opponentTeamName = this.getOpponentTeamName(
            seasonState,
            opponentRoster,
        );
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
            matchId: getCurrentMatchId(seasonState),
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
            nextOpponentOverallMultiplier: this.matchRewards.opponentProgression
                .nextOpponentPlayerOverallMultiplier,
            operationPresidentBonus: effects.operationPresidentBudgetBonus,
            rewardMultiplier: match.rewardMultiplier,
            isStandardProgressionMatch: match.isStandardProgressionMatch,
            temporaryBonusPercent: 0,
        };
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
        match: MatchDefinition,
        matchId: string,
    ): PlayerCard[] {
        const poolsByQuality = new Map<number, PlayerTemplate[]>();
        const overalls = this.createOpponentOverallDistribution(match.opponentOvr);

        return overalls.map((overall, index) => {
            const quality = this.resolveOpponentQuality(overall, match);
            let pool = poolsByQuality.get(quality.qualityId);
            if (!pool) {
                const matchingPlayers = this.playerConfig!.players.filter(
                    (player) => player.quality === quality.qualityId,
                );
                pool = this.shuffleDeterministically(
                    matchingPlayers.length > 0
                        ? matchingPlayers
                        : this.playerConfig!.players,
                    this.getStableSeed(`${matchId}-${quality.qualityId}`),
                );
                poolsByQuality.set(quality.qualityId, pool);
            }
            const template = pool[index % pool.length];
            return {
                instanceId: `opponent-${matchId}-${index}`,
                templateId: template.id,
                sourcePlayerName: template.sourcePlayerName,
                displayName: template.displayName,
                position: template.position,
                qualityId: quality.qualityId,
                qualityName: quality.qualityName,
                overall,
                attributes: this.allocateAttributes(overall, template.attributes),
                acquiredAtMs: 0,
                lineupSinceMs: null,
            };
        });
    }

    private createOpponentOverallDistribution(totalOverall: number): number[] {
        const targetOverall = Math.max(0, Math.floor(totalOverall));
        const rookieMinimum = this.getQualityMinimumOverall(3);
        const drinkingWaterMinimum = this.getQualityMinimumOverall(4);
        const rotationMinimum = this.getQualityMinimumOverall(5);
        const minimumOveralls = [
            rotationMinimum,
            drinkingWaterMinimum,
            ...Array.from(
                { length: OPPONENT_ROSTER_SIZE - 2 },
                () => rookieMinimum,
            ),
        ];
        const minimumTotal = minimumOveralls.reduce((sum, value) => sum + value, 0);
        const baseOveralls = targetOverall >= minimumTotal
            ? minimumOveralls
            : Array.from({ length: OPPONENT_ROSTER_SIZE }, () => 0);
        const remainingOverall = Math.max(
            0,
            targetOverall - baseOveralls.reduce((sum, value) => sum + value, 0),
        );
        const totalWeight = OPPONENT_OVERALL_WEIGHTS.reduce(
            (sum, value) => sum + value,
            0,
        );
        const overalls = baseOveralls.map((baseOverall, index) => (
            baseOverall + Math.floor(
                remainingOverall * OPPONENT_OVERALL_WEIGHTS[index] / totalWeight,
            )
        ));
        let remainder = targetOverall - overalls.reduce((sum, value) => sum + value, 0);
        for (let index = 0; remainder > 0; index = (index + 1) % OPPONENT_ROSTER_SIZE) {
            overalls[index] += 1;
            remainder -= 1;
        }
        return overalls;
    }

    private getQualityMinimumOverall(qualityId: number): number {
        const range = this.playerOvrRanges!.ranges.find(
            (candidate) => candidate.qualityId === qualityId,
        );
        return Math.max(1, Math.floor(range?.minOvr ?? 1));
    }

    private resolveOpponentOverall(
        seasonState: SeasonState,
        playerOverall: number,
    ): number {
        const storedOverall = seasonState.nextOpponentOverall;
        if (storedOverall !== null && storedOverall > 0) {
            return Math.min(INT32_MAX, Math.floor(storedOverall));
        }
        return Math.min(
            INT32_MAX,
            Math.max(
                1,
                Math.floor(
                    playerOverall
                    * this.matchRewards!.opponentProgression
                        .firstMatchPlayerOverallMultiplier,
                ),
            ),
        );
    }

    private resolveOpponentQuality(
        overall: number,
        fallback: Pick<MatchDefinition, 'difficultyQualityId' | 'difficultyQualityName'>,
    ): Pick<PlayerCard, 'qualityId' | 'qualityName'> {
        const range = [...this.playerOvrRanges!.ranges]
            .filter((candidate) => (
                Number.isFinite(candidate.minOvr)
                && candidate.minOvr <= overall
            ))
            .sort((left, right) => right.qualityId - left.qualityId)[0];
        return range
            ? { qualityId: range.qualityId, qualityName: range.qualityName }
            : {
                qualityId: fallback.difficultyQualityId,
                qualityName: fallback.difficultyQualityName,
            };
    }

    private getOpponentTeamName(
        seasonState: SeasonState,
        opponentRoster: readonly PlayerCard[],
    ): string {
        if (seasonState.infiniteMode) {
            const strongestOpponent = opponentRoster.reduce(
                (strongest, card) => !strongest || card.overall > strongest.overall
                    ? card
                    : strongest,
                null as PlayerCard | null,
            );
            return strongestOpponent?.displayName ?? '概念神';
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
            overallLabel.overflow = Label.Overflow.SHRINK;
            overallLabel.enableWrapText = false;
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
        const playerEventController = this.node.parent?.getComponent(PlayerEventController) ?? null;
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
        let state = seed || 1;
        const random = (): number => {
            state ^= state << 13;
            state ^= state >>> 17;
            state ^= state << 5;
            return (state >>> 0) / 4_294_967_296;
        };
        for (let index = result.length - 1; index > 0; index -= 1) {
            const target = Math.floor(random() * (index + 1));
            [result[index], result[target]] = [result[target], result[index]];
        }
        return result;
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

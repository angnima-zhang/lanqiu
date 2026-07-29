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
    INT32_MAX,
    loadJson,
    loadRoster,
    loadSeasonState,
    PlayerAttributes,
    PlayerCard,
    TEAM_NAME_STORAGE_KEY,
} from './GameState';
import { loadPlayerPortrait } from './PlayerAssets';
import { formatPlayerOverall } from './RosterSlotView';
import {
    playFullScreenEntrance,
    stopFullScreenEntrance,
} from './FullScreenEntrance';
import { MatchController } from './MatchController';
import {
    MatchSessionSnapshot,
    setCurrentMatchSession,
} from './MatchSession';

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

interface MatchReward {
    matchNumber: number;
    opponentOvr: number;
}

interface MatchRewardSeason {
    seasonNumber: number;
    difficultyQualityId: number;
    difficultyQualityName: string;
    matches: MatchReward[];
}

interface MatchRewardsConfig {
    seasons: MatchRewardSeason[];
}

@ccclass('PreMatchController')
export class PreMatchController extends Component {
    public static instance: PreMatchController | null = null;

    private page: Node | null = null;
    private returnButton: Button | null = null;
    private startButton: Button | null = null;
    private playerTeamCardsRoot: Node | null = null;
    private opponentTeamCardsRoot: Node | null = null;
    private playerConfig: PlayerConfig | null = null;
    private matchRewards: MatchRewardsConfig | null = null;
    private loadPromise: Promise<void> | null = null;
    private cardRenderVersion = 0;
    private pageRequestVersion = 0;
    private playerCardButtons: Array<{ button: Button; callback: () => void }> = [];
    private preparedMatch: MatchSessionSnapshot | null = null;
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
            void playFullScreenEntrance(this.page, {
                backgroundNodes: this.namedChildren(['bg']),
                moduleGroups: [
                    { nodes: this.namedChildren(['顶部']), order: 0 },
                    { nodes: this.namedChildren(['双方阵容']), order: 1 },
                    { nodes: this.namedChildren(['管理层加成']), order: 2 },
                    { nodes: this.namedChildren(['底部按钮']), order: 3 },
                ],
            });
        }
    }

    public closePage = (): void => {
        this.pageRequestVersion += 1;
        this.cardRenderVersion += 1;
        if (this.page) {
            stopFullScreenEntrance(this.page);
            this.page.active = false;
        }
    };

    private ensureDataLoaded(): Promise<void> {
        this.loadPromise ??= Promise.all([
            loadJson<PlayerConfig>('data/player_config_fame_v3'),
            loadJson<MatchRewardsConfig>('data/balance/match_rewards'),
        ]).then(([playerConfig, matchRewards]) => {
            if (
                !Array.isArray(playerConfig.players)
                || !Array.isArray(matchRewards.seasons)
            ) {
                throw new Error('Invalid pre-match configuration.');
            }
            this.playerConfig = playerConfig;
            this.matchRewards = matchRewards;
        }).catch((error) => {
            console.error('[PreMatchController] Failed to load pre-match data.', error);
        });
        return this.loadPromise;
    }

    private async refreshPage(): Promise<void> {
        if (!this.page || !this.playerConfig || !this.matchRewards) {
            return;
        }
        const seasonState = loadSeasonState();
        const season = this.matchRewards.seasons.find(
            (item) => item.seasonNumber === seasonState.seasonNumber,
        ) ?? this.matchRewards.seasons[0];
        const match = season?.matches.find(
            (item) => item.matchNumber === seasonState.matchNumber,
        ) ?? season?.matches[0];
        if (!season || !match) {
            return;
        }

        const renderVersion = ++this.cardRenderVersion;
        const roster = loadRoster();
        const effects = await getManagementEffects();
        const playerOverall = calculateTeamOverall(
            roster,
            effects.headCoachBattleOvrBonus,
        );
        const opponentRoster = this.createOpponentRoster(
            season,
            match,
        );
        const teamName = sys.localStorage.getItem(TEAM_NAME_STORAGE_KEY)?.trim()
            || '我的球队';
        const occupiedRosterCount = roster.filter(Boolean).length;
        const goatCompleted = Boolean(seasonState.goatCompleted);

        this.setLabel(
            '顶部/赛程',
            goatCompleted
                ? '概念神赛程待开放'
                : `${season.difficultyQualityName}赛季 第${match.matchNumber}场`,
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
            `${season.difficultyQualityName}对手`,
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
        this.preparedMatch = goatCompleted ? null : {
            matchId: `${seasonState.seasonNumber}-${seasonState.matchNumber}`,
            seasonNumber: seasonState.seasonNumber,
            matchNumber: seasonState.matchNumber,
            difficultyQualityName: season.difficultyQualityName,
            playerTeamName: teamName,
            opponentTeamName: `${season.difficultyQualityName}对手`,
            playerRoster: roster,
            opponentRoster,
            playerOverall,
            opponentOverall: match.opponentOvr,
            operationPresidentBonus: effects.operationPresidentBudgetBonus,
            temporaryBonusPercent: 0,
        };
        if (this.startButton) {
            this.startButton.interactable = occupiedRosterCount >= 5
                && !this.startingMatch
                && Boolean(this.preparedMatch);
        }

        const playerCardNodes = this.playerTeamCardsRoot?.children ?? [];
        const opponentCardNodes = this.opponentTeamCardsRoot?.children ?? [];
        await Promise.all([
            ...playerCardNodes.slice(0, 12).map((node, index) => {
                return this.renderCompactCard(
                    node,
                    roster[index] ?? null,
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
        season: MatchRewardSeason,
        match: MatchReward,
    ): PlayerCard[] {
        const pool = this.playerConfig!.players.filter(
            (player) => player.quality === season.difficultyQualityId,
        );
        const fallbackPool = pool.length > 0 ? pool : this.playerConfig!.players;
        const shuffled = this.shuffleDeterministically(
            fallbackPool,
            season.seasonNumber * 10_000 + match.matchNumber,
        );
        const baseOverall = Math.floor(match.opponentOvr / 12);
        const remainder = Math.max(0, match.opponentOvr - baseOverall * 12);

        return Array.from({ length: 12 }, (_, index) => {
            const template = shuffled[index % shuffled.length];
            const overall = baseOverall + (index < remainder ? 1 : 0);
            return {
                instanceId: `opponent-${season.seasonNumber}-${match.matchNumber}-${index}`,
                templateId: template.id,
                sourcePlayerName: template.sourcePlayerName,
                displayName: template.displayName,
                position: template.position,
                qualityId: template.quality,
                qualityName: template.qualityName,
                overall,
                attributes: this.allocateAttributes(overall, template.attributes),
                acquiredAtMs: 0,
                lineupSinceMs: null,
            };
        });
    }

    private async renderCompactCard(
        root: Node,
        card: PlayerCard | null,
        renderVersion: number,
    ): Promise<void> {
        const portrait = root.getChildByName('头像')?.getComponent(Sprite) ?? null;
        const nameLabel = root.getChildByName('名字')?.getComponent(Label) ?? null;
        const overallLabel = root.getChildByName('总评')?.getComponent(Label) ?? null;
        if (!card) {
            if (portrait) {
                portrait.spriteFrame = null;
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
        const portraitFrame = await loadPlayerPortrait(card);
        if (renderVersion !== this.cardRenderVersion) {
            return;
        }
        if (portrait) {
            this.setPortraitFramePreservingAspect(portrait, portraitFrame);
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
                if (loadRoster()[index]) {
                    gameStateEvents.emit(
                        GAME_STATE_EVENT_PLAYER_DETAILS_REQUESTED,
                        index,
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
        ) {
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

    private setLabel(path: string, value: string): void {
        const label = this.findByPath(this.page, path)?.getComponent(Label);
        if (label) {
            label.string = value;
        }
    }

    private formatOverall(value: number): string {
        return value >= INT32_MAX ? 'MAX' : formatPlayerOverall(value);
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

import {
    _decorator,
    Button,
    Color,
    Component,
    director,
    Font,
    instantiate,
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
    advanceSeasonAfterWin,
    emitMatchSettled,
    INT32_MAX,
    loadSeasonState,
    PlayerCard,
    settleAdMatchReward,
    settleBaseMatchReward,
} from './GameState';
import {
    clearCurrentMatchSession,
    getCurrentMatchSession,
    MatchResultBand,
    MatchSessionSnapshot,
    setHomepageReturnTarget,
} from './MatchSession';
import {
    loadPlayerPortrait,
    loadRoundQualityFrame,
} from './PlayerAssets';
import { formatPlayerOverall } from './RosterSlotView';
import { showRewardedVideo } from './RewardedAdService';
import {
    playFullScreenEntrance,
    stopFullScreenEntrance,
} from './FullScreenEntrance';
import { setGrowingNumber } from './NumberGrowthAnimator';
import { applyGameFont } from '../loading/GameFont';
import { CourtSimulationController } from './CourtSimulationController';
import {
    MatchCourtSimulation,
    MatchCommentaryMention,
    MatchPlayAction,
    MatchPlayEvent,
    MatchReboundResult,
    MatchTactic,
} from './MatchCourtSimulation';

const { ccclass } = _decorator;

const MATCH_SECONDS = 120;
const QUARTER_SECONDS = 30;
const WIN_PREFAB_PATH = 'prefabs/比赛/胜利弹窗';
const LOSE_PREFAB_PATH = 'prefabs/比赛/失败弹窗';
const FONT_PATH = 'fonts/zpix';
const POSSESSIONS_PER_QUARTER = 10;
const MAX_TEAM_SCORE = 60;

interface MatchResult {
    band: MatchResultBand;
    won: boolean;
    forcedWin: boolean;
    playerFinalScore: number;
    opponentFinalScore: number;
    playerQuarterScores: number[];
    opponentQuarterScores: number[];
}

interface CommentaryLine {
    time: string;
    richText: string;
}

@ccclass('MatchController')
export class MatchController extends Component {
    private page: Node | null = null;
    private session: MatchSessionSnapshot | null = null;
    private result: MatchResult | null = null;
    private victoryPage: Node | null = null;
    private defeatPage: Node | null = null;
    private doubleSpeedButton: Button | null = null;
    private forcedWinButton: Button | null = null;
    private skipButton: Button | null = null;
    private speedMultiplier = 1;
    private requestedSpeedMultiplier = 1;
    private elapsedMatchSeconds = 0;
    private commentaryLines: CommentaryLine[] = [];
    private plannedPlays: MatchPlayEvent[] = [];
    private nextPlayIndex = 0;
    private playerQuarterScores = [0, 0, 0, 0];
    private opponentQuarterScores = [0, 0, 0, 0];
    private readonly awardedPointsByPlay = new Map<number, number>();
    private readonly commentaryTeamColors: [Color, Color] = [
        new Color(65, 147, 132, 255),
        new Color(204, 87, 40, 255),
    ];
    private courtSimulation: MatchCourtSimulation | null = null;
    private initialized = false;
    private finished = false;
    private adProcessing = false;
    private retryCount = 0;
    private readonly originalButtonGrayscale = new WeakMap<Sprite, boolean>();

    protected onLoad(): void {
        this.page = this.node.getChildByName('比赛页面');
        this.session = getCurrentMatchSession();
        if (!this.page || !this.session) {
            console.error('[MatchController] Missing match page or prepared match session.');
            this.enabled = false;
            return;
        }

        const simulation = this.findByPath(this.page, '球场模拟')
            ?.getComponent(CourtSimulationController);
        if (simulation) {
            simulation.enabled = false;
        }
        this.resolveButtons();
        this.prepareButtonVisuals(this.node);
    }

    protected onEnable(): void {
        this.doubleSpeedButton?.node.on(
            Button.EventType.CLICK,
            this.toggleDoubleSpeed,
            this,
        );
        this.forcedWinButton?.node.on(
            Button.EventType.CLICK,
            this.onForcedWinClicked,
            this,
        );
        this.skipButton?.node.on(Button.EventType.CLICK, this.skipMatch, this);
    }

    protected start(): void {
        void this.initialize();
    }

    protected update(deltaTime: number): void {
        if (!this.initialized || this.finished || !this.result) {
            return;
        }
        this.elapsedMatchSeconds = Math.min(
            MATCH_SECONDS,
            this.elapsedMatchSeconds + deltaTime * this.speedMultiplier,
        );
        this.refreshClockPresentation();
        this.startDueCourtPlay();
        if (
            this.elapsedMatchSeconds >= MATCH_SECONDS
            && this.nextPlayIndex >= this.plannedPlays.length
            && !this.courtSimulation?.isBusy
        ) {
            this.finishMatch();
        }
    }

    protected onDisable(): void {
        this.doubleSpeedButton?.node.off(
            Button.EventType.CLICK,
            this.toggleDoubleSpeed,
            this,
        );
        this.forcedWinButton?.node.off(
            Button.EventType.CLICK,
            this.onForcedWinClicked,
            this,
        );
        this.skipButton?.node.off(Button.EventType.CLICK, this.skipMatch, this);
        this.stopAllMotion();
    }

    private async initialize(): Promise<void> {
        try {
            const [victoryPrefab, defeatPrefab, font] = await Promise.all([
                this.loadResource<Prefab>(WIN_PREFAB_PATH, Prefab),
                this.loadResource<Prefab>(LOSE_PREFAB_PATH, Prefab),
                this.loadResource<Font>(FONT_PATH, Font),
            ]);
            if (!this.isValid || !this.page || !this.session) {
                return;
            }
            this.victoryPage = instantiate(victoryPrefab);
            this.defeatPage = instantiate(defeatPrefab);
            this.node.addChild(this.victoryPage);
            this.node.addChild(this.defeatPage);
            this.victoryPage.active = false;
            this.defeatPage.active = false;
            applyGameFont(this.node.scene, font);
            this.bindResultButtons();
            await this.bindCourtPlayers();
            this.startPreparedMatch();
        } catch (error) {
            console.error('[MatchController] Failed to initialize match.', error);
        }
    }

    private startPreparedMatch(forceWin = false): void {
        if (!this.session) {
            return;
        }
        this.stopAllMotion();
        this.finished = false;
        this.adProcessing = false;
        this.speedMultiplier = 1;
        this.requestedSpeedMultiplier = 1;
        this.elapsedMatchSeconds = 0;
        this.commentaryLines = [];
        this.nextPlayIndex = 0;
        this.playerQuarterScores = [0, 0, 0, 0];
        this.opponentQuarterScores = [0, 0, 0, 0];
        this.awardedPointsByPlay.clear();
        this.result = this.createMatchResult(forceWin);
        this.plannedPlays = this.createPlayPlan(this.result);
        this.victoryPage && (this.victoryPage.active = false);
        this.defeatPage && (this.defeatPage.active = false);
        this.setButtonLabel(this.doubleSpeedButton, '二倍速');
        if (this.forcedWinButton) {
            this.forcedWinButton.node.active = this.result.band === 'uncertain'
                && !this.result.won;
            this.setButtonAvailable(
                this.forcedWinButton,
                this.forcedWinButton.node.active,
            );
        }
        this.refreshTeamIdentity();
        this.refreshScorePresentation(false);
        this.refreshClockPresentation();
        this.pushCommentary(
            0,
            forceWin
                ? '广告助威生效，球队士气被彻底点燃，比赛从第一节重新开始！'
                : this.retryCount > 0
                    ? `广告加成生效，本场球队总评临时提升${this.session.temporaryBonusPercent}%！`
                    : `${this.session.playerTeamName}与${this.session.opponentTeamName}的比赛正式开始！`,
        );
        this.courtSimulation?.reset(this.plannedPlays[0]?.offenseTeam ?? 0);
        this.initialized = true;
        this.startDueCourtPlay();
    }

    private createMatchResult(forceWin: boolean): MatchResult {
        const session = this.session!;
        const effectivePlayerOverall = Math.min(
            INT32_MAX,
            Math.floor(
                session.playerOverall
                * (1 + Math.max(0, session.temporaryBonusPercent) / 100),
            ),
        );
        const fullConceptLineup = session.playerRoster.length >= 12
            && session.playerRoster.every((card) => card?.isConceptGod);
        const ratio = session.opponentOverall > 0
            ? effectivePlayerOverall / session.opponentOverall
            : Number.POSITIVE_INFINITY;
        const band: MatchResultBand = fullConceptLineup
            ? 'full-concept'
            : ratio >= 1.1
                ? 'auto-win'
                : ratio <= 0.9
                    ? 'auto-lose'
                    : 'uncertain';
        const random = this.createSeededRandom(
            `${session.matchId}:${this.retryCount}:${session.temporaryBonusPercent}`,
        );
        const won = forceWin
            || band === 'full-concept'
            || band === 'auto-win'
            || (band === 'uncertain' && random() < 0.5);
        const rawPlayerScore = this.calculateRawScore(
            session.playerRoster,
            random,
        );
        const rawOpponentScore = this.calculateRawScore(
            session.opponentRoster,
            random,
        );
        const gapRatio = Math.abs(effectivePlayerOverall - session.opponentOverall)
            / Math.max(1, effectivePlayerOverall, session.opponentOverall);
        const winnerRaw = won ? rawPlayerScore : rawOpponentScore;
        const loserRaw = won ? rawOpponentScore : rawPlayerScore;
        const uncappedMargin = Math.max(
            1,
            Math.ceil(winnerRaw * (0.01 + gapRatio * 0.25 + random() * 0.03)),
        );
        const requiredMargin = band === 'uncertain'
            ? Math.min(
                uncappedMargin,
                Math.max(1, Math.ceil(winnerRaw * 0.12)),
            )
            : uncappedMargin;
        const cappedLoserScore = Math.min(INT32_MAX - 1, loserRaw);
        const winnerScore = Math.min(
            INT32_MAX,
            Math.max(winnerRaw, cappedLoserScore + requiredMargin),
        );
        const uncappedPlayerScore = won ? winnerScore : cappedLoserScore;
        const uncappedOpponentScore = won ? cappedLoserScore : winnerScore;
        const [playerFinalScore, opponentFinalScore] = this.normalizeVisibleScores(
            uncappedPlayerScore,
            uncappedOpponentScore,
            won,
        );
        return {
            band,
            won,
            forcedWin: forceWin,
            playerFinalScore,
            opponentFinalScore,
            playerQuarterScores: this.distributeQuarterScores(playerFinalScore, random),
            opponentQuarterScores: this.distributeQuarterScores(opponentFinalScore, random),
        };
    }

    private calculateRawScore(
        roster: ReadonlyArray<PlayerCard | null>,
        random: () => number,
    ): number {
        const active = roster.filter((card): card is PlayerCard => Boolean(card));
        if (active.length === 0) {
            return 0;
        }
        const scoringSum = active.reduce(
            (total, card) => total + Math.max(0, card.attributes.scoring),
            0,
        );
        return Math.min(
            INT32_MAX,
            Math.floor(
                scoringSum / active.length
                * 5
                * 0.1
                * (0.9 + random() * 0.2),
            ),
        );
    }

    private distributeQuarterScores(
        total: number,
        random: () => number,
    ): number[] {
        const scores = Array.from({ length: 4 }, () => Math.floor(total / 4));
        let remainder = total % 4;
        const order = [0, 1, 2, 3].sort(() => random() - 0.5);
        for (let index = 0; remainder > 0; index += 1, remainder -= 1) {
            scores[order[index % order.length]] += 1;
        }
        return scores;
    }

    private normalizeVisibleScores(
        playerScore: number,
        opponentScore: number,
        playerWon: boolean,
    ): [number, number] {
        const highest = Math.max(1, playerScore, opponentScore);
        const scale = Math.min(1, MAX_TEAM_SCORE / highest);
        let player = playerScore > 0
            ? Math.max(1, Math.floor(playerScore * scale))
            : 0;
        let opponent = opponentScore > 0
            ? Math.max(1, Math.floor(opponentScore * scale))
            : 0;
        if (playerWon && player <= opponent) {
            if (opponent >= MAX_TEAM_SCORE) {
                opponent = MAX_TEAM_SCORE - 1;
            }
            player = Math.min(MAX_TEAM_SCORE, opponent + 1);
        } else if (!playerWon && opponent <= player) {
            if (player >= MAX_TEAM_SCORE) {
                player = MAX_TEAM_SCORE - 1;
            }
            opponent = Math.min(MAX_TEAM_SCORE, player + 1);
        }
        return [player, opponent];
    }

    private createPlayPlan(result: MatchResult): MatchPlayEvent[] {
        const random = this.createSeededRandom(
            `${this.session?.matchId}:plays:${this.retryCount}:${result.forcedWin}`,
        );
        const plays: MatchPlayEvent[] = [];
        const tactics: MatchTactic[] = [
            'five-out',
            'four-out-one-in',
            'pick-and-roll',
            'low-post',
            'horns',
        ];
        let offenseTeam = random() < 0.5 ? 0 : 1;
        let lastTactic: MatchTactic | null = null;
        for (let quarter = 0; quarter < 4; quarter += 1) {
            const teamPoints = [
                this.createPossessionPoints(
                    result.playerQuarterScores[quarter],
                    random,
                ),
                this.createPossessionPoints(
                    result.opponentQuarterScores[quarter],
                    random,
                ),
            ];
            const teamTurns = [0, 0];
            for (
                let possession = 0;
                possession < POSSESSIONS_PER_QUARTER;
                possession += 1
            ) {
                const points = teamPoints[offenseTeam][teamTurns[offenseTeam]];
                teamTurns[offenseTeam] += 1;
                const tacticCandidates = lastTactic
                    ? tactics.filter((tactic) => tactic !== lastTactic)
                    : tactics;
                const tactic = tacticCandidates[
                    Math.floor(random() * tacticCandidates.length)
                ];
                lastTactic = tactic;
                const action = this.pickPlayAction(points, random);
                const rebound = this.pickReboundResult(random);
                plays.push({
                    index: plays.length,
                    quarter,
                    startSecond: quarter * QUARTER_SECONDS
                        + possession * (
                            QUARTER_SECONDS / POSSESSIONS_PER_QUARTER
                        ),
                    offenseTeam,
                    tactic,
                    action,
                    points,
                    shooterIndex: Math.floor(random() * 5),
                    handlerIndex: Math.floor(random() * 5),
                    passerIndex: Math.floor(random() * 5),
                    made: points > 0,
                    foul: action === 'free-throw' || action === 'and-one',
                    rebound,
                    contestedRebound: random() < 0.58,
                });
                offenseTeam = 1 - offenseTeam;
            }
        }
        return plays;
    }

    private createPossessionPoints(
        total: number,
        random: () => number,
    ): number[] {
        const points = [0, 0, 0, 0, 0];
        let remaining = Math.max(0, Math.min(15, total));
        for (let index = 0; index < points.length; index += 1) {
            const slotsAfter = points.length - index - 1;
            const minimum = Math.max(0, remaining - slotsAfter * 3);
            const maximum = Math.min(3, remaining);
            if (maximum <= minimum) {
                points[index] = minimum;
            } else {
                const choices = Array.from(
                    { length: maximum - minimum + 1 },
                    (_, choice) => minimum + choice,
                );
                const preferred = choices.filter((value) => (
                    value === 0
                    || value === 2
                    || value === 3
                    || remaining === 1
                ));
                const pool = preferred.length > 0 ? preferred : choices;
                points[index] = pool[Math.floor(random() * pool.length)];
            }
            remaining -= points[index];
        }
        return points.sort(() => random() - 0.5);
    }

    private pickPlayAction(
        points: number,
        random: () => number,
    ): MatchPlayAction {
        if (points === 3) {
            return random() < 0.84 ? 'three' : 'and-one';
        }
        if (points === 2) {
            if (random() < 0.14) {
                return 'free-throw';
            }
            const actions: MatchPlayAction[] = ['jumper', 'layup', 'dunk'];
            return actions[Math.floor(random() * actions.length)];
        }
        if (points === 1) {
            return 'free-throw';
        }
        const roll = random();
        if (roll < 0.18) {
            return 'turnover';
        }
        if (roll < 0.26) {
            return 'free-throw';
        }
        const misses: MatchPlayAction[] = [
            'three',
            'jumper',
            'layup',
            'dunk',
        ];
        return misses[Math.floor(random() * misses.length)];
    }

    private pickReboundResult(
        random: () => number,
    ): MatchReboundResult {
        const roll = random();
        if (roll < 0.16) {
            return 'self';
        }
        if (roll < 0.42) {
            return 'teammate';
        }
        return 'opponent';
    }

    private startDueCourtPlay(): void {
        if (
            !this.courtSimulation
            || this.courtSimulation.isBusy
            || this.nextPlayIndex >= this.plannedPlays.length
        ) {
            return;
        }
        const play = this.plannedPlays[this.nextPlayIndex];
        if (play.startSecond > this.elapsedMatchSeconds + 0.001) {
            return;
        }
        if (this.courtSimulation.play(play, this.speedMultiplier)) {
            this.nextPlayIndex += 1;
        }
    }

    private onCourtScore = (
        team: number,
        points: number,
        event: MatchPlayEvent,
    ): void => {
        if (this.finished || points <= 0) {
            return;
        }
        const awarded = this.awardedPointsByPlay.get(event.index) ?? 0;
        const available = Math.max(0, event.points - awarded);
        const actualPoints = Math.min(points, available);
        if (actualPoints <= 0) {
            return;
        }
        const quarterScores = team === 0
            ? this.playerQuarterScores
            : this.opponentQuarterScores;
        quarterScores[event.quarter] += actualPoints;
        this.awardedPointsByPlay.set(event.index, awarded + actualPoints);
        this.refreshScorePresentation(true);
    };

    private onCourtCommentary = (
        text: string,
        event: MatchPlayEvent,
        mentions: readonly MatchCommentaryMention[],
    ): void => {
        this.pushCommentary(
            Math.max(event.startSecond, this.elapsedMatchSeconds),
            text,
            mentions,
        );
    };

    private onCourtPlayComplete = (): void => {
        this.speedMultiplier = this.requestedSpeedMultiplier;
        this.startDueCourtPlay();
    };

    private refreshScorePresentation(animateGrowth: boolean): void {
        if (!this.page) {
            return;
        }
        for (let index = 0; index < 4; index += 1) {
            this.setGrowingScoreLabel(
                `比分/每节比分/Q${index + 1}/自己`,
                this.playerQuarterScores[index],
                animateGrowth,
            );
            this.setGrowingScoreLabel(
                `比分/每节比分/Q${index + 1}/对方`,
                this.opponentQuarterScores[index],
                animateGrowth,
            );
        }
        this.setGrowingScoreLabel(
            '比分/总比分/自己',
            this.playerQuarterScores.reduce((sum, value) => sum + value, 0),
            animateGrowth,
        );
        this.setGrowingScoreLabel(
            '比分/总比分/对方',
            this.opponentQuarterScores.reduce((sum, value) => sum + value, 0),
            animateGrowth,
        );
    }

    private refreshClockPresentation(): void {
        if (!this.page) {
            return;
        }
        const quarterIndex = Math.min(
            3,
            Math.floor(this.elapsedMatchSeconds / QUARTER_SECONDS),
        );
        const quarterElapsed = this.elapsedMatchSeconds >= MATCH_SECONDS
            ? QUARTER_SECONDS
            : this.elapsedMatchSeconds % QUARTER_SECONDS;
        const secondsRemaining = Math.max(
            0,
            Math.ceil(QUARTER_SECONDS - quarterElapsed),
        );
        this.setLabel(
            '标题',
            `第${quarterIndex + 1}节 ${this.formatClock(secondsRemaining)}`,
        );
    }

    private refreshTeamIdentity(): void {
        const session = this.session!;
        this.setLabel('比分/我的球队/球队简称/Label', Array.from(session.playerTeamName)[0] ?? '我');
        this.setLabel('比分/我的球队/球队名', session.playerTeamName);
        this.setLabel('比分/对方球队/球队简称/Label', Array.from(session.opponentTeamName)[0] ?? '敌');
        this.setLabel('比分/对方球队/球队名', session.opponentTeamName);
        this.captureCommentaryTeamColors();
        for (let index = 0; index < 4; index += 1) {
            this.setLabel(`比分/每节比分/Q${index + 1}/自己`, '0');
            this.setLabel(`比分/每节比分/Q${index + 1}/对方`, '0');
        }
    }

    private pushCommentary(
        matchSecond: number,
        text: string,
        mentions: readonly MatchCommentaryMention[] = [],
    ): void {
        if (!this.session || !text) {
            return;
        }
        this.commentaryLines.push({
            time: this.formatClock(Math.floor(matchSecond)),
            richText: this.createRichCommentary(text, mentions),
        });
        this.commentaryLines = this.commentaryLines.slice(-5);
        const slots = ['过去01', '过去02', '过去03', '过去04', '最新'];
        slots.forEach((slot, index) => {
            const line = this.commentaryLines[
                this.commentaryLines.length - slots.length + index
            ];
            this.setLabel(`文字播报/${slot}/时间`, line?.time ?? '--:--');
            this.setCommentaryRichText(
                `文字播报/${slot}/播报内容`,
                line?.richText ?? '',
            );
        });
    }

    private async bindCourtPlayers(): Promise<void> {
        if (!this.page || !this.session) {
            return;
        }
        const playersRoot = this.findByPath(this.page, '球场模拟/players');
        if (!playersRoot) {
            return;
        }
        const actors = [
            ...playersRoot.children.filter((node) => /^我方球员\d+$/.test(node.name)),
            ...playersRoot.children.filter((node) => /^敌方球员\d+$/.test(node.name)),
        ].slice(0, 10);
        const playerCards = this.getTopFive(this.session.playerRoster);
        const opponentCards = this.getTopFive(this.session.opponentRoster);
        const cards = [...playerCards, ...opponentCards];
        await Promise.all(actors.map(async (actor, index) => {
            const card = cards[index] ?? null;
            actor.active = Boolean(card);
            if (!card) {
                return;
            }
            const portrait = actor.getChildByName('头像')?.getComponent(Sprite);
            const frame = actor.getChildByName('边框')?.getComponent(Sprite);
            const overall = actor.getChildByName('ovr')?.getComponent(Label);
            const [portraitFrame, frameAsset] = await Promise.all([
                loadPlayerPortrait(card),
                loadRoundQualityFrame(card.qualityId),
            ]);
            if (portrait) {
                portrait.spriteFrame = portraitFrame;
            }
            if (frame && frameAsset) {
                frame.spriteFrame = frameAsset;
            }
            if (overall) {
                overall.string = card.overall >= INT32_MAX
                    ? 'MAX'
                    : formatPlayerOverall(card.overall);
            }
            for (const anchorName of [
                '持球点-右',
                '运球点-右',
                '投射点-右',
                '持球点-左',
                '运球点-左',
                '投射点-左',
            ]) {
                const anchor = actor.getChildByName(anchorName);
                if (anchor) {
                    anchor.active = false;
                }
            }
        }));
        const courtRange = this.findByPath(this.page, '球场模拟/球场范围');
        const ball = this.findByPath(this.page, '球场模拟/篮球');
        if (!courtRange || !ball) {
            console.error('[MatchController] Match court markers or ball are incomplete.');
            return;
        }
        this.courtSimulation = new MatchCourtSimulation(
            playersRoot,
            courtRange,
            ball,
            playerCards,
            opponentCards,
            {
                onScore: this.onCourtScore,
                onCommentary: this.onCourtCommentary,
                onPlayComplete: this.onCourtPlayComplete,
            },
        );
        if (!this.courtSimulation.isReady) {
            console.error('[MatchController] Match court simulation references are incomplete.');
            this.courtSimulation = null;
        }
    }

    private finishMatch(): void {
        if (this.finished || !this.result || !this.session) {
            return;
        }
        this.finished = true;
        this.elapsedMatchSeconds = MATCH_SECONDS;
        this.refreshClockPresentation();
        this.refreshScorePresentation(false);
        this.stopAllMotion();
        if (this.forcedWinButton) {
            this.forcedWinButton.node.active = false;
        }
        if (this.result.won) {
            this.showVictory();
        } else {
            this.showDefeat();
        }
    }

    private showVictory(): void {
        if (!this.victoryPage || !this.result || !this.session) {
            return;
        }
        const reward = this.calculateMatchReward();
        const baseSettled = settleBaseMatchReward(this.session.matchId, reward);
        const advanced = advanceSeasonAfterWin(this.session.matchId);
        emitMatchSettled({
            matchId: this.session.matchId,
            won: true,
            baseReward: baseSettled ? reward : 0,
            adReward: 0,
            advanced,
        });
        this.setResultPageLabels(this.victoryPage);
        const rewardLabel = this.findByPath(
            this.victoryPage,
            '本场奖励/管理层-选中背景/获得数值',
        )?.getComponent(Label) ?? null;
        setGrowingNumber(
            rewardLabel,
            reward,
            (value) => `+${formatPlayerOverall(Math.floor(value))}`,
            { from: 0, animateGrowth: true },
        );
        this.setNodeLabel(this.victoryPage, '看广告双倍领取/数值', formatPlayerOverall(reward));
        const adButton = this.victoryPage
            .getChildByName('看广告双倍领取')
            ?.getComponent(Button);
        if (adButton) {
            this.setButtonAvailable(
                adButton,
                loadSeasonState().lastAdRewardMatchId !== this.session.matchId,
            );
        }
        void playFullScreenEntrance(this.victoryPage, {
            backgroundNodes: this.nodes(this.victoryPage, ['遮罩', 'bg']),
            moduleGroups: [
                { nodes: this.nodes(this.victoryPage, ['顶部装饰']), order: 0 },
                { nodes: this.nodes(this.victoryPage, ['赛程']), order: 1 },
                { nodes: this.nodes(this.victoryPage, ['比分']), order: 2 },
                { nodes: this.nodes(this.victoryPage, ['本场奖励']), order: 3 },
                { nodes: this.nodes(this.victoryPage, ['看广告双倍领取']), order: 4 },
                {
                    nodes: this.nodes(this.victoryPage, ['继续下一场', '返回']),
                    order: 5,
                },
            ],
        });
    }

    private showDefeat(): void {
        if (!this.defeatPage || !this.result || !this.session) {
            return;
        }
        emitMatchSettled({
            matchId: this.session.matchId,
            won: false,
            baseReward: 0,
            adReward: 0,
            advanced: false,
        });
        this.setResultPageLabels(this.defeatPage);
        void playFullScreenEntrance(this.defeatPage, {
            backgroundNodes: this.nodes(this.defeatPage, ['遮罩', 'bg']),
            moduleGroups: [
                { nodes: this.nodes(this.defeatPage, ['失败']), order: 0 },
                { nodes: this.nodes(this.defeatPage, ['赛程']), order: 1 },
                { nodes: this.nodes(this.defeatPage, ['比分']), order: 2 },
                {
                    nodes: this.nodes(this.defeatPage, ['看广告获得加成重来']),
                    order: 3,
                },
                { nodes: this.nodes(this.defeatPage, ['调整阵容']), order: 4 },
            ],
        });
    }

    private setResultPageLabels(page: Node): void {
        if (!this.session || !this.result) {
            return;
        }
        this.setNodeLabel(
            page,
            '赛程/赛程',
            `${this.session.difficultyQualityName}赛季 第${this.session.matchNumber}场`,
        );
        this.setNodeLabel(page, '比分/总比分/自己', String(this.result.playerFinalScore));
        this.setNodeLabel(page, '比分/总比分/对方', String(this.result.opponentFinalScore));
        this.setNodeLabel(page, '比分/自己球队名', this.session.playerTeamName);
        this.setNodeLabel(page, '比分/对手球队名', this.session.opponentTeamName);
    }

    private bindResultButtons(): void {
        const victoryAd = this.victoryPage
            ?.getChildByName('看广告双倍领取')
            ?.getComponent(Button);
        const victoryContinue = this.victoryPage
            ?.getChildByName('继续下一场')
            ?.getComponent(Button);
        const victoryReturn = this.victoryPage
            ?.getChildByName('返回')
            ?.getComponent(Button);
        const defeatAd = this.defeatPage
            ?.getChildByName('看广告获得加成重来')
            ?.getComponent(Button);
        const defeatAdjust = this.defeatPage
            ?.getChildByName('调整阵容')
            ?.getComponent(Button);
        victoryAd?.node.on(Button.EventType.CLICK, this.claimVictoryAdReward, this);
        victoryContinue?.node.on(
            Button.EventType.CLICK,
            () => this.returnToHomepage(true),
            this,
        );
        victoryReturn?.node.on(
            Button.EventType.CLICK,
            () => this.returnToHomepage(false),
            this,
        );
        defeatAd?.node.on(Button.EventType.CLICK, this.retryWithAdBonus, this);
        defeatAdjust?.node.on(
            Button.EventType.CLICK,
            () => this.returnToHomepage(true),
            this,
        );
        this.prepareButtonVisuals(this.node);
    }

    private claimVictoryAdReward = (): void => {
        void this.claimVictoryAdRewardAsync();
    };

    private async claimVictoryAdRewardAsync(): Promise<void> {
        if (this.adProcessing || !this.session || !this.victoryPage) {
            return;
        }
        const button = this.victoryPage
            .getChildByName('看广告双倍领取')
            ?.getComponent(Button);
        this.adProcessing = true;
        this.setButtonAvailable(button ?? null, false);
        try {
            const completed = await showRewardedVideo();
            if (!completed) {
                return;
            }
            const reward = this.calculateMatchReward();
            if (settleAdMatchReward(this.session.matchId, reward)) {
                emitMatchSettled({
                    matchId: this.session.matchId,
                    won: true,
                    baseReward: 0,
                    adReward: reward,
                    advanced: false,
                });
            }
        } finally {
            this.adProcessing = false;
            if (button && this.session) {
                this.setButtonAvailable(
                    button,
                    loadSeasonState().lastAdRewardMatchId !== this.session.matchId,
                );
            }
        }
    }

    private retryWithAdBonus = (): void => {
        void this.retryWithAdBonusAsync();
    };

    private async retryWithAdBonusAsync(): Promise<void> {
        if (this.adProcessing || !this.session || !this.defeatPage) {
            return;
        }
        const button = this.defeatPage
            .getChildByName('看广告获得加成重来')
            ?.getComponent(Button);
        this.adProcessing = true;
        this.setButtonAvailable(button ?? null, false);
        try {
            const completed = await showRewardedVideo();
            if (!completed) {
                return;
            }
            this.retryCount += 1;
            this.session.temporaryBonusPercent = Math.floor(Math.random() * 20) + 1;
            stopFullScreenEntrance(this.defeatPage);
            this.defeatPage.active = false;
            this.startPreparedMatch();
        } finally {
            this.adProcessing = false;
            if (button?.isValid) {
                this.setButtonAvailable(button, true);
            }
        }
    }

    private onForcedWinClicked = (): void => {
        void this.forceWinWithAd();
    };

    private async forceWinWithAd(): Promise<void> {
        if (
            this.adProcessing
            || !this.result
            || this.result.band !== 'uncertain'
            || this.result.won
        ) {
            return;
        }
        this.adProcessing = true;
        this.setButtonAvailable(this.forcedWinButton, false);
        try {
            const completed = await showRewardedVideo();
            if (!completed) {
                return;
            }
            this.startPreparedMatch(true);
            if (this.forcedWinButton) {
                this.forcedWinButton.node.active = false;
            }
        } finally {
            this.adProcessing = false;
            if (
                this.forcedWinButton
                && this.forcedWinButton.node.active
                && this.result
            ) {
                this.setButtonAvailable(
                    this.forcedWinButton,
                    !this.result.won,
                );
            }
        }
    }

    private toggleDoubleSpeed = (): void => {
        this.requestedSpeedMultiplier = this.requestedSpeedMultiplier === 1
            ? 2
            : 1;
        if (!this.courtSimulation?.isBusy) {
            this.speedMultiplier = this.requestedSpeedMultiplier;
        }
        this.setButtonLabel(
            this.doubleSpeedButton,
            this.requestedSpeedMultiplier === 2 ? '一倍速' : '二倍速',
        );
    };

    private skipMatch = (): void => {
        if (!this.initialized || this.finished) {
            return;
        }
        this.settleRemainingPlays();
        this.elapsedMatchSeconds = MATCH_SECONDS;
        this.finishMatch();
    };

    private settleRemainingPlays(): void {
        this.courtSimulation?.settleImmediately();
        for (const play of this.plannedPlays) {
            const awarded = this.awardedPointsByPlay.get(play.index) ?? 0;
            const remaining = Math.max(0, play.points - awarded);
            if (remaining <= 0) {
                continue;
            }
            const scores = play.offenseTeam === 0
                ? this.playerQuarterScores
                : this.opponentQuarterScores;
            scores[play.quarter] += remaining;
            this.awardedPointsByPlay.set(play.index, play.points);
        }
        this.nextPlayIndex = this.plannedPlays.length;
        this.refreshScorePresentation(false);
    }

    private returnToHomepage(openPreMatch: boolean): void {
        clearCurrentMatchSession();
        setHomepageReturnTarget(openPreMatch ? 'pre-match' : 'home');
        director.loadScene('Homepage');
    }

    private calculateMatchReward(): number {
        const session = this.session!;
        const baseReward = Math.max(1, Math.ceil(session.opponentOverall / 696));
        return Math.ceil(
            baseReward * (1 + Math.max(0, session.operationPresidentBonus)),
        );
    }

    private resolveButtons(): void {
        this.doubleSpeedButton = this.page
            ?.getChildByName('二倍速')
            ?.getComponent(Button) ?? null;
        this.forcedWinButton = this.page
            ?.getChildByName('看广告获胜')
            ?.getComponent(Button) ?? null;
        this.skipButton = this.page
            ?.getChildByName('跳过')
            ?.getComponent(Button) ?? null;
    }

    private prepareButtonVisuals(root: Node): void {
        for (const button of root.getComponentsInChildren(Button)) {
            button.hoverSprite = null;
            button.pressedSprite = null;
            button.disabledSprite = null;
            const sprite = button.target?.getComponent(Sprite)
                ?? button.node.getComponent(Sprite);
            if (sprite) {
                if (!this.originalButtonGrayscale.has(sprite)) {
                    this.originalButtonGrayscale.set(sprite, sprite.grayscale);
                }
                sprite.grayscale = button.interactable
                    ? this.originalButtonGrayscale.get(sprite)!
                    : true;
            }
        }
    }

    private setButtonAvailable(button: Button | null, available: boolean): void {
        if (!button) {
            return;
        }
        button.enabled = true;
        button.interactable = available;
        button.hoverSprite = null;
        button.pressedSprite = null;
        button.disabledSprite = null;
        const sprite = button.target?.getComponent(Sprite)
            ?? button.node.getComponent(Sprite);
        if (!sprite) {
            return;
        }
        if (!this.originalButtonGrayscale.has(sprite)) {
            this.originalButtonGrayscale.set(sprite, sprite.grayscale);
        }
        sprite.grayscale = available
            ? this.originalButtonGrayscale.get(sprite)!
            : true;
    }

    private setButtonLabel(button: Button | null, value: string): void {
        const label = button?.node.getChildByName('Label')?.getComponent(Label);
        if (label) {
            label.string = value;
        }
    }

    private setLabel(path: string, value: string): void {
        this.setNodeLabel(this.page, path, value);
    }

    private setGrowingScoreLabel(
        path: string,
        value: number,
        animateGrowth: boolean,
    ): void {
        const label = this.findByPath(this.page, path)?.getComponent(Label) ?? null;
        setGrowingNumber(
            label,
            value,
            (displayed) => String(Math.floor(displayed)),
            { animateGrowth },
        );
    }

    private setNodeLabel(root: Node | null, path: string, value: string): void {
        const label = this.findByPath(root, path)?.getComponent(Label);
        if (label) {
            label.string = value;
        }
    }

    private captureCommentaryTeamColors(): void {
        const ownColor = this.findByPath(
            this.page,
            '比分/我的球队/球队名',
        )?.getComponent(Label)?.color;
        const opponentColor = this.findByPath(
            this.page,
            '比分/对方球队/球队名',
        )?.getComponent(Label)?.color;
        if (ownColor) {
            this.commentaryTeamColors[0].set(ownColor);
        }
        if (opponentColor) {
            this.commentaryTeamColors[1].set(opponentColor);
        }
    }

    private createRichCommentary(
        text: string,
        mentions: readonly MatchCommentaryMention[],
    ): string {
        let cursor = 0;
        let result = '';
        for (const mention of mentions) {
            const index = text.indexOf(mention.name, cursor);
            if (index < 0) {
                continue;
            }
            result += this.escapeRichText(text.slice(cursor, index));
            result += `<color=${this.colorToHex(
                this.commentaryTeamColors[mention.team === 1 ? 1 : 0],
            )}>${this.escapeRichText(mention.name)}</color>`;
            cursor = index + mention.name.length;
        }
        result += this.escapeRichText(text.slice(cursor));
        return result;
    }

    private setCommentaryRichText(path: string, value: string): void {
        const node = this.findByPath(this.page, path);
        if (!node) {
            return;
        }
        const label = node.getComponent(Label);
        let richText = node.getComponent(RichText);
        if (!richText && label) {
            const originalWidth = node.getComponent(UITransform)?.width ?? 0;
            richText = node.addComponent(RichText);
            richText.fontSize = label.fontSize;
            richText.lineHeight = label.lineHeight;
            richText.horizontalAlign = label.horizontalAlign;
            richText.verticalAlign = label.verticalAlign;
            richText.fontColor = label.color.clone();
            richText.maxWidth = originalWidth;
            richText.useSystemFont = label.useSystemFont;
            richText.fontFamily = label.fontFamily;
            if (label.font instanceof TTFFont) {
                richText.font = label.font;
            }
            richText.handleTouchEvent = false;
            label.enabled = false;
        }
        if (richText) {
            richText.string = value;
        }
    }

    private colorToHex(color: Readonly<Color>): string {
        return `#${[
            color.r,
            color.g,
            color.b,
        ].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
    }

    private escapeRichText(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    private nodes(root: Node, names: readonly string[]): Node[] {
        return names.flatMap((name) => {
            const node = root.getChildByName(name);
            return node ? [node] : [];
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

    private getTopFive(
        roster: ReadonlyArray<PlayerCard | null>,
    ): PlayerCard[] {
        return roster
            .filter((card): card is PlayerCard => Boolean(card))
            .sort((a, b) => b.overall - a.overall)
            .slice(0, 5);
    }

    private formatClock(totalSeconds: number): string {
        const seconds = Math.max(0, Math.floor(totalSeconds));
        return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
            seconds % 60,
        ).padStart(2, '0')}`;
    }

    private createSeededRandom(seedText: string): () => number {
        let state = 2_166_136_261;
        for (const character of seedText) {
            state ^= character.charCodeAt(0);
            state = Math.imul(state, 16_777_619);
        }
        return (): number => {
            state ^= state << 13;
            state ^= state >>> 17;
            state ^= state << 5;
            return (state >>> 0) / 4_294_967_296;
        };
    }

    private stopAllMotion(): void {
        this.courtSimulation?.stop();
    }

    private loadResource<TResult>(
        path: string,
        type: typeof Prefab | typeof Font,
    ): Promise<TResult> {
        return new Promise((resolve, reject) => {
            resources.load(path, type as never, (error, asset) => {
                if (error || !asset) {
                    reject(error ?? new Error(`Missing resource: ${path}`));
                    return;
                }
                resolve(asset as unknown as TResult);
            });
        });
    }
}

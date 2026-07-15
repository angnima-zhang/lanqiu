import {
    _decorator,
    Component,
    instantiate,
    JsonAsset,
    Label,
    Node,
    resources,
    sys,
    tween,
    Tween,
    Vec3,
} from 'cc';
import { RosterSlotView } from './RosterSlotView';

const { ccclass, property } = _decorator;

interface CommentaryEntry {
    id: string;
    trigger: string;
    text: string;
}

interface CommentaryData {
    entries: CommentaryEntry[];
}

interface RosterPlayer {
    id: string;
    name: string;
    ovr: number;
    originalIndex: number;
}

interface BallAnchorSet {
    hold: Node | null;
    dribble: Node | null;
    shot: Node | null;
}

interface BallCarrier {
    node: Node;
    ballAnchors: {
        left: BallAnchorSet;
        right: BallAnchorSet;
    };
    facing: 'left' | 'right';
}

interface CourtActor extends BallCarrier {
    homePosition: Vec3;
    modePosition: Vec3;
    homeScale: Vec3;
    homePerspectiveFactor: number;
    player: RosterPlayer | null;
    team: number;
}

interface ScrimmageTacticSetup {
    roles: CourtActor[];
    handler: CourtActor;
    finisher: CourtActor;
    passer: CourtActor;
    commentaryCategory: string;
    finishType: 'jump-shot' | 'layup';
}

interface ScrimmagePaceProfile {
    ballHandler: number;
    offBall: number;
    defense: number;
    action: number;
}

type ReboundScenario = 'self' | 'teammate-single' | 'teammate-contested' | 'opponent-single' | 'opponent-contested';

interface ReboundPlan {
    scenario: ReboundScenario;
    winner: CourtActor;
    contenders: CourtActor[];
    offenseTeam: number;
}

type ActionType = 'jump-shot' | 'layup' | 'dunk' | 'assist';
type TrainingMode = 'three-point' | 'free-throw' | 'dunk' | 'scrimmage';
type ScrimmageTactic = 'five-out' | 'four-out-one-in' | 'pick-and-roll' | 'low-post' | 'horns';
type BallAnchorKind = 'hold' | 'dribble' | 'shot';
type PassReception = 'control' | 'shoot';
type NormalizedRoutePoint = [number, number];

interface BallOwnership {
    actor: BallCarrier;
    kind: BallAnchorKind;
    visual: 'anchor' | 'motion';
}

const SCRIMMAGE_TACTICS: ScrimmageTactic[] = ['five-out', 'four-out-one-in', 'pick-and-roll', 'low-post', 'horns'];
const SCRIMMAGE_PACE_PROFILES: Record<ScrimmageTactic, ScrimmagePaceProfile> = {
    'five-out': { ballHandler: 1.2, offBall: 1, defense: 1.05, action: 1 },
    'four-out-one-in': { ballHandler: 1.28, offBall: 1.1, defense: 1.1, action: 1.1 },
    'pick-and-roll': { ballHandler: 1.15, offBall: 0.95, defense: 1, action: 0.92 },
    'low-post': { ballHandler: 1.4, offBall: 1.2, defense: 1.15, action: 1.22 },
    horns: { ballHandler: 1.25, offBall: 1.05, defense: 1.08, action: 1 },
};
const SCRIMMAGE_OFF_BALL_ROUTES: Record<
    ScrimmageTactic,
    Partial<Record<number, NormalizedRoutePoint[]>>
> = {
    'five-out': {
        2: [[0.72, 0.68], [0.6, 0.5], [0.78, 0.34], [0.58, 0.78]],
        3: [[0.68, 0.22], [0.78, 0.42], [0.62, 0.54], [0.86, 0.12]],
        4: [[0.68, 0.78], [0.78, 0.58], [0.62, 0.46], [0.86, 0.88]],
    },
    'four-out-one-in': {
        1: [[0.7, 0.3], [0.58, 0.52], [0.8, 0.18], [0.58, 0.2]],
        2: [[0.7, 0.7], [0.58, 0.48], [0.8, 0.82], [0.58, 0.8]],
        3: [[0.68, 0.28], [0.82, 0.44], [0.7, 0.62], [0.82, 0.14]],
    },
    'pick-and-roll': {
        2: [[0.8, 0.12], [0.62, 0.34], [0.76, 0.48], [0.68, 0.18]],
        3: [[0.8, 0.88], [0.62, 0.66], [0.76, 0.52], [0.68, 0.82]],
        4: [[0.72, 0.64], [0.82, 0.42], [0.68, 0.3], [0.86, 0.82]],
    },
    'low-post': {
        1: [[0.68, 0.62], [0.54, 0.42], [0.74, 0.28], [0.54, 0.76]],
        2: [[0.82, 0.3], [0.62, 0.48], [0.78, 0.62], [0.72, 0.14]],
        3: [[0.62, 0.7], [0.8, 0.58], [0.66, 0.4], [0.72, 0.86]],
    },
    horns: {
        3: [[0.68, 0.24], [0.82, 0.42], [0.64, 0.56], [0.84, 0.12]],
        4: [[0.68, 0.76], [0.82, 0.58], [0.64, 0.44], [0.84, 0.88]],
    },
};
const MODE_DURATIONS: Record<TrainingMode, number> = {
    'three-point': 30,
    'free-throw': 30,
    dunk: 15,
    scrimmage: 120,
};

const TEAM_NAME_STORAGE_KEY = 'basketball.team.name';
const DEFAULT_TEAM_NAME = '我的球队';

const COMMENTARY_IDS: Record<string, string[]> = {
    threeDrillMade: ['T01', 'T02'],
    threeDrillMissed: ['T03', 'T04'],
    freeThrowDrillMade: ['T05', 'T06'],
    freeThrowDrillMissed: ['T07', 'T08'],
    dunkDrillMade: ['T09', 'T10'],
    dunkDrillMissed: ['T11', 'T12'],
    scrimmage: ['T13', 'T14', 'T15', 'T16'],
    fiveOut: ['T17', 'T18'],
    fourOutOneIn: ['T19', 'T20'],
    pickAndRoll: ['T21', 'T22'],
    lowPost: ['T23', 'T24'],
    horns: ['T25', 'T26'],
    reboundSelf: ['T27', 'T28'],
    reboundTeammateSingle: ['T29', 'T30'],
    reboundTeammateContested: ['T31', 'T32'],
    reboundOpponentSingle: ['T33', 'T34'],
    reboundOpponentContested: ['T35', 'T36'],
    threeMade: ['A01'],
    threeCornerMade: ['A04'],
    threeMissed: ['C01', 'C02'],
    jumperMade: ['A06', 'A08', 'A09'],
    jumperMissed: ['C06'],
    layupMade: ['A16', 'A17', 'A18', 'A19', 'A41', 'A42'],
    layupMissed: ['C03', 'C05'],
    dunkMade: ['A11', 'A12', 'A13', 'A15'],
    dunkMissed: ['C04'],
    assistMade: ['A33', 'A34', 'A35', 'A36', 'A37'],
};

@ccclass('CourtSimulationController')
export class CourtSimulationController extends Component {
    @property(Node)
    public ballNode: Node | null = null;

    @property(Node)
    public playersRoot: Node | null = null;

    @property(Label)
    public commentaryLabel: Label | null = null;

    @property(Node)
    public courtRange: Node | null = null;

    @property(Node)
    public rosterContainer: Node | null = null;

    @property({ min: 3 })
    public actionIntervalSeconds = 3;

    private actors: CourtActor[] = [];
    private commentaryById = new Map<string, CommentaryEntry>();
    private activeTweenTargets: object[] = [];
    private cornerNodes: Node[] = [];
    private hoopNodes: Node[] = [];
    private ballDropNodes: Node[] = [];
    private ballRetrievers: Node[] = [];
    private ballRetrieverCarriers: BallCarrier[] = [];
    private ballRetrieverPlayers: Array<RosterPlayer | null> = [null, null];
    private basketballs: Node[] = [];
    private ballOwners = new Map<Node, BallOwnership>();
    private freeThrowNodes: Node[] = [];
    private threePointNodes: Node[][] = [[], []];
    private possessionTeam = 0;
    private eventToken = 0;
    private lastCommentaryId = '';
    private lastShooterId = '';
    private simulationReady = false;
    private currentMode: TrainingMode = 'scrimmage';
    private currentTactic: ScrimmageTactic = 'five-out';
    private lastTactic: ScrimmageTactic | null = null;
    private scrimmageTacticAnchors = new Map<CourtActor, Vec3>();
    private scrimmageTacticRoles: CourtActor[] = [];
    private scrimmageMovementSteps = new Map<CourtActor, number>();
    private activeReboundPlan: ReboundPlan | null = null;
    private scrimmageActionActors = new Set<CourtActor>();
    private modeRound = 0;
    private modeElapsedSeconds = 0;
    private drillTurns = [0, 0];
    private freeThrowQueues: CourtActor[][] = [[], []];
    private hasStartedMode = false;
    private scrimmagePossessionActive = false;

    protected onLoad(): void {
        const simulationRoot = this.node.name === '球场模拟'
            ? this.node
            : this.node.parent?.getChildByName('球场模拟') ?? null;
        this.ballNode ??= simulationRoot?.getChildByName('篮球') ?? null;
        this.playersRoot ??= simulationRoot?.getChildByName('players') ?? null;
        this.commentaryLabel ??= simulationRoot
            ?.getChildByName('文字播报')
            ?.getChildByName('播报内容')
            ?.getComponent(Label) ?? null;
        this.courtRange ??= simulationRoot?.getChildByName('球场范围') ?? null;
        this.rosterContainer ??= simulationRoot?.parent
            ?.getChildByName('球队')
            ?.getChildByName('阵容槽位') ?? null;

        if (!this.resolveReferenceNodes()) {
            this.enabled = false;
            return;
        }

        this.collectCourtActors();
        this.collectBallRetrieverCarriers();
        this.refreshRosterBindings();
        this.prepareBasketballs();
        this.placeBallRetrievers();
        this.sortActorDepth();
        this.setCommentary('球队正在进行日常训练……');
    }

    protected start(): void {
        if (this.enabled) {
            this.loadCommentary();
        }
    }

    protected onDisable(): void {
        this.stopSimulation();
    }

    protected onDestroy(): void {
        this.stopSimulation();
        this.clearBallOwners();
        for (const ball of this.basketballs.slice(1)) {
            ball.destroy();
        }
    }

    protected lateUpdate(): void {
        for (const [ball, ownership] of this.ballOwners) {
            if (ownership.visual === 'anchor' && ownership.actor.node.active) {
                ball.setWorldPosition(this.getBallAnchorPosition(ownership.actor, ownership.kind));
            }
        }
    }

    public refreshRosterBindings(): void {
        if (!this.rosterContainer || this.actors.length < 10) {
            return;
        }

        const rosterPlayers = this.readRosterPlayers();
        const topPlayers = [...rosterPlayers]
            .sort((a, b) => b.ovr - a.ovr || a.originalIndex - b.originalIndex)
            .slice(0, 10);
        const topPlayerIds = new Set(topPlayers.map((player) => player.id));
        const bottomPlayers = rosterPlayers
            .filter((player) => !topPlayerIds.has(player.id))
            .sort((a, b) => a.ovr - b.ovr || a.originalIndex - b.originalIndex)
            .slice(0, 2);
        this.ballRetrieverPlayers = [bottomPlayers[0] ?? null, bottomPlayers[1] ?? null];
        const teams: RosterPlayer[][] = [[], []];
        const totals = [0, 0];

        for (const player of topPlayers) {
            let team = totals[0] <= totals[1] ? 0 : 1;
            if (teams[team].length >= 5) {
                team = 1 - team;
            }
            teams[team].push(player);
            totals[team] += player.ovr;
        }

        for (let team = 0; team < 2; team += 1) {
            for (let index = 0; index < 5; index += 1) {
                const actor = this.actors[team * 5 + index];
                const player = teams[team][index] ?? null;
                actor.team = team;
                actor.facing = team === 0 ? 'right' : 'left';
                actor.player = player;
            }
        }
    }

    public restartSimulation(): void {
        if (!this.simulationReady) {
            return;
        }
        this.stopAnimations();
        this.unschedule(this.runNextEvent);
        this.restoreActorsHome();
        this.placeBallRetrievers();
        this.hasStartedMode = false;
        this.startNextMode();
        this.runNextEvent();
        this.schedule(this.runNextEvent, this.actionIntervalSeconds);
    }

    private loadCommentary(): void {
        resources.load('data/basketball_commentary', JsonAsset, (error, asset) => {
            if (!this.isValid || !this.enabled) {
                return;
            }
            if (error || !asset) {
                console.error('[CourtSimulationController] Failed to load commentary data.', error);
                this.setCommentary('训练播报加载失败');
                return;
            }

            const data = asset.json as unknown as CommentaryData;
            for (const entry of data.entries ?? []) {
                this.commentaryById.set(entry.id, entry);
            }
            this.simulationReady = true;
            this.startNextMode();
            this.runNextEvent();
            this.schedule(this.runNextEvent, this.actionIntervalSeconds);
        });
    }

    private runNextEvent = (): void => {
        if (!this.simulationReady || this.actors.some((actor) => !actor.player)) {
            return;
        }
        if (this.currentMode === 'scrimmage' && this.scrimmagePossessionActive) {
            this.modeElapsedSeconds += this.actionIntervalSeconds;
            return;
        }

        this.eventToken += 1;
        const token = this.eventToken;
        this.stopAnimations();
        this.refreshRosterBindings();
        if (!this.hasStartedMode || this.modeElapsedSeconds >= MODE_DURATIONS[this.currentMode]) {
            this.startNextMode();
        }

        if (this.currentMode === 'scrimmage') {
            this.runScrimmageEvent(token);
        } else {
            this.runDrillEvent(token);
        }
        this.modeRound += 1;
        this.modeElapsedSeconds += this.actionIntervalSeconds;
    };

    private runScrimmageEvent(token: number): void {
        this.scrimmagePossessionActive = true;
        const offenseTeam = this.possessionTeam;
        const offense = this.getTeamActors(offenseTeam);
        const defense = this.getTeamActors(1 - offenseTeam);
        this.currentTactic = this.pickScrimmageTactic();
        const setup = this.prepareScrimmageTactic(offense, this.currentTactic);
        const defender = this.findNearestActor(defense, setup.finisher.node.worldPosition) ?? defense[0];
        const chanceAction: ActionType = setup.finishType;
        const made = Math.random() < this.getSuccessChance(chanceAction, setup.finisher.player?.ovr ?? 70);
        const ball = this.basketballs[0];
        this.setBallOwner(ball, setup.passer);
        this.activeReboundPlan = made
            ? null
            : this.createReboundPlan(setup.finisher, offense, defense, offenseTeam);
        this.scrimmageActionActors = new Set(this.getTacticActionActors(setup));
        this.moveScrimmageActors(setup.finisher, setup.passer, offenseTeam);
        this.executeScrimmageTactic(setup, ball, made, token);
        this.showActionCommentary(setup.commentaryCategory, setup.finisher, defender, setup.passer);
    }

    private runDrillEvent(token: number): void {
        const rounds: Array<{
            shooter: CourtActor;
            nextShooter: CourtActor;
            ball: Node;
            made: boolean;
        }> = [];

        for (let team = 0; team < 2; team += 1) {
            const teamActors = this.getTeamActors(team);
            const turn = this.drillTurns[team] % teamActors.length;
            const queue = this.currentMode === 'free-throw' ? this.freeThrowQueues[team] : teamActors;
            const shooter = this.currentMode === 'free-throw' ? queue[0] : queue[turn];
            const nextShooter = this.currentMode === 'free-throw' ? queue[1] : queue[(turn + 1) % queue.length];
            const action = this.currentMode === 'dunk' ? 'dunk' : 'jump-shot';
            const ovr = shooter.player?.ovr ?? 70;
            const baseChance = this.currentMode === 'free-throw'
                ? Math.max(0.45, Math.min(0.94, 0.76 + (ovr - 70) * 0.007))
                : this.getSuccessChance(action, ovr);
            rounds.push({ shooter, nextShooter, ball: this.basketballs[team], made: Math.random() < baseChance });
            this.drillTurns[team] = (turn + 1) % teamActors.length;
        }

        const featured = rounds[this.modeRound % rounds.length];
        const defender = this.findNearestActor(
            this.getTeamActors(1 - featured.shooter.team),
            featured.shooter.node.worldPosition,
        ) ?? featured.nextShooter;
        const madeCategory = this.currentMode === 'three-point'
            ? 'threeDrillMade'
            : this.currentMode === 'free-throw'
                ? 'freeThrowDrillMade'
                : 'dunkDrillMade';
        const missedCategory = this.currentMode === 'three-point'
            ? 'threeDrillMissed'
            : this.currentMode === 'free-throw'
                ? 'freeThrowDrillMissed'
                : 'dunkDrillMissed';
        this.showActionCommentary(featured.made ? madeCategory : missedCategory, featured.shooter, defender, featured.nextShooter);

        for (const round of rounds) {
            if (this.currentMode === 'three-point') {
                this.playThreePointDrill(round.shooter, round.nextShooter, round.ball, round.made, token);
            } else if (this.currentMode === 'free-throw') {
                this.playFreeThrowDrill(round.shooter, round.nextShooter, round.ball, round.made, token);
            } else {
                this.playDunkDrill(round.shooter, round.nextShooter, round.ball, round.made, token);
            }
        }
    }

    private playThreePointDrill(
        shooter: CourtActor,
        nextShooter: CourtActor,
        ball: Node,
        made: boolean,
        token: number,
    ): void {
        const hoop = this.getAttackingHoop(shooter.team);
        this.setBallOwner(ball, shooter);
        this.jumpActor(shooter, 1.08, 0.36);
        this.shootDrillBall(ball, shooter, nextShooter, hoop, made, 0.72, token);
        this.returnDrillShooter(shooter, token);
    }

    private playFreeThrowDrill(
        shooter: CourtActor,
        nextShooter: CourtActor,
        ball: Node,
        made: boolean,
        token: number,
    ): void {
        const hoop = this.getAttackingHoop(shooter.team);
        const freeThrowPoint = this.freeThrowNodes[this.hoopNodes.indexOf(hoop)].worldPosition;
        this.dribbleTo(ball, shooter, freeThrowPoint, 0.38, token, () => {
            this.jumpActor(shooter, 1.05, 0.32);
            this.shootDrillBall(ball, shooter, nextShooter, hoop, made, 0.68, token);
        });
        this.scheduleOnce(() => this.rotateFreeThrowQueue(shooter.team, ball, token), 2.15);
    }

    private playDunkDrill(
        shooter: CourtActor,
        nextShooter: CourtActor,
        ball: Node,
        made: boolean,
        token: number,
    ): void {
        const hoop = this.getAttackingHoop(shooter.team);
        const takeoff = this.getTakeoffPoint(hoop, shooter.team, 72, 0);
        this.setBallOwner(ball, shooter);
        this.dribbleTo(ball, shooter, takeoff, 0.86, token, () => {
            this.playDunkMotion(ball, shooter, hoop, made, token, (target) => {
                this.retrieveDrillBall(ball, hoop, target, nextShooter, token);
            });
        });
        this.returnDrillShooter(shooter, token, 2.45);
    }

    private shootDrillBall(
        ball: Node,
        shooter: CourtActor,
        nextShooter: CourtActor,
        hoop: Node,
        made: boolean,
        duration: number,
        token: number,
    ): void {
        const rim = hoop.getChildByName('进球点')?.worldPosition ?? hoop.worldPosition;
        const target = made ? rim : new Vec3(rim.x + (Math.random() < 0.5 ? -24 : 24), rim.y + 10, rim.z);
        this.gatherBallForShot(ball, shooter, token, (start) => {
            this.animateBallArc(ball, start, target, duration, made ? 92 : 76, token, () => {
                this.retrieveDrillBall(ball, hoop, target, nextShooter, token);
            });
        });
    }

    private retrieveDrillBall(
        ball: Node,
        hoop: Node,
        start: Readonly<Vec3>,
        receiver: CourtActor,
        token: number,
    ): void {
        const hoopIndex = this.hoopNodes.indexOf(hoop);
        const dropNode = this.ballDropNodes[hoopIndex];
        const retriever = this.ballRetrievers[hoopIndex];
        const retrieverCarrier = this.ballRetrieverCarriers[hoopIndex];
        this.animateBallArc(ball, start, dropNode.worldPosition, 0.34, 10, token, () => {
            this.pulseNode(retriever);
            this.setBallOwner(ball, retrieverCarrier);
            this.scheduleOnce(() => {
                if (token !== this.eventToken) {
                    return;
                }
                this.passBall(
                    ball,
                    this.getBallAnchorPosition(retrieverCarrier, 'hold'),
                    receiver,
                    'control',
                    token,
                    () => {},
                );
            }, 0.12);
        });
    }

    private returnDrillShooter(shooter: CourtActor, token: number, delay = 2.25): void {
        this.scheduleOnce(() => {
            if (token === this.eventToken) {
                this.moveActor(shooter, shooter.modePosition, 0.35);
            }
        }, delay);
    }

    private getTacticActionActors(setup: ScrimmageTacticSetup): CourtActor[] {
        if (this.currentTactic === 'five-out') {
            return [setup.handler, setup.roles[1], setup.finisher];
        }
        if (this.currentTactic === 'four-out-one-in') {
            return [setup.handler, setup.roles[4], setup.finisher];
        }
        if (this.currentTactic === 'pick-and-roll') {
            return [setup.handler, setup.roles[1]];
        }
        if (this.currentTactic === 'low-post') {
            return [setup.handler, setup.finisher];
        }
        return [setup.handler, setup.roles[1], setup.roles[2]];
    }

    private executeScrimmageTactic(
        setup: ScrimmageTacticSetup,
        ball: Node,
        made: boolean,
        token: number,
    ): void {
        if (this.currentTactic === 'five-out') {
            this.playFiveOutTactic(setup, ball, made, token);
        } else if (this.currentTactic === 'four-out-one-in') {
            this.playFourOutOneInTactic(setup, ball, made, token);
        } else if (this.currentTactic === 'pick-and-roll') {
            this.playPickAndRollTactic(setup, ball, made, token);
        } else if (this.currentTactic === 'low-post') {
            this.playLowPostTactic(setup, ball, made, token);
        } else {
            this.playHornsTactic(setup, ball, made, token);
        }
    }

    private playFiveOutTactic(setup: ScrimmageTacticSetup, ball: Node, made: boolean, token: number): void {
        const wing = setup.roles[1];
        const shooter = setup.finisher;
        const wingTarget = this.getScrimmageAnchor(wing);
        const shooterTarget = this.getScrimmageAnchor(shooter);
        const wingDuration = this.getTacticalMoveDuration(wing, wingTarget, 0.28);
        const shooterDuration = this.getTacticalMoveDuration(shooter, shooterTarget, 0.34);
        this.moveAndPass(ball, setup.handler, wing, wingTarget, wingDuration, 'control', token, () => {
            this.moveAndPass(
                ball,
                wing,
                shooter,
                shooterTarget,
                shooterDuration,
                'shoot',
                token,
                () => {
                    this.jumpActor(shooter, 1.06, 0.35);
                    this.shootBall(ball, shooter, this.getAttackingHoop(shooter.team), made, 0.72, token);
                },
            );
        });
    }

    private playFourOutOneInTactic(setup: ScrimmageTacticSetup, ball: Node, made: boolean, token: number): void {
        const post = setup.roles[4];
        const cutter = setup.finisher;
        const postTarget = this.getScrimmageAnchor(post);
        const cutTarget = this.getTakeoffPoint(
            this.getAttackingHoop(cutter.team),
            cutter.team,
            94,
            cutter === setup.roles[2] ? -34 : 34,
        );
        const entryDuration = this.getTacticalMoveDuration(post, postTarget, 0.32);
        const cutDuration = this.getTacticalMoveDuration(cutter, cutTarget, 0.38);
        this.moveAndPass(ball, setup.handler, post, postTarget, entryDuration, 'control', token, () => {
            this.moveAndPass(
                ball,
                post,
                cutter,
                cutTarget,
                cutDuration,
                'shoot',
                token,
                () => {
                    this.jumpActor(cutter, 1.1, 0.42);
                    this.shootBall(ball, cutter, this.getAttackingHoop(cutter.team), made, 0.46, token);
                },
            );
        });
    }

    private playPickAndRollTactic(setup: ScrimmageTacticSetup, ball: Node, made: boolean, token: number): void {
        const handler = setup.handler;
        const roller = setup.roles[1];
        const screenTarget = this.getScrimmageAnchor(roller);
        const screenDuration = this.getTacticalMoveDuration(roller, screenTarget, 0.28);
        this.moveActor(roller, screenTarget, screenDuration);
        this.scheduleOnce(() => {
            if (token !== this.eventToken) {
                return;
            }
            const hoop = this.getAttackingHoop(handler.team);
            const handlerTarget = this.getTakeoffPoint(hoop, handler.team, setup.finisher === handler ? 174 : 142, -28);
            const driveDuration = this.getTacticalMoveDuration(handler, handlerTarget, 0.42);
            this.dribbleTo(ball, handler, handlerTarget, driveDuration, token, () => {
                if (setup.finisher === handler) {
                    this.jumpActor(handler, 1.06, 0.34);
                    this.shootBall(ball, handler, hoop, made, 0.62, token);
                    return;
                }
                const rollTarget = this.getTakeoffPoint(hoop, roller.team, 86, 26);
                const rollDuration = this.getTacticalMoveDuration(roller, rollTarget, 0.34);
                this.moveAndPass(ball, handler, roller, rollTarget, rollDuration, 'shoot', token, () => {
                    this.jumpActor(roller, 1.1, 0.4);
                    this.shootBall(ball, roller, hoop, made, 0.46, token);
                });
            });
        }, Math.min(0.26, screenDuration * 0.5));
    }

    private playLowPostTactic(setup: ScrimmageTacticSetup, ball: Node, made: boolean, token: number): void {
        const post = setup.finisher;
        const postTarget = this.getScrimmageAnchor(post);
        const entryDuration = this.getTacticalMoveDuration(post, postTarget, 0.34);
        this.moveAndPass(ball, setup.handler, post, postTarget, entryDuration, 'control', token, () => {
            const hoop = this.getAttackingHoop(post.team);
            const backDownTarget = this.getTakeoffPoint(hoop, post.team, 112, 28);
            const backDownDuration = this.getTacticalMoveDuration(post, backDownTarget, 0.46);
            this.dribbleTo(ball, post, backDownTarget, backDownDuration, token, () => {
                this.jumpActor(post, 1.08, 0.38);
                this.shootBall(ball, post, hoop, made, 0.58, token);
            });
        });
    }

    private playHornsTactic(setup: ScrimmageTacticSetup, ball: Node, made: boolean, token: number): void {
        const handler = setup.handler;
        const elbowPasser = setup.roles[1];
        const cutter = setup.roles[2];
        const firstElbow = this.getScrimmageAnchor(elbowPasser);
        const secondElbow = this.getScrimmageAnchor(cutter);
        this.moveActor(elbowPasser, firstElbow, this.getTacticalMoveDuration(elbowPasser, firstElbow, 0.28));
        this.moveActor(cutter, secondElbow, this.getTacticalMoveDuration(cutter, secondElbow, 0.28));
        const handlerTarget = this.getScrimmageAnchor(handler);
        const driveDuration = this.getTacticalMoveDuration(handler, handlerTarget, 0.38);
        this.dribbleTo(ball, handler, handlerTarget, driveDuration, token, () => {
            this.passBall(
                ball,
                this.getBallAnchorPosition(handler, 'hold'),
                elbowPasser,
                'control',
                token,
                () => {
                    const cutTarget = this.getTakeoffPoint(this.getAttackingHoop(cutter.team), cutter.team, 88, -28);
                    const cutDuration = this.getTacticalMoveDuration(cutter, cutTarget, 0.36);
                    this.moveAndPass(ball, elbowPasser, cutter, cutTarget, cutDuration, 'shoot', token, () => {
                        this.jumpActor(cutter, 1.1, 0.4);
                        this.shootBall(ball, cutter, this.getAttackingHoop(cutter.team), made, 0.46, token);
                    });
                },
            );
        });
    }

    private moveAndPass(
        ball: Node,
        passer: CourtActor,
        receiver: CourtActor,
        target: Vec3,
        duration: number,
        reception: PassReception,
        token: number,
        onComplete: () => void,
    ): void {
        const receiverStart = receiver.node.worldPosition.clone();
        const catchProgress = reception === 'shoot' ? 0.78 : 0.68;
        const catchPoint = Vec3.lerp(new Vec3(), receiverStart, target, catchProgress);
        const approachDuration = Math.max(0.4, duration * catchProgress);
        const finishDuration = Math.max(0.12, duration - approachDuration);
        this.moveActor(receiver, catchPoint, approachDuration);

        const passerStart = passer.node.worldPosition.clone();
        const expectedStart = this.getBallAnchorPosition(passer, 'hold', passerStart);
        const expectedEnd = this.getBallAnchorPosition(receiver, 'hold', catchPoint);
        const estimatedFlightDuration = Math.max(
            0.2,
            Math.min(0.38, Vec3.distance(expectedStart, expectedEnd) / 1100),
        );
        const passReleaseDelay = Math.max(0.12, approachDuration - estimatedFlightDuration - 0.08);
        const passDirection = new Vec3();
        Vec3.subtract(passDirection, catchPoint, passerStart);
        const receiverDistance = passDirection.length();
        if (receiverDistance > 0) {
            passDirection.normalize();
        }
        const passMoveDistance = Math.min(96, receiverDistance * 0.32, passReleaseDelay * 240);
        const passMoveDuration = Math.max(0.08, passMoveDistance / 240);
        const passMoveDelay = Math.max(0, passReleaseDelay - passMoveDuration);
        const passPoint = passerStart.clone().add3f(
            passDirection.x * passMoveDistance,
            passDirection.y * passMoveDistance,
            0,
        );

        this.scheduleOnce(() => {
            if (token !== this.eventToken) {
                return;
            }
            this.dribbleTo(ball, passer, passPoint, passMoveDuration, token, () => {
                this.passBall(
                    ball,
                    this.getBallAnchorPosition(passer, 'hold'),
                    receiver,
                    reception,
                    token,
                    () => {
                        if (reception === 'control') {
                            this.dribbleTo(ball, receiver, target, finishDuration, token, onComplete);
                            return;
                        }
                        this.moveActor(receiver, target, finishDuration);
                        this.scheduleOnce(() => {
                            if (token === this.eventToken) {
                                onComplete();
                            }
                        }, finishDuration + 0.08);
                    },
                );
            });
        }, passMoveDelay);
    }

    private getScrimmageAnchor(actor: CourtActor): Vec3 {
        return this.scrimmageTacticAnchors.get(actor)?.clone() ?? actor.node.worldPosition.clone();
    }

    private getTacticalMoveDuration(
        actor: CourtActor,
        target: Readonly<Vec3>,
        minimum: number,
    ): number {
        const actionPace = SCRIMMAGE_PACE_PROFILES[this.currentTactic].action;
        const duration = Vec3.distance(actor.node.worldPosition, target) / (250 / actionPace);
        return Math.max(minimum, duration);
    }

    private playJumpShot(
        shooter: CourtActor,
        passer: CourtActor,
        defender: CourtActor,
        ball: Node,
        made: boolean,
        token: number,
    ): void {
        const hoop = this.getAttackingHoop(shooter.team);
        const shotNode = this.pickThreePointNode(shooter.team);
        const shotPoint = shotNode?.worldPosition
            ?? this.pointInCourt(shooter.team === 0 ? 0.66 : 0.34, 0.5);
        const madeCategory = shotNode?.name.includes('底角') ? 'threeCornerMade' : 'threeMade';
        const moveDuration = this.getScrimmageActionDuration(0.45);
        this.showActionCommentary(made ? madeCategory : 'threeMissed', shooter, defender, passer);
        this.moveAndPass(
            ball,
            passer,
            shooter,
            shotPoint,
            moveDuration,
            'shoot',
            token,
            () => {
                this.shootBall(ball, shooter, hoop, made, 0.78, token);
            },
        );
    }

    private playLayup(shooter: CourtActor, defender: CourtActor, ball: Node, made: boolean, token: number): void {
        const hoop = this.getAttackingHoop(shooter.team);
        const takeoff = this.getTakeoffPoint(hoop, shooter.team, 86, Math.random() < 0.5 ? -32 : 32);
        this.showActionCommentary(made ? 'layupMade' : 'layupMissed', shooter, defender, shooter);
        this.dribbleTo(ball, shooter, takeoff, 0.82, token, () => {
            this.jumpActor(shooter, 1.1, 0.48);
            this.shootBall(ball, shooter, hoop, made, 0.48, token);
        });
    }

    private playDunk(shooter: CourtActor, defender: CourtActor, ball: Node, made: boolean, token: number): void {
        const hoop = this.getAttackingHoop(shooter.team);
        const takeoff = this.getTakeoffPoint(hoop, shooter.team, 72, 0);
        this.showActionCommentary(made ? 'dunkMade' : 'dunkMissed', shooter, defender, shooter);
        this.dribbleTo(ball, shooter, takeoff, 0.7, token, () => {
            const reboundPlan = !made
                ? this.activeReboundPlan ?? {
                    scenario: 'self' as ReboundScenario,
                    winner: shooter,
                    contenders: [shooter],
                    offenseTeam: shooter.team,
                }
                : null;
            const reboundPoint = reboundPlan ? this.getReboundPoint(hoop) : null;
            if (reboundPlan && reboundPoint) {
                this.startReboundPositioning(reboundPlan, reboundPoint, 0.48, token);
            }
            this.playDunkMotion(ball, shooter, hoop, made, token, (target) => {
                if (made) {
                    this.retrieveMadeBall(ball, hoop, target, token);
                } else if (reboundPlan && reboundPoint) {
                    this.finishRebound(ball, hoop, target, reboundPoint, reboundPlan, shooter, token);
                }
            });
        });
    }

    private playDunkMotion(
        ball: Node,
        shooter: CourtActor,
        hoop: Node,
        made: boolean,
        token: number,
        onBallFinished: (target: Vec3) => void,
    ): void {
        const start = shooter.node.worldPosition.clone();
        const landing = this.getTakeoffPoint(hoop, shooter.team, 48, 0);
        const rim = hoop.getChildByName('进球点')?.worldPosition ?? hoop.worldPosition;
        const target = made
            ? rim.clone()
            : new Vec3(rim.x + (Math.random() < 0.5 ? -26 : 26), rim.y + 12, rim.z);
        const state = this.trackTweenTarget({ progress: 0 });
        let released = false;

        this.setBallMotionOwner(ball, shooter, 'shot');
        tween(state)
            .to(0.62, { progress: 1 }, {
                onUpdate: () => {
                    if (token !== this.eventToken) {
                        return;
                    }
                    const basePosition = Vec3.lerp(new Vec3(), start, landing, state.progress);
                    const lift = Math.sin(state.progress * Math.PI) * 52;
                    const position = new Vec3(basePosition.x, basePosition.y + lift, basePosition.z);
                    shooter.node.setWorldPosition(position);
                    this.applyPerspectiveScale(shooter, position);
                    const baseScale = shooter.node.scale.clone();
                    const jumpScale = 1 + Math.sin(state.progress * Math.PI) * 0.24;
                    shooter.node.setScale(
                        baseScale.x * jumpScale,
                        baseScale.y * jumpScale,
                        baseScale.z,
                    );

                    if (!released) {
                        const gatherProgress = Math.min(1, state.progress / 0.48);
                        const holdPoint = this.getBallAnchorPosition(shooter, 'hold');
                        const shotPoint = this.getBallAnchorPosition(shooter, 'shot');
                        ball.setWorldPosition(Vec3.lerp(new Vec3(), holdPoint, shotPoint, gatherProgress));
                    }
                },
            })
            .call(() => {
                this.applyPerspectiveScale(shooter, landing);
                this.sortActorDepth();
            })
            .start();

        this.scheduleOnce(() => {
            if (token !== this.eventToken) {
                return;
            }
            released = true;
            if (made) {
                this.shakeHoop(hoop);
            }
            const releasePoint = this.getBallAnchorPosition(shooter, 'shot');
            this.animateBallArc(ball, releasePoint, target, 0.18, made ? 12 : 32, token, () => {
                onBallFinished(target);
            });
        }, 0.3);
    }

    private playAssistFinish(
        finisher: CourtActor,
        passer: CourtActor,
        defender: CourtActor,
        ball: Node,
        made: boolean,
        token: number,
    ): void {
        const hoop = this.getAttackingHoop(finisher.team);
        const catchPoint = this.getTakeoffPoint(hoop, finisher.team, 96, Math.random() < 0.5 ? -42 : 42);
        const moveDuration = this.getScrimmageActionDuration(0.55);

        this.showActionCommentary(made ? 'assistMade' : 'layupMissed', finisher, defender, passer);
        this.moveAndPass(
            ball,
            passer,
            finisher,
            catchPoint,
            moveDuration,
            'shoot',
            token,
            () => {
                this.jumpActor(finisher, 1.1, 0.45);
                this.shootBall(ball, finisher, hoop, made, 0.46, token);
            },
        );
    }

    private shootBall(
        ball: Node,
        shooter: CourtActor,
        hoop: Node,
        made: boolean,
        duration: number,
        token: number,
    ): void {
        const rim = hoop.getChildByName('进球点')?.worldPosition ?? hoop.worldPosition;
        const target = made ? rim : new Vec3(rim.x, rim.y + 12, rim.z);
        const reboundPlan = !made
            ? this.activeReboundPlan ?? {
                scenario: 'self' as ReboundScenario,
                winner: shooter,
                contenders: [shooter],
                offenseTeam: shooter.team,
            }
            : null;
        const reboundPoint = reboundPlan ? this.getReboundPoint(hoop) : null;
        this.gatherBallForShot(ball, shooter, token, (start) => {
            if (reboundPlan && reboundPoint) {
                this.startReboundPositioning(reboundPlan, reboundPoint, duration, token);
            }
            this.animateBallArc(ball, start, target, duration, made ? 95 : 82, token, () => {
                if (made) {
                    this.retrieveMadeBall(ball, hoop, target, token);
                } else if (reboundPlan && reboundPoint) {
                    this.finishRebound(ball, hoop, target, reboundPoint, reboundPlan, shooter, token);
                }
            });
        });
    }

    private retrieveMadeBall(ball: Node, hoop: Node, start: Readonly<Vec3>, token: number): void {
        const hoopIndex = this.hoopNodes.indexOf(hoop);
        const dropNode = this.ballDropNodes[hoopIndex];
        const retriever = this.ballRetrievers[hoopIndex];
        if (!dropNode || !retriever) {
            return;
        }

        if (this.currentMode === 'scrimmage') {
            const scoringTeam = hoop === this.hoopNodes[1] ? 0 : 1;
            const nextTeam = 1 - scoringTeam;
            const receivers = this.getTeamActors(nextTeam);
            const inbounder = this.findNearestActor(receivers, dropNode.worldPosition);
            if (!inbounder) {
                this.scrimmagePossessionActive = false;
                return;
            }
            const receiverCandidates = receivers.filter((actor) => actor !== inbounder);
            const receiver = receiverCandidates[Math.floor(Math.random() * receiverCandidates.length)] ?? inbounder;
            const pickupDuration = this.getTacticalMoveDuration(inbounder, dropNode.worldPosition, 0.34);
            this.moveActor(inbounder, dropNode.worldPosition, pickupDuration);
            this.animateBallArc(ball, start, dropNode.worldPosition, 0.32, 8, token);
            this.scheduleOnce(() => {
                if (token !== this.eventToken) {
                    return;
                }
                this.possessionTeam = nextTeam;
                this.setBallOwner(ball, inbounder);
                this.scheduleOnce(() => {
                    if (token !== this.eventToken) {
                        return;
                    }
                    this.passBall(
                        ball,
                        this.getBallAnchorPosition(inbounder, 'hold'),
                        receiver,
                        'control',
                        token,
                        () => {
                            this.completeScrimmagePossession(token);
                        },
                    );
                }, 0.18);
            }, Math.max(0.34, pickupDuration));
            return;
        }

        this.animateBallArc(ball, start, dropNode.worldPosition, 0.32, 8, token, () => {
            const receivers = this.getTeamActors(this.possessionTeam);
            const receiver = receivers[Math.floor(Math.random() * receivers.length)];
            if (receiver) {
                const inbounderPosition = this.currentMode === 'scrimmage'
                    ? dropNode.worldPosition
                    : retriever.worldPosition;
                if (this.currentMode !== 'scrimmage') {
                    this.pulseNode(retriever);
                }
                this.passBall(
                    ball,
                    this.getLegacyBallHandPosition(inbounderPosition),
                    receiver,
                    'control',
                    token,
                    () => {},
                );
            }
        });
    }

    private completeScrimmagePossession(token: number): void {
        if (token !== this.eventToken || this.currentMode !== 'scrimmage' || !this.scrimmagePossessionActive) {
            return;
        }
        this.scrimmagePossessionActive = false;
        this.activeReboundPlan = null;
        this.scheduleOnce(() => {
            if (token === this.eventToken && !this.scrimmagePossessionActive) {
                this.runNextEvent();
            }
        }, 0.3);
    }

    private getReboundPoint(hoop: Node): Vec3 {
        const rightSide = hoop === this.hoopNodes[1];
        return this.pointInCourt(
            rightSide ? 0.73 + Math.random() * 0.08 : 0.19 + Math.random() * 0.08,
            0.34 + Math.random() * 0.32,
        );
    }

    private startReboundPositioning(
        plan: ReboundPlan,
        reboundPoint: Readonly<Vec3>,
        shotDuration: number,
        token: number,
    ): void {
        for (const contender of plan.contenders) {
            this.scrimmageActionActors.add(contender);
        }
        for (let index = 0; index < plan.contenders.length; index += 1) {
            const contender = plan.contenders[index];
            const angle = (index / Math.max(1, plan.contenders.length - 1) - 0.5) * Math.PI * 0.8;
            const radius = contender === plan.winner ? 0 : 24;
            const target = new Vec3(
                reboundPoint.x + Math.cos(angle) * radius,
                reboundPoint.y + Math.sin(angle) * radius,
                reboundPoint.z,
            );
            this.moveActor(contender, target, Math.max(0.34, shotDuration * 0.78));
        }
        this.scheduleOnce(() => {
            if (token !== this.eventToken) {
                return;
            }
            for (const contender of plan.contenders) {
                this.jumpActor(contender, contender === plan.winner ? 1.14 : 1.09, 0.34);
            }
        }, Math.max(0.2, shotDuration * 0.7));
    }

    private finishRebound(
        ball: Node,
        hoop: Node,
        start: Readonly<Vec3>,
        reboundPoint: Readonly<Vec3>,
        plan: ReboundPlan,
        shooter: CourtActor,
        token: number,
    ): void {
        this.animateBallArc(ball, start, reboundPoint, 0.52, 38, token, () => {
            this.setBallOwner(ball, plan.winner);
            this.possessionTeam = plan.winner.team;
            this.showReboundCommentary(plan, shooter);

            if (plan.scenario === 'self') {
                const resetPoint = this.getTakeoffPoint(
                    hoop,
                    shooter.team,
                    118,
                    Math.random() < 0.5 ? -34 : 34,
                );
                const resetDuration = Math.min(0.32, this.getScrimmageActionDuration(0.45));
                this.dribbleTo(ball, plan.winner, resetPoint, resetDuration, token, () => {
                    this.setBallOwner(ball, plan.winner);
                    this.completeScrimmagePossession(token);
                });
            } else {
                this.completeScrimmagePossession(token);
            }
        });
    }

    private showReboundCommentary(plan: ReboundPlan, shooter: CourtActor): void {
        const category = plan.scenario === 'self'
            ? 'reboundSelf'
            : plan.scenario === 'teammate-single'
                ? 'reboundTeammateSingle'
                : plan.scenario === 'teammate-contested'
                    ? 'reboundTeammateContested'
                    : plan.scenario === 'opponent-single'
                        ? 'reboundOpponentSingle'
                        : 'reboundOpponentContested';
        const opponent = plan.contenders.find((actor) => actor.team !== plan.winner.team) ?? shooter;
        this.showActionCommentary(category, plan.winner, opponent, shooter);
    }

    private prepareBasketballs(): void {
        if (!this.ballNode || !this.ballNode.parent) {
            return;
        }
        const secondBall = instantiate(this.ballNode);
        secondBall.name = '训练篮球2';
        this.ballNode.parent.addChild(secondBall);
        secondBall.setWorldPosition(this.ballNode.worldPosition);
        secondBall.active = false;
        this.basketballs = [this.ballNode, secondBall];
    }

    private startNextMode(): void {
        const modes: TrainingMode[] = ['three-point', 'free-throw', 'dunk', 'scrimmage'];
        const candidates = this.hasStartedMode
            ? modes.filter((mode) => mode !== this.currentMode)
            : modes;
        this.currentMode = candidates[Math.floor(Math.random() * candidates.length)];
        this.hasStartedMode = true;
        this.modeRound = 0;
        this.modeElapsedSeconds = 0;
        this.drillTurns = [0, 0];
        this.freeThrowQueues = [[], []];
        this.configureCurrentMode();
    }

    private configureCurrentMode(): void {
        const drillMode = this.currentMode !== 'scrimmage';
        this.scrimmagePossessionActive = false;
        this.clearBallOwners();
        this.scrimmageTacticAnchors.clear();
        this.activeReboundPlan = null;
        this.scrimmageActionActors.clear();
        this.setBasketballCount(drillMode ? 2 : 1);
        for (const retriever of this.ballRetrievers) {
            retriever.active = drillMode;
        }
        this.placeBallRetrievers();

        if (this.currentMode === 'scrimmage') {
            for (const actor of this.actors) {
                actor.modePosition = actor.homePosition.clone();
            }
            this.restoreActorsHome();
            return;
        }

        for (let team = 0; team < 2; team += 1) {
            const teamActors = this.getTeamActors(team);
            const halfIndex = team === 0 ? 1 : 0;
            const formationActors = this.currentMode === 'free-throw'
                ? this.freeThrowQueues[team] = [...teamActors]
                : teamActors;
            for (let index = 0; index < formationActors.length; index += 1) {
                const actor = formationActors[index];
                actor.modePosition = this.currentMode === 'free-throw'
                    ? this.getFreeThrowQueuePosition(halfIndex, index)
                    : this.threePointNodes[halfIndex][index].worldPosition.clone();
                actor.node.setWorldPosition(actor.modePosition);
                this.applyPerspectiveScale(actor, actor.modePosition);
            }
            if (this.currentMode === 'free-throw') {
                const shooter = this.freeThrowQueues[team][0];
                this.setBallOwner(this.basketballs[team], shooter);
            }
        }
        this.sortActorDepth();
    }

    private setBasketballCount(count: number): void {
        for (let index = 0; index < this.basketballs.length; index += 1) {
            this.basketballs[index].active = index < count;
        }
    }

    private getFreeThrowQueuePosition(halfIndex: number, index: number): Vec3 {
        const freeThrow = this.freeThrowNodes[halfIndex].worldPosition;
        if (index === 0) {
            return freeThrow.clone();
        }
        const hoop = this.hoopNodes[halfIndex].worldPosition;
        const outwardX = Math.sign(freeThrow.x - hoop.x);
        return new Vec3(
            freeThrow.x + outwardX * index * 54,
            freeThrow.y,
            freeThrow.z,
        );
    }

    private rotateFreeThrowQueue(team: number, ball: Node, token: number): void {
        if (token !== this.eventToken || this.currentMode !== 'free-throw') {
            return;
        }
        const queue = this.freeThrowQueues[team];
        const shooter = queue.shift();
        if (!shooter) {
            return;
        }
        queue.push(shooter);
        const halfIndex = team === 0 ? 1 : 0;
        for (let index = 0; index < queue.length; index += 1) {
            const actor = queue[index];
            actor.modePosition = this.getFreeThrowQueuePosition(halfIndex, index);
            if (index === 0) {
                this.dribbleTo(ball, actor, actor.modePosition, 0.36, token);
            } else {
                this.moveActor(actor, actor.modePosition, 0.36);
            }
        }
    }

    private pickScrimmageTactic(): ScrimmageTactic {
        const candidates = this.lastTactic
            ? SCRIMMAGE_TACTICS.filter((tactic) => tactic !== this.lastTactic)
            : SCRIMMAGE_TACTICS;
        const tactic = candidates[Math.floor(Math.random() * candidates.length)];
        this.lastTactic = tactic;
        return tactic;
    }

    private createReboundPlan(
        shooter: CourtActor,
        offense: CourtActor[],
        defense: CourtActor[],
        offenseTeam: number,
    ): ReboundPlan {
        const scenarios: ReboundScenario[] = [
            'self',
            'teammate-single',
            'teammate-contested',
            'opponent-single',
            'opponent-contested',
        ];
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        const teammates = offense.filter((actor) => actor !== shooter);

        if (scenario === 'self') {
            return { scenario, winner: shooter, contenders: [shooter], offenseTeam };
        }

        if (scenario === 'teammate-single' || scenario === 'teammate-contested') {
            const winner = teammates[Math.floor(Math.random() * teammates.length)];
            const contenders = scenario === 'teammate-single'
                ? [winner]
                : [winner, ...this.pickDistinctActors(defense, 2)];
            return { scenario, winner, contenders, offenseTeam };
        }

        const winner = defense[Math.floor(Math.random() * defense.length)];
        const contenders = scenario === 'opponent-single'
            ? [winner]
            : [winner, shooter, ...this.pickDistinctActors(teammates, 1)];
        return { scenario, winner, contenders, offenseTeam };
    }

    private pickDistinctActors(actors: CourtActor[], count: number): CourtActor[] {
        const pool = [...actors];
        const result: CourtActor[] = [];
        while (pool.length > 0 && result.length < count) {
            const index = Math.floor(Math.random() * pool.length);
            result.push(pool.splice(index, 1)[0]);
        }
        return result;
    }

    private prepareScrimmageTactic(
        offense: CourtActor[],
        tactic: ScrimmageTactic,
    ): ScrimmageTacticSetup {
        const currentOwner = this.ballOwners.get(this.basketballs[0])?.actor;
        const handler = offense.find((actor) => actor === currentOwner) ?? this.pickShooter(offense);
        let points: Array<[number, number]>;
        let finisherIndex = 0;
        let commentaryCategory = 'fiveOut';
        let finishType: ScrimmageTacticSetup['finishType'] = 'layup';

        if (tactic === 'five-out') {
            points = [[0.42, 0.5], [0.58, 0.22], [0.58, 0.78], [0.86, 0.12], [0.86, 0.88]];
            finisherIndex = Math.random() < 0.5 ? 3 : 4;
            finishType = 'jump-shot';
        } else if (tactic === 'four-out-one-in') {
            points = [[0.4, 0.5], [0.58, 0.2], [0.58, 0.8], [0.82, 0.14], [0.84, 0.62]];
            finisherIndex = Math.random() < 0.5 ? 2 : 3;
            commentaryCategory = 'fourOutOneIn';
        } else if (tactic === 'pick-and-roll') {
            points = [[0.38, 0.5], [0.48, 0.5], [0.68, 0.18], [0.68, 0.82], [0.86, 0.82]];
            finisherIndex = Math.random() < 0.45 ? 0 : 1;
            finishType = finisherIndex === 0 ? 'jump-shot' : 'layup';
            commentaryCategory = 'pickAndRoll';
        } else if (tactic === 'low-post') {
            points = [[0.48, 0.28], [0.54, 0.76], [0.72, 0.14], [0.72, 0.86], [0.88, 0.62]];
            finisherIndex = 4;
            finishType = 'jump-shot';
            commentaryCategory = 'lowPost';
        } else {
            points = [[0.34, 0.5], [0.55, 0.4], [0.55, 0.6], [0.84, 0.12], [0.84, 0.88]];
            finisherIndex = 2;
            commentaryCategory = 'horns';
        }

        const roles = [handler];
        const available = offense.filter((actor) => actor !== handler);
        for (let index = 1; index < points.length; index += 1) {
            const [depth, vertical] = points[index];
            const target = this.getAttackingHalfPoint(handler.team, depth, vertical);
            available.sort(
                (a, b) => Vec3.distance(a.node.worldPosition, target) - Vec3.distance(b.node.worldPosition, target),
            );
            roles.push(available.shift()!);
        }

        this.scrimmageTacticAnchors.clear();
        this.scrimmageTacticRoles = roles;
        this.scrimmageMovementSteps.clear();
        for (let index = 0; index < roles.length; index += 1) {
            const [depth, vertical] = points[index];
            this.scrimmageTacticAnchors.set(
                roles[index],
                this.getAttackingHalfPoint(roles[index].team, depth, vertical),
            );
        }

        return {
            roles,
            handler,
            finisher: roles[finisherIndex],
            passer: handler,
            commentaryCategory,
            finishType,
        };
    }

    private getAttackingHalfPoint(team: number, depth: number, vertical: number): Vec3 {
        const u = team === 0 ? 0.5 + depth * 0.46 : 0.5 - depth * 0.46;
        return this.pointInCourt(u, vertical);
    }

    private moveScrimmageActors(shooter: CourtActor, ballHandler: CourtActor, offenseTeam: number): void {
        for (const actor of this.actors) {
            if (actor === shooter || this.scrimmageActionActors.has(actor)) {
                continue;
            }
            this.moveScrimmageActorContinuously(actor, shooter, ballHandler, offenseTeam, this.eventToken);
        }
    }

    private moveScrimmageActorContinuously(
        actor: CourtActor,
        shooter: CourtActor,
        ballHandler: CourtActor,
        offenseTeam: number,
        token: number,
    ): void {
        if (
            token !== this.eventToken
            || this.currentMode !== 'scrimmage'
            || actor === shooter
            || this.scrimmageActionActors.has(actor)
        ) {
            return;
        }
        const start = actor.node.worldPosition.clone();
        const target = this.getScrimmageMovementTarget(actor, offenseTeam);
        const state = this.trackTweenTarget({ progress: 0 });
        const duration = this.getScrimmageMovementDuration(actor, ballHandler, offenseTeam, target);
        tween(state)
            .to(duration, { progress: 1 }, {
                onUpdate: () => {
                    if (token !== this.eventToken || this.scrimmageActionActors.has(actor)) {
                        return;
                    }
                    const position = Vec3.lerp(new Vec3(), start, target, state.progress);
                    actor.node.setWorldPosition(position);
                    this.applyPerspectiveScale(actor, position);
                },
            })
            .call(() => {
                this.sortActorDepth();
                const roleIndex = Math.max(0, this.scrimmageTacticRoles.indexOf(actor));
                const waypointPause = actor.team === offenseTeam
                    ? 0.08 + roleIndex % 3 * 0.04
                    : 0.04;
                this.scheduleOnce(() => {
                    this.moveScrimmageActorContinuously(actor, shooter, ballHandler, offenseTeam, token);
                }, waypointPause);
            })
            .start();
    }

    private getScrimmageMovementDuration(
        actor: CourtActor,
        ballHandler: CourtActor,
        offenseTeam: number,
        target: Readonly<Vec3>,
    ): number {
        const profile = SCRIMMAGE_PACE_PROFILES[this.currentTactic];
        const roleMultiplier = actor === ballHandler
            ? profile.ballHandler
            : actor.team === offenseTeam
                ? profile.offBall
                : profile.defense;
        const distance = Vec3.distance(actor.node.worldPosition, target);
        const pixelsPerSecond = 240 + Math.random() * 40;
        return Math.max(0.12, distance / pixelsPerSecond * roleMultiplier);
    }

    private getScrimmageActionDuration(duration: number): number {
        if (this.currentMode !== 'scrimmage') {
            return duration;
        }
        return Math.max(0.45, duration * 1.45 * SCRIMMAGE_PACE_PROFILES[this.currentTactic].action);
    }

    private getScrimmageMovementTarget(actor: CourtActor, offenseTeam: number): Vec3 {
        if (actor.team === offenseTeam) {
            const roleIndex = this.scrimmageTacticRoles.indexOf(actor);
            const route = SCRIMMAGE_OFF_BALL_ROUTES[this.currentTactic][roleIndex];
            if (route && route.length > 0) {
                const step = this.scrimmageMovementSteps.get(actor) ?? 0;
                this.scrimmageMovementSteps.set(actor, step + 1);
                const [depth, vertical] = route[step % route.length];
                return this.getAttackingHalfPoint(actor.team, depth, vertical);
            }
            const anchor = this.scrimmageTacticAnchors.get(actor);
            if (anchor) {
                return anchor.clone();
            }
            return this.pointInCourt(0.5, 0.5);
        }

        const offense = this.getTeamActors(offenseTeam);
        const actorIndex = this.getTeamActors(actor.team).indexOf(actor);
        const mark = this.scrimmageTacticRoles[Math.max(0, actorIndex)]
            ?? offense[Math.max(0, actorIndex) % offense.length];
        const hoop = this.getAttackingHoop(offenseTeam);
        const helpRatio = this.currentTactic === 'pick-and-roll' && actorIndex < 2
            ? 0.2
            : this.currentTactic === 'low-post' && actorIndex !== 4
                ? 0.16
                : 0.12;
        const target = Vec3.lerp(new Vec3(), mark.node.worldPosition, hoop.worldPosition, helpRatio);
        const laneDirection = new Vec3();
        Vec3.subtract(laneDirection, hoop.worldPosition, mark.node.worldPosition);
        if (laneDirection.length() > 0) {
            laneDirection.normalize();
        }
        const lateralOffset = (actorIndex - 2) * 6;
        target.add3f(-laneDirection.y * lateralOffset, laneDirection.x * lateralOffset, 0);
        return target;
    }

    private placeBallRetrievers(): void {
        for (let index = 0; index < this.ballRetrievers.length; index += 1) {
            this.ballRetrievers[index].setWorldPosition(this.ballDropNodes[index].worldPosition);
        }
    }

    private restoreActorsHome(): void {
        for (const actor of this.actors) {
            actor.node.setWorldPosition(actor.homePosition);
            actor.node.setScale(actor.homeScale);
        }
        this.sortActorDepth();
    }

    private collectCourtActors(): void {
        if (!this.playersRoot) {
            return;
        }
        this.actors = [...this.playersRoot.children]
            .filter((node) => /^球员\d+$/.test(node.name))
            .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN', { numeric: true }))
            .slice(0, 10)
            .map((node, index) => {
                const actor: CourtActor = {
                    node,
                    ballAnchors: this.collectBallAnchors(node),
                    facing: index < 5 ? 'right' : 'left',
                    homePosition: node.worldPosition.clone(),
                    modePosition: node.worldPosition.clone(),
                    homeScale: node.scale.clone(),
                    homePerspectiveFactor: this.getPerspectiveFactor(node.worldPosition),
                    player: null,
                    team: index < 5 ? 0 : 1,
                };
                this.hideActorBallAnchors(actor);
                return actor;
            });
    }

    private collectBallRetrieverCarriers(): void {
        this.ballRetrieverCarriers = this.ballRetrievers.map((node, index) => {
            const carrier: BallCarrier = {
                node,
                ballAnchors: this.collectBallAnchors(node),
                facing: index === 0 ? 'right' : 'left',
            };
            this.hideActorBallAnchors(carrier);
            return carrier;
        });
    }

    private collectBallAnchors(node: Node): BallCarrier['ballAnchors'] {
        return {
            left: {
                hold: node.getChildByName('持球点-左'),
                dribble: node.getChildByName('运球点-左'),
                shot: node.getChildByName('投射点-左'),
            },
            right: {
                hold: node.getChildByName('持球点-右'),
                dribble: node.getChildByName('运球点-右'),
                shot: node.getChildByName('投射点-右'),
            },
        };
    }

    private readRosterPlayers(): RosterPlayer[] {
        if (!this.rosterContainer) {
            return [];
        }
        return this.rosterContainer.children.map((slot, index) => {
            const ovrText = slot.getChildByName('ovr')?.getComponent(Label)?.string ?? '0';
            const slotView = slot.getComponent(RosterSlotView);
            const number = slotView?.getOverall() ?? Number(ovrText.replace(/[^\d.-]/g, ''));
            const slotNumber = slot.name.match(/\d+/)?.[0] ?? String(index + 1);
            return {
                id: slot.uuid,
                name: `${Number(slotNumber)}号球员`,
                ovr: Number.isFinite(number) ? Math.max(0, number) : 0,
                originalIndex: Number(slotNumber) || index + 1,
            };
        });
    }

    private resolveReferenceNodes(): boolean {
        if (!this.ballNode || !this.playersRoot || !this.commentaryLabel || !this.courtRange || !this.rosterContainer) {
            console.error('[CourtSimulationController] Missing ball, players, commentary, court range, or roster.');
            return false;
        }

        const cornerNames = ['左上角', '右上角', '左下角', '右下角'];
        this.cornerNodes = cornerNames
            .map((name) => this.courtRange?.getChildByName(name) ?? null)
            .filter((node): node is Node => Boolean(node));
        this.hoopNodes = ['篮筐1', '篮筐2']
            .map((name) => this.courtRange?.getChildByName(name) ?? null)
            .filter((node): node is Node => Boolean(node));
        this.ballDropNodes = ['进球后下落终点1', '进球后下落终点2']
            .map((name) => this.courtRange?.getChildByName(name) ?? null)
            .filter((node): node is Node => Boolean(node));
        this.ballRetrievers = ['捡球球员1', '捡球球员2']
            .map((name) => this.playersRoot?.getChildByName(name) ?? null)
            .filter((node): node is Node => Boolean(node));
        this.freeThrowNodes = ['罚球点2', '罚球点1']
            .map((name) => this.courtRange?.getChildByName(name) ?? null)
            .filter((node): node is Node => Boolean(node));
        this.threePointNodes = [
            this.courtRange.children.filter((node) => node.name.startsWith('左半场-') && node.name.includes('三分')),
            this.courtRange.children.filter((node) => node.name.startsWith('右半场-') && node.name.includes('三分')),
        ];

        if (
            this.cornerNodes.length !== 4
            || this.hoopNodes.length !== 2
            || this.ballDropNodes.length !== 2
            || this.ballRetrievers.length !== 2
            || this.freeThrowNodes.length !== 2
            || this.threePointNodes.some((nodes) => nodes.length < 5)
        ) {
            console.error('[CourtSimulationController] Court corners, hoops, free throws, ball drops, or retrievers are incomplete.');
            return false;
        }
        return true;
    }

    private pickAction(): ActionType {
        const roll = Math.random();
        if (roll < 0.34) {
            return 'jump-shot';
        }
        if (roll < 0.62) {
            return 'layup';
        }
        if (roll < 0.82) {
            return 'dunk';
        }
        return 'assist';
    }

    private getSuccessChance(action: ActionType, ovr: number): number {
        const ovrBonus = Math.max(-0.12, Math.min(0.16, (ovr - 70) * 0.008));
        const base = action === 'jump-shot' ? 0.56 : action === 'dunk' ? 0.82 : 0.7;
        return Math.max(0.35, Math.min(0.92, base + ovrBonus));
    }

    private pickShooter(actors: CourtActor[]): CourtActor {
        const candidates = actors.filter((actor) => actor.player?.id !== this.lastShooterId);
        const shooter = candidates[Math.floor(Math.random() * candidates.length)] ?? actors[0];
        this.lastShooterId = shooter.player?.id ?? '';
        return shooter;
    }

    private pickDifferentActor(actors: CourtActor[], actor: CourtActor): CourtActor {
        const candidates = actors.filter((candidate) => candidate !== actor);
        return candidates[Math.floor(Math.random() * candidates.length)] ?? actor;
    }

    private getTeamActors(team: number): CourtActor[] {
        return this.actors.filter((actor) => actor.team === team && actor.node.active && Boolean(actor.player));
    }

    private getAttackingHoop(team: number): Node {
        return team === 0 ? this.hoopNodes[1] : this.hoopNodes[0];
    }

    private pickThreePointNode(team: number): Node | null {
        const nodes = team === 0 ? this.threePointNodes[1] : this.threePointNodes[0];
        return nodes[Math.floor(Math.random() * nodes.length)] ?? null;
    }

    private pointInCourt(u: number, v: number): Vec3 {
        const top = new Vec3();
        const bottom = new Vec3();
        Vec3.lerp(top, this.cornerNodes[0].worldPosition, this.cornerNodes[1].worldPosition, u);
        Vec3.lerp(bottom, this.cornerNodes[2].worldPosition, this.cornerNodes[3].worldPosition, u);
        return Vec3.lerp(new Vec3(), top, bottom, v);
    }

    private getTakeoffPoint(hoop: Node, team: number, distance: number, lateral: number): Vec3 {
        const center = this.courtRange?.getChildByName('中场点')?.worldPosition
            ?? this.pointInCourt(0.5, 0.5);
        const direction = new Vec3();
        Vec3.subtract(direction, center, hoop.worldPosition).normalize();
        const perpendicular = new Vec3(-direction.y, direction.x, 0);
        const point = hoop.worldPosition.clone();
        point.add3f(direction.x * distance, direction.y * distance, 0);
        point.add3f(perpendicular.x * lateral, perpendicular.y * lateral, 0);
        return point;
    }

    private moveActor(actor: CourtActor, target: Vec3, duration: number): void {
        const start = actor.node.worldPosition.clone();
        const state = this.trackTweenTarget({ progress: 0 });
        tween(state)
            .to(duration, { progress: 1 }, {
                onUpdate: () => {
                    const position = Vec3.lerp(new Vec3(), start, target, state.progress);
                    actor.node.setWorldPosition(position);
                    this.applyPerspectiveScale(actor, position);
                },
            })
            .call(() => this.sortActorDepth())
            .start();
    }

    private dribbleTo(
        ball: Node,
        actor: CourtActor,
        target: Vec3,
        duration: number,
        token: number,
        onComplete: () => void = () => {},
    ): void {
        this.setBallMotionOwner(ball, actor, 'dribble');
        const start = actor.node.worldPosition.clone();
        const bounceCount = Math.max(1, Math.round(duration / 0.32));
        const state = this.trackTweenTarget({ progress: 0 });
        tween(state)
            .to(duration, { progress: 1 }, {
                onUpdate: () => {
                    if (token !== this.eventToken) {
                        return;
                    }
                    const position = Vec3.lerp(new Vec3(), start, target, state.progress);
                    actor.node.setWorldPosition(position);
                    this.applyPerspectiveScale(actor, position);
                    const holdPoint = this.getBallAnchorPosition(actor, 'hold');
                    const dribblePoint = this.getBallAnchorPosition(actor, 'dribble');
                    const bounceProgress = Math.abs(Math.sin(state.progress * Math.PI * bounceCount));
                    ball.setWorldPosition(Vec3.lerp(new Vec3(), holdPoint, dribblePoint, bounceProgress));
                },
            })
            .call(() => {
                this.sortActorDepth();
                if (token === this.eventToken) {
                    this.setBallOwner(ball, actor, 'hold');
                    onComplete();
                }
            })
            .start();
    }

    private gatherBallForShot(
        ball: Node,
        shooter: CourtActor,
        token: number,
        onComplete: (shotPoint: Vec3) => void,
    ): void {
        this.setBallMotionOwner(ball, shooter, 'shot');
        const state = this.trackTweenTarget({ progress: 0 });
        tween(state)
            .to(0.12, { progress: 1 }, {
                onUpdate: () => {
                    if (token !== this.eventToken) {
                        return;
                    }
                    const holdPoint = this.getBallAnchorPosition(shooter, 'hold');
                    const shotPoint = this.getBallAnchorPosition(shooter, 'shot');
                    ball.setWorldPosition(Vec3.lerp(new Vec3(), holdPoint, shotPoint, state.progress));
                },
            })
            .call(() => {
                if (token === this.eventToken) {
                    const shotPoint = this.getBallAnchorPosition(shooter, 'shot');
                    ball.setWorldPosition(shotPoint);
                    onComplete(shotPoint);
                }
            })
            .start();
    }

    private passBall(
        ball: Node,
        start: Readonly<Vec3>,
        receiver: BallCarrier,
        reception: PassReception,
        token: number,
        onComplete: () => void,
    ): void {
        const startPoint = new Vec3(start.x, start.y, start.z);
        const initialEnd = this.getBallAnchorPosition(receiver, 'hold');
        const flightDuration = this.getPassFlightDuration(startPoint, receiver);
        const releaseDuration = 0.08;
        const totalDuration = releaseDuration + flightDuration;
        const releaseRatio = releaseDuration / totalDuration;
        const direction = initialEnd.x >= startPoint.x ? 1 : -1;
        const releasePoint = new Vec3(
            startPoint.x + direction * 18,
            startPoint.y + 10,
            startPoint.z,
        );
        const passDistance = Vec3.distance(startPoint, initialEnd);
        const arcHeight = Math.min(52, 18 + passDistance * 0.06);
        const state = this.trackTweenTarget({ progress: 0 });

        this.releaseBall(ball);
        ball.setWorldPosition(startPoint);
        tween(state)
            .to(totalDuration, { progress: 1 }, {
                onUpdate: () => {
                    if (token !== this.eventToken) {
                        return;
                    }
                    if (state.progress < releaseRatio) {
                        const releaseProgress = state.progress / releaseRatio;
                        ball.setWorldPosition(Vec3.lerp(new Vec3(), startPoint, releasePoint, releaseProgress));
                        return;
                    }

                    const flightProgress = (state.progress - releaseRatio) / (1 - releaseRatio);
                    const endPoint = this.getBallAnchorPosition(receiver, 'hold');
                    const controlPoint = Vec3.lerp(new Vec3(), releasePoint, endPoint, 0.5);
                    controlPoint.y += arcHeight;
                    const inverse = 1 - flightProgress;
                    ball.setWorldPosition(new Vec3(
                        inverse * inverse * releasePoint.x
                            + 2 * inverse * flightProgress * controlPoint.x
                            + flightProgress * flightProgress * endPoint.x,
                        inverse * inverse * releasePoint.y
                            + 2 * inverse * flightProgress * controlPoint.y
                            + flightProgress * flightProgress * endPoint.y,
                        endPoint.z,
                    ));
                },
            })
            .call(() => {
                if (token === this.eventToken) {
                    ball.setWorldPosition(this.getBallAnchorPosition(receiver, 'hold'));
                    this.setBallOwner(ball, receiver);
                    if (reception === 'shoot') {
                        onComplete();
                        return;
                    }
                    this.scheduleOnce(() => {
                        if (token === this.eventToken) {
                            onComplete();
                        }
                    }, 0.16);
                }
            })
            .start();
    }

    private getPassFlightDuration(start: Readonly<Vec3>, receiver: BallCarrier): number {
        const end = this.getBallAnchorPosition(receiver, 'hold');
        return Math.max(0.2, Math.min(0.38, Vec3.distance(start, end) / 1100));
    }

    private animateBallArc(
        ball: Node,
        start: Readonly<Vec3>,
        end: Readonly<Vec3>,
        duration: number,
        height: number,
        token: number,
        onComplete?: () => void,
    ): void {
        this.releaseBall(ball);
        const state = this.trackTweenTarget({ progress: 0 });
        ball.setWorldPosition(start);
        tween(state)
            .to(duration, { progress: 1 }, {
                onUpdate: () => {
                    if (token !== this.eventToken) {
                        return;
                    }
                    const position = Vec3.lerp(new Vec3(), start, end, state.progress);
                    position.y += Math.sin(state.progress * Math.PI) * height;
                    ball.setWorldPosition(position);
                },
            })
            .call(() => {
                if (token === this.eventToken) {
                    onComplete?.();
                }
            })
            .start();
    }

    private jumpActor(actor: CourtActor, scaleMultiplier: number, duration: number): void {
        const original = actor.node.scale.clone();
        const enlarged = new Vec3(original.x * scaleMultiplier, original.y * scaleMultiplier, original.z);
        tween(actor.node)
            .to(duration * 0.45, { scale: enlarged })
            .to(duration * 0.55, { scale: original })
            .start();
    }

    private pulseNode(node: Node): void {
        const original = node.scale.clone();
        tween(node)
            .to(0.1, { scale: new Vec3(original.x * 1.08, original.y * 1.08, original.z) })
            .to(0.12, { scale: original })
            .start();
    }

    private shakeHoop(hoop: Node): void {
        const original = hoop.scale.clone();
        tween(hoop)
            .to(0.08, { scale: new Vec3(original.x * 1.08, original.y * 0.92, original.z) })
            .to(0.12, { scale: original })
            .start();
    }

    private applyPerspectiveScale(actor: CourtActor, worldPosition: Readonly<Vec3>): void {
        const factor = this.getPerspectiveFactor(worldPosition);
        const relativeFactor = factor / actor.homePerspectiveFactor;
        actor.node.setScale(
            actor.homeScale.x * relativeFactor,
            actor.homeScale.y * relativeFactor,
            actor.homeScale.z,
        );
    }

    private getPerspectiveFactor(worldPosition: Readonly<Vec3>): number {
        const topY = (this.cornerNodes[0].worldPosition.y + this.cornerNodes[1].worldPosition.y) * 0.5;
        const bottomY = (this.cornerNodes[2].worldPosition.y + this.cornerNodes[3].worldPosition.y) * 0.5;
        const depth = Math.max(0, Math.min(1, (topY - worldPosition.y) / (topY - bottomY)));
        return 0.82 + depth * 0.22;
    }

    private sortActorDepth(): void {
        const sorted = [...this.actors]
            .filter((actor) => actor.node.active)
            .sort((a, b) => b.node.worldPosition.y - a.node.worldPosition.y);
        sorted.forEach((actor, index) => actor.node.setSiblingIndex(index));
    }

    private findNearestActor(actors: CourtActor[], position: Readonly<Vec3>): CourtActor | null {
        let nearest: CourtActor | null = null;
        let nearestDistance = Number.POSITIVE_INFINITY;
        for (const actor of actors) {
            const distance = Vec3.distance(actor.node.worldPosition, position);
            if (distance < nearestDistance) {
                nearest = actor;
                nearestDistance = distance;
            }
        }
        return nearest;
    }

    private getLegacyBallHandPosition(position: Readonly<Vec3>): Vec3 {
        return new Vec3(position.x + 15, position.y + 12, position.z);
    }

    private getBallAnchorPosition(
        actor: BallCarrier,
        kind: BallAnchorKind,
        actorPosition: Readonly<Vec3> = actor.node.worldPosition,
    ): Vec3 {
        const anchors = actor.ballAnchors[actor.facing];
        const anchor = anchors[kind];
        if (!anchor) {
            const fallbackY = kind === 'dribble' ? -6 : kind === 'shot' ? 30 : 12;
            const direction = actor.facing === 'right' ? 1 : -1;
            return new Vec3(actorPosition.x + direction * 15, actorPosition.y + fallbackY, actorPosition.z);
        }

        const actorWorld = actor.node.worldPosition;
        const anchorWorld = anchor.worldPosition;
        return new Vec3(
            actorPosition.x + anchorWorld.x - actorWorld.x,
            actorPosition.y + anchorWorld.y - actorWorld.y,
            actorPosition.z + anchorWorld.z - actorWorld.z,
        );
    }

    private setBallOwner(ball: Node, owner: BallCarrier, kind: BallAnchorKind = 'hold'): void {
        const previous = this.ballOwners.get(ball);
        if (previous) {
            this.hideActorBallAnchors(previous.actor);
        }
        this.ballOwners.set(ball, { actor: owner, kind, visual: 'anchor' });
        this.showActorBallAnchor(owner, kind);
        ball.setWorldPosition(this.getBallAnchorPosition(owner, kind));
        ball.active = false;
    }

    private setBallMotionOwner(ball: Node, owner: BallCarrier, kind: BallAnchorKind): void {
        const previous = this.ballOwners.get(ball);
        if (previous) {
            this.hideActorBallAnchors(previous.actor);
        }
        this.hideActorBallAnchors(owner);
        this.ballOwners.set(ball, { actor: owner, kind, visual: 'motion' });
        ball.setWorldPosition(this.getBallAnchorPosition(owner, 'hold'));
        ball.active = true;
    }

    private releaseBall(ball: Node): void {
        const ownership = this.ballOwners.get(ball);
        if (ownership) {
            this.hideActorBallAnchors(ownership.actor);
        }
        this.ballOwners.delete(ball);
        ball.active = true;
    }

    private clearBallOwners(): void {
        for (const actor of [...this.actors, ...this.ballRetrieverCarriers]) {
            this.hideActorBallAnchors(actor);
        }
        this.ballOwners.clear();
    }

    private hideActorBallAnchors(actor: BallCarrier): void {
        for (const anchors of [actor.ballAnchors.left, actor.ballAnchors.right]) {
            for (const node of [anchors.hold, anchors.dribble, anchors.shot]) {
                if (node) {
                    node.active = false;
                }
            }
        }
    }

    private showActorBallAnchor(actor: BallCarrier, kind: BallAnchorKind): void {
        this.hideActorBallAnchors(actor);
        const anchors = actor.ballAnchors[actor.facing];
        const node = anchors[kind];
        if (node) {
            node.active = true;
        }
    }

    private showActionCommentary(
        category: string,
        player: CourtActor,
        defender: CourtActor,
        teammate: CourtActor,
    ): void {
        const ids = COMMENTARY_IDS[category] ?? [];
        const candidates = ids.filter((id) => id !== this.lastCommentaryId);
        const id = (candidates.length > 0 ? candidates : ids)[Math.floor(Math.random() * Math.max(1, candidates.length || ids.length))];
        const entry = this.commentaryById.get(id);
        if (!entry) {
            this.setCommentary(`${player.player?.name ?? '球员'}正在进行训练。`);
            return;
        }

        this.lastCommentaryId = id;
        const teamName = sys.localStorage.getItem(TEAM_NAME_STORAGE_KEY)?.trim() || DEFAULT_TEAM_NAME;
        const replacements: Record<string, string> = {
            '{{player}}': player.player?.name ?? player.node.name,
            '{{defender}}': defender.player?.name ?? defender.node.name,
            '{{teammate}}': teammate.player?.name ?? teammate.node.name,
            '{{team}}': `${teamName}${player.team === 0 ? 'A队' : 'B队'}`,
            '{{opponent_team}}': `${teamName}${player.team === 0 ? 'B队' : 'A队'}`,
            '{{coach}}': '球队教练',
        };
        let text = entry.text;
        for (const [placeholder, value] of Object.entries(replacements)) {
            text = text.split(placeholder).join(value);
        }
        this.setCommentary(text);
    }

    private setCommentary(text: string): void {
        if (this.commentaryLabel) {
            this.commentaryLabel.string = text;
        }
    }

    private trackTweenTarget<T extends object>(target: T): T {
        this.activeTweenTargets.push(target);
        return target;
    }

    private stopAnimations(): void {
        for (const target of this.activeTweenTargets) {
            Tween.stopAllByTarget(target);
        }
        this.activeTweenTargets.length = 0;
        for (const actor of this.actors) {
            Tween.stopAllByTarget(actor.node);
        }
        for (const hoop of this.hoopNodes) {
            Tween.stopAllByTarget(hoop);
        }
        for (const retriever of this.ballRetrievers) {
            Tween.stopAllByTarget(retriever);
        }
        for (const ball of this.basketballs) {
            Tween.stopAllByTarget(ball);
        }
    }

    private stopSimulation(): void {
        this.eventToken += 1;
        this.scrimmagePossessionActive = false;
        this.unscheduleAllCallbacks();
        this.stopAnimations();
        this.clearBallOwners();
        this.restoreActorsHome();
        this.setBasketballCount(1);
        for (const retriever of this.ballRetrievers) {
            retriever.active = true;
        }
        this.placeBallRetrievers();
        this.simulationReady = false;
    }
}

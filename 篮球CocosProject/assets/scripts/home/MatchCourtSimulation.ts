import {
    Node,
    tween,
    Tween,
    Vec3,
} from 'cc';
import { PlayerCard } from './GameState';
import { MatchCommentarySelector } from './MatchCommentarySelector';

// 与 MatchController 的单节时长保持一致。
const MATCH_QUARTER_SECONDS = 60;

export type MatchTactic =
    | 'five-out'
    | 'four-out-one-in'
    | 'pick-and-roll'
    | 'low-post'
    | 'horns';

export type MatchPlayAction =
    | 'three'
    | 'jumper'
    | 'layup'
    | 'dunk'
    | 'free-throw'
    | 'and-one'
    | 'turnover';

export type MatchReboundResult = 'self' | 'teammate' | 'opponent';

export interface MatchPlayEvent {
    index: number;
    quarter: number;
    startSecond: number;
    offenseTeam: number;
    tactic: MatchTactic;
    action: MatchPlayAction;
    points: number;
    shooterIndex: number;
    handlerIndex: number;
    passerIndex: number;
    made: boolean;
    foul: boolean;
    rebound: MatchReboundResult;
    contestedRebound: boolean;
}

export interface MatchCourtCallbacks {
    onScore: (team: number, points: number, event: MatchPlayEvent) => void;
    onCommentary: (
        text: string | readonly string[],
        event: MatchPlayEvent,
        mentions: readonly MatchCommentaryMention[],
    ) => void;
    onPlayComplete: (nextPossessionTeam: number, event: MatchPlayEvent) => void;
}

export interface MatchCommentaryMention {
    name: string;
    team: number;
}

interface BallAnchorSet {
    hold: Node | null;
    dribble: Node | null;
    shot: Node | null;
}

interface MatchActor {
    node: Node;
    team: number;
    teamIndex: number;
    card: PlayerCard | null;
    homeScale: Vec3;
    homePerspectiveFactor: number;
    facing: 'left' | 'right';
    ballAnchors: {
        left: BallAnchorSet;
        right: BallAnchorSet;
    };
}

type BallAnchorKind = keyof BallAnchorSet;

interface TacticSetup {
    offense: MatchActor[];
    defense: MatchActor[];
    handler: MatchActor;
    passer: MatchActor;
    shooter: MatchActor;
    helper: MatchActor;
    points: ReadonlyArray<readonly [number, number]>;
}

interface BallOwnership {
    actor: MatchActor;
    kind: BallAnchorKind;
    visual: 'anchor' | 'motion';
}

const TACTIC_NAMES: Record<MatchTactic, string> = {
    'five-out': '五外拉开',
    'four-out-one-in': '四外一内',
    'pick-and-roll': '高位挡拆',
    'low-post': '低位单打',
    horns: '牛角战术',
};

const TACTIC_POINTS: Record<
    MatchTactic,
    ReadonlyArray<readonly [number, number]>
> = {
    'five-out': [
        [0.38, 0.5],
        [0.58, 0.2],
        [0.58, 0.8],
        [0.86, 0.12],
        [0.86, 0.88],
    ],
    'four-out-one-in': [
        [0.4, 0.5],
        [0.6, 0.2],
        [0.6, 0.8],
        [0.84, 0.15],
        [0.86, 0.62],
    ],
    'pick-and-roll': [
        [0.38, 0.5],
        [0.5, 0.5],
        [0.7, 0.18],
        [0.7, 0.82],
        [0.86, 0.82],
    ],
    'low-post': [
        [0.46, 0.28],
        [0.54, 0.76],
        [0.72, 0.14],
        [0.72, 0.86],
        [0.88, 0.62],
    ],
    horns: [
        [0.34, 0.5],
        [0.56, 0.4],
        [0.56, 0.6],
        [0.84, 0.12],
        [0.84, 0.88],
    ],
};

const STARTING_FORMATIONS: ReadonlyArray<
    ReadonlyArray<readonly [number, number]>
> = [
    [
        [0.18, 0.24],
        [0.18, 0.76],
        [0.32, 0.16],
        [0.32, 0.5],
        [0.32, 0.84],
    ],
    [
        [0.82, 0.24],
        [0.82, 0.76],
        [0.68, 0.16],
        [0.68, 0.5],
        [0.68, 0.84],
    ],
];
const MATCH_ACTOR_SCALE = 0.86;

export class MatchCourtSimulation {
    private readonly actors: MatchActor[] = [];
    private readonly cornerNodes: Node[] = [];
    private readonly hoopNodes: Node[] = [];
    private readonly freeThrowNodes: Node[] = [];
    private readonly ballDropNodes: Node[] = [];
    private readonly threePointNodes: Node[][] = [[], []];
    private readonly activeTweenTargets: object[] = [];
    private readonly callbacks: MatchCourtCallbacks;
    private readonly ballOwners = new Map<Node, BallOwnership>();
    private token = 0;
    private speedMultiplier = 1;
    private busy = false;
    private activeEvent: MatchPlayEvent | null = null;

    public constructor(
        private readonly playersRoot: Node,
        private readonly courtRange: Node,
        private readonly ball: Node,
        playerCards: ReadonlyArray<PlayerCard | null>,
        opponentCards: ReadonlyArray<PlayerCard | null>,
        callbacks: MatchCourtCallbacks,
        private readonly commentarySelector: MatchCommentarySelector,
    ) {
        this.callbacks = callbacks;
        this.collectCourtReferences();
        this.collectActors(playerCards, opponentCards);
    }

    public get isReady(): boolean {
        return this.actors.length === 10
            && this.cornerNodes.length === 4
            && this.hoopNodes.length === 2
            && this.freeThrowNodes.length === 2;
    }

    public get isBusy(): boolean {
        return this.busy;
    }

    public reset(startingPossessionTeam = 0): void {
        this.stop();
        this.placeStartingFormation();
        const handler = this.getTeamActors(startingPossessionTeam)[0];
        if (handler) {
            this.faceTeamTowardAttack(startingPossessionTeam);
            this.setBallOwner(handler);
        }
    }

    public playOpeningJumpBall(
        winningTeam: number,
        onComplete: () => void,
    ): boolean {
        if (!this.isReady || this.busy) {
            return false;
        }
        const jumpers = [
            this.getTeamActors(0)[4] ?? this.getTeamActors(0)[0],
            this.getTeamActors(1)[4] ?? this.getTeamActors(1)[0],
        ];
        const receiver = this.getTeamActors(winningTeam)[0];
        if (!jumpers[0] || !jumpers[1] || !receiver) {
            return false;
        }
        this.busy = true;
        this.activeEvent = null;
        this.speedMultiplier = 1;
        this.token += 1;
        const token = this.token;
        this.stopTweens();
        this.placeStartingFormation();
        this.faceTeamTowardAttack(winningTeam);
        const center = this.courtRange.getChildByName('中场点')?.worldPosition.clone()
            ?? this.pointInCourt(0.5, 0.5);
        this.moveActor(jumpers[0], new Vec3(center.x - 26, center.y, center.z), 0.2);
        this.moveActor(jumpers[1], new Vec3(center.x + 26, center.y, center.z), 0.2);
        this.after(0.24, token, () => {
            this.clearBallOwner();
            this.ball.active = true;
            this.ball.setWorldPosition(center);
            this.jumpActor(jumpers[0], 1.14, 0.34);
            this.jumpActor(jumpers[1], 1.14, 0.34);
            this.animateBallArc(
                center,
                this.getBallAnchorPosition(receiver, 'hold'),
                0.36,
                68,
                token,
                () => {
                    if (token !== this.token) {
                        return;
                    }
                    this.setBallOwner(receiver);
                    this.busy = false;
                    onComplete();
                },
            );
        });
        return true;
    }

    public play(event: MatchPlayEvent, speedMultiplier: number): boolean {
        if (!this.isReady || this.busy) {
            return false;
        }
        this.busy = true;
        this.activeEvent = event;
        this.speedMultiplier = Math.max(1, speedMultiplier);
        this.token += 1;
        const token = this.token;
        this.stopTweens();
        this.faceTeamTowardAttack(event.offenseTeam);
        const setup = this.createTacticSetup(event);
        const currentOwner = this.ballOwners.get(this.ball)?.actor ?? null;
        const transitionHandler = currentOwner?.team === event.offenseTeam
            ? currentOwner
            : setup.handler;
        if (currentOwner !== transitionHandler) {
            this.setBallOwner(transitionHandler);
        }
        const beginTactic = (): void => {
            this.moveIntoTactic(setup, transitionHandler, token, () => {
                this.executeTactic(setup, event, token);
            });
        };
        if (
            event.quarter > 0
            && event.startSecond === event.quarter * MATCH_QUARTER_SECONDS
        ) {
            this.playQuarterOpeningInbound(setup, event, token, beginTactic);
        } else {
            beginTactic();
        }
        return true;
    }

    public stop(): void {
        this.token += 1;
        this.busy = false;
        this.activeEvent = null;
        this.stopTweens();
        this.clearBallOwner();
    }

    public settleImmediately(): void {
        this.stop();
    }

    private collectCourtReferences(): void {
        this.cornerNodes.push(
            ...['左上角', '右上角', '左下角', '右下角']
                .map((name) => this.courtRange.getChildByName(name))
                .filter((node): node is Node => Boolean(node)),
        );
        this.hoopNodes.push(
            ...['篮筐1', '篮筐2']
                .map((name) => this.courtRange.getChildByName(name))
                .filter((node): node is Node => Boolean(node)),
        );
        this.freeThrowNodes.push(
            ...['罚球点1', '罚球点2']
                .map((name) => this.courtRange.getChildByName(name))
                .filter((node): node is Node => Boolean(node)),
        );
        this.ballDropNodes.push(
            ...['进球后下落终点1', '进球后下落终点2']
                .map((name) => this.courtRange.getChildByName(name))
                .filter((node): node is Node => Boolean(node)),
        );
        this.threePointNodes[0] = this.courtRange.children.filter(
            (node) => node.name.startsWith('左半场-') && node.name.includes('三分'),
        );
        this.threePointNodes[1] = this.courtRange.children.filter(
            (node) => node.name.startsWith('右半场-') && node.name.includes('三分'),
        );
    }

    private collectActors(
        playerCards: ReadonlyArray<PlayerCard | null>,
        opponentCards: ReadonlyArray<PlayerCard | null>,
    ): void {
        const playerNodes = [
            ...this.playersRoot.children.filter((node) => /^我方球员\d+$/.test(node.name)),
            ...this.playersRoot.children.filter((node) => /^敌方球员\d+$/.test(node.name)),
        ];
        const cards = [...playerCards.slice(0, 5), ...opponentCards.slice(0, 5)];
        playerNodes.slice(0, 10).forEach((node, index) => {
            const team = index < 5 ? 0 : 1;
            const actor: MatchActor = {
                node,
                team,
                teamIndex: index % 5,
                card: cards[index] ?? null,
                homeScale: node.scale.clone(),
                homePerspectiveFactor: this.getPerspectiveFactor(node.worldPosition),
                facing: team === 0 ? 'right' : 'left',
                ballAnchors: this.collectBallAnchors(node),
            };
            this.hideActorBallAnchors(actor);
            this.actors.push(actor);
        });
    }

    private collectBallAnchors(node: Node): MatchActor['ballAnchors'] {
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

    private placeStartingFormation(): void {
        for (let team = 0; team < 2; team += 1) {
            const actors = this.getTeamActors(team);
            const formation = STARTING_FORMATIONS[team];
            actors.forEach((actor, index) => {
                const [u, v] = formation[index];
                const position = this.pointInCourt(u, v);
                actor.node.setWorldPosition(position);
                this.applyPerspectiveScale(actor, position);
            });
        }
        this.sortActorDepth();
    }

    private createTacticSetup(event: MatchPlayEvent): TacticSetup {
        const offense = this.getTeamActors(event.offenseTeam);
        const defense = this.getTeamActors(1 - event.offenseTeam);
        const handler = offense[event.handlerIndex % offense.length] ?? offense[0];
        const shooter = offense[event.shooterIndex % offense.length] ?? offense[0];
        const passer = offense[event.passerIndex % offense.length] ?? handler;
        const helper = offense.find(
            (actor) => actor !== handler && actor !== shooter && actor !== passer,
        ) ?? offense[1] ?? handler;
        return {
            offense,
            defense,
            handler,
            passer,
            shooter,
            helper,
            points: TACTIC_POINTS[event.tactic],
        };
    }

    private playQuarterOpeningInbound(
        setup: TacticSetup,
        event: MatchPlayEvent,
        token: number,
        onComplete: () => void,
    ): void {
        const inbounder = setup.offense[
            (event.handlerIndex + 1) % setup.offense.length
        ] ?? setup.handler;
        const receiver = inbounder === setup.handler
            ? (setup.offense[(event.handlerIndex + 2) % setup.offense.length] ?? inbounder)
            : setup.handler;
        const inboundHoop = this.getAttackingHoop(1 - event.offenseTeam);
        const inboundIndex = this.hoopNodes.indexOf(inboundHoop);
        const inboundPoint = this.ballDropNodes[inboundIndex]?.worldPosition.clone()
            ?? inbounder.node.worldPosition.clone();
        const receiverPoint = this.pointInCourt(
            event.offenseTeam === 0 ? 0.24 : 0.76,
            event.index % 2 === 0 ? 0.44 : 0.56,
        );
        this.clearBallOwner();
        this.ball.active = true;
        this.ball.setWorldPosition(inboundPoint);
        this.moveActor(inbounder, inboundPoint, this.scaled(0.22));
        this.moveActor(receiver, receiverPoint, this.scaled(0.22));
        this.after(0.24, token, () => {
            this.setBallOwner(inbounder);
            this.passBall(inbounder, receiver, token, onComplete);
        });
    }

    private moveIntoTactic(
        setup: TacticSetup,
        transitionHandler: MatchActor,
        token: number,
        onComplete: () => void,
    ): void {
        const roleOrder = this.orderRolesForTactic(setup);
        const offenseTargets = new Map<MatchActor, Vec3>();
        roleOrder.forEach((actor, index) => {
            const [depth, vertical] = setup.points[index];
            offenseTargets.set(
                actor,
                this.getAttackingHalfPoint(actor.team, depth, vertical),
            );
        });
        const maximumTravelDistance = Math.max(
            ...roleOrder.map((actor) => Vec3.distance(
                actor.node.worldPosition,
                offenseTargets.get(actor) ?? actor.node.worldPosition,
            )),
        );
        const transitionDuration = Math.max(
            0.78,
            Math.min(1.9, maximumTravelDistance / 230),
        );
        roleOrder.forEach((actor, index) => {
            if (actor === transitionHandler) {
                return;
            }
            const target = offenseTargets.get(actor);
            if (target) {
                this.moveActor(actor, target, this.scaled(transitionDuration));
            }
        });
        setup.defense.forEach((defender, index) => {
            const mark = roleOrder[index] ?? setup.offense[index];
            const hoop = this.getAttackingHoop(setup.handler.team);
            const [depth, vertical] = setup.points[index];
            const markTarget = this.getAttackingHalfPoint(
                mark.team,
                depth,
                vertical,
            );
            const target = Vec3.lerp(
                new Vec3(),
                markTarget,
                hoop.worldPosition,
                eventHelpRatio(this.activeEvent?.tactic ?? 'five-out', index),
            );
            const lane = new Vec3();
            Vec3.subtract(lane, hoop.worldPosition, markTarget);
            if (lane.length() > 0) {
                lane.normalize();
            }
            const side = index % 2 === 0 ? -1 : 1;
            const spacing = 12 + Math.floor(index / 2) * 4;
            target.add3f(-lane.y * spacing * side, lane.x * spacing * side, 0);
            this.moveActor(defender, target, this.scaled(transitionDuration));
        });

        const transitionTarget = offenseTargets.get(transitionHandler)
            ?? transitionHandler.node.worldPosition.clone();
        this.dribbleTo(
            transitionHandler,
            transitionTarget,
            transitionDuration,
            token,
            () => {
                if (token !== this.token) {
                    return;
                }
                const beginTactic = (): void => {
                    this.startOffBallRoutes(setup, roleOrder, token);
                    onComplete();
                };
                if (transitionHandler !== setup.handler) {
                    this.passBall(transitionHandler, setup.handler, token, beginTactic);
                    return;
                }
                beginTactic();
            },
        );
    }

    private orderRolesForTactic(setup: TacticSetup): MatchActor[] {
        const roles = [setup.handler];
        for (const preferred of [setup.helper, setup.passer, setup.shooter]) {
            if (!roles.includes(preferred)) {
                roles.push(preferred);
            }
        }
        for (const actor of setup.offense) {
            if (!roles.includes(actor)) {
                roles.push(actor);
            }
        }
        return roles.slice(0, 5);
    }

    private startOffBallRoutes(
        setup: TacticSetup,
        roles: MatchActor[],
        token: number,
    ): void {
        roles.forEach((actor, index) => {
            if (
                actor === setup.handler
                || actor === setup.passer
                || actor === setup.shooter
            ) {
                return;
            }
            const [depth, vertical] = setup.points[index];
            const first = this.getAttackingHalfPoint(
                actor.team,
                Math.max(0.4, depth - 0.12),
                1 - vertical,
            );
            const second = this.getAttackingHalfPoint(actor.team, depth, vertical);
            this.moveActor(actor, first, this.scaled(0.62), () => {
                if (token === this.token) {
                    this.moveActor(actor, second, this.scaled(0.58));
                }
            });
        });
        setup.defense.forEach((defender, index) => {
            const mark = roles[index] ?? setup.offense[index];
            const target = Vec3.lerp(
                new Vec3(),
                defender.node.worldPosition,
                mark.node.worldPosition,
                0.58,
            );
            this.moveActor(defender, target, this.scaled(0.82));
        });
    }

    private executeTactic(
        setup: TacticSetup,
        event: MatchPlayEvent,
        token: number,
    ): void {
        if (event.action === 'free-throw') {
            this.playFreeThrows(setup, event, token);
            return;
        }
        if (event.action === 'turnover') {
            this.playTurnover(setup, event, token);
            return;
        }
        switch (event.tactic) {
            case 'five-out':
                this.playFiveOut(setup, event, token);
                break;
            case 'four-out-one-in':
                this.playFourOutOneIn(setup, event, token);
                break;
            case 'pick-and-roll':
                this.playPickAndRoll(setup, event, token);
                break;
            case 'low-post':
                this.playLowPost(setup, event, token);
                break;
            default:
                this.playHorns(setup, event, token);
                break;
        }
    }

    private playFiveOut(
        setup: TacticSetup,
        event: MatchPlayEvent,
        token: number,
    ): void {
        const wing = setup.helper;
        const wingTarget = this.getAttackingHalfPoint(event.offenseTeam, 0.62, 0.28);
        this.dribbleTo(setup.handler, wingTarget, 0.34, token, () => {
            this.passBall(setup.handler, wing, token, () => {
                const shotTarget = this.getFinishPoint(event, setup.shooter, 0);
                this.moveAndPass(wing, setup.shooter, shotTarget, token, () => {
                    this.finishPlayAtBasket(setup, event, token);
                });
            });
        });
    }

    private playFourOutOneIn(
        setup: TacticSetup,
        event: MatchPlayEvent,
        token: number,
    ): void {
        const post = setup.passer === setup.handler ? setup.helper : setup.passer;
        const postTarget = this.getAttackingHalfPoint(event.offenseTeam, 0.82, 0.62);
        this.moveAndPass(setup.handler, post, postTarget, token, () => {
            const cutTarget = this.getFinishPoint(event, setup.shooter, 34);
            this.moveAndPass(post, setup.shooter, cutTarget, token, () => {
                this.finishPlayAtBasket(setup, event, token);
            });
        });
    }

    private playPickAndRoll(
        setup: TacticSetup,
        event: MatchPlayEvent,
        token: number,
    ): void {
        const screener = setup.helper;
        const screenTarget = this.getAttackingHalfPoint(event.offenseTeam, 0.5, 0.5);
        this.moveActor(screener, screenTarget, this.scaled(0.28));
        const handlerTarget = this.getFinishPoint(event, setup.handler, -26);
        this.after(0.16, token, () => {
            this.dribbleTo(setup.handler, handlerTarget, 0.54, token, () => {
                if (setup.shooter === setup.handler) {
                    this.finishPlayAtBasket(setup, event, token);
                    return;
                }
                const rollTarget = this.getFinishPoint(event, setup.shooter, 24);
                this.moveAndPass(
                    setup.handler,
                    setup.shooter,
                    rollTarget,
                    token,
                    () => this.finishPlayAtBasket(setup, event, token),
                );
            });
        });
    }

    private playLowPost(
        setup: TacticSetup,
        event: MatchPlayEvent,
        token: number,
    ): void {
        const post = setup.shooter;
        const entryTarget = this.getAttackingHalfPoint(event.offenseTeam, 0.84, 0.62);
        this.moveAndPass(setup.handler, post, entryTarget, token, () => {
            const backDownTarget = this.getFinishPoint(event, post, 26);
            this.dribbleTo(post, backDownTarget, 0.5, token, () => {
                this.finishPlayAtBasket(setup, event, token);
            });
        });
    }

    private playHorns(
        setup: TacticSetup,
        event: MatchPlayEvent,
        token: number,
    ): void {
        const elbow = setup.helper;
        const elbowTarget = this.getAttackingHalfPoint(event.offenseTeam, 0.58, 0.42);
        this.moveActor(elbow, elbowTarget, this.scaled(0.3));
        const handlerTarget = this.getAttackingHalfPoint(event.offenseTeam, 0.5, 0.5);
        this.dribbleTo(setup.handler, handlerTarget, 0.38, token, () => {
            this.passBall(setup.handler, elbow, token, () => {
                const cutTarget = this.getFinishPoint(event, setup.shooter, -30);
                this.moveAndPass(elbow, setup.shooter, cutTarget, token, () => {
                    this.finishPlayAtBasket(setup, event, token);
                });
            });
        });
    }

    private finishPlayAtBasket(
        setup: TacticSetup,
        event: MatchPlayEvent,
        token: number,
    ): void {
        if (event.action === 'and-one') {
            this.shootBall(setup.shooter, event, token, 2, () => {
                this.after(0.12, token, () => {
                    this.playSingleAndOneFreeThrow(setup, event, token);
                });
            });
            return;
        }
        this.shootBall(setup.shooter, event, token, event.points);
    }

    private playSingleAndOneFreeThrow(
        setup: TacticSetup,
        event: MatchPlayEvent,
        token: number,
    ): void {
        const point = this.getFreeThrowPoint(event.offenseTeam);
        this.moveActor(setup.shooter, point, this.scaled(0.24), () => {
            if (token !== this.token) {
                return;
            }
            this.setBallOwner(setup.shooter);
            this.animateFreeThrowShot(setup.shooter, true, token, () => {
                this.callbacks.onScore(event.offenseTeam, 1, event);
                this.emitCommentary(
                    `${this.playerName(setup.shooter)}突破出手时遭遇犯规，打成2+1。加罚命中，本回合得到3分。`,
                    event,
                    setup.shooter,
                );
                this.completeMadePlay(event, token);
            });
        });
    }

    private playFreeThrows(
        setup: TacticSetup,
        event: MatchPlayEvent,
        token: number,
    ): void {
        const shooter = setup.shooter;
        const point = this.getFreeThrowPoint(event.offenseTeam);
        const hoop = this.getAttackingHoop(event.offenseTeam);
        const lanePoints = [
            this.getTakeoffPoint(hoop, 150, -72),
            this.getTakeoffPoint(hoop, 150, 72),
            this.getTakeoffPoint(hoop, 190, -88),
            this.getTakeoffPoint(hoop, 190, 88),
        ];
        [...setup.offense.filter((actor) => actor !== shooter), ...setup.defense]
            .slice(0, 8)
            .forEach((actor, index) => {
                this.moveActor(
                    actor,
                    lanePoints[index % lanePoints.length],
                    this.scaled(0.34),
                );
            });
        this.moveActor(shooter, point, this.scaled(0.34), () => {
            if (token !== this.token) {
                return;
            }
            this.setBallOwner(shooter);
            const madeShots = Math.max(0, Math.min(2, event.points));
            this.animateFreeThrowSequence(
                shooter,
                event,
                token,
                0,
                madeShots,
            );
        });
    }

    private animateFreeThrowSequence(
        shooter: MatchActor,
        event: MatchPlayEvent,
        token: number,
        attempt: number,
        madeShots: number,
    ): void {
        if (attempt >= 2) {
            const resultText = madeShots === 2
                ? '两罚两中'
                : madeShots === 1
                    ? '两罚一中'
                    : '两罚全部偏出';
            const outcome = `${resultText}，得到${madeShots}分`;
            const foul = `${this.playerName(shooter)}突破出手时遭遇犯规，站上罚球线`;
            const special = this.selectCommentary(shooter, event, 'free-throw');
            const commentary = this.composeCommentarySeries(
                special,
                this.joinCommentarySentences(foul, special?.[0] ?? '', outcome),
            );
            if (madeShots === 2) {
                this.emitCommentary(
                    commentary,
                    event,
                    shooter,
                );
                this.completeMadePlay(event, token);
            } else {
                this.resolveMissedShot(
                    shooter,
                    event,
                    token,
                    commentary,
                );
            }
            return;
        }
        const made = attempt < madeShots;
        this.animateFreeThrowShot(shooter, made, token, () => {
            if (made) {
                this.callbacks.onScore(event.offenseTeam, 1, event);
            }
            if (token !== this.token) {
                return;
            }
            if (attempt + 1 >= 2) {
                this.animateFreeThrowSequence(
                    shooter,
                    event,
                    token,
                    attempt + 1,
                    madeShots,
                );
                return;
            }
            const returnPoint = this.getBallAnchorPosition(shooter, 'hold');
            this.after(0.12, token, () => {
                this.animateBallArc(
                    this.ball.worldPosition.clone(),
                    returnPoint,
                    0.18,
                    12,
                    token,
                    () => {
                        this.setBallOwner(shooter);
                        this.animateFreeThrowSequence(
                            shooter,
                            event,
                            token,
                            attempt + 1,
                            madeShots,
                        );
                    },
                );
            });
        });
    }

    private animateFreeThrowShot(
        shooter: MatchActor,
        made: boolean,
        token: number,
        onComplete: () => void,
    ): void {
        const hoop = this.getAttackingHoop(shooter.team);
        const rim = hoop.getChildByName('进球点')?.worldPosition ?? hoop.worldPosition;
        const target = made
            ? rim
            : new Vec3(rim.x, rim.y + 16, rim.z);
        this.gatherBallForShot(shooter, token, (start) => {
            this.animateBallArc(start, target, 0.42, made ? 78 : 64, token, onComplete);
        });
    }

    private playTurnover(
        setup: TacticSetup,
        event: MatchPlayEvent,
        token: number,
    ): void {
        const defender = setup.defense[
            (event.shooterIndex + event.handlerIndex) % setup.defense.length
        ];
        const lane = Vec3.lerp(
            new Vec3(),
            setup.handler.node.worldPosition,
            defender.node.worldPosition,
            0.48,
        );
        this.after(0.58, token, () => {
            this.dribbleTo(setup.handler, lane, 0.5, token, () => {
                const target = Vec3.lerp(
                    new Vec3(),
                    setup.handler.node.worldPosition,
                    defender.node.worldPosition,
                    0.72,
                );
                this.moveActor(defender, target, this.scaled(0.24));
                this.passBall(setup.handler, defender, token, () => {
                    const special = this.selectCommentary(
                        setup.handler,
                        event,
                        'turnover',
                    );
                    this.emitCommentary(
                        special
                            ? this.composeCommentarySeries(
                                special,
                                this.joinCommentarySentences(
                                    special[0],
                                    `${this.playerName(defender)}完成抢断，球权交换`,
                                ),
                            )
                            : [`${TACTIC_NAMES[event.tactic]}没有打成，${this.playerName(defender)}判断传球路线完成抢断，球权交换。`],
                        event,
                        defender,
                    );
                    this.completePlay(1 - event.offenseTeam, event, token);
                });
            });
        });
    }

    private shootBall(
        shooter: MatchActor,
        event: MatchPlayEvent,
        token: number,
        scorePoints: number,
        onMadeComplete?: () => void,
    ): void {
        const hoop = this.getAttackingHoop(event.offenseTeam);
        const rim = hoop.getChildByName('进球点')?.worldPosition ?? hoop.worldPosition;
        const target = event.made
            ? rim
            : new Vec3(rim.x + (event.index % 2 === 0 ? -24 : 24), rim.y + 14, rim.z);
        if (event.action === 'dunk') {
            this.playDunkMotion(shooter, hoop, target, event, token, scorePoints, onMadeComplete);
            return;
        }
        this.jumpActor(shooter, event.action === 'layup' ? 1.1 : 1.06, 0.36);
        this.gatherBallForShot(shooter, token, (start) => {
            const height = event.action === 'three'
                ? 92
                : event.action === 'jumper'
                    ? 76
                    : 58;
            this.animateBallArc(start, target, 0.52, height, token, () => {
                if (event.made) {
                    if (scorePoints > 0) {
                        this.callbacks.onScore(event.offenseTeam, scorePoints, event);
                    }
                    if (onMadeComplete) {
                        onMadeComplete();
                        return;
                    }
                    this.emitCommentary(
                        this.createMadeCommentary(shooter, event),
                        event,
                        shooter,
                    );
                    this.completeMadePlay(event, token);
                } else {
                    this.resolveMissedShot(shooter, event, token);
                }
            });
        });
    }

    private playDunkMotion(
        shooter: MatchActor,
        hoop: Node,
        target: Vec3,
        event: MatchPlayEvent,
        token: number,
        scorePoints: number,
        onMadeComplete?: () => void,
    ): void {
        const start = shooter.node.worldPosition.clone();
        const landing = this.getTakeoffPoint(hoop, 42, 0);
        const state = this.trackTweenTarget({ progress: 0 });
        let released = false;
        this.setBallMotionOwner(shooter, 'shot');
        tween(state)
            .to(this.scaled(0.5), { progress: 1 }, {
                onUpdate: () => {
                    if (token !== this.token) {
                        return;
                    }
                    const base = Vec3.lerp(new Vec3(), start, landing, state.progress);
                    base.y += Math.sin(state.progress * Math.PI) * 48;
                    shooter.node.setWorldPosition(base);
                    this.applyPerspectiveScale(shooter, base);
                    const scale = shooter.node.scale.clone();
                    const stretch = 1 + Math.sin(state.progress * Math.PI) * 0.18;
                    shooter.node.setScale(
                        scale.x * stretch,
                        scale.y * stretch,
                        scale.z,
                    );
                    if (!released) {
                        const hold = this.getBallAnchorPosition(shooter, 'hold');
                        const shot = this.getBallAnchorPosition(shooter, 'shot');
                        this.ball.setWorldPosition(
                            Vec3.lerp(new Vec3(), hold, shot, Math.min(1, state.progress / 0.48)),
                        );
                    }
                },
            })
            .start();
        this.after(0.24, token, () => {
            released = true;
            const release = this.getBallAnchorPosition(shooter, 'shot');
            this.animateBallArc(release, target, 0.18, event.made ? 10 : 32, token, () => {
                if (event.made) {
                    if (scorePoints > 0) {
                        this.callbacks.onScore(event.offenseTeam, scorePoints, event);
                    }
                    if (onMadeComplete) {
                        onMadeComplete();
                        return;
                    }
                    this.emitCommentary(
                        this.createMadeCommentary(shooter, event),
                        event,
                        shooter,
                    );
                    this.completeMadePlay(event, token);
                } else {
                    this.resolveMissedShot(shooter, event, token);
                }
            });
        });
    }

    private resolveMissedShot(
        shooter: MatchActor,
        event: MatchPlayEvent,
        token: number,
        outcomePrefix: readonly string[] = [],
    ): void {
        const offense = this.getTeamActors(event.offenseTeam);
        const defense = this.getTeamActors(1 - event.offenseTeam);
        const reboundPoint = this.getReboundPoint(this.getAttackingHoop(event.offenseTeam), event.index);
        let winner = shooter;
        if (event.rebound === 'teammate') {
            winner = offense.find((actor) => actor !== shooter) ?? shooter;
        } else if (event.rebound === 'opponent') {
            winner = defense[event.shooterIndex % defense.length] ?? defense[0];
        }
        const contenders = event.contestedRebound
            ? [
                winner,
                ...(winner.team === event.offenseTeam
                    ? defense.slice(0, 2)
                    : [shooter, offense.find((actor) => actor !== shooter) ?? shooter]),
            ]
            : [winner];
        contenders.forEach((actor, index) => {
            const angle = (index - (contenders.length - 1) / 2) * 0.65;
            const radius = actor === winner ? 0 : 22;
            const target = new Vec3(
                reboundPoint.x + Math.cos(angle) * radius,
                reboundPoint.y + Math.sin(angle) * radius,
                reboundPoint.z,
            );
            this.moveActor(actor, target, this.scaled(0.34));
        });
        this.after(0.28, token, () => {
            contenders.forEach((actor) => {
                this.jumpActor(actor, actor === winner ? 1.14 : 1.08, 0.32);
            });
        });
        const start = this.ball.worldPosition.clone();
        this.animateBallArc(start, reboundPoint, 0.42, 34, token, () => {
            this.setBallOwner(winner);
            const contestedText = event.contestedRebound ? '多人争抢后' : '';
            const relation = winner === shooter
                ? '自投自抢'
                : winner.team === event.offenseTeam
                    ? '队友保护下进攻篮板'
                    : '防守方收下篮板';
            const outcome = outcomePrefix.length > 0
                ? outcomePrefix
                : this.createMissedCommentary(shooter, event);
            this.emitCommentary(
                [
                    ...outcome,
                    this.joinCommentarySentences(
                        `${contestedText}${this.playerName(winner)}${relation}`,
                    ),
                ],
                event,
                shooter,
                winner,
            );
            this.completePlay(winner.team, event, token);
        });
    }

    private completeMadePlay(event: MatchPlayEvent, token: number): void {
        const hoop = this.getAttackingHoop(event.offenseTeam);
        const hoopIndex = this.hoopNodes.indexOf(hoop);
        const drop = this.ballDropNodes[hoopIndex];
        const nextTeam = 1 - event.offenseTeam;
        const receivers = this.getTeamActors(nextTeam);
        const receiver = receivers[event.index % receivers.length] ?? receivers[0];
        if (!drop || !receiver) {
            this.completePlay(nextTeam, event, token);
            return;
        }
        const start = this.ball.worldPosition.clone();
        this.animateBallArc(start, drop.worldPosition, 0.22, 8, token, () => {
            this.moveActor(receiver, drop.worldPosition, this.scaled(0.2), () => {
                if (token !== this.token) {
                    return;
                }
                this.setBallOwner(receiver);
                const outlet = receivers[(event.index + 1) % receivers.length] ?? receiver;
                if (outlet === receiver) {
                    this.completePlay(nextTeam, event, token);
                    return;
                }
                const outletPoint = this.pointInCourt(
                    nextTeam === 0 ? 0.25 : 0.75,
                    event.index % 2 === 0 ? 0.44 : 0.56,
                );
                this.moveActor(outlet, outletPoint, this.scaled(0.16));
                this.after(0.06, token, () => {
                    this.passBall(receiver, outlet, token, () => {
                        this.completePlay(nextTeam, event, token);
                    });
                });
            });
        });
    }

    private completePlay(
        nextPossessionTeam: number,
        event: MatchPlayEvent,
        token: number,
    ): void {
        if (token !== this.token || this.activeEvent !== event) {
            return;
        }
        this.busy = false;
        this.activeEvent = null;
        this.callbacks.onPlayComplete(nextPossessionTeam, event);
    }

    private createMadeCommentary(
        shooter: MatchActor,
        event: MatchPlayEvent,
    ): readonly string[] {
        const special = this.selectCommentary(shooter, event, 'made');
        if (special) {
            return this.composeCommentarySeries(
                special,
                this.joinCommentarySentences(
                    special[0],
                    this.createMadeResultCommentary(shooter, event),
                ),
            );
        }
        const tactic = TACTIC_NAMES[event.tactic];
        const player = this.playerName(shooter);
        if (event.action === 'three') {
            return [`${tactic}拉出空位，${player}三分命中，比分增加3分。`];
        }
        if (event.action === 'dunk') {
            return [`${tactic}撕开防线，${player}完成扣篮，比分增加2分。`];
        }
        if (event.action === 'layup') {
            return [`${tactic}形成突破，${player}上篮得手，比分增加2分。`];
        }
        return [`${tactic}创造出手机会，${player}中距离命中，比分增加2分。`];
    }

    private createMissedCommentary(
        shooter: MatchActor,
        event: MatchPlayEvent,
    ): readonly string[] {
        const special = this.selectCommentary(shooter, event, 'missed');
        if (special) {
            return this.composeCommentarySeries(
                special,
                this.joinCommentarySentences(
                    special[0],
                    `${this.playerName(shooter)}${this.actionName(event.action)}打铁`,
                ),
            );
        }
        return [`${this.playerName(shooter)}${this.actionName(event.action)}偏出`];
    }

    private createMadeResultCommentary(
        shooter: MatchActor,
        event: MatchPlayEvent,
    ): string {
        const player = this.playerName(shooter);
        if (event.action === 'three') {
            return `${player}三分命中，得到3分`;
        }
        if (event.action === 'dunk') {
            return `${player}扣篮得手，得到2分`;
        }
        if (event.action === 'layup') {
            return `${player}上篮得手，得到2分`;
        }
        return `${player}中距离命中，得到2分`;
    }

    private joinCommentarySentences(...parts: string[]): string {
        return parts
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => {
                const normalized = part.replace(/[，,、；;：:]+$/u, '');
                return /[。！？!?]$/u.test(normalized)
                    ? normalized
                    : `${normalized}。`;
            })
            .join('');
    }

    private composeCommentarySeries(
        special: readonly string[] | null,
        lead: string,
    ): readonly string[] {
        return [
            lead,
            ...(special?.slice(1).map((text) => this.joinCommentarySentences(text)) ?? []),
        ];
    }

    private selectCommentary(
        actor: MatchActor,
        event: MatchPlayEvent,
        outcome: 'made' | 'missed' | 'turnover' | 'free-throw',
    ): readonly string[] | null {
        const offense = this.getTeamActors(event.offenseTeam);
        const passer = offense[event.passerIndex % offense.length] ?? null;
        return this.commentarySelector.select({
            event,
            outcome,
            actor: actor.card,
            passer: passer.card,
            ownRoster: offense.map((member) => member.card),
            opponentRoster: this.getTeamActors(1 - event.offenseTeam)
                .map((member) => member.card),
        });
    }

    private emitCommentary(
        text: string | readonly string[],
        event: MatchPlayEvent,
        ...actors: MatchActor[]
    ): void {
        this.callbacks.onCommentary(
            text,
            event,
            actors.map((actor) => ({
                name: this.playerName(actor),
                team: actor.team,
            })),
        );
    }

    private moveAndPass(
        passer: MatchActor,
        receiver: MatchActor,
        target: Vec3,
        token: number,
        onComplete: () => void,
    ): void {
        const receiverStart = receiver.node.worldPosition.clone();
        const catchPoint = Vec3.lerp(new Vec3(), receiverStart, target, 0.7);
        this.moveActor(receiver, catchPoint, this.scaled(0.34));
        const direction = new Vec3();
        Vec3.subtract(direction, catchPoint, passer.node.worldPosition);
        if (direction.length() > 0) {
            direction.normalize();
        }
        const step = Math.min(
            72,
            Vec3.distance(passer.node.worldPosition, catchPoint) * 0.28,
        );
        const passerTarget = passer.node.worldPosition.clone().add3f(
            direction.x * step,
            direction.y * step,
            0,
        );
        this.dribbleTo(passer, passerTarget, 0.26, token, () => {
            this.passBall(passer, receiver, token, () => {
                this.moveActor(receiver, target, this.scaled(0.2), onComplete);
            });
        });
    }

    private dribbleTo(
        actor: MatchActor,
        target: Vec3,
        duration: number,
        token: number,
        onComplete: () => void,
    ): void {
        this.setBallMotionOwner(actor, 'dribble');
        const start = actor.node.worldPosition.clone();
        const state = this.trackTweenTarget({ progress: 0 });
        const scaledDuration = this.scaled(duration);
        const bounceCount = Math.max(1, Math.round(duration / 0.22));
        tween(state)
            .to(scaledDuration, { progress: 1 }, {
                onUpdate: () => {
                    if (token !== this.token) {
                        return;
                    }
                    const position = Vec3.lerp(new Vec3(), start, target, state.progress);
                    actor.node.setWorldPosition(position);
                    this.applyPerspectiveScale(actor, position);
                    const hold = this.getBallAnchorPosition(actor, 'hold');
                    const dribble = this.getBallAnchorPosition(actor, 'dribble');
                    const bounce = Math.abs(
                        Math.sin(state.progress * Math.PI * bounceCount),
                    );
                    this.ball.setWorldPosition(
                        Vec3.lerp(new Vec3(), hold, dribble, bounce),
                    );
                },
            })
            .call(() => {
                if (token === this.token) {
                    this.setBallOwner(actor);
                    onComplete();
                }
            })
            .start();
    }

    private passBall(
        passer: MatchActor,
        receiver: MatchActor,
        token: number,
        onComplete: () => void,
    ): void {
        const start = this.getBallAnchorPosition(passer, 'hold');
        const release = new Vec3(
            start.x + (receiver.node.worldPosition.x >= start.x ? 18 : -18),
            start.y + 10,
            start.z,
        );
        const initialEnd = this.getBallAnchorPosition(receiver, 'hold');
        const distance = Vec3.distance(start, initialEnd);
        const duration = this.scaled(Math.max(0.2, Math.min(0.36, distance / 1050)));
        const state = this.trackTweenTarget({ progress: 0 });
        this.clearBallOwner();
        this.ball.active = true;
        this.ball.setWorldPosition(start);
        tween(state)
            .to(duration, { progress: 1 }, {
                onUpdate: () => {
                    if (token !== this.token) {
                        return;
                    }
                    const end = this.getBallAnchorPosition(receiver, 'hold');
                    const control = Vec3.lerp(new Vec3(), release, end, 0.5);
                    control.y += Math.min(52, 18 + distance * 0.06);
                    const progress = state.progress;
                    const inverse = 1 - progress;
                    this.ball.setWorldPosition(new Vec3(
                        inverse * inverse * release.x
                            + 2 * inverse * progress * control.x
                            + progress * progress * end.x,
                        inverse * inverse * release.y
                            + 2 * inverse * progress * control.y
                            + progress * progress * end.y,
                        end.z,
                    ));
                },
            })
            .call(() => {
                if (token === this.token) {
                    this.setBallOwner(receiver);
                    onComplete();
                }
            })
            .start();
    }

    private gatherBallForShot(
        shooter: MatchActor,
        token: number,
        onComplete: (shotPoint: Vec3) => void,
    ): void {
        this.setBallMotionOwner(shooter, 'shot');
        const state = this.trackTweenTarget({ progress: 0 });
        tween(state)
            .to(this.scaled(0.12), { progress: 1 }, {
                onUpdate: () => {
                    if (token !== this.token) {
                        return;
                    }
                    const hold = this.getBallAnchorPosition(shooter, 'hold');
                    const shot = this.getBallAnchorPosition(shooter, 'shot');
                    this.ball.setWorldPosition(
                        Vec3.lerp(new Vec3(), hold, shot, state.progress),
                    );
                },
            })
            .call(() => {
                if (token === this.token) {
                    onComplete(this.getBallAnchorPosition(shooter, 'shot'));
                }
            })
            .start();
    }

    private animateBallArc(
        start: Readonly<Vec3>,
        end: Readonly<Vec3>,
        duration: number,
        height: number,
        token: number,
        onComplete: () => void,
    ): void {
        this.clearBallOwner();
        this.ball.active = true;
        const state = this.trackTweenTarget({ progress: 0 });
        this.ball.setWorldPosition(start);
        tween(state)
            .to(this.scaled(duration), { progress: 1 }, {
                onUpdate: () => {
                    if (token !== this.token) {
                        return;
                    }
                    const position = Vec3.lerp(new Vec3(), start, end, state.progress);
                    position.y += Math.sin(state.progress * Math.PI) * height;
                    this.ball.setWorldPosition(position);
                },
            })
            .call(() => {
                if (token === this.token) {
                    onComplete();
                }
            })
            .start();
    }

    private moveActor(
        actor: MatchActor,
        target: Readonly<Vec3>,
        duration: number,
        onComplete?: () => void,
    ): void {
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
            .call(() => {
                this.sortActorDepth();
                onComplete?.();
            })
            .start();
    }

    private jumpActor(
        actor: MatchActor,
        scaleMultiplier: number,
        duration: number,
    ): void {
        const original = actor.node.scale.clone();
        const enlarged = new Vec3(
            original.x * scaleMultiplier,
            original.y * scaleMultiplier,
            original.z,
        );
        tween(actor.node)
            .to(this.scaled(duration * 0.45), { scale: enlarged })
            .to(this.scaled(duration * 0.55), { scale: original })
            .start();
    }

    private getFinishPoint(
        event: MatchPlayEvent,
        shooter: MatchActor,
        lateral: number,
    ): Vec3 {
        if (event.action === 'three') {
            const halfIndex = event.offenseTeam === 0 ? 1 : 0;
            const nodes = this.threePointNodes[halfIndex];
            const node = nodes[(event.index + shooter.teamIndex) % nodes.length];
            return node?.worldPosition.clone()
                ?? this.getAttackingHalfPoint(event.offenseTeam, 0.72, 0.5);
        }
        if (event.action === 'jumper') {
            const point = this.getFreeThrowPoint(event.offenseTeam);
            return new Vec3(point.x, point.y + lateral * 0.4, point.z);
        }
        const distance = event.action === 'dunk' ? 68 : 88;
        return this.getTakeoffPoint(
            this.getAttackingHoop(event.offenseTeam),
            distance,
            lateral,
        );
    }

    private getFreeThrowPoint(team: number): Vec3 {
        return this.freeThrowNodes[team]?.worldPosition.clone()
            ?? this.getAttackingHalfPoint(team, 0.62, 0.5);
    }

    private getAttackingHoop(team: number): Node {
        return team === 0 ? this.hoopNodes[1] : this.hoopNodes[0];
    }

    private getAttackingHalfPoint(
        team: number,
        depth: number,
        vertical: number,
    ): Vec3 {
        const u = team === 0
            ? 0.5 + depth * 0.46
            : 0.5 - depth * 0.46;
        return this.pointInCourt(u, vertical);
    }

    private pointInCourt(u: number, v: number): Vec3 {
        const top = Vec3.lerp(
            new Vec3(),
            this.cornerNodes[0].worldPosition,
            this.cornerNodes[1].worldPosition,
            u,
        );
        const bottom = Vec3.lerp(
            new Vec3(),
            this.cornerNodes[2].worldPosition,
            this.cornerNodes[3].worldPosition,
            u,
        );
        return Vec3.lerp(new Vec3(), top, bottom, v);
    }

    private getTakeoffPoint(
        hoop: Node,
        distance: number,
        lateral: number,
    ): Vec3 {
        const center = this.courtRange.getChildByName('中场点')?.worldPosition
            ?? this.pointInCourt(0.5, 0.5);
        const direction = new Vec3();
        Vec3.subtract(direction, center, hoop.worldPosition);
        if (direction.length() > 0) {
            direction.normalize();
        }
        const perpendicular = new Vec3(-direction.y, direction.x, 0);
        return hoop.worldPosition.clone().add3f(
            direction.x * distance + perpendicular.x * lateral,
            direction.y * distance + perpendicular.y * lateral,
            0,
        );
    }

    private getReboundPoint(hoop: Node, seed: number): Vec3 {
        const rightSide = hoop === this.hoopNodes[1];
        const u = rightSide
            ? 0.72 + (seed % 3) * 0.035
            : 0.28 - (seed % 3) * 0.035;
        const v = 0.38 + (seed % 4) * 0.08;
        return this.pointInCourt(u, v);
    }

    private faceTeamTowardAttack(team: number): void {
        for (const actor of this.getTeamActors(team)) {
            actor.facing = team === 0 ? 'right' : 'left';
            this.hideActorBallAnchors(actor);
        }
        for (const actor of this.getTeamActors(1 - team)) {
            actor.facing = team === 0 ? 'left' : 'right';
            this.hideActorBallAnchors(actor);
        }
    }

    private getTeamActors(team: number): MatchActor[] {
        return this.actors.filter(
            (actor) => actor.team === team && actor.node.active && Boolean(actor.card),
        );
    }

    private getBallAnchorPosition(
        actor: MatchActor,
        kind: BallAnchorKind,
        actorPosition: Readonly<Vec3> = actor.node.worldPosition,
    ): Vec3 {
        const anchor = actor.ballAnchors[actor.facing][kind];
        if (!anchor) {
            const y = kind === 'dribble' ? -6 : kind === 'shot' ? 30 : 12;
            const direction = actor.facing === 'right' ? 1 : -1;
            return new Vec3(
                actorPosition.x + direction * 15,
                actorPosition.y + y,
                actorPosition.z,
            );
        }
        const actorWorld = actor.node.worldPosition;
        const anchorWorld = anchor.worldPosition;
        return new Vec3(
            actorPosition.x + anchorWorld.x - actorWorld.x,
            actorPosition.y + anchorWorld.y - actorWorld.y,
            actorPosition.z + anchorWorld.z - actorWorld.z,
        );
    }

    private setBallOwner(
        actor: MatchActor,
        kind: BallAnchorKind = 'hold',
    ): void {
        this.clearBallOwner();
        this.ballOwners.set(this.ball, { actor, kind, visual: 'anchor' });
        this.showActorBallAnchor(actor, kind);
        this.ball.setWorldPosition(this.getBallAnchorPosition(actor, kind));
        this.ball.active = false;
    }

    private setBallMotionOwner(
        actor: MatchActor,
        kind: BallAnchorKind,
    ): void {
        this.clearBallOwner();
        this.hideActorBallAnchors(actor);
        this.ballOwners.set(this.ball, { actor, kind, visual: 'motion' });
        this.ball.setWorldPosition(this.getBallAnchorPosition(actor, 'hold'));
        this.ball.active = true;
    }

    private clearBallOwner(): void {
        const ownership = this.ballOwners.get(this.ball);
        if (ownership) {
            this.hideActorBallAnchors(ownership.actor);
        }
        this.ballOwners.delete(this.ball);
    }

    private hideActorBallAnchors(actor: MatchActor): void {
        for (const anchors of [actor.ballAnchors.left, actor.ballAnchors.right]) {
            for (const node of [anchors.hold, anchors.dribble, anchors.shot]) {
                if (node) {
                    node.active = false;
                }
            }
        }
    }

    private showActorBallAnchor(
        actor: MatchActor,
        kind: BallAnchorKind,
    ): void {
        this.hideActorBallAnchors(actor);
        const anchor = actor.ballAnchors[actor.facing][kind];
        if (anchor) {
            anchor.active = true;
        }
    }

    private getPerspectiveFactor(worldPosition: Readonly<Vec3>): number {
        if (this.cornerNodes.length < 4) {
            return 1;
        }
        const topY = (
            this.cornerNodes[0].worldPosition.y
            + this.cornerNodes[1].worldPosition.y
        ) * 0.5;
        const bottomY = (
            this.cornerNodes[2].worldPosition.y
            + this.cornerNodes[3].worldPosition.y
        ) * 0.5;
        const denominator = topY - bottomY;
        const depth = denominator === 0
            ? 0.5
            : Math.max(0, Math.min(1, (topY - worldPosition.y) / denominator));
        return 0.82 + depth * 0.22;
    }

    private applyPerspectiveScale(
        actor: MatchActor,
        worldPosition: Readonly<Vec3>,
    ): void {
        const factor = this.getPerspectiveFactor(worldPosition);
        const base = actor.homePerspectiveFactor || 1;
        const relative = factor / base;
        actor.node.setScale(
            actor.homeScale.x * relative * MATCH_ACTOR_SCALE,
            actor.homeScale.y * relative * MATCH_ACTOR_SCALE,
            actor.homeScale.z,
        );
    }

    private sortActorDepth(): void {
        [...this.actors]
            .filter((actor) => actor.node.active)
            .sort((a, b) => b.node.worldPosition.y - a.node.worldPosition.y)
            .forEach((actor, index) => actor.node.setSiblingIndex(index));
        if (this.ball.parent) {
            this.ball.setSiblingIndex(this.ball.parent.children.length - 1);
        }
    }

    private playerName(actor: MatchActor): string {
        return actor.card?.displayName ?? actor.node.name;
    }

    private actionName(action: MatchPlayAction): string {
        if (action === 'three') {
            return '三分投篮';
        }
        if (action === 'dunk') {
            return '扣篮';
        }
        if (action === 'layup') {
            return '上篮';
        }
        return '投篮';
    }

    private scaled(duration: number): number {
        return duration / this.speedMultiplier;
    }

    private after(
        duration: number,
        token: number,
        callback: () => void,
    ): void {
        const target = this.trackTweenTarget({});
        tween(target)
            .delay(this.scaled(duration))
            .call(() => {
                if (token === this.token) {
                    callback();
                }
            })
            .start();
    }

    private trackTweenTarget<T extends object>(target: T): T {
        this.activeTweenTargets.push(target);
        return target;
    }

    private stopTweens(): void {
        for (const target of this.activeTweenTargets) {
            Tween.stopAllByTarget(target);
        }
        this.activeTweenTargets.length = 0;
        for (const actor of this.actors) {
            Tween.stopAllByTarget(actor.node);
        }
        Tween.stopAllByTarget(this.ball);
        for (const hoop of this.hoopNodes) {
            Tween.stopAllByTarget(hoop);
        }
    }
}

function eventHelpRatio(tactic: MatchTactic, defenderIndex: number): number {
    if (tactic === 'pick-and-roll' && defenderIndex < 2) {
        return 0.22;
    }
    if (tactic === 'low-post' && defenderIndex !== 4) {
        return 0.18;
    }
    return 0.12;
}

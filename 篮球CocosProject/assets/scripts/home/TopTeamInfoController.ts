import { _decorator, Color, Component, Label, Node, sys } from 'cc';
import {
    calculateTeamOverall,
    GAME_STATE_EVENT_ROSTER_CHANGED,
    GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED,
    gameStateEvents,
    getManagementEffects,
    getTeamAbbreviation,
    INT32_MAX,
    loadRoster,
    TEAM_ABBREVIATION_STORAGE_KEY,
    TEAM_NAME_STORAGE_KEY,
} from './GameState';

const { ccclass, property } = _decorator;

const OVERALL_ANIMATION_SECONDS = 0.45;

@ccclass('TopTeamInfoController')
export class TopTeamInfoController extends Component {
    @property(Label)
    public teamNameLabel: Label | null = null;

    @property(Label)
    public teamAbbreviationLabel: Label | null = null;

    @property(Label)
    public teamOverallLabel: Label | null = null;

    @property(Node)
    public rosterContainer: Node | null = null;

    @property
    public defaultTeamName = '我的球队';

    @property
    public defaultTeamAbbreviation = '我';

    private displayedOverall = 0;
    private animationStartOverall = 0;
    private animationTargetOverall = 0;
    private animationElapsed = 0;
    private isOverallAnimating = false;
    private hasRenderedOverall = false;
    private overallNormalColor = new Color();

    protected onLoad(): void {
        this.teamNameLabel ??= this.node.getChildByName('球队名称')?.getComponent(Label) ?? null;
        this.teamAbbreviationLabel ??= this.node.getChildByName('球队简称')?.getComponent(Label) ?? null;
        this.teamOverallLabel ??= this.node.getChildByName('球队总评数值')?.getComponent(Label) ?? null;

        if (!this.teamNameLabel || !this.teamAbbreviationLabel || !this.teamOverallLabel) {
            console.error('[TopTeamInfoController] Missing team name, abbreviation, or overall Label.');
            this.enabled = false;
            return;
        }

        this.teamNameLabel.overflow = Label.Overflow.SHRINK;
        this.teamNameLabel.enableWrapText = false;
        this.overallNormalColor.set(this.teamOverallLabel.color);
        this.refreshTeamInfo(false);
    }

    protected onEnable(): void {
        if (this.teamNameLabel && this.teamAbbreviationLabel && this.teamOverallLabel) {
            this.refreshTeamInfo(this.hasRenderedOverall);
        }
        gameStateEvents.on(
            GAME_STATE_EVENT_ROSTER_CHANGED,
            this.onRosterChanged,
            this,
        );
        gameStateEvents.on(
            GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED,
            this.onTeamIdentityChanged,
            this,
        );
    }

    protected onDisable(): void {
        gameStateEvents.off(
            GAME_STATE_EVENT_ROSTER_CHANGED,
            this.onRosterChanged,
            this,
        );
        gameStateEvents.off(
            GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED,
            this.onTeamIdentityChanged,
            this,
        );
    }

    protected update(deltaTime: number): void {
        if (!this.isOverallAnimating || !this.teamOverallLabel) {
            return;
        }

        this.animationElapsed += deltaTime;
        const progress = Math.min(1, this.animationElapsed / OVERALL_ANIMATION_SECONDS);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        this.displayedOverall = Math.round(
            this.animationStartOverall
            + (this.animationTargetOverall - this.animationStartOverall) * easedProgress,
        );
        this.teamOverallLabel.string = this.formatOverall(this.displayedOverall);

        if (progress >= 1) {
            this.isOverallAnimating = false;
            this.teamOverallLabel.color = this.overallNormalColor;
        }
    }

    public refreshTeamInfo(animateOverall = true): void {
        if (!this.teamNameLabel || !this.teamAbbreviationLabel || !this.teamOverallLabel) {
            return;
        }

        const teamName = sys.localStorage.getItem(TEAM_NAME_STORAGE_KEY)?.trim() || this.defaultTeamName;
        const abbreviation = getTeamAbbreviation(
            teamName,
            this.defaultTeamAbbreviation,
        );

        this.teamNameLabel.string = teamName;
        this.teamAbbreviationLabel.string = abbreviation;
        sys.localStorage.setItem(TEAM_ABBREVIATION_STORAGE_KEY, abbreviation);
        void this.refreshOverallFromRoster(animateOverall);
    }

    public setTeamIdentity(teamName: string): void {
        const safeName = teamName.trim() || this.defaultTeamName;
        const safeAbbreviation = getTeamAbbreviation(
            safeName,
            this.defaultTeamAbbreviation,
        );

        sys.localStorage.setItem(TEAM_NAME_STORAGE_KEY, safeName);
        sys.localStorage.setItem(TEAM_ABBREVIATION_STORAGE_KEY, safeAbbreviation);
        gameStateEvents.emit(
            GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED,
            safeName,
            safeAbbreviation,
        );

        if (this.teamNameLabel) {
            this.teamNameLabel.string = safeName;
        }
        if (this.teamAbbreviationLabel) {
            this.teamAbbreviationLabel.string = safeAbbreviation;
        }
    }

    public async refreshOverallFromRoster(animate = true): Promise<void> {
        const effects = await getManagementEffects();
        this.setLineupOverall(
            calculateTeamOverall(loadRoster(), effects.headCoachBattleOvrBonus),
            animate,
        );
    }

    public setLineupOverall(overall: number, animate = true): void {
        const safeOverall = Math.max(0, Math.round(Number.isFinite(overall) ? overall : 0));
        if (!this.teamOverallLabel) {
            return;
        }

        if (!animate || !this.hasRenderedOverall || safeOverall === this.displayedOverall) {
            this.displayedOverall = safeOverall;
            this.animationTargetOverall = safeOverall;
            this.isOverallAnimating = false;
            this.teamOverallLabel.string = this.formatOverall(safeOverall);
            this.teamOverallLabel.color = this.overallNormalColor;
            this.hasRenderedOverall = true;
            return;
        }

        this.animationStartOverall = this.displayedOverall;
        this.animationTargetOverall = safeOverall;
        this.animationElapsed = 0;
        this.isOverallAnimating = true;
        this.teamOverallLabel.color = safeOverall > this.displayedOverall
            ? new Color(92, 210, 120, 255)
            : new Color(235, 92, 92, 255);
    }

    private formatOverall(value: number): string {
        if (value >= INT32_MAX) {
            return 'MAX';
        }
        return String(Math.round(value));
    }

    private onRosterChanged(): void {
        void this.refreshOverallFromRoster(true);
    }

    private onTeamIdentityChanged(): void {
        this.refreshTeamInfo(false);
    }
}

import { _decorator, Color, Component, Label, Node, sys } from 'cc';

const { ccclass, property } = _decorator;

const TEAM_NAME_STORAGE_KEY = 'basketball.team.name';
const TEAM_ABBREVIATION_STORAGE_KEY = 'basketball.team.abbreviation';
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
        const abbreviation = sys.localStorage.getItem(TEAM_ABBREVIATION_STORAGE_KEY)?.trim()
            || this.defaultTeamAbbreviation;

        this.teamNameLabel.string = teamName;
        this.teamAbbreviationLabel.string = Array.from(abbreviation).slice(0, 3).join('');
        this.setLineupOverall(this.calculateLineupOverall(), animateOverall);
    }

    public setTeamIdentity(teamName: string, abbreviation: string): void {
        const safeName = teamName.trim() || this.defaultTeamName;
        const safeAbbreviation = Array.from(abbreviation.trim() || this.defaultTeamAbbreviation)
            .slice(0, 3)
            .join('');

        sys.localStorage.setItem(TEAM_NAME_STORAGE_KEY, safeName);
        sys.localStorage.setItem(TEAM_ABBREVIATION_STORAGE_KEY, safeAbbreviation);

        if (this.teamNameLabel) {
            this.teamNameLabel.string = safeName;
        }
        if (this.teamAbbreviationLabel) {
            this.teamAbbreviationLabel.string = safeAbbreviation;
        }
    }

    public refreshOverallFromRoster(): void {
        this.setLineupOverall(this.calculateLineupOverall(), true);
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

    private calculateLineupOverall(): number {
        if (!this.rosterContainer) {
            return 0;
        }

        return this.rosterContainer
            .getComponentsInChildren(Label)
            .filter((label) => label.node.activeInHierarchy && label.node.name.toLowerCase() === 'ovr')
            .reduce((total, label) => total + this.parseOverall(label.string), 0);
    }

    private parseOverall(value: string): number {
        const parsed = Number(value.replace(/[^\d.-]/g, ''));
        return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    }

    private formatOverall(value: number): string {
        if (value >= 100_000_000) {
            return `${this.formatUnit(value / 100_000_000)}亿`;
        }
        if (value >= 10_000) {
            return `${this.formatUnit(value / 10_000)}万`;
        }
        return String(Math.round(value));
    }

    private formatUnit(value: number): string {
        return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
    }
}

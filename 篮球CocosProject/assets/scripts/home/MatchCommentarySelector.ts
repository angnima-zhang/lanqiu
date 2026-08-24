import { JsonAsset } from 'cc';
import type { PlayerCard } from './GameState';
import type {
    MatchPlayAction,
    MatchPlayEvent,
    MatchTactic,
} from './MatchCourtSimulation';

type CommentaryOutcome = 'made' | 'missed' | 'turnover' | 'free-throw';

interface CommentaryRule {
    id: string;
    priority?: number;
    action?: MatchPlayAction;
    actions?: MatchPlayAction[];
    outcome?: CommentaryOutcome;
    actors?: string[];
    teamHasAll?: string[];
    opponentHasAll?: string[];
    passerMustBe?: string[];
    tactics?: MatchTactic[];
    clutch?: boolean;
    texts?: string[];
    series?: string[][];
}

interface CommentaryLibraryData {
    rules?: CommentaryRule[];
}

export interface MatchCommentaryContext {
    event: MatchPlayEvent;
    outcome: CommentaryOutcome;
    actor: PlayerCard | null;
    passer: PlayerCard | null;
    ownRoster: ReadonlyArray<PlayerCard | null>;
    opponentRoster: ReadonlyArray<PlayerCard | null>;
}

export class MatchCommentarySelector {
    private readonly rules: CommentaryRule[];
    private readonly lastEventByRule = new Map<string, number>();
    private readonly usedTexts = new Set<string>();

    public constructor(data: unknown) {
        this.rules = this.readRules(data);
    }

    public static fromJsonAsset(asset: JsonAsset): MatchCommentarySelector {
        return new MatchCommentarySelector(asset.json);
    }

    public select(context: MatchCommentaryContext): readonly string[] | null {
        const matches = this.rules.filter((rule) => this.matches(rule, context));
        if (matches.length === 0) {
            return null;
        }
        const highestPriority = Math.max(...matches.map((rule) => rule.priority ?? 0));
        const candidates = matches
            .filter((rule) => (rule.priority ?? 0) === highestPriority)
            .filter((rule) => !this.isCoolingDown(rule, context.event.index));
        if (candidates.length === 0) {
            return null;
        }
        const startIndex = this.seed(context.event, context.actor) % candidates.length;
        for (let offset = 0; offset < candidates.length; offset += 1) {
            const rule = candidates[(startIndex + offset) % candidates.length];
            const series = this.pickSeries(rule, context);
            if (!series) {
                continue;
            }
            this.lastEventByRule.set(rule.id, context.event.index);
            this.usedTexts.add(series.join('\u0000'));
            return series;
        }
        return null;
    }

    private readRules(data: unknown): CommentaryRule[] {
        if (!data || typeof data !== 'object') {
            return [];
        }
        const rawRules = (data as CommentaryLibraryData).rules;
        if (!Array.isArray(rawRules)) {
            return [];
        }
        return rawRules.filter((rule): rule is CommentaryRule => (
            Boolean(rule)
            && typeof rule.id === 'string'
            && (
                (Array.isArray(rule.texts)
                    && rule.texts.some((text) => typeof text === 'string' && text.length > 0))
                || (Array.isArray(rule.series)
                    && rule.series.some((series) => (
                        Array.isArray(series)
                        && series.some((text) => typeof text === 'string' && text.length > 0)
                    )))
            )
        ));
    }

    private matches(rule: CommentaryRule, context: MatchCommentaryContext): boolean {
        const { event } = context;
        if (rule.action && rule.action !== event.action) {
            return false;
        }
        if (Array.isArray(rule.actions) && !rule.actions.includes(event.action)) {
            return false;
        }
        if (rule.outcome && rule.outcome !== context.outcome) {
            return false;
        }
        if (rule.tactics && !rule.tactics.includes(event.tactic)) {
            return false;
        }
        if (rule.clutch !== undefined && rule.clutch !== this.isClutch(event)) {
            return false;
        }
        if (!this.hasActor(rule.actors, context.actor)) {
            return false;
        }
        if (!this.hasAll(rule.teamHasAll, context.ownRoster)) {
            return false;
        }
        if (!this.hasAll(rule.opponentHasAll, context.opponentRoster)) {
            return false;
        }
        return this.hasActor(rule.passerMustBe, context.passer);
    }

    private hasActor(keys: string[] | undefined, actor: PlayerCard | null): boolean {
        return !keys || keys.length === 0 || Boolean(actor && keys.includes(actor.sourcePlayerName));
    }

    private hasAll(
        keys: string[] | undefined,
        roster: ReadonlyArray<PlayerCard | null>,
    ): boolean {
        if (!keys || keys.length === 0) {
            return true;
        }
        const names = new Set(
            roster.filter((card): card is PlayerCard => Boolean(card)).map((card) => card.sourcePlayerName),
        );
        return keys.every((key) => names.has(key));
    }

    private isClutch(event: MatchPlayEvent): boolean {
        return event.quarter === 3 && event.startSecond >= 105;
    }

    private isCoolingDown(rule: CommentaryRule, eventIndex: number): boolean {
        const lastEvent = this.lastEventByRule.get(rule.id);
        return lastEvent !== undefined && eventIndex - lastEvent <= 2;
    }

    private pickSeries(
        rule: CommentaryRule,
        context: MatchCommentaryContext,
    ): readonly string[] | null {
        const choices = [
            ...(rule.texts ?? [])
                .filter((text) => typeof text === 'string' && text.length > 0)
                .map((text) => [text]),
            ...(rule.series ?? [])
                .filter((series) => (
                    Array.isArray(series)
                    && series.length > 0
                    && series.every((text) => typeof text === 'string' && text.length > 0)
                )),
        ];
        if (choices.length === 0) {
            return null;
        }
        const startIndex = this.seed(context.event, context.actor) % choices.length;
        for (let offset = 0; offset < choices.length; offset += 1) {
            const series = choices[(startIndex + offset) % choices.length]
                .map((text) => this.render(text, context));
            if (!this.usedTexts.has(series.join('\u0000'))) {
                return series;
            }
        }
        return choices[startIndex].map((text) => this.render(text, context));
    }

    private render(text: string, context: MatchCommentaryContext): string {
        return text
            .replace(/\{\{player\}\}/g, context.actor?.displayName ?? '球员')
            .replace(/\{\{teammate\}\}/g, context.passer?.displayName ?? '队友');
    }

    private seed(event: MatchPlayEvent, actor: PlayerCard | null): number {
        const sourceLength = actor?.sourcePlayerName.length ?? 0;
        return event.index * 31 + event.quarter * 11 + sourceLength * 7;
    }
}

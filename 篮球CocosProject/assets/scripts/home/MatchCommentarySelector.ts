import { JsonAsset } from 'cc';
import type { PlayerCard } from './GameState';
import type {
    MatchPlayAction,
    MatchPlayEvent,
    MatchTactic,
} from './MatchCourtSimulation';

type CommentaryOutcome = 'made' | 'missed' | 'turnover' | 'free-throw';

const MATCH_SECONDS = 60 * 4;
const CLUTCH_SECONDS = 15;

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
    actorConceptGodIds?: string[];
    passerConceptGodIds?: string[];
    tactics?: MatchTactic[];
    clutch?: boolean;
    maxTriggersPerMatch?: number;
    cooldownEvents?: number;
    chance?: number;
    texts?: string[];
    series?: string[][];
}

interface ConceptGodCommentaryRule {
    conceptGodId: string;
    madeActions?: MatchPlayAction[];
    reverseActions?: MatchPlayAction[];
    reverseOutcome?: CommentaryOutcome;
    signature: string;
    reverse: string;
    clutch: string[];
}

interface CommentaryLibraryData {
    rules?: CommentaryRule[];
    conceptGodRules?: ConceptGodCommentaryRule[];
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
    private readonly triggerCountByRule = new Map<string, number>();
    private readonly usedTexts = new Set<string>();

    public constructor(data: unknown) {
        this.rules = this.readRules(data);
    }

    public static fromJsonAsset(asset: JsonAsset): MatchCommentarySelector {
        return new MatchCommentarySelector(asset.json);
    }

    public resetMatchState(): void {
        this.lastEventByRule.clear();
        this.triggerCountByRule.clear();
        this.usedTexts.clear();
    }

    public select(context: MatchCommentaryContext): readonly string[] | null {
        const matches = this.rules.filter((rule) => this.matches(rule, context));
        if (matches.length === 0) {
            return null;
        }
        const priorities = Array.from(new Set(
            matches.map((rule) => rule.priority ?? 0),
        )).sort((left, right) => right - left);
        for (const priority of priorities) {
            const candidates = matches
                .filter((rule) => (rule.priority ?? 0) === priority)
                .filter((rule) => !this.isCoolingDown(rule, context.event.index))
                .filter((rule) => !this.hasReachedTriggerLimit(rule))
                .filter((rule) => this.passesChance(rule, context));
            if (candidates.length === 0) {
                continue;
            }
            const startIndex = this.seed(context.event, context.actor) % candidates.length;
            for (let offset = 0; offset < candidates.length; offset += 1) {
                const rule = candidates[(startIndex + offset) % candidates.length];
                const series = this.pickSeries(rule, context);
                if (!series) {
                    continue;
                }
                this.lastEventByRule.set(rule.id, context.event.index);
                this.triggerCountByRule.set(
                    rule.id,
                    (this.triggerCountByRule.get(rule.id) ?? 0) + 1,
                );
                this.usedTexts.add(series.join('\u0000'));
                return series;
            }
        }
        return null;
    }

    private readRules(data: unknown): CommentaryRule[] {
        if (!data || typeof data !== 'object') {
            return [];
        }
        const library = data as CommentaryLibraryData;
        const rawRules = Array.isArray(library.rules) ? library.rules : [];
        const standardRules = rawRules.filter((rule): rule is CommentaryRule => (
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
        return [
            ...this.expandConceptGodRules(library.conceptGodRules),
            ...standardRules,
        ];
    }

    private expandConceptGodRules(value: unknown): CommentaryRule[] {
        if (!Array.isArray(value)) {
            return [];
        }
        const rules: CommentaryRule[] = [];
        value.forEach((rawEntry, index) => {
            if (!rawEntry || typeof rawEntry !== 'object') {
                return;
            }
            const entry = rawEntry as Partial<ConceptGodCommentaryRule>;
            if (
                typeof entry.conceptGodId !== 'string'
                || typeof entry.signature !== 'string'
                || typeof entry.reverse !== 'string'
                || !Array.isArray(entry.clutch)
                || !entry.clutch.every((text) => typeof text === 'string')
            ) {
                return;
            }
            const madeActions = Array.isArray(entry.madeActions)
                ? entry.madeActions
                : undefined;
            const reverseActions = Array.isArray(entry.reverseActions)
                ? entry.reverseActions
                : madeActions;
            rules.push(
                {
                    id: `concept_${index + 1}_signature`,
                    priority: 1100,
                    actions: madeActions,
                    outcome: 'made',
                    actorConceptGodIds: [entry.conceptGodId],
                    maxTriggersPerMatch: 2,
                    cooldownEvents: 4,
                    chance: 0.35,
                    texts: [entry.signature],
                },
                {
                    id: `concept_${index + 1}_reverse`,
                    priority: 1100,
                    actions: reverseActions,
                    outcome: entry.reverseOutcome ?? 'missed',
                    actorConceptGodIds: [entry.conceptGodId],
                    maxTriggersPerMatch: 1,
                    cooldownEvents: 4,
                    chance: 0.25,
                    texts: [entry.reverse],
                },
                {
                    id: `concept_${index + 1}_clutch`,
                    priority: 1250,
                    actions: madeActions,
                    outcome: 'made',
                    actorConceptGodIds: [entry.conceptGodId],
                    clutch: true,
                    maxTriggersPerMatch: 1,
                    cooldownEvents: 0,
                    chance: 1,
                    series: [entry.clutch],
                },
            );
        });
        return rules;
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
        if (!this.hasConceptGod(rule.actorConceptGodIds, context.actor)) {
            return false;
        }
        if (!this.hasAll(rule.teamHasAll, context.ownRoster)) {
            return false;
        }
        if (!this.hasAll(rule.opponentHasAll, context.opponentRoster)) {
            return false;
        }
        return this.hasActor(rule.passerMustBe, context.passer)
            && this.hasConceptGod(rule.passerConceptGodIds, context.passer);
    }

    private hasActor(keys: string[] | undefined, actor: PlayerCard | null): boolean {
        return !keys || keys.length === 0 || Boolean(actor && keys.includes(actor.sourcePlayerName));
    }

    private hasConceptGod(keys: string[] | undefined, actor: PlayerCard | null): boolean {
        return !keys
            || keys.length === 0
            || Boolean(
                actor?.isConceptGod
                && actor.conceptGodId
                && keys.includes(actor.conceptGodId),
            );
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
        return event.quarter === 3
            && event.startSecond >= MATCH_SECONDS - CLUTCH_SECONDS;
    }

    private isCoolingDown(rule: CommentaryRule, eventIndex: number): boolean {
        const lastEvent = this.lastEventByRule.get(rule.id);
        const cooldownEvents = Math.max(0, Math.floor(rule.cooldownEvents ?? 2));
        return lastEvent !== undefined && eventIndex - lastEvent <= cooldownEvents;
    }

    private hasReachedTriggerLimit(rule: CommentaryRule): boolean {
        if (!Number.isFinite(rule.maxTriggersPerMatch)) {
            return false;
        }
        const limit = Math.max(0, Math.floor(rule.maxTriggersPerMatch ?? 0));
        return (this.triggerCountByRule.get(rule.id) ?? 0) >= limit;
    }

    private passesChance(rule: CommentaryRule, context: MatchCommentaryContext): boolean {
        const chance = Math.min(1, Math.max(0, rule.chance ?? 1));
        if (chance >= 1) {
            return true;
        }
        if (chance <= 0) {
            return false;
        }
        const roll = (
            this.seed(context.event, context.actor)
            + this.hash(rule.id)
        ) % 10_000;
        return roll < Math.floor(chance * 10_000);
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

    private hash(value: string): number {
        let hash = 0;
        for (let index = 0; index < value.length; index += 1) {
            hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
        }
        return hash;
    }
}

import { getManagementEffects, loadJson, loadRoster } from './GameState';
import {
    loadPlayerPortrait,
    loadQualityFrame,
    loadRoundQualityFrame,
    loadRecruitmentBackground,
} from './PlayerAssets';

const HOMEPAGE_JSON_PATHS = [
    'data/player_config_fame_v3',
    'data/player_events',
    'data/player_knowledge',
    'data/balance/economy',
    'data/balance/player_ovr_ranges',
    'data/balance/recruitment_probability',
    'data/balance/concept_god_upgrade',
    'data/balance/management_effects',
] as const;

let homepageDataPreloadPromise: Promise<void> | null = null;

/** Static assets only: safe to load while cloud recovery is still pending. */
export function preloadHomepageStaticAssets(): Promise<void> {
    homepageDataPreloadPromise ??= Promise.all([
        ...HOMEPAGE_JSON_PATHS.map((path) => loadJson<unknown>(path)),
    ]).then(() => undefined).catch((error) => {
        homepageDataPreloadPromise = null;
        throw error;
    });
    return homepageDataPreloadPromise;
}

/** Call only after cloud recovery; reads the current saved roster and management levels. */
export function preloadHomepageRuntimeAssets(): Promise<void> {
    // The initial loading screen can have an empty roster. Warm the current roster
    // on every return preparation, including the round frames used on the home court.
    return Promise.all([
        preloadHomepageStaticAssets(),
        getManagementEffects(),
        ...loadRoster().flatMap((card) => {
            if (!card) {
                return [];
            }
            return [
                loadPlayerPortrait(card),
                loadQualityFrame(card.qualityId),
                loadRoundQualityFrame(card.qualityId),
                loadRecruitmentBackground(card.qualityId),
            ];
        }),
    ]).then(() => undefined);
}

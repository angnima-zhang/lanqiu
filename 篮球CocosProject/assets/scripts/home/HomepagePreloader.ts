import { getManagementEffects, loadJson, loadRoster } from './GameState';
import {
    loadPlayerPortrait,
    loadQualityFrame,
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
] as const;

let homepageRuntimePreloadPromise: Promise<void> | null = null;

/**
 * Preloads the data and visible roster art that Homepage initializes dynamically.
 * Asset-manager caching lets the actual page bind these without a second disk request.
 */
export function preloadHomepageRuntimeAssets(): Promise<void> {
    homepageRuntimePreloadPromise ??= Promise.all([
        ...HOMEPAGE_JSON_PATHS.map((path) => loadJson<unknown>(path)),
        getManagementEffects(),
        ...loadRoster().flatMap((card) => {
            if (!card) {
                return [];
            }
            return [
                loadPlayerPortrait(card),
                loadQualityFrame(card.qualityId),
                loadRecruitmentBackground(card.qualityId),
            ];
        }),
    ])
        .then(() => undefined)
        .catch((error) => {
            homepageRuntimePreloadPromise = null;
            throw error;
        });
    return homepageRuntimePreloadPromise;
}

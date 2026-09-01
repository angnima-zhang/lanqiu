import { director, Font, JsonAsset, Prefab, resources } from 'cc';
import { loadJson } from './GameState';
import { loadPlayerPortrait, loadRoundQualityFrame } from './PlayerAssets';
import type { PlayerCard } from './GameState';
import type { MatchRewardsConfig } from './MatchProgression';
import type { MatchSessionSnapshot } from './MatchSession';

type MatchRuntimeAssets = [Prefab, Prefab, Prefab, Font, JsonAsset, MatchRewardsConfig];
let runtimePromise: Promise<MatchRuntimeAssets> | null = null;
let scenePromise: Promise<void> | null = null;

function loadResource<T>(path: string, type: typeof Prefab | typeof Font | typeof JsonAsset): Promise<T> {
    return new Promise((resolve, reject) => {
        resources.load(path, type as never, (error, asset) => {
            if (error || !asset) reject(error ?? new Error(`Missing resource: ${path}`));
            else resolve(asset as unknown as T);
        });
    });
}

export function loadMatchRuntimeAssets(): Promise<MatchRuntimeAssets> {
    // Both gameplay scenes keep assets on transition (autoReleaseAssets=false).
    // Cache assets, never a live scene or a controller carrying match state.
    runtimePromise ??= Promise.all([
        loadResource<Prefab>('prefabs/比赛/胜利弹窗', Prefab),
        loadResource<Prefab>('prefabs/比赛/夺冠弹窗', Prefab),
        loadResource<Prefab>('prefabs/比赛/失败弹窗', Prefab),
        loadResource<Font>('fonts/zpix', Font),
        loadResource<JsonAsset>('data/match_meme_commentary', JsonAsset),
        loadJson<MatchRewardsConfig>('data/balance/match_rewards'),
    ]).catch((error) => {
        runtimePromise = null;
        throw error;
    });
    return runtimePromise;
}

export async function preloadMatchAssets(session?: MatchSessionSnapshot): Promise<void> {
    scenePromise ??= new Promise<void>((resolve, reject) => {
        director.preloadScene('Match', undefined, (error) => {
            if (error) reject(error);
            else resolve();
        });
    }).catch((error) => {
        scenePromise = null;
        throw error;
    });
    const starters = session ? [session.playerRoster, session.opponentRoster].flatMap((roster) => (
        roster.filter((card): card is PlayerCard => Boolean(card))
            .sort((left, right) => right.overall - left.overall).slice(0, 5)
    )) : [];
    // Re-evaluate the lineup on each preparation; new recruits may change the starters.
    await Promise.all([
        scenePromise,
        loadMatchRuntimeAssets(),
        ...starters.map((card) => loadPlayerPortrait(card)),
        ...Array.from(new Set(starters.map((card) => card.qualityId)))
            .map((qualityId) => loadRoundQualityFrame(qualityId)),
    ]);
}

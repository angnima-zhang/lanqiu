import { PREVIEW } from 'cc/env';
import { gameAudio } from './GameAudio';
import {
    GAME_STATE_EVENT_REWARDED_AD_COMPLETED,
    gameStateEvents,
    recordRewardedAdForRecruitmentPity,
} from './GameState';

export interface RewardedAdUnitIds {
    wechat: string;
    tapTap: string;
}

const configuredAdUnitIds: RewardedAdUnitIds = {
    wechat: '',
    tapTap: '',
};

interface RewardedAdCloseResult {
    isEnded?: boolean;
}

interface RewardedVideoAd {
    load?(): Promise<unknown>;
    show(): Promise<unknown>;
    onClose(callback: (result?: RewardedAdCloseResult) => void): void;
    offClose?(callback: (result?: RewardedAdCloseResult) => void): void;
    onError?(callback: (error?: unknown) => void): void;
    offError?(callback: (error?: unknown) => void): void;
    destroy?(): void;
}

interface RewardedVideoAdOptions {
    adUnitId: string;
    disableFallbackSharePage?: boolean;
}

interface MiniGameAdPlatform {
    createRewardedVideoAd(options: RewardedVideoAdOptions): RewardedVideoAd;
}

interface RewardedAdGlobals {
    tap?: MiniGameAdPlatform;
    wx?: MiniGameAdPlatform;
}

type RewardedAdPlatformKind = keyof RewardedAdUnitIds;

interface CachedRewardedVideoAd {
    platform: MiniGameAdPlatform;
    adUnitId: string;
    ad: RewardedVideoAd;
}

let cachedRewardedVideoAd: CachedRewardedVideoAd | null = null;
let isRewardedVideoShowing = false;

export function configureRewardedAdUnitIds(
    adUnitIds: RewardedAdUnitIds,
): void {
    configuredAdUnitIds.wechat = adUnitIds.wechat.trim();
    configuredAdUnitIds.tapTap = adUnitIds.tapTap.trim();
}

export async function showRewardedVideo(
    adUnitIds: RewardedAdUnitIds = configuredAdUnitIds,
): Promise<boolean> {
    if (PREVIEW) {
        notifyRewardedAdCompleted();
        return true;
    }

    const globals = globalThis as unknown as RewardedAdGlobals;
    const platformKind: RewardedAdPlatformKind | null = globals.tap?.createRewardedVideoAd
        ? 'tapTap'
        : globals.wx?.createRewardedVideoAd
            ? 'wechat'
            : null;
    const platform = platformKind === 'tapTap'
        ? globals.tap!
        : platformKind === 'wechat'
            ? globals.wx!
            : null;
    const adUnitId = platformKind ? adUnitIds[platformKind].trim() : '';
    if (!platformKind || !platform || !adUnitId) {
        console.error('[RewardedAdService] Missing rewarded-video platform or ad unit ID.');
        return false;
    }
    if (isRewardedVideoShowing) {
        console.warn('[RewardedAdService] A rewarded video is already showing.');
        return false;
    }

    let ad: RewardedVideoAd;
    try {
        ad = getRewardedVideoAd(platformKind, platform, adUnitId);
    } catch (error) {
        console.error('[RewardedAdService] Failed to create rewarded video.', error);
        return false;
    }

    isRewardedVideoShowing = true;
    try {
        return await new Promise<boolean>((resolve) => {
            let settled = false;
            const finish = (success: boolean): void => {
                if (settled) {
                    return;
                }
                settled = true;
                ad.offClose?.(onClose);
                ad.offError?.(onError);
                if (success) {
                    notifyRewardedAdCompleted();
                }
                resolve(success);
            };
            const onClose = (result?: RewardedAdCloseResult): void => {
                const completed = result?.isEnded === true
                    || (platformKind === 'wechat' && result === undefined);
                finish(completed);
            };
            const onError = (error?: unknown): void => {
                console.error('[RewardedAdService] Rewarded video error.', error);
                finish(false);
            };

            ad.onClose(onClose);
            ad.onError?.(onError);
            void Promise.resolve().then(() => ad.show()).catch(async () => {
                if (settled) {
                    return;
                }
                try {
                    await ad.load?.();
                    if (!settled) {
                        await ad.show();
                    }
                } catch (error) {
                    console.error('[RewardedAdService] Failed to show rewarded video.', error);
                    finish(false);
                }
            });
        });
    } finally {
        isRewardedVideoShowing = false;
    }
}

function getRewardedVideoAd(
    platformKind: RewardedAdPlatformKind,
    platform: MiniGameAdPlatform,
    adUnitId: string,
): RewardedVideoAd {
    if (cachedRewardedVideoAd?.platform === platform
        && cachedRewardedVideoAd.adUnitId === adUnitId) {
        return cachedRewardedVideoAd.ad;
    }

    cachedRewardedVideoAd?.ad.destroy?.();
    const options: RewardedVideoAdOptions = { adUnitId };
    if (platformKind === 'wechat') {
        options.disableFallbackSharePage = true;
    }
    const ad = platform.createRewardedVideoAd(options);
    cachedRewardedVideoAd = { platform, adUnitId, ad };
    return ad;
}

function notifyRewardedAdCompleted(): void {
    recordRewardedAdForRecruitmentPity();
    gameAudio.playAdSuccess();
    gameStateEvents.emit(GAME_STATE_EVENT_REWARDED_AD_COMPLETED);
}

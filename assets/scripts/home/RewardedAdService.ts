import { PREVIEW } from 'cc/env';

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
    onClose(callback: (result: RewardedAdCloseResult) => void): void;
    offClose?(callback: (result: RewardedAdCloseResult) => void): void;
    onError?(callback: () => void): void;
    offError?(callback: () => void): void;
    destroy?(): void;
}

interface MiniGameAdPlatform {
    createRewardedVideoAd(options: { adUnitId: string }): RewardedVideoAd;
}

interface RewardedAdGlobals {
    tap?: MiniGameAdPlatform;
    wx?: MiniGameAdPlatform;
}

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
        return true;
    }

    const globals = globalThis as unknown as RewardedAdGlobals;
    const platform = globals.tap?.createRewardedVideoAd
        ? globals.tap
        : globals.wx?.createRewardedVideoAd
            ? globals.wx
            : null;
    const adUnitId = platform === globals.tap
        ? adUnitIds.tapTap.trim()
        : adUnitIds.wechat.trim();
    if (!platform || !adUnitId) {
        console.error('[RewardedAdService] Missing rewarded-video platform or ad unit ID.');
        return false;
    }

    let ad: RewardedVideoAd;
    try {
        ad = platform.createRewardedVideoAd({ adUnitId });
    } catch (error) {
        console.error('[RewardedAdService] Failed to create rewarded video.', error);
        return false;
    }

    return new Promise<boolean>((resolve) => {
        let settled = false;
        const finish = (success: boolean): void => {
            if (settled) {
                return;
            }
            settled = true;
            ad.offClose?.(onClose);
            ad.offError?.(onError);
            ad.destroy?.();
            resolve(success);
        };
        const onClose = (result: RewardedAdCloseResult): void => {
            finish(result?.isEnded === true);
        };
        const onError = (): void => {
            finish(false);
        };

        ad.onClose(onClose);
        ad.onError?.(onError);
        void Promise.resolve().then(() => ad.show()).catch(async () => {
            try {
                await ad.load?.();
                await ad.show();
            } catch (error) {
                console.error('[RewardedAdService] Failed to show rewarded video.', error);
                finish(false);
            }
        });
    });
}

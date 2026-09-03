import { Button, Label, Node, RichText, Sprite } from 'cc';
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

interface WechatShareOptions {
    title: string;
    query: string;
}

interface WechatSharePlatform {
    shareAppMessage?(options: WechatShareOptions): void;
    showShareMenu?(options: {
        menus: string[];
        success?: () => void;
        fail?: (error?: { errMsg?: string }) => void;
    }): void;
    onShareAppMessage?(callback: () => WechatShareOptions): void;
    offShareAppMessage?(callback: () => WechatShareOptions): void;
    onShareTimeline?(callback: () => WechatShareOptions): void;
    offShareTimeline?(callback: () => WechatShareOptions): void;
    onCopyUrl?(callback: () => { query: string }): void;
    offCopyUrl?(callback: () => { query: string }): void;
    onHide?(callback: () => void): void;
    offHide?(callback: () => void): void;
    onShow?(callback: () => void): void;
    offShow?(callback: () => void): void;
}

interface RewardedAdGlobals {
    tap?: MiniGameAdPlatform;
    wx?: Partial<MiniGameAdPlatform> & WechatSharePlatform;
}

type RewardedAdPlatformKind = keyof RewardedAdUnitIds;

interface CachedRewardedVideoAd {
    platform: MiniGameAdPlatform;
    adUnitId: string;
    ad: RewardedVideoAd;
}

let cachedRewardedVideoAd: CachedRewardedVideoAd | null = null;
let initializedWechatSharePlatform: WechatSharePlatform | null = null;
let isRewardedVideoShowing = false;
const WECHAT_SHARE_MIN_HIDDEN_MS = 2_000;
const WECHAT_SHARE_TITLE = '我正在打造自己的篮球王朝，快来一起组建梦之队！';
const onWechatShareAppMessage = (): WechatShareOptions => createWechatShareOptions('menu_share');
const onWechatShareTimeline = (): WechatShareOptions => createWechatShareOptions('timeline_share');
const onWechatCopyUrl = (): { query: string } => ({ query: 'from=copy_link' });

export function configureRewardedAdUnitIds(
    adUnitIds: RewardedAdUnitIds,
): void {
    configuredAdUnitIds.wechat = adUnitIds.wechat.trim();
    configuredAdUnitIds.tapTap = adUnitIds.tapTap.trim();
}

/** TapTap 可能提供 wx 兼容层，因此必须先排除 TapTap。 */
export function isWechatSharePlatform(): boolean {
    const globals = globalThis as unknown as RewardedAdGlobals;
    return !globals.tap && Boolean(globals.wx);
}

export function initializeWechatShareCapabilities(): void {
    if (!isWechatSharePlatform()) {
        return;
    }
    const globals = globalThis as unknown as RewardedAdGlobals;
    const platform = globals.wx!;
    if (initializedWechatSharePlatform === platform) {
        return;
    }

    initializedWechatSharePlatform?.offShareAppMessage?.(onWechatShareAppMessage);
    initializedWechatSharePlatform?.offShareTimeline?.(onWechatShareTimeline);
    initializedWechatSharePlatform?.offCopyUrl?.(onWechatCopyUrl);
    initializedWechatSharePlatform = platform;

    platform.showShareMenu?.({
        menus: ['shareAppMessage', 'shareTimeline'],
        success: () => console.log('[RewardedAdService] WeChat share menu enabled.'),
        fail: (error) => console.warn(
            '[RewardedAdService] Failed to enable WeChat share menu.',
            error,
        ),
    });
    platform.onShareAppMessage?.(onWechatShareAppMessage);
    platform.onShareTimeline?.(onWechatShareTimeline);
    platform.onCopyUrl?.(onWechatCopyUrl);
}

export function toRewardedActionCopy(text: string): string {
    if (!isWechatSharePlatform()) {
        return text;
    }
    return text
        .replace(/观看广告/g, '分享')
        .replace(/看广告/g, '分享')
        .replace(/广告/g, '分享');
}

/** 只改可见组件文本，节点名继续保留供现有逻辑查找。 */
export function applyWechatShareCopy(root: Node | null): void {
    if (!root || !isWechatSharePlatform()) {
        return;
    }
    const pending = [root];
    while (pending.length > 0) {
        const current = pending.pop()!;
        const label = current.getComponent(Label);
        if (label) {
            label.string = toRewardedActionCopy(label.string);
        }
        const richText = current.getComponent(RichText);
        if (richText) {
            richText.string = toRewardedActionCopy(richText.string);
        }
        applyWechatShareButtonCopy(current);
        pending.push(...current.children);
    }
}

function applyWechatShareButtonCopy(node: Node): void {
    const isAdIcon = (node.name === '看广告' || node.name === '广告')
        && !node.getComponent(Button);
    if (isAdIcon && node.getComponent(Label)?.string === '分享') {
        return;
    }
    const namedChild = node.getChildByName('看广告') ?? node.getChildByName('广告');
    const childAdIcon = namedChild && !namedChild.getComponent(Button) ? namedChild : null;
    const adIcon = childAdIcon ?? (isAdIcon ? node : null);
    if (!adIcon) {
        return;
    }

    const iconSprite = adIcon.getComponent(Sprite);
    if (!iconSprite) {
        return;
    }
    const buttonRoot = childAdIcon ? node : node.parent;
    const buttonLabel = buttonRoot?.children
        .map((child) => child.getComponent(Label))
        .find((label) => Boolean(label) && !/数值|预算/.test(label!.node.name)) ?? null;
    iconSprite.enabled = false;
    adIcon.active = true;
    const shareLabel = adIcon.getComponent(Label) ?? adIcon.addComponent(Label);
    shareLabel.string = '分享';
    shareLabel.font = buttonLabel?.font ?? null;
    if (buttonLabel) {
        shareLabel.color = buttonLabel.color;
    }
    shareLabel.fontSize = Math.min(buttonLabel?.fontSize ?? 48, 48);
    shareLabel.lineHeight = Math.min(buttonLabel?.lineHeight ?? 60, 60);
    shareLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
    shareLabel.verticalAlign = Label.VerticalAlign.CENTER;
    shareLabel.overflow = Label.Overflow.SHRINK;
}

export async function showRewardedVideo(
    adUnitIds: RewardedAdUnitIds = configuredAdUnitIds,
): Promise<boolean> {
    if (PREVIEW) {
        notifyRewardedAdCompleted();
        return true;
    }

    const globals = globalThis as unknown as RewardedAdGlobals;
    if (isWechatSharePlatform()) {
        if (isRewardedVideoShowing) {
            console.warn('[RewardedAdService] A rewarded share is already active.');
            return false;
        }
        isRewardedVideoShowing = true;
        try {
            const completed = await showWechatShare(globals.wx!);
            if (completed) {
                notifyRewardedAdCompleted();
            }
            return completed;
        } finally {
            isRewardedVideoShowing = false;
        }
    }

    const platformKind: RewardedAdPlatformKind | null = globals.tap?.createRewardedVideoAd
        ? 'tapTap'
        : null;
    const platform = platformKind === 'tapTap'
        ? globals.tap!
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
                finish(result?.isEnded === true);
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

function showWechatShare(platform: WechatSharePlatform): Promise<boolean> {
    initializeWechatShareCapabilities();
    if (!platform.shareAppMessage || !platform.onHide || !platform.onShow) {
        console.error('[RewardedAdService] WeChat share API is unavailable.');
        return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
        let hiddenAt: number | null = null;
        let settled = false;
        const finish = (success: boolean): void => {
            if (settled) {
                return;
            }
            settled = true;
            platform.offHide?.(onHide);
            platform.offShow?.(onShow);
            resolve(success);
        };
        const onHide = (): void => {
            hiddenAt = Date.now();
        };
        const onShow = (): void => {
            if (hiddenAt === null) {
                return;
            }
            const elapsed = Date.now() - hiddenAt;
            const completed = elapsed >= WECHAT_SHARE_MIN_HIDDEN_MS;
            console.log(
                `[RewardedAdService] WeChat share returned after ${elapsed}ms: ${completed ? 'completed' : 'incomplete'}.`,
            );
            finish(completed);
        };

        platform.onHide!(onHide);
        platform.onShow!(onShow);
        try {
            platform.shareAppMessage!({
                title: WECHAT_SHARE_TITLE,
                query: 'from=reward_share',
            });
        } catch (error) {
            console.error('[RewardedAdService] Failed to open WeChat share.', error);
            finish(false);
        }
    });
}

function createWechatShareOptions(source: string): WechatShareOptions {
    return {
        title: WECHAT_SHARE_TITLE,
        query: `from=${source}`,
    };
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

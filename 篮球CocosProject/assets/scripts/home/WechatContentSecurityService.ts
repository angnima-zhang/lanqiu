interface WechatCloudFunctionResult {
    result?: unknown;
}

interface WechatCloudApi {
    init(options: { traceUser: boolean }): void;
    callFunction(options: {
        name: string;
        data: Record<string, unknown>;
    }): Promise<WechatCloudFunctionResult>;
}

interface WechatContentSecurityPlatform {
    cloud?: WechatCloudApi;
    showToast?(options: { title: string; icon: 'none'; duration: number }): void;
}

interface WechatContentSecurityGlobals {
    tap?: unknown;
    wx?: WechatContentSecurityPlatform;
}

interface CloudSecurityPayload {
    ok?: boolean;
    suggest?: string;
    label?: number;
    traceId?: string;
}

export type WechatContentSecurityResult = {
    status: 'pass' | 'risky' | 'submitted' | 'unavailable';
    label?: number;
    traceId?: string;
};

const CONTENT_SECURITY_FUNCTION_NAME = 'contentSecurity';
let initializedCloud: WechatCloudApi | null = null;

export async function checkWechatGameText(
    content: string,
): Promise<WechatContentSecurityResult> {
    if (!isWechatPlatform()) {
        return { status: 'pass' };
    }
    const cloud = getWechatCloud();
    if (!cloud) {
        return { status: 'unavailable' };
    }
    const payload = await callContentSecurity(cloud, {
        action: 'checkText',
        content,
        scene: 1,
    });
    if (!payload?.ok) {
        return { status: 'unavailable' };
    }
    return {
        status: payload.suggest === 'pass' ? 'pass' : 'risky',
        label: payload.label,
        traceId: payload.traceId,
    };
}

export async function submitWechatMediaCheck(
    mediaUrl: string,
    mediaType: 1 | 2,
): Promise<WechatContentSecurityResult> {
    if (!isWechatPlatform()) {
        return { status: 'pass' };
    }
    const cloud = getWechatCloud();
    if (!cloud) {
        return { status: 'unavailable' };
    }
    const payload = await callContentSecurity(cloud, {
        action: 'checkMedia',
        mediaUrl,
        mediaType,
        scene: 1,
    });
    if (!payload?.ok || payload.suggest !== 'submitted') {
        return { status: 'unavailable' };
    }
    return { status: 'submitted', traceId: payload.traceId };
}

export function showWechatContentSecurityMessage(title: string): void {
    const globals = globalThis as unknown as WechatContentSecurityGlobals;
    globals.wx?.showToast?.({ title, icon: 'none', duration: 3000 });
}

function getWechatCloud(): WechatCloudApi | null {
    const globals = globalThis as unknown as WechatContentSecurityGlobals;
    return globals.wx?.cloud ?? null;
}

function isWechatPlatform(): boolean {
    const globals = globalThis as unknown as WechatContentSecurityGlobals;
    return !globals.tap && Boolean(globals.wx);
}

async function callContentSecurity(
    cloud: WechatCloudApi,
    data: Record<string, unknown>,
): Promise<CloudSecurityPayload | null> {
    try {
        if (initializedCloud !== cloud) {
            cloud.init({ traceUser: true });
            initializedCloud = cloud;
        }
        const response = await cloud.callFunction({
            name: CONTENT_SECURITY_FUNCTION_NAME,
            data,
        });
        const payload = response.result;
        return payload && typeof payload === 'object'
            ? payload as CloudSecurityPayload
            : null;
    } catch (error) {
        console.error('[WechatContentSecurity] Cloud content check failed.', error);
        return null;
    }
}

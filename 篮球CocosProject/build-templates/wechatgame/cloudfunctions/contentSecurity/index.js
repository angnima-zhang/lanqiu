'use strict';

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const TEXT_MAX_LENGTH = 2500;
const HTTP_URL_PATTERN = /^https?:\/\//i;

exports.main = async (event) => {
    const openid = cloud.getWXContext().OPENID;
    if (!openid) {
        return failure('missing_openid');
    }

    try {
        if (event?.action === 'checkText') {
            return await checkText(event, openid);
        }
        if (event?.action === 'checkMedia') {
            return await checkMedia(event, openid);
        }
        return failure('unsupported_action');
    } catch (error) {
        return failure('wechat_api_failed', error);
    }
};

async function checkText(event, openid) {
    const content = typeof event.content === 'string' ? event.content.trim() : '';
    if (!content || Array.from(content).length > TEXT_MAX_LENGTH) {
        return failure('invalid_content');
    }
    const scene = normalizeScene(event.scene, 5);
    const response = await cloud.openapi.wxa.game.contentSpam.msgSecCheck({
        openid,
        version: 2,
        scene,
        content,
        nickname: content,
    });
    const error = normalizeWechatError(response);
    if (error) {
        return error;
    }
    return {
        ok: true,
        suggest: response.result?.suggest === 'pass' ? 'pass' : 'risky',
        label: response.result?.label,
        traceId: response.traceId ?? response.trace_id,
    };
}

async function checkMedia(event, openid) {
    const mediaUrl = typeof event.mediaUrl === 'string' ? event.mediaUrl.trim() : '';
    const mediaType = Number(event.mediaType);
    if (!HTTP_URL_PATTERN.test(mediaUrl) || (mediaType !== 1 && mediaType !== 2)) {
        return failure('invalid_media');
    }
    const response = await cloud.openapi.security.mediaCheckAsync({
        openid,
        version: 2,
        scene: normalizeScene(event.scene, 1, 4),
        mediaUrl,
        mediaType,
    });
    const error = normalizeWechatError(response);
    if (error) {
        return error;
    }
    return {
        ok: true,
        suggest: 'submitted',
        traceId: response.traceId ?? response.trace_id,
    };
}

function normalizeScene(value, fallback, maximum = 5) {
    const scene = Number(value);
    return Number.isInteger(scene) && scene >= 1 && scene <= maximum ? scene : fallback;
}

function normalizeWechatError(response) {
    const errCode = response?.errCode ?? response?.errcode ?? -1;
    return errCode === 0
        ? null
        : { ok: false, error: 'wechat_api_error', errCode };
}

function failure(error, cause) {
    return {
        ok: false,
        error,
        errCode: cause?.errCode ?? cause?.errcode,
    };
}

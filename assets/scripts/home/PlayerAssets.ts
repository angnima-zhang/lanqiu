import { resources, SpriteFrame } from 'cc';
import { getQualityFrameIndex } from './RosterSlotView';
import { PlayerCard } from './GameState';

const PORTRAIT_SOURCE_ALIASES: Readonly<Record<string, string>> = {
    阿不都沙拉木: 'Abudushalamu Abudurexiti',
    巴特尔: 'Mengke Bateer',
    丁彦雨航: 'Ding Yanyuhang',
    杜锋: 'Du Feng',
    巩晓彬: 'Gong Xiaobin',
    贺希宁: 'He Xining',
    胡金秋: 'Hu Jinqiu',
    胡明轩: 'Hu Mingxuan',
    胡卫东: 'Hu Weidong',
    刘玉栋: 'Liu Yudong',
    孙军: 'Sun Jun',
    唐正东: 'Tang Zhengdong',
    王仕鹏: 'Wang Shipeng',
    王哲林: 'Wang Zhelin',
    王治郅: 'Wang Zhizhi',
    吴前: 'Wu Qian',
    姚明: 'Yao Ming',
    易建联: 'Yi Jianlian',
    赵继伟: 'Zhao Jiwei',
    朱芳雨: 'Zhu Fangyu',
};

export function loadPlayerPortrait(
    player: Pick<PlayerCard, 'sourcePlayerName' | 'displayName'>,
): Promise<SpriteFrame | null> {
    const portraitSource = PORTRAIT_SOURCE_ALIASES[player.sourcePlayerName]
        ?? player.sourcePlayerName;
    return loadSpriteFrame(
        `images/头像/${player.displayName}_${portraitSource}/spriteFrame`,
    );
}

export function loadQualityFrame(qualityId: number): Promise<SpriteFrame | null> {
    const frameIndex = getQualityFrameIndex(qualityId);
    return loadSpriteFrame(
        `images/UI/球员/头像框-方/头像框${frameIndex}-方/spriteFrame`,
    );
}

export function loadRoundQualityFrame(qualityId: number): Promise<SpriteFrame | null> {
    const frameIndex = getQualityFrameIndex(qualityId);
    return loadSpriteFrame(
        `images/UI/球员/头像框-圆/头像框${frameIndex}-圆/spriteFrame`,
    );
}

export function loadSpriteFrame(path: string): Promise<SpriteFrame | null> {
    return new Promise((resolve) => {
        resources.load(path, SpriteFrame, (error, spriteFrame) => {
            if (error || !spriteFrame) {
                console.error(`[PlayerAssets] Failed to load SpriteFrame: ${path}`, error);
                resolve(null);
                return;
            }
            resolve(spriteFrame);
        });
    });
}

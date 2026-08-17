/**
 * PreMatchEntrance — "对决碰撞"备赛页面入场动画。
 *
 * 阶段一：bg、顶部、管理层加成 淡入出现
 * 阶段二：双方球队面板从屏幕左右滑入 → 中心对撞 → 回弹归位
 *          球员卡依次左右滑入 → 对撞 → 回弹归位
 * 阶段三：底部按钮"从天而降"（缩放 0→1 + 淡入），尘埃落定
 *
 * 还原方法：PreMatchController.openPage() 内已将旧动画注释保留，
 * 取消注释 playFullScreenEntrance 并注释 playPreMatchEntrance 即可。
 */
import {
    Node,
    tween,
    Tween,
    UIOpacity,
    UITransform,
    Vec3,
} from 'cc';

// ---- 时间常量（单位：秒） ----

const PHASE1_DURATION = 0.2;       // 阶段一淡入时长（秒）
const TEAM_SLIDE_DURATION = 0.07;   // 球队面板滑动碰撞时长（秒）
const PLAYER_LAUNCH_INTERVAL = 0.08; // 相邻球员卡发射间隔（秒）：上一对出发后多久发射下一对，越小越密集
const PLAYER_SLIDE_DURATION = 0.05; // 单个球员卡滑动时长（秒）
const DROP_DURATION = 0.2;          // 底部按钮坠落时长（秒）
const DROP_DELAY = 0.05;             // 坠落前停顿（秒）

// ---- 公开接口 ----

export async function playPreMatchEntrance(
    page: Node,
    teamPanels: { playerTeam: Node; opponentTeam: Node },
    playerCards: Node[],
    opponentCards: Node[],
    bgNodes: Node[],
    topBarNodes: Node[],
    mgmtNodes: Node[],
    bottomNodes: Node[],
): Promise<void> {
    stopAllTweens(page);
    page.active = true;

    // 汇总所有需要 UIOpacity 控制的节点
    const allNodes = [
        ...bgNodes, ...topBarNodes, ...mgmtNodes,
        teamPanels.playerTeam, teamPanels.opponentTeam,
        ...playerCards, ...opponentCards,
        ...bottomNodes,
    ];

    // 所有节点起始状态：不可见
    for (const node of allNodes) {
        const op = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
        Tween.stopAllByTarget(op);
        op.opacity = 0;
    }

    // ---- 阶段一：背景/顶部/管理层 淡入 ----
    await fadeInNodes([...bgNodes, ...topBarNodes, ...mgmtNodes], PHASE1_DURATION);

    // ---- 阶段二：双方球队面板对撞 ----
    const playerPos = teamPanels.playerTeam.position.clone();
    const opponentPos = teamPanels.opponentTeam.position.clone();

    await Promise.all([
        slideAndBounce(teamPanels.playerTeam, 'left', playerPos),
        slideAndBounce(teamPanels.opponentTeam, 'right', opponentPos),
    ]);

    // ---- 阶段二下半：球员卡依次对撞（重叠发射） ----
    // 不再等上一对播完才发下一对，而是按固定间隔连续发射
    const maxCards = Math.max(playerCards.length, opponentCards.length);
    const allCardPromises: Promise<void>[] = [];
    for (let i = 0; i < maxCards; i++) {
        // 按发射间隔延迟后再启动这对
        const launchDelay = i * PLAYER_LAUNCH_INTERVAL;
        const pairPromise = delay(launchDelay).then(() => Promise.all([
            i < playerCards.length ? slideAndBounce(
                playerCards[i], 'left', playerCards[i].position.clone(),
            ) : Promise.resolve(),
            i < opponentCards.length ? slideAndBounce(
                opponentCards[i], 'right', opponentCards[i].position.clone(),
            ) : Promise.resolve(),
        ]));
        allCardPromises.push(pairPromise);
    }
    // 等所有卡片动画全部结束
    await Promise.all(allCardPromises);

    // ---- 阶段三：底部按钮从天而降 ----
    await delay(DROP_DELAY);
    await dropIn(bottomNodes);
}

// ---- 内部工具函数 ----

/**
 * 批量淡入：所有节点同时从透明渐变到不透明。
 * @param nodes   目标节点数组
 * @param duration 动画时长（秒）
 */
function fadeInNodes(nodes: Node[], duration: number): Promise<void> {
    if (nodes.length === 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
        let done = 0;
        for (const node of nodes) {
            const op = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
            op.opacity = 0;
            tween(op)
                .to(duration, { opacity: 255 }, { easing: 'quadOut' })
                .call(() => { done++; if (done === nodes.length) resolve(); })
                .start();
        }
    });
}

/**
 * 左右对撞滑入：节点从屏幕外滑入，越过中点轻微过冲，再回弹到原位。
 * @param node        目标节点
 * @param fromSide    从左边还是右边滑入
 * @param originalPos 节点最终归位坐标
 */
function slideAndBounce(
    node: Node,
    fromSide: 'left' | 'right',
    originalPos: Vec3,
): Promise<void> {
    // 起始透明度
    const op = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    op.opacity = 0;

    const transform = node.getComponent(UITransform);
    const parentWidth = node.parent?.getComponent(UITransform)?.width ?? 1080;
    const nodeWidth = transform?.width ?? 200;

    // 起始 X 坐标：屏幕外
    const startX = fromSide === 'left'
        ? -(parentWidth / 2 + nodeWidth)
        : parentWidth / 2 + nodeWidth;

    // 过冲 X 坐标：比原位多偏移 30 像素（伪碰撞效果）
    const overshootX = fromSide === 'left'
        ? originalPos.x + 30
        : originalPos.x - 30;

    node.setPosition(startX, originalPos.y, 0);

    return new Promise<void>((resolve) => {
        tween(node)
            // 滑动过程中同步淡入
            .parallel(
                tween(op).to(0.05, { opacity: 180 }),
            )
            // 滑向过冲点（加速冲入）
            .to(TEAM_SLIDE_DURATION, {
                position: new Vec3(overshootX, originalPos.y, 0),
            }, { easing: 'quadIn' })
            // 回弹到原位（0.15 秒）
            .to(0.15, {
                position: new Vec3(originalPos.x, originalPos.y, 0),
            }, { easing: 'backOut' })
            .call(() => {
                op.opacity = 255;
                resolve();
            })
            .start();
    });
}

/**
 * 从天而降：缩放 0.3 → 1.15 → 1.0，同时淡入。模拟"坠落着地"。
 * @param nodes 目标节点数组
 */
function dropIn(nodes: Node[]): Promise<void> {
    if (nodes.length === 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
        let done = 0;
        for (const node of nodes) {
            const op = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
            op.opacity = 0;
            node.setScale(0.3, 0.3, 1);

            tween(node)
                .parallel(
                    tween(op).to(DROP_DURATION, { opacity: 255 }, { easing: 'quadIn' }),
                )
                // 主体弹射阶段：快速放大到 1.15 倍（占 70% 时长）
                .to(DROP_DURATION * 0.7, {
                    scale: new Vec3(1.15, 1.15, 1),
                }, { easing: 'quadIn' })
                // 回弹到位：1.15 → 1.0（占 30% 时长）
                .to(DROP_DURATION * 0.3, {
                    scale: new Vec3(1, 1, 1),
                }, { easing: 'backOut' })
                .call(() => { done++; if (done === nodes.length) resolve(); })
                .start();
        }
    });
}

/** 简单延时（秒） */
function delay(seconds: number): Promise<void> {
    return new Promise((resolve) => { setTimeout(resolve, seconds * 1000); });
}

/** 递归停止页面所有节点的 Tween 动画 */
function stopAllTweens(page: Node): void {
    const stop = (n: Node): void => {
        Tween.stopAllByTarget(n);
        const op = n.getComponent(UIOpacity);
        if (op) Tween.stopAllByTarget(op);
        for (const child of n.children) stop(child);
    };
    stop(page);
}

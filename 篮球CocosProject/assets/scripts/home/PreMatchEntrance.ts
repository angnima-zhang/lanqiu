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
    Widget,
} from 'cc';

// ---- 时间常量（单位：秒） ----

const PHASE1_DURATION = 0.2;       // 阶段一淡入时长（秒）
const TEAM_SLIDE_DURATION = 0.07;   // 球队面板滑动碰撞时长（秒）
const PLAYER_LAUNCH_INTERVAL = 0.08; // 相邻球员卡发射间隔（秒）：上一对出发后多久发射下一对，越小越密集
const PLAYER_SLIDE_DURATION = 0.05; // 单个球员卡滑动时长（秒）
const DROP_DURATION = 0.2;          // 底部按钮坠落时长（秒）
const DROP_DELAY = 0.05;             // 坠落前停顿（秒）

interface EntranceState {
    cancelled: boolean;
    nodes: Map<Node, { position: Vec3 | null; scale: Vec3 | null; opacity: UIOpacity }>;
    pendingSteps: Set<() => void>;
    timers: Set<ReturnType<typeof setTimeout>>;
}

const activeEntrances = new WeakMap<Node, EntranceState>();

// ---- 公开接口 ----

export function stopPreMatchEntrance(page: Node): void {
    const state = activeEntrances.get(page);
    if (!state) return;
    activeEntrances.delete(page);
    state.cancelled = true;
    state.timers.forEach((timer) => clearTimeout(timer));
    state.timers.clear();
    stopAllTweens(page);
    for (const [node, original] of state.nodes) {
        if (!node.isValid) continue;
        if (original.position) node.setPosition(original.position);
        if (original.scale) node.setScale(original.scale);
        original.opacity.opacity = 255;
    }
    // 被停止的 Tween 不会触发 call，主动完成等待，防止入场流程悬挂。
    state.pendingSteps.forEach((finish) => finish());
}

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
    stopPreMatchEntrance(page);
    stopAllTweens(page);
    page.active = true;
    // 首次激活后先完成 Widget 对齐，避免把编辑器/隐藏状态的坐标记成动画终点。
    alignWidgets(page);

    const movingNodes = new Set([
        teamPanels.playerTeam, teamPanels.opponentTeam,
        ...playerCards, ...opponentCards,
    ]);
    const scalingNodes = new Set(bottomNodes);

    // 汇总所有需要 UIOpacity 控制的节点
    const allNodes = Array.from(new Set([
        ...bgNodes, ...topBarNodes, ...mgmtNodes,
        teamPanels.playerTeam, teamPanels.opponentTeam,
        ...playerCards, ...opponentCards,
        ...bottomNodes,
    ]));
    const state: EntranceState = {
        cancelled: false,
        nodes: new Map(),
        pendingSteps: new Set(),
        timers: new Set(),
    };
    activeEntrances.set(page, state);

    // 所有节点起始状态：不可见
    for (const node of allNodes) {
        const op = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
        // 只保存动画会修改的属性；背景、顶部等淡入节点的坐标由 Widget 管理。
        state.nodes.set(node, {
            position: movingNodes.has(node) ? node.position.clone() : null,
            scale: scalingNodes.has(node) ? node.scale.clone() : null,
            opacity: op,
        });
        Tween.stopAllByTarget(op);
        op.opacity = 0;
    }

    // ---- 阶段一：背景/顶部/管理层 淡入 ----
    await fadeInNodes([...bgNodes, ...topBarNodes, ...mgmtNodes], PHASE1_DURATION, state);
    if (state.cancelled) return;

    // ---- 阶段二：双方球队面板对撞 ----
    const playerPos = state.nodes.get(teamPanels.playerTeam)!.position!;
    const opponentPos = state.nodes.get(teamPanels.opponentTeam)!.position!;

    await Promise.all([
        slideAndBounce(teamPanels.playerTeam, 'left', playerPos, state),
        slideAndBounce(teamPanels.opponentTeam, 'right', opponentPos, state),
    ]);
    if (state.cancelled) return;

    // ---- 阶段二下半：球员卡依次对撞（重叠发射） ----
    // 不再等上一对播完才发下一对，而是按固定间隔连续发射
    const maxCards = Math.max(playerCards.length, opponentCards.length);
    const allCardPromises: Promise<void>[] = [];
    for (let i = 0; i < maxCards; i++) {
        // 按发射间隔延迟后再启动这对
        const launchDelay = i * PLAYER_LAUNCH_INTERVAL;
        const pairPromise = delay(launchDelay, state).then(() => {
            if (state.cancelled) return;
            return Promise.all([
                i < playerCards.length ? slideAndBounce(
                    playerCards[i], 'left', state.nodes.get(playerCards[i])!.position!, state,
                ) : Promise.resolve(),
                i < opponentCards.length ? slideAndBounce(
                    opponentCards[i], 'right', state.nodes.get(opponentCards[i])!.position!, state,
                ) : Promise.resolve(),
            ]).then(() => undefined);
        });
        allCardPromises.push(pairPromise);
    }
    // 等所有卡片动画全部结束
    await Promise.all(allCardPromises);
    if (state.cancelled) return;

    // ---- 阶段三：底部按钮从天而降 ----
    await delay(DROP_DELAY, state);
    if (state.cancelled) return;
    await dropIn(bottomNodes, state);
    // 正常完成只清理记录，不能调用中断恢复去覆盖已经对齐的页面布局。
    if (!state.cancelled) activeEntrances.delete(page);
}

// ---- 内部工具函数 ----

/**
 * 批量淡入：所有节点同时从透明渐变到不透明。
 * @param nodes   目标节点数组
 * @param duration 动画时长（秒）
 */
function fadeInNodes(nodes: Node[], duration: number, state: EntranceState): Promise<void> {
    if (nodes.length === 0) return Promise.resolve();
    return runStep(state, (resolve) => {
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
    state: EntranceState,
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

    return runStep(state, (resolve) => {
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
function dropIn(nodes: Node[], state: EntranceState): Promise<void> {
    if (nodes.length === 0) return Promise.resolve();
    return runStep(state, (resolve) => {
        let done = 0;
        for (const node of nodes) {
            const op = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
            op.opacity = 0;
            const originalScale = state.nodes.get(node)!.scale!;
            node.setScale(originalScale.x * 0.3, originalScale.y * 0.3, originalScale.z);

            tween(node)
                .parallel(
                    tween(op).to(DROP_DURATION, { opacity: 255 }, { easing: 'quadIn' }),
                )
                // 主体弹射阶段：快速放大到 1.15 倍（占 70% 时长）
                .to(DROP_DURATION * 0.7, {
                    scale: new Vec3(originalScale.x * 1.15, originalScale.y * 1.15, originalScale.z),
                }, { easing: 'quadIn' })
                // 回弹到位：1.15 → 1.0（占 30% 时长）
                .to(DROP_DURATION * 0.3, {
                    scale: originalScale.clone(),
                }, { easing: 'backOut' })
                .call(() => { done++; if (done === nodes.length) resolve(); })
                .start();
        }
    });
}

/** 简单延时（秒） */
function delay(seconds: number, state: EntranceState): Promise<void> {
    return runStep(state, (resolve) => {
        const timer = setTimeout(() => {
            state.timers.delete(timer);
            resolve();
        }, seconds * 1000);
        state.timers.add(timer);
    });
}

function runStep(state: EntranceState, start: (finish: () => void) => void): Promise<void> {
    if (state.cancelled) return Promise.resolve();
    return new Promise<void>((resolve) => {
        const finish = (): void => {
            state.pendingSteps.delete(finish);
            resolve();
        };
        state.pendingSteps.add(finish);
        start(finish);
    });
}

/** 按父子顺序同步布局，再记录动画终点。 */
function alignWidgets(node: Node): void {
    const widget = node.getComponent(Widget);
    if (widget?.enabled) widget.updateAlignment();
    for (const child of node.children) alignWidgets(child);
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

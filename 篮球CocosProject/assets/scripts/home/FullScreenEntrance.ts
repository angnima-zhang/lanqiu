import {
    Node,
    tween,
    Tween,
    UIOpacity,
    UITransform,
} from 'cc';

const FADE_SECONDS = 0.2;
const STAGGER_SECONDS = 0.08;
const EXIT_SPEED_MULTIPLIER = 2;     // 淡出速度倍数（比淡入快）
const BACKGROUND_NAMES = new Set(['bg', 'bg-001']);

export interface FullScreenEntranceGroup {
    nodes: readonly Node[];
    order?: number;
}

export interface FullScreenEntranceOptions {
    backgroundNodes?: readonly Node[];
    moduleGroups?: readonly FullScreenEntranceGroup[];
    /** 仅供需要加速的连续展示页使用；普通页面保持默认速度。 */
    speedMultiplier?: number;
}

interface ActiveEntrance {
    opacities: UIOpacity[];
    finish: () => void;
}

const activeEntrances = new WeakMap<Node, ActiveEntrance>();

export function stopFullScreenEntrance(page: Node): void {
    const activeEntrance = activeEntrances.get(page);
    if (!activeEntrance) {
        return;
    }

    activeEntrance.opacities.forEach((opacity) => {
        Tween.stopAllByTarget(opacity);
        opacity.opacity = 255;
    });
    activeEntrance.finish();
}

/**
 * 标准淡出：入场动画的反向——从下往上依次淡出，速度是淡入的 N 倍。
 * 返回 Promise，resolve 时所有节点已完全透明。
 */
export function playFullScreenExit(page: Node, speedMultiplier = 1): Promise<void> {
    stopFullScreenEntrance(page);

    // 复用入场时的分组逻辑：背景节点 + 按 Y 坐标从高到低排列的模块组
    const viewportTransform = page.parent?.getComponent(UITransform)
        ?? page.getComponent(UITransform);
    const backgroundNodes = page.children.filter((child) => {
        if (!child.active) return false;
        if (BACKGROUND_NAMES.has(child.name)) return true;
        const transform = child.getComponent(UITransform);
        return Boolean(
            viewportTransform
            && transform
            && transform.width >= viewportTransform.width * 0.9
            && transform.height >= viewportTransform.height * 0.9
        );
    });
    const bgSet = new Set(backgroundNodes);
    const moduleNodes = page.children
        .filter((child) => child.active && !bgSet.has(child))
        .sort((a, b) => b.position.y - a.position.y); // 从上到下

    const bgOpacities = backgroundNodes
        .map((n) => n.getComponent(UIOpacity))
        .filter((op): op is UIOpacity => Boolean(op && op.opacity > 0));
    const moduleOpacities = moduleNodes
        .map((n) => n.getComponent(UIOpacity))
        .filter((op): op is UIOpacity => Boolean(op && op.opacity > 0));

    if (bgOpacities.length === 0 && moduleOpacities.length === 0) {
        return Promise.resolve();
    }

    const speed = Math.max(1, speedMultiplier);
    const exitFade = FADE_SECONDS / EXIT_SPEED_MULTIPLIER / speed;
    const exitStagger = STAGGER_SECONDS / EXIT_SPEED_MULTIPLIER / speed;
    const totalDuration = exitFade
        + exitStagger * Math.max(0, moduleOpacities.length - 1);

    for (const op of [...bgOpacities, ...moduleOpacities]) {
        Tween.stopAllByTarget(op);
    }

    return new Promise<void>((resolve) => {
        let done = 0;
        const total = bgOpacities.length + moduleOpacities.length;
        const check = () => { done++; if (done === total) resolve(); };

        // 背景：在持续时间内缓慢淡出（跟模块同步结束）
        for (const op of bgOpacities) {
            tween(op)
                .to(totalDuration, { opacity: 0 }, { easing: 'quadIn' })
                .call(check)
                .start();
        }

        // 模块：从下往上依次淡出（先淡出底部的）
        // moduleNodes 已经是「从上到下」排序，reverse 后是「从下到上」
        const reversed = [...moduleOpacities].reverse();
        reversed.forEach((op, index) => {
            tween(op)
                .delay(index * exitStagger)
                .to(exitFade, { opacity: 0 }, { easing: 'quadIn' })
                .call(check)
                .start();
        });
    });
}

export function playFullScreenEntrance(
    page: Node,
    options: FullScreenEntranceOptions = {},
): Promise<void> {
    stopFullScreenEntrance(page);
    page.active = true;
    const speed = Math.max(1, options.speedMultiplier ?? 1);

    const viewportTransform = page.parent?.getComponent(UITransform)
        ?? page.getComponent(UITransform);
    const backgroundNodes = uniqueNodes(
        options.backgroundNodes ?? page.children.filter((child) => {
            if (BACKGROUND_NAMES.has(child.name)) {
                return true;
            }
            const transform = child.getComponent(UITransform);
            return Boolean(
                viewportTransform
                && transform
                && transform.width >= viewportTransform.width * 0.9
                && transform.height >= viewportTransform.height * 0.9
            );
        }),
    );
    const backgroundSet = new Set(backgroundNodes);
    const moduleGroups = options.moduleGroups
        ? normalizeGroups(options.moduleGroups, backgroundSet)
        : page.children
            .filter((child) => child.active && !backgroundSet.has(child))
            .sort((a, b) => b.position.y - a.position.y)
            .map((node) => [node]);
    const backgroundOpacities = backgroundNodes.map(
        (node) => node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity),
    );
    const moduleOpacityGroups = moduleGroups.map(
        (group) => group.map(
            (node) => node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity),
        ),
    );
    const allOpacities = moduleOpacityGroups.reduce<UIOpacity[]>(
        (result, group) => {
            result.push(...group);
            return result;
        },
        [...backgroundOpacities],
    );

    for (const opacity of allOpacities) {
        Tween.stopAllByTarget(opacity);
        opacity.opacity = 0;
    }

    if (allOpacities.length === 0) {
        return Promise.resolve();
    }

    const fadeSeconds = FADE_SECONDS / speed;
    const staggerSeconds = STAGGER_SECONDS / speed;
    const totalDuration = fadeSeconds
        + staggerSeconds * Math.max(0, moduleOpacityGroups.length - 1);
    return new Promise<void>((resolve) => {
        let finished = false;
        const finish = (): void => {
            if (finished) {
                return;
            }
            finished = true;
            if (activeEntrances.get(page)?.finish === finish) {
                activeEntrances.delete(page);
            }
            resolve();
        };
        activeEntrances.set(page, { opacities: allOpacities, finish });

        backgroundOpacities.forEach((opacity, index) => {
            const entrance = tween(opacity)
                .to(totalDuration, { opacity: 255 }, { easing: 'quadOut' });
            if (
                moduleOpacityGroups.length === 0
                && index === backgroundOpacities.length - 1
            ) {
                entrance.call(finish);
            }
            entrance.start();
        });

        if (moduleOpacityGroups.length === 0) {
            return;
        }

        moduleOpacityGroups.forEach((group, groupIndex) => {
            group.forEach((opacity, nodeIndex) => {
                const entrance = tween(opacity)
                .delay(groupIndex * staggerSeconds)
                .to(fadeSeconds, { opacity: 255 }, { easing: 'quadOut' });
                if (
                    groupIndex === moduleOpacityGroups.length - 1
                    && nodeIndex === group.length - 1
                ) {
                    entrance.call(finish);
                }
                entrance.start();
            });
        });
    });
}

function uniqueNodes(nodes: readonly Node[]): Node[] {
    return [...new Set(nodes)];
}

function normalizeGroups(
    groups: readonly FullScreenEntranceGroup[],
    excludedNodes: ReadonlySet<Node>,
): Node[][] {
    const seenNodes = new Set(excludedNodes);
    return groups
        .map((group, index) => ({ group, index }))
        .sort((a, b) => (a.group.order ?? a.index) - (b.group.order ?? b.index))
        .map(({ group }) => group.nodes.filter((node) => {
            if (!node.active || seenNodes.has(node)) {
                return false;
            }
            seenNodes.add(node);
            return true;
        }))
        .filter((group) => group.length > 0);
}

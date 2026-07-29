import {
    Node,
    tween,
    Tween,
    UIOpacity,
    UITransform,
} from 'cc';

const FADE_SECONDS = 0.2;
const STAGGER_SECONDS = 0.08;
const BACKGROUND_NAMES = new Set(['bg', 'bg-001']);

export function playFullScreenEntrance(page: Node): Promise<void> {
    const viewportTransform = page.parent?.getComponent(UITransform)
        ?? page.getComponent(UITransform);
    const backgroundNodes = page.children.filter((child) => {
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
    });
    const moduleNodes = page.children
        .filter((child) => child.active && !backgroundNodes.includes(child))
        .sort((a, b) => b.position.y - a.position.y);
    const backgroundOpacities = backgroundNodes.map(
        (node) => node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity),
    );
    const moduleOpacities = moduleNodes.map(
        (node) => node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity),
    );
    const allOpacities = [...backgroundOpacities, ...moduleOpacities];

    for (const opacity of allOpacities) {
        Tween.stopAllByTarget(opacity);
        opacity.opacity = 0;
    }

    page.active = true;
    if (allOpacities.length === 0) {
        return Promise.resolve();
    }

    const totalDuration = FADE_SECONDS
        + STAGGER_SECONDS * Math.max(0, moduleOpacities.length - 1);
    return new Promise<void>((resolve) => {
        if (moduleOpacities.length === 0) {
            backgroundOpacities.forEach((opacity, index) => {
                const entrance = tween(opacity)
                    .to(totalDuration, { opacity: 255 }, { easing: 'quadOut' });
                if (index === backgroundOpacities.length - 1) {
                    entrance.call(() => resolve());
                }
                entrance.start();
            });
            return;
        }

        for (const opacity of backgroundOpacities) {
            tween(opacity)
                .to(totalDuration, { opacity: 255 }, { easing: 'quadOut' })
                .start();
        }

        let remaining = moduleOpacities.length;
        moduleOpacities.forEach((opacity, index) => {
            tween(opacity)
                .delay(index * STAGGER_SECONDS)
                .to(FADE_SECONDS, { opacity: 255 }, { easing: 'quadOut' })
                .call(() => {
                    remaining -= 1;
                    if (remaining === 0) {
                        resolve();
                    }
                })
                .start();
        });
    });
}

import { Node, ResolutionPolicy, SafeArea, view, Widget } from 'cc';

const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 2160;

/** 矮宽窗口按高度完整显示；常规竖屏按宽度铺满。 */
export function applyAdaptiveDesignResolution(): void {
    const frameSize = view.getFrameSize();
    if (frameSize.width <= 0 || frameSize.height <= 0) {
        return;
    }
    const policy = frameSize.width / frameSize.height > DESIGN_WIDTH / DESIGN_HEIGHT
        ? ResolutionPolicy.FIXED_HEIGHT
        : ResolutionPolicy.FIXED_WIDTH;
    view.setDesignResolutionSize(DESIGN_WIDTH, DESIGN_HEIGHT, policy);
}

/** 只收拢 Canvas 下带 Widget 的全屏页面，跳过 Camera 和 manager 等功能节点。 */
export function applySafeAreaToPage(page: Node | null): void {
    if (!page || !page.getComponent(Widget) || page.getComponent(SafeArea)) {
        return;
    }
    const safeArea = page.addComponent(SafeArea);
    safeArea.symmetric = false;
    safeArea.updateArea();
}

export function applySafeAreaToCanvasPages(canvas: Node | null): void {
    if (!canvas) {
        return;
    }
    applyAdaptiveDesignResolution();
    for (const child of canvas.children) {
        applySafeAreaToPage(child);
    }
}

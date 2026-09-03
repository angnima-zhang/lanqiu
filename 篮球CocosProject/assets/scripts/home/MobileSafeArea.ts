import { Node, SafeArea, Widget } from 'cc';

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
    for (const child of canvas.children) {
        applySafeAreaToPage(child);
    }
}

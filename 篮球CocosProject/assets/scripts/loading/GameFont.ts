import { Component, Font, Label, Node } from 'cc';

export function applyGameFont(root: Node, font: Font): void {
    for (const label of root.getComponents(Label)) {
        label.font = font;
    }
    for (const child of root.children) {
        applyGameFont(child, font);
    }
}

/** Font assignment immediately rebuilds even hidden labels in Creator 3.8. */
export function applyGameFontInBatches(root: Node, font: Font, owner: Component): void {
    const pending = root.getComponentsInChildren(Label).filter((label) => label.font !== font);
    const applyBatch = (): void => {
        if (!root.isValid || !owner.isValid) {
            owner.unschedule(applyBatch);
            return;
        }
        // Recheck visibility each frame so a newly opened popup jumps ahead of hidden pages.
        for (let count = 0; count < 8 && pending.length > 0; count += 1) {
            const visibleIndex = pending.findIndex((label) => label.isValid && label.node.activeInHierarchy);
            const [label] = pending.splice(Math.max(0, visibleIndex), 1);
            if (label.isValid && label.font !== font) label.font = font;
        }
        if (pending.length === 0) owner.unschedule(applyBatch);
    };
    owner.schedule(applyBatch);
}

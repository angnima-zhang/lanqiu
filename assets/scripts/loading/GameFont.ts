import { Font, Label, Node } from 'cc';

export function applyGameFont(root: Node, font: Font): void {
    for (const label of root.getComponents(Label)) {
        label.font = font;
    }
    for (const child of root.children) {
        applyGameFont(child, font);
    }
}

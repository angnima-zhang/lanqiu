import { Font, Label, Node } from 'cc';

export function applyGameFont(root: Node, font: Font): void {
    const labels = root.getComponentsInChildren(Label);
    for (const label of labels) {
        label.font = font;
    }
}

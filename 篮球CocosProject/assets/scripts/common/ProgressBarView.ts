import { _decorator, Component, Label, Node, UITransform } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ProgressBarView')
export class ProgressBarView extends Component {
    @property(Node)
    public fill: Node | null = null;

    @property(Label)
    public valueLabel: Label | null = null;

    public setup(current: number, max: number): void {
        const safeMax = Math.max(1, max);
        const ratio = Math.max(0, Math.min(1, current / safeMax));

        if (this.fill) {
            const fillTransform = this.fill.getComponent(UITransform);
            const rootTransform = this.node.getComponent(UITransform);
            if (fillTransform && rootTransform) {
                fillTransform.setContentSize(rootTransform.contentSize.width * ratio, fillTransform.contentSize.height);
            }
        }

        if (this.valueLabel) {
            this.valueLabel.string = `${current}/${max}`;
        }
    }
}

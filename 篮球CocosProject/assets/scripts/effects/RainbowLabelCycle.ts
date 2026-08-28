import { _decorator, Color, Component, Label } from 'cc';

const { ccclass } = _decorator;
const CYCLE_SECONDS = 5.4;

@ccclass('RainbowLabelCycle')
export class RainbowLabelCycle extends Component {
    private labels: Array<{ label: Label; original: Color; animated: Color }> = [];
    private phase = 0;

    protected onLoad(): void {
        this.labels = this.node.getComponentsInChildren(Label).map((label) => ({
            label,
            original: label.color.clone(),
            animated: label.color.clone(),
        }));
    }

    protected onEnable(): void {
        this.phase = 0;
        this.update(0);
    }

    protected update(deltaTime: number): void {
        this.phase = (this.phase + deltaTime / CYCLE_SECONDS) % 1;
        this.labels.forEach(({ label, original, animated }, index) => {
            if (!label.isValid) return;
            // 与概念神边框一样使用三相余弦彩虹，抬高最低亮度以保持文字清晰。
            const hue = this.phase + index / Math.max(1, this.labels.length);
            const channel = (offset: number): number => Math.round(
                255 * (0.72 + 0.28 * Math.cos(2 * Math.PI * (hue + offset))),
            );
            animated.set(channel(0), channel(1 / 3), channel(2 / 3), original.a);
            label.color = animated;
        });
    }

    protected onDisable(): void {
        for (const { label, original } of this.labels) {
            if (label.isValid) label.color = original;
        }
    }
}

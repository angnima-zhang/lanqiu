import { _decorator, Component, Label, Node, Sprite } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('PlayerAvatarChip')
export class PlayerAvatarChip extends Component {
    @property(Sprite)
    public portrait: Sprite | null = null;

    @property(Label)
    public ovrLabel: Label | null = null;

    @property(Node)
    public qualityFrame: Node | null = null;

    protected onLoad(): void {
        this.ovrLabel ??= this.node.getChildByName('OVR')?.getComponent(Label) ?? null;
        this.qualityFrame ??= this.node.getChildByName('QualityFrame') ?? null;
    }

    public setup(ovr: number): void {
        if (this.ovrLabel) {
            this.ovrLabel.string = String(ovr);
        }
    }
}

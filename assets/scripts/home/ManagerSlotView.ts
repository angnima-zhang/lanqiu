import { _decorator, Button, Component, Label, Sprite } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ManagerSlotView')
export class ManagerSlotView extends Component {
    @property(Sprite)
    public icon: Sprite | null = null;

    @property(Label)
    public titleLabel: Label | null = null;

    @property(Button)
    public openButton: Button | null = null;

    protected onLoad(): void {
        this.titleLabel ??= this.node.getChildByName('LevelText')?.getComponent(Label) ?? null;
        this.openButton ??= this.node.getComponent(Button);
    }

    public setup(title: string): void {
        if (this.titleLabel) {
            this.titleLabel.string = title;
        }
    }
}

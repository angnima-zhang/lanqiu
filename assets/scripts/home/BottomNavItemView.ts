import { _decorator, Button, Component, Label, Sprite } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('BottomNavItemView')
export class BottomNavItemView extends Component {
    @property(Sprite)
    public icon: Sprite | null = null;

    @property(Label)
    public titleLabel: Label | null = null;

    @property(Button)
    public button: Button | null = null;

    protected onLoad(): void {
        this.titleLabel ??= this.node.getChildByName('Text')?.getComponent(Label) ?? null;
        this.button ??= this.node.getComponent(Button);
    }

    public setup(title: string): void {
        if (this.titleLabel) {
            this.titleLabel.string = title;
        }
    }
}

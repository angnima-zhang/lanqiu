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
        this.titleLabel ??= this.node.getChildByName('等级')?.getComponent(Label)
            ?? this.node.getChildByName('LevelText')?.getComponent(Label)
            ?? null;
        this.openButton = this.resolveOpenButton();
    }

    public resolveOpenButton(): Button | null {
        return this.node.getChildByName('bg')?.getComponent(Button)
            ?? this.node.getChildByName('背景')?.getComponent(Button)
            ?? this.node.getComponent(Button)
            ?? this.node.getComponentInChildren(Button)
            ?? null;
    }

    public setup(title: string): void {
        if (this.titleLabel) {
            this.titleLabel.string = title;
        }
    }
}

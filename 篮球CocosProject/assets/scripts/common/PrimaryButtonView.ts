import { _decorator, Button, Component, Label } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('PrimaryButtonView')
export class PrimaryButtonView extends Component {
    @property(Button)
    public button: Button | null = null;

    @property(Label)
    public titleLabel: Label | null = null;

    protected onLoad(): void {
        this.button ??= this.node.getComponent(Button);
        this.titleLabel ??= this.node.getChildByName('Text')?.getComponent(Label) ?? null;
    }

    public setup(title: string): void {
        if (this.titleLabel) {
            this.titleLabel.string = title;
        }
    }
}

import {
    _decorator,
    Button,
    Component,
    EffectAsset,
    Label,
    Material,
    Node,
    resources,
    Sprite,
    UITransform,
    Vec4,
} from 'cc';

const { ccclass } = _decorator;

const EFFECT_PATH = 'effects/recruit-button-glow';
const AD_BUTTON_PATTERN = /广告|\bad\b/i;

let cachedEffect: EffectAsset | null = null;
let loadingEffect: Promise<EffectAsset | null> | null = null;

function loadEffect(): Promise<EffectAsset | null> {
    if (cachedEffect) {
        return Promise.resolve(cachedEffect);
    }
    if (loadingEffect) {
        return loadingEffect;
    }
    loadingEffect = new Promise((resolve) => {
        resources.load(EFFECT_PATH, EffectAsset, (error, effect) => {
            if (error || !effect) {
                console.warn('[GoldAdButtonGlow] Failed to load effect.', error);
                resolve(null);
                return;
            }
            cachedEffect = effect;
            resolve(effect);
        });
    });
    return loadingEffect;
}

function hasAdNamedNode(node: Node): boolean {
    if (AD_BUTTON_PATTERN.test(node.name)) {
        return true;
    }
    return node.children.some((child) => hasAdNamedNode(child));
}

function isAdButton(button: Button): boolean {
    let node: Node | null = button.node;
    while (node) {
        if (AD_BUTTON_PATTERN.test(node.name)) {
            return true;
        }
        node = node.parent;
    }
    if (hasAdNamedNode(button.node)) {
        return true;
    }
    return button.node
        .getComponentsInChildren(Label)
        .some((label) => AD_BUTTON_PATTERN.test(label.string));
}

@ccclass('GoldAdButtonGlow')
export class GoldAdButtonGlow extends Component {
    private button: Button | null = null;
    private sprite: Sprite | null = null;
    private originalMaterial: Material | null = null;
    private material: Material | null = null;
    private loading = false;
    private destroyed = false;

    public bind(button: Button): void {
        if (this.button === button) {
            return;
        }
        this.removeMaterial(true);
        this.button = button;
        this.sprite = button.target?.getComponent(Sprite)
            ?? button.node.getComponent(Sprite)
            ?? null;
    }

    protected update(): void {
        if (this.shouldGlow()) {
            this.applyMaterial();
        } else {
            this.removeMaterial(true);
        }
    }

    protected onDisable(): void {
        this.removeMaterial(true);
    }

    protected onDestroy(): void {
        this.destroyed = true;
        this.removeMaterial(false);
    }

    private shouldGlow(): boolean {
        return Boolean(
            this.button?.isValid
            && this.button.interactable
            && this.sprite?.isValid
            && this.sprite.spriteFrame,
        );
    }

    private applyMaterial(): void {
        if (this.material || this.loading || !this.sprite) {
            return;
        }
        this.loading = true;
        void loadEffect().then((effect) => {
            this.loading = false;
            if (this.destroyed || !effect || !this.shouldGlow() || !this.sprite) {
                return;
            }

            const transform = this.sprite.node.getComponent(UITransform);
            if (!transform) {
                return;
            }

            const material = new Material();
            material.initialize({
                effectAsset: effect,
                defines: {
                    IS_GRAY: false,
                    USE_TEXTURE: true,
                },
            });
            material.setProperty('shineColor', new Vec4(1, 201 / 255, 66 / 255, 1));
            material.setProperty(
                'spriteRect',
                new Vec4(
                    transform.width,
                    transform.height,
                    transform.anchorPoint.x,
                    transform.anchorPoint.y,
                ),
            );
            material.setProperty('sweepParams', new Vec4(0.16, 2.2, 0.18, 0.62));
            material.setProperty('pulseParams', new Vec4(0.08, 1.6, 0, 0));

            this.originalMaterial = this.sprite.customMaterial;
            this.material = material;
            this.sprite.customMaterial = material;
        });
    }

    private removeMaterial(restoreOriginal: boolean): void {
        if (
            restoreOriginal
            && this.sprite
            && this.sprite.isValid
            && this.material
            && this.sprite.customMaterial === this.material
        ) {
            this.sprite.customMaterial = this.originalMaterial;
        }
        this.material?.destroy();
        this.material = null;
        this.originalMaterial = null;
    }
}

export function installGoldAdButtonGlows(root: Node): number {
    const buttons = root.getComponentsInChildren(Button);
    const rootButton = root.getComponent(Button);
    if (rootButton) {
        buttons.push(rootButton);
    }

    let installedCount = 0;
    for (const button of buttons) {
        if (!button.isValid || !isAdButton(button)) {
            continue;
        }
        const glow = button.node.getComponent(GoldAdButtonGlow)
            ?? button.node.addComponent(GoldAdButtonGlow);
        glow.bind(button);
        installedCount += 1;
    }
    return installedCount;
}

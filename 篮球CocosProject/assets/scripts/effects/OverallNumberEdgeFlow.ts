import {
    _decorator,
    Color,
    Component,
    EffectAsset,
    Label,
    Material,
    Vec4,
    isValid,
    resources,
} from 'cc';

const { ccclass } = _decorator;
const EFFECT_PATH = 'effects/overall-number-edge-flow';

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
                console.warn('[OverallNumberEdgeFlow] Failed to load effect.', error);
                resolve(null);
                return;
            }
            cachedEffect = effect;
            resolve(effect);
        });
    });
    return loadingEffect;
}

/** 总评数字的常驻边缘流光：仅在字形内沿移动，不横扫整个数字。 */
@ccclass('OverallNumberEdgeFlow')
export class OverallNumberEdgeFlow extends Component {
    private label: Label | null = null;
    private material: Material | null = null;
    private originalMaterial: Material | null = null;
    private loadVersion = 0;
    private destroyed = false;
    private edgeColor: Color = new Color(255, 219, 89, 255);
    private glintColor: Color = new Color(255, 244, 208, 255);
    private flowParams: Vec4 = new Vec4(2.0, 0.32, 0.18, 0.95);
    private prismAmount = 0;

    protected onLoad(): void {
        this.label = this.node.getComponent(Label);
    }

    protected onEnable(): void {
        void this.applyMaterial();
    }

    protected onDisable(): void {
        this.loadVersion++;
        this.cleanupMaterial();
    }

    protected onDestroy(): void {
        this.destroyed = true;
        this.loadVersion++;
        // 场景卸载时 Label 的渲染实体可能已经释放，不能写 customMaterial。
        this.material?.destroy();
        this.material = null;
    }

    private async applyMaterial(): Promise<void> {
        this.label ??= this.node.getComponent(Label);
        if (!this.label || this.destroyed || !this.enabledInHierarchy) {
            return;
        }
        const version = ++this.loadVersion;
        this.cleanupMaterial();
        const effect = await loadEffect();
        if (
            this.destroyed
            || version !== this.loadVersion
            || !this.enabledInHierarchy
            || !this.label.isValid
            || !effect
        ) {
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
        this.originalMaterial = this.label.customMaterial;
        this.material = material;
        this.syncProperties();
        this.label.customMaterial = material;
    }

    /** 由品质预设设置边缘底色、扫过时高光和必要的彩色折射。 */
    public apply(
        edgeColor: Color,
        glintColor: Color,
        flowParams: Vec4,
        prismAmount: number,
    ): void {
        this.edgeColor = edgeColor.clone();
        this.glintColor = glintColor.clone();
        this.flowParams = flowParams.clone();
        this.prismAmount = prismAmount;
        this.syncProperties();
    }

    private syncProperties(): void {
        if (!this.material) {
            return;
        }
        this.material.setProperty('edgeColor', new Vec4(
            this.edgeColor.r / 255,
            this.edgeColor.g / 255,
            this.edgeColor.b / 255,
            this.edgeColor.a / 255,
        ));
        this.material.setProperty('glintColor', new Vec4(
            this.glintColor.r / 255,
            this.glintColor.g / 255,
            this.glintColor.b / 255,
            this.glintColor.a / 255,
        ));
        this.material.setProperty('flowParams', this.flowParams);
        this.material.setProperty('prismAmount', this.prismAmount);
    }

    private cleanupMaterial(): void {
        if (
            this.label
            && this.label.isValid
            && this.material
            && this.label.customMaterial === this.material
        ) {
            this.label.customMaterial = this.enabledInHierarchy
                && this.originalMaterial
                && isValid(this.originalMaterial, true)
                ? this.originalMaterial
                : null;
        }
        this.material?.destroy();
        this.material = null;
        this.originalMaterial = null;
    }
}

export function installOverallNumberEdgeFlow(label: Label | null): OverallNumberEdgeFlow | null {
    if (!label) {
        return null;
    }
    return label.node.getComponent(OverallNumberEdgeFlow)
        ?? label.node.addComponent(OverallNumberEdgeFlow);
}

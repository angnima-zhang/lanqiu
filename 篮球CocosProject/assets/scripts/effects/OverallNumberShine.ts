import {
    _decorator,
    Color,
    Component,
    EffectAsset,
    Label,
    Material,
    Tween,
    Vec3,
    Vec4,
    isValid,
    resources,
    tween,
} from 'cc';

const { ccclass } = _decorator;
const EFFECT_PATH = 'effects/overall-number-shine';

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
                console.warn('[OverallNumberShine] Failed to load effect.', error);
                resolve(null);
                return;
            }
            cachedEffect = effect;
            resolve(effect);
        });
    });
    return loadingEffect;
}

interface ImpactState {
    progress: number;
}

/** 招募总评的单次冲击亮起；结束后恢复原有的常驻浮雕材质。 */
@ccclass('OverallNumberImpact')
export class OverallNumberImpact extends Component {
    private label: Label | null = null;
    private material: Material | null = null;
    private originalMaterial: Material | null = null;
    private impactState: ImpactState | null = null;
    private originalScale: Vec3 | null = null;
    private loadVersion = 0;
    private destroyed = false;

    protected onLoad(): void {
        this.label = this.node.getComponent(Label);
    }

    protected onDisable(): void {
        this.loadVersion++;
        this.stopImpact();
        this.cleanupMaterial();
    }

    protected onDestroy(): void {
        this.destroyed = true;
        this.loadVersion++;
        this.stopImpact();
        // 场景卸载时 Label 的渲染实体可能已经释放，不能写 customMaterial。
        this.material?.destroy();
        this.material = null;
    }

    public trigger(impactColor: Color, impactIntensity: number): void {
        this.label ??= this.node.getComponent(Label);
        if (!this.label || !this.label.isValid || this.destroyed || !this.enabledInHierarchy) {
            return;
        }

        const version = ++this.loadVersion;
        this.stopImpact();
        this.cleanupMaterial();
        void this.playImpact(version, impactColor.clone(), impactIntensity);
    }

    private async playImpact(
        version: number,
        impactColor: Color,
        impactIntensity: number,
    ): Promise<void> {
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
        material.setProperty('impactColor', new Vec4(
            impactColor.r / 255,
            impactColor.g / 255,
            impactColor.b / 255,
            impactColor.a / 255,
        ));
        material.setProperty('impactParams', new Vec4(0, impactIntensity, 0, 0));
        this.originalMaterial = this.label.customMaterial;
        this.material = material;
        this.label.customMaterial = material;

        const originalScale = this.node.scale.clone();
        this.originalScale = originalScale;
        const state: ImpactState = { progress: 0 };
        this.impactState = state;
        const applyFrame = (): void => {
            if (!this.material || this.impactState !== state) {
                return;
            }
            const scale = 1 + 0.075 * Math.sin(Math.PI * state.progress);
            this.node.setScale(
                originalScale.x * scale,
                originalScale.y * scale,
                originalScale.z,
            );
            this.material.setProperty('impactParams', new Vec4(
                state.progress,
                impactIntensity,
                0,
                0,
            ));
        };
        applyFrame();
        tween(state)
            .to(0.52, { progress: 1 }, { easing: 'quadOut', onUpdate: applyFrame })
            .call(() => {
                if (this.impactState === state) {
                    this.stopImpact();
                    this.cleanupMaterial();
                }
            })
            .start();
    }

    private stopImpact(): void {
        if (this.impactState) {
            Tween.stopAllByTarget(this.impactState);
            this.impactState = null;
        }
        if (this.originalScale && this.node.isValid) {
            this.node.setScale(this.originalScale);
        }
        this.originalScale = null;
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

export function triggerOverallNumberImpact(
    label: Label | null,
    impactColor: Color = new Color(255, 209, 77, 255),
    impactIntensity = 0.78,
): void {
    if (!label) {
        return;
    }
    const impact = label.node.getComponent(OverallNumberImpact)
        ?? label.node.addComponent(OverallNumberImpact);
    impact.trigger(impactColor, impactIntensity);
}

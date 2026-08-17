import { Component, Color, EffectAsset, Material, Sprite, Vec4, resources, _decorator } from 'cc';

const { ccclass } = _decorator;

export type QualityFrameShaderKind = 'metal' | 'crystal' | 'lightning' | 'conceptGod';

const EFFECT_PATHS: Readonly<Record<QualityFrameShaderKind, string>> = {
    metal: 'effects/quality-metal-frame',
    crystal: 'effects/quality-crystal-frame',
    lightning: 'effects/frame-lightning',
    conceptGod: 'effects/concept-god-frame',
};

const loadedEffects = new Map<string, EffectAsset>();
const loadingEffects = new Map<string, Promise<EffectAsset | null>>();

function loadEffect(path: string): Promise<EffectAsset | null> {
    const cached = loadedEffects.get(path);
    if (cached) {
        return Promise.resolve(cached);
    }
    const pending = loadingEffects.get(path);
    if (pending) {
        return pending;
    }
    const request = new Promise<EffectAsset | null>((resolve) => {
        resources.load(path, EffectAsset, (error, effect) => {
            loadingEffects.delete(path);
            if (error || !effect) {
                console.warn('[QualityFrameShader] Failed to load effect.', path, error);
                resolve(null);
                return;
            }
            loadedEffects.set(path, effect);
            resolve(effect);
        });
    });
    loadingEffects.set(path, request);
    return request;
}

function colorToVec4(color: Color): Vec4 {
    return new Vec4(color.r / 255, color.g / 255, color.b / 255, color.a / 255);
}

/** 根据品质为头像框设置独立的轻量材质。 */
@ccclass('QualityFrameShader')
export class QualityFrameShader extends Component {
    private sprite: Sprite | null = null;
    private material: Material | null = null;
    private requestVersion = 0;
    private destroyed = false;

    protected onLoad(): void {
        this.sprite = this.node.getComponent(Sprite);
    }

    protected onDisable(): void {
        this.requestVersion++;
        this.clearMaterial();
    }

    protected onDestroy(): void {
        this.destroyed = true;
        this.requestVersion++;
        // 场景销毁时 Sprite 渲染实体可能已先释放，不能在这里写 customMaterial。
        this.material?.destroy();
        this.material = null;
    }

    public apply(
        kind: QualityFrameShaderKind,
        primary: Color,
        secondary: Color,
        params: Vec4,
    ): void {
        this.sprite ??= this.node.getComponent(Sprite);
        if (!this.sprite) {
            return;
        }

        const version = ++this.requestVersion;
        this.clearMaterial();
        void loadEffect(EFFECT_PATHS[kind]).then((effect) => {
            if (
                this.destroyed
                || version !== this.requestVersion
                || !effect
                || !this.sprite?.isValid
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
            this.applyProperties(material, kind, primary, secondary, params);
            this.material = material;
            this.sprite.customMaterial = material;
        });
    }

    public getMaterial(): Material | null {
        return this.material;
    }

    private applyProperties(
        material: Material,
        kind: QualityFrameShaderKind,
        primary: Color,
        secondary: Color,
        params: Vec4,
    ): void {
        if (kind === 'metal') {
            material.setProperty('baseTint', colorToVec4(primary));
            material.setProperty('shineTint', colorToVec4(secondary));
        } else if (kind === 'crystal') {
            material.setProperty('crystalTint', colorToVec4(primary));
            material.setProperty('glintColor', colorToVec4(secondary));
        } else if (kind === 'lightning') {
            material.setProperty('boltColor', colorToVec4(primary));
            material.setProperty('glowColor', colorToVec4(secondary));
        } else {
            material.setProperty('goldColor', colorToVec4(primary));
            material.setProperty('glintColor', colorToVec4(secondary));
        }
        material.setProperty('params', params);
    }

    private clearMaterial(): void {
        if (
            this.sprite
            && this.sprite.isValid
            && this.material
            && this.sprite.customMaterial === this.material
        ) {
            this.sprite.customMaterial = null;
        }
        this.material?.destroy();
        this.material = null;
    }
}

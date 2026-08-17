import { _decorator, Component, Sprite, Material, EffectAsset, Color, Vec4, resources } from 'cc';

const { ccclass, property } = _decorator;

const EFFECT_PATH = 'effects/flame-frame';

// ---- Shared loader (singleton) ----

let _effectAsset: EffectAsset | null = null;
let _loadPromise: Promise<EffectAsset | null> | null = null;

function loadEffect(): Promise<EffectAsset | null> {
    if (_effectAsset) return Promise.resolve(_effectAsset);
    if (_loadPromise) return _loadPromise;

    _loadPromise = new Promise((resolve) => {
        resources.load(EFFECT_PATH, EffectAsset, (error, asset) => {
            if (error || !asset) {
                console.error('[FlameFrame] Failed to load effect.', error);
                resolve(null);
                return;
            }
            _effectAsset = asset;
            resolve(asset);
        });
    });

    return _loadPromise;
}

/**
 * 常驻火焰边框组件
 * 挂在 Sprite 节点上，在精灵边缘生成持续的火焰动画效果。
 * 火焰仅在透明区域（精灵边界外）显示，通过噪声模拟 flicker 和火舌形状。
 *
 * 注意：一个 Sprite 只能有一个 customMaterial。
 * 如需同时使用边缘发光，应选择一个效果，或后续合并 shader。
 */
@ccclass('FlameFrame')
export class FlameFrame extends Component {

    @property({ type: Color, tooltip: '火焰内层颜色（根部，明亮区）' })
    flameColorInner: Color = new Color(255, 242, 51, 255);  // 亮黄

    @property({ type: Color, tooltip: '火焰外层颜色（尖端，暗红区）' })
    flameColorOuter: Color = new Color(255, 64, 0, 255);     // 红橙

    @property({ tooltip: '火焰高度 (1 ~ 20)', slide: true, range: [1, 20, 0.5] })
    flameHeight: number = 6.0;

    @property({ tooltip: '火焰亮度强度 (0.2 ~ 4)', slide: true, range: [0.2, 4, 0.1] })
    flameIntensity: number = 1.5;

    @property({ tooltip: '火焰动画速度 (0.2 ~ 5)', slide: true, range: [0.2, 5, 0.1] })
    flameSpeed: number = 1.2;

    @property({ tooltip: '火焰细节密度 (3 ~ 20)，越高火舌越细碎', slide: true, range: [3, 20, 0.5] })
    flameDetail: number = 8.0;

    private _material: Material | null = null;
    private _sprite: Sprite | null = null;
    private _applied: boolean = false;

    async onLoad(): Promise<void> {
        this._sprite = this.node.getComponent(Sprite);
        if (!this._sprite) {
            console.warn('[FlameFrame] Node has no Sprite component.');
            return;
        }

        const effect = await loadEffect();
        if (!effect) {
            console.warn('[FlameFrame] Effect not found.');
            return;
        }

        this._material = new Material();
        this._material.initialize({
            effectAsset: effect,
            defines: { USE_TEXTURE: true },
        });

        this._sprite.customMaterial = this._material;
        this._applied = true;

        this.syncToMaterial();
    }

    onDestroy(): void {
        if (this._sprite && this._applied) {
            this._sprite.customMaterial = null;
        }
        if (this._material) {
            this._material.destroy();
            this._material = null;
        }
        this._applied = false;
    }

    /**
     * 将所有属性同步到材质 uniform
     */
    syncToMaterial(): void {
        if (!this._material) return;

        const ci = this.flameColorInner;
        const co = this.flameColorOuter;

        this._material.setProperty('flameColorInner', new Vec4(
            ci.r / 255.0, ci.g / 255.0, ci.b / 255.0, ci.a / 255.0,
        ));
        this._material.setProperty('flameColorOuter', new Vec4(
            co.r / 255.0, co.g / 255.0, co.b / 255.0, co.a / 255.0,
        ));
        this._material.setProperty('params', new Vec4(
            this.flameHeight,
            this.flameIntensity,
            this.flameSpeed,
            this.flameDetail,
        ));
    }

    // ---- 运行时调节接口 ----

    /** 设置火焰内层颜色 (0-255) */
    setInnerColor(r: number, g: number, b: number, a: number = 255): void {
        this.flameColorInner = new Color(r, g, b, a);
        this.syncToMaterial();
    }

    /** 设置火焰外层颜色 */
    setOuterColor(r: number, g: number, b: number, a: number = 255): void {
        this.flameColorOuter = new Color(r, g, b, a);
        this.syncToMaterial();
    }

    /** 设置火焰高度 */
    setFlameHeight(value: number): void {
        this.flameHeight = value;
        this.syncToMaterial();
    }

    /** 设置火焰强度 */
    setIntensity(value: number): void {
        this.flameIntensity = value;
        this.syncToMaterial();
    }

    /** 设置动画速度 */
    setSpeed(value: number): void {
        this.flameSpeed = value;
        this.syncToMaterial();
    }

    /** 设置细节密度 */
    setDetail(value: number): void {
        this.flameDetail = value;
        this.syncToMaterial();
    }

    /** 获取当前材质 (用于外部直接操作) */
    getMaterial(): Material | null {
        return this._material;
    }
}

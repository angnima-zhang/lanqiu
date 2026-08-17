import { _decorator, Component, Sprite, Material, EffectAsset, Color, Vec4, resources } from 'cc';

const { ccclass, property } = _decorator;

const EFFECT_PATH = 'effects/edge-luminescence';

// ---- Shared loader (singleton) ----

let _effectAsset: EffectAsset | null = null;
let _loadPromise: Promise<EffectAsset | null> | null = null;

function loadEffect(): Promise<EffectAsset | null> {
    if (_effectAsset) return Promise.resolve(_effectAsset);
    if (_loadPromise) return _loadPromise;

    _loadPromise = new Promise((resolve) => {
        resources.load(EFFECT_PATH, EffectAsset, (error, asset) => {
            if (error || !asset) {
                console.error('[EdgeLuminescence] Failed to load effect.', error);
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
 * 边缘发光组件
 * 挂在 Sprite 节点上，自动加载 edge-luminescence effect 并创建 Material。
 * 支持运行时调节发光颜色、宽度、强度和脉冲速度。
 */
@ccclass('EdgeLuminescence')
export class EdgeLuminescence extends Component {

    @property({ type: Color, tooltip: '边缘发光颜色' })
    edgeColor: Color = new Color(255, 214, 0, 255);  // 默认金色

    @property({ tooltip: '边缘宽度 (0.5 ~ 15)', slide: true, range: [0.5, 15, 0.5] })
    edgeWidth: number = 3.0;

    @property({ tooltip: '发光强度 (0 ~ 5)', slide: true, range: [0, 5, 0.1] })
    intensity: number = 1.2;

    @property({ tooltip: '脉冲呼吸速度 (0 = 不脉冲)', slide: true, range: [0, 8, 0.1] })
    pulseSpeed: number = 0.0;

    private _material: Material | null = null;
    private _sprite: Sprite | null = null;
    private _applied: boolean = false;

    async onLoad(): Promise<void> {
        this._sprite = this.node.getComponent(Sprite);
        if (!this._sprite) {
            console.warn('[EdgeLuminescence] Node has no Sprite component.');
            return;
        }

        const effect = await loadEffect();
        if (!effect) {
            console.warn('[EdgeLuminescence] Effect not found.');
            return;
        }

        this._material = new Material();
        this._material.initialize({
            effectAsset: effect,
            defines: { USE_TEXTURE: true },
        });

        this._sprite.customMaterial = this._material;
        this._applied = true;

        // 同步初始属性到材质
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

        const c = this.edgeColor;
        this._material.setProperty('edgeColor', new Vec4(
            c.r / 255.0,
            c.g / 255.0,
            c.b / 255.0,
            c.a / 255.0,
        ));
        this._material.setProperty('params', new Vec4(
            this.edgeWidth,
            this.intensity,
            this.pulseSpeed,
            0.0,
        ));
    }

    // ---- 运行时调节接口 ----

    /** 设置边缘颜色 (0-255) */
    setEdgeColor(r: number, g: number, b: number, a: number = 255): void {
        this.edgeColor = new Color(r, g, b, a);
        this.syncToMaterial();
    }

    /** 设置边缘宽度 */
    setEdgeWidth(value: number): void {
        this.edgeWidth = value;
        this.syncToMaterial();
    }

    /** 设置发光强度 */
    setIntensity(value: number): void {
        this.intensity = value;
        this.syncToMaterial();
    }

    /** 设置脉冲速度 */
    setPulseSpeed(value: number): void {
        this.pulseSpeed = value;
        this.syncToMaterial();
    }

    /** 获取当前材质 (用于外部直接操作) */
    getMaterial(): Material | null {
        return this._material;
    }
}

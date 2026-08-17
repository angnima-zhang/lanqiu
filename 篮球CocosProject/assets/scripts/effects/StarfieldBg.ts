import { _decorator, Component, Sprite, Material, EffectAsset, Color, Vec4, UITransform, resources } from 'cc';

const { ccclass, property } = _decorator;
const EFFECT_PATH = 'effects/starfield-2';

let _effectAsset: EffectAsset | null = null;
let _loadPromise: Promise<EffectAsset | null> | null = null;

function loadEffect(): Promise<EffectAsset | null> {
    if (_effectAsset) return Promise.resolve(_effectAsset);
    if (_loadPromise) return _loadPromise;
    _loadPromise = new Promise((resolve) => {
        resources.load(EFFECT_PATH, EffectAsset, (error, asset) => {
            if (error || !asset) { console.error('[StarfieldBg] Effect load failed.', error); resolve(null); return; }
            _effectAsset = asset; resolve(asset);
        });
    });
    return _loadPromise;
}

/** 星场背景组件 — 光线步进分形星场，挂在 bg 节点上自动渲染 */
@ccclass('StarfieldBg')
export class StarfieldBg extends Component {

    // ---- 星场参数 ----
    @property({ tooltip: '动画速度 -5~5', slide: true, range: [-5, 5, 0.1] })
    animSpeed: number = 0.0;

    @property({ tooltip: '星星亮度 0~0.5', slide: true, range: [0, 0.5, 0.01] })
    starBrightness: number = 0.05;

    @property({ tooltip: '星尘浓度 0~0.25', slide: true, range: [0, 0.25, 0.01] })
    dust: number = 0.125;

    @property({ tooltip: '深度衰减 0~1', slide: true, range: [0, 1, 0.01] })
    distFade: number = 0.35;

    // ---- 后期效果 ----
    @property({ tooltip: '像素化 50~1000, 1000=关闭', slide: true, range: [50, 1000, 10] })
    pixelation: number = 1000;

    @property({ tooltip: '颜色量化 1~256, 256=关闭', slide: true, range: [1, 256, 1] })
    quantizationLevels: number = 256;

    @property({ tooltip: '饱和度 0~1', slide: true, range: [0, 1, 0.01] })
    saturation: number = 1.0;

    @property({ tooltip: '层数 1~9', slide: true, range: [1, 9, 1] })
    layers: number = 4;

    // ---- 颜色 ----
    @property({ type: Color, tooltip: '星尘颜色' })
    dustColor: Color = new Color(0, 55, 75, 255);

    @property({ tooltip: '星空覆盖强度 0~1', slide: true, range: [0, 1, 0.01] })
    mixFactor: number = 0.6;

    private _material: Material | null = null;
    private _sprite: Sprite | null = null;
    private _destroyed: boolean = false;

    onLoad(): void {
        this._sprite = this.node.getComponent(Sprite);
        if (!this._sprite) {
            console.warn('[StarfieldBg] 未找到 Sprite 组件。');
        }
    }

    async start(): Promise<void> {
        if (!this._sprite) return;

        const effect = await loadEffect();
        if (this._destroyed || !effect) return;

        this.cleanupMaterial();
        this._material = new Material();
        this._material.initialize({ effectAsset: effect, defines: { USE_TEXTURE: true } });

        this.syncParams();

        const transform = this.node.getComponent(UITransform);
        if (transform) {
            this._material.setProperty('nodeSize', new Vec4(
                Math.max(transform.width, 1),
                Math.max(transform.height, 1),
                this.mixFactor,
                0,
            ));
        }

        this._sprite.customMaterial = this._material;
    }

    onEnable(): void {
        if (this._sprite && this._material) {
            this._sprite.customMaterial = this._material;
        }
    }

    onDisable(): void {
        this.cleanupMaterial();
    }

    onDestroy(): void {
        this._destroyed = true;
        if (this._material) {
            this._material.destroy();
            this._material = null;
        }
    }

    private syncParams(): void {
        if (!this._material) return;
        const dc = this.dustColor;
        this._material.setProperty('starParams', new Vec4(
            this.animSpeed, this.starBrightness, this.dust, this.distFade,
        ));
        this._material.setProperty('retroParams', new Vec4(
            this.pixelation, this.quantizationLevels, this.saturation, this.layers,
        ));
        this._material.setProperty('dustColor', new Vec4(
            dc.r / 255, dc.g / 255, dc.b / 255, 1.0,
        ));
    }

    private cleanupMaterial(): void {
        if (this._sprite && this._material && this._sprite.isValid && this._sprite.customMaterial === this._material) {
            this._sprite.customMaterial = null;
        }
        if (this._material) {
            this._material.destroy();
            this._material = null;
        }
    }
}

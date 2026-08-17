import { _decorator, Component, Sprite, Material, EffectAsset, Texture2D, Color, Vec4, UITransform, resources } from 'cc';

const { ccclass, property } = _decorator;
const EFFECT_PATH = 'effects/starry-night-bg';

let _effectAsset: EffectAsset | null = null;
let _loadPromise: Promise<EffectAsset | null> | null = null;

function loadEffect(): Promise<EffectAsset | null> {
    if (_effectAsset) return Promise.resolve(_effectAsset);
    if (_loadPromise) return _loadPromise;
    _loadPromise = new Promise((resolve) => {
        resources.load(EFFECT_PATH, EffectAsset, (error, asset) => {
            if (error || !asset) { console.error('[StarryNightBg] Effect load failed.', error); resolve(null); return; }
            _effectAsset = asset; resolve(asset);
        });
    });
    return _loadPromise;
}

/** 星月夜星空背景组件 — 挂在 bg 节点上自动渲染程序化星空 */
@ccclass('StarryNightBg')
export class StarryNightBg extends Component {

    // ---- 主星 ----
    @property({ tooltip: '主星层数 1~10', slide: true, range: [1, 10, 1] })
    starIterations: number = 3;

    @property({ tooltip: '主星基准大小 10~200', slide: true, range: [10, 200, 10] })
    sizeStar: number = 100;

    @property({ tooltip: '主星密度 0~1, 越大越多', slide: true, range: [0, 1, 0.01] })
    frequencyStar: number = 0.1;

    @property({ tooltip: '主星亮度 1~5', slide: true, range: [1, 5, 0.1] })
    brightnessStar: number = 3.0;

    @property({ tooltip: '主星闪烁频率 1~20', slide: true, range: [1, 20, 0.5] })
    shineFrequencyStar: number = 8.0;

    @property({ tooltip: '主星透明度 0~1', slide: true, range: [0, 1, 0.01] })
    transparencyStar: number = 0.0;

    @property({ tooltip: '水平漂移速度 -2~2', slide: true, range: [-2, 2, 0.01] })
    horizontalMovement: number = 0.1;

    @property({ tooltip: '垂直漂移速度 -2~2', slide: true, range: [-2, 2, 0.01] })
    verticalMovement: number = 0.1;

    // ---- 背景星 ----
    @property({ tooltip: '背景星密度 0.95~1, 越接近1越稀疏', slide: true, range: [0.95, 1, 0.001] })
    frequencyBgStar: number = 0.996;

    @property({ tooltip: '背景星闪烁频率 0~5', slide: true, range: [0, 5, 0.1] })
    shineFreqBgStar: number = 1.0;

    @property({ tooltip: '背景星透明度 0~1', slide: true, range: [0, 1, 0.01] })
    transparencyBgStar: number = 0.0;

    // ---- 天色 ----
    @property({ type: Color, tooltip: '夜空底色 + 透明度控制星空浓度' })
    colorBackground: Color = new Color(13, 10, 51, 255);

    @property({ tooltip: '噪声种子 0~100', slide: true, range: [0, 100, 0.1] })
    seed: number = 0.0;

    // ---- 可选渐变色贴图（留空则用白色） ----
    @property({ type: Texture2D, tooltip: '主星渐变色贴图（可选，256×1 横向渐变）' })
    gradientA: Texture2D | null = null;

    @property({ type: Texture2D, tooltip: '背景星渐变色贴图（可选，256×1 横向渐变）' })
    gradientB: Texture2D | null = null;

    private _material: Material | null = null;
    private _sprite: Sprite | null = null;
    private _destroyed: boolean = false;

    onLoad(): void {
        this._sprite = this.node.getComponent(Sprite);
        if (!this._sprite) {
            console.warn('[StarryNightBg] 未找到 Sprite 组件。');
        }
    }

    async start(): Promise<void> {
        if (!this._sprite) return;

        const effect = await loadEffect();
        if (this._destroyed || !effect) return;

        this.cleanupMaterial();
        this._material = new Material();
        this._material.initialize({ effectAsset: effect, defines: { USE_TEXTURE: true } });

        if (this.gradientA) this._material.setProperty('gradientA', this.gradientA);
        if (this.gradientB) this._material.setProperty('gradientB', this.gradientB);

        this.syncParams();

        const transform = this.node.getComponent(UITransform);
        if (transform) {
            this._material.setProperty('nodeSize', new Vec4(
                Math.max(transform.width, 1),
                Math.max(transform.height, 1),
                0, 0,
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
        const cb = this.colorBackground;
        this._material.setProperty('starParams', new Vec4(
            this.starIterations, this.sizeStar, this.frequencyStar, this.brightnessStar,
        ));
        this._material.setProperty('shineParams', new Vec4(
            this.shineFrequencyStar, this.transparencyStar, this.horizontalMovement, this.verticalMovement,
        ));
        this._material.setProperty('bgStarParams', new Vec4(
            this.frequencyBgStar, this.shineFreqBgStar, this.transparencyBgStar, this.seed,
        ));
        this._material.setProperty('colorBackground', new Vec4(
            cb.r / 255, cb.g / 255, cb.b / 255, cb.a / 255,
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

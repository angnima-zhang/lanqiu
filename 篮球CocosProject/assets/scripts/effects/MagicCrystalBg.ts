import { _decorator, Component, Sprite, Material, EffectAsset, Color, Vec4, resources } from 'cc';

const { ccclass, property } = _decorator;
const EFFECT_PATH = 'effects/magic-crystal';

let _effectAsset: EffectAsset | null = null;
let _loadPromise: Promise<EffectAsset | null> | null = null;

function loadEffect(): Promise<EffectAsset | null> {
    if (_effectAsset) return Promise.resolve(_effectAsset);
    if (_loadPromise) return _loadPromise;
    _loadPromise = new Promise((resolve) => {
        resources.load(EFFECT_PATH, EffectAsset, (error, asset) => {
            if (error || !asset) { console.error('[MagicCrystalBg] Effect load failed.', error); resolve(null); return; }
            _effectAsset = asset; resolve(asset);
        });
    });
    return _loadPromise;
}

/** 魔法水晶背景组件 — 双色流动 + 白色分界线 + 边缘光 */
@ccclass('MagicCrystalBg')
export class MagicCrystalBg extends Component {

    @property({ tooltip: '流动速度 0~2', slide: true, range: [0, 2, 0.1] })
    speed: number = 1.0;

    @property({ tooltip: '噪波缩放 1~10', slide: true, range: [1, 10, 0.5] })
    noiseScale: number = 3.0;

    @property({ tooltip: '色带分界线浓度 0~1', slide: true, range: [0, 1, 0.01] })
    bandWidth: number = 0.5;

    @property({ tooltip: '边缘光强度 0~1', slide: true, range: [0, 1, 0.01] })
    rimStrength: number = 0.5;

    @property({ type: Color, tooltip: '颜色1' })
    color1: Color = new Color(26, 77, 204, 255);

    @property({ type: Color, tooltip: '颜色2' })
    color2: Color = new Color(204, 51, 153, 255);

    @property({ tooltip: '覆盖强度 0~1', slide: true, range: [0, 1, 0.01] })
    mixFactor: number = 0.6;

    private _material: Material | null = null;
    private _sprite: Sprite | null = null;
    private _destroyed: boolean = false;

    onLoad(): void {
        this._sprite = this.node.getComponent(Sprite);
        if (!this._sprite) {
            console.warn('[MagicCrystalBg] 未找到 Sprite 组件。');
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
        const c1 = this.color1;
        const c2 = this.color2;
        this._material.setProperty('params', new Vec4(this.speed, this.noiseScale, this.bandWidth, this.rimStrength));
        this._material.setProperty('color1', new Vec4(c1.r / 255, c1.g / 255, c1.b / 255, c1.a / 255));
        this._material.setProperty('color2', new Vec4(c2.r / 255, c2.g / 255, c2.b / 255, c2.a / 255));
        this._material.setProperty('params2', new Vec4(this.mixFactor, 0, 0, 0));
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

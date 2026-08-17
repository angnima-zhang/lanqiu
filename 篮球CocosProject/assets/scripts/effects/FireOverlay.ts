import { _decorator, Component, Sprite, Material, EffectAsset, Color, Vec4, resources } from 'cc';

const { ccclass, property } = _decorator;

const EFFECT_PATH = 'effects/fire-overlay';

let _effectAsset: EffectAsset | null = null;
let _loadPromise: Promise<EffectAsset | null> | null = null;

function loadEffect(): Promise<EffectAsset | null> {
    if (_effectAsset) return Promise.resolve(_effectAsset);
    if (_loadPromise) return _loadPromise;
    _loadPromise = new Promise((resolve) => {
        resources.load(EFFECT_PATH, EffectAsset, (error, asset) => {
            if (error || !asset) { console.error('[FireOverlay] load failed.', error); resolve(null); return; }
            _effectAsset = asset; resolve(asset);
        });
    });
    return _loadPromise;
}

/** 火焰覆盖组件 — 在整个精灵图片上叠加燃烧火焰效果 */
@ccclass('FireOverlay')
export class FireOverlay extends Component {

    @property({ type: Color, tooltip: '火焰内层颜色（高温区）' })
    fireColorInner: Color = new Color(255, 230, 25, 255);

    @property({ type: Color, tooltip: '火焰外层颜色（低温区）' })
    fireColorOuter: Color = new Color(255, 50, 0, 255);

    @property({ tooltip: '火焰强度 (0 ~ 3)', slide: true, range: [0, 3, 0.1] })
    fireIntensity: number = 1.2;

    @property({ tooltip: '动画速度 (0.2 ~ 5)', slide: true, range: [0.2, 5, 0.1] })
    fireSpeed: number = 1.5;

    @property({ tooltip: '火焰细节密度 (3 ~ 25)', slide: true, range: [3, 25, 0.5] })
    fireDetail: number = 10.0;

    @property({ tooltip: '热浪扭曲强度 (0 ~ 1)', slide: true, range: [0, 1, 0.05] })
    distortion: number = 0.3;

    private _material: Material | null = null;
    private _sprite: Sprite | null = null;
    private _applied: boolean = false;

    async onLoad(): Promise<void> {
        this._sprite = this.node.getComponent(Sprite);
        if (!this._sprite) { console.warn('[FireOverlay] No Sprite.'); return; }

        const effect = await loadEffect();
        if (!effect) { console.warn('[FireOverlay] Effect not found.'); return; }

        this._material = new Material();
        this._material.initialize({ effectAsset: effect, defines: { USE_TEXTURE: true } });
        this._sprite.customMaterial = this._material;
        this._applied = true;
        this.syncToMaterial();
    }

    onDestroy(): void {
        if (this._sprite && this._applied) this._sprite.customMaterial = null;
        if (this._material) { this._material.destroy(); this._material = null; }
        this._applied = false;
    }

    syncToMaterial(): void {
        if (!this._material) return;
        const ci = this.fireColorInner, co = this.fireColorOuter;
        this._material.setProperty('fireColorInner', new Vec4(ci.r / 255, ci.g / 255, ci.b / 255, ci.a / 255));
        this._material.setProperty('fireColorOuter', new Vec4(co.r / 255, co.g / 255, co.b / 255, co.a / 255));
        this._material.setProperty('params', new Vec4(this.fireIntensity, this.fireSpeed, this.fireDetail, this.distortion));
    }

    setIntensity(v: number) { this.fireIntensity = v; this.syncToMaterial(); }
    setSpeed(v: number) { this.fireSpeed = v; this.syncToMaterial(); }
    setDetail(v: number) { this.fireDetail = v; this.syncToMaterial(); }
    setDistortion(v: number) { this.distortion = v; this.syncToMaterial(); }
    getMaterial(): Material | null { return this._material; }
}

import { _decorator, Color, Component, Sprite, Material, EffectAsset, Vec2, Vec4, UITransform, resources } from 'cc';

const { ccclass, property } = _decorator;

const EFFECT_PATH = 'effects/universe-within';

let _effectAsset: EffectAsset | null = null;
let _loadPromise: Promise<EffectAsset | null> | null = null;

function loadEffect(): Promise<EffectAsset | null> {
    if (_effectAsset) return Promise.resolve(_effectAsset);
    if (_loadPromise) return _loadPromise;
    _loadPromise = new Promise((resolve) => {
        resources.load(EFFECT_PATH, EffectAsset, (error, asset) => {
            if (error || !asset) { console.error('[UniverseWithin] load failed.', error); resolve(null); return; }
            _effectAsset = asset; resolve(asset);
        });
    });
    return _loadPromise;
}

/**
 * 宇宙之心 (The Universe Within) 背景效果
 *
 * 适配自 ShaderToy 经典作品 (Martijn Steinrucken / BigWings 2018)
 * 4 层动态网格连线 + 星光粒子脉冲 + 旋转视差 + 暗角遮罩
 *
 * 适用于头像背景、卡片背景等中小尺寸 Sprite 节点。
 * 效果叠加在原图之上 (mix ratio 60%)，原图提供底色和形状。
 */
@ccclass('UniverseWithin')
export class UniverseWithin extends Component {

    @property({ tooltip: '是否自动从 UITransform 同步分辨率' })
    autoResolution: boolean = true;

    @property({ tooltip: '手动分辨率 (autoResolution=false 时生效)' })
    manualResolution: Vec2 = new Vec2(584, 571);

    @property({ tooltip: '旋转速度 (0.02 ~ 0.5)', slide: true, range: [0.02, 0.5, 0.01] })
    rotationSpeed: number = 0.1;

    @property({ tooltip: '底部光晕强度 (0 ~ 5)', slide: true, range: [0, 5, 0.1] })
    glowIntensity: number = 2.0;

    @property({ tooltip: '宇宙叠加透明度 (0 ~ 1), 0=纯原图', slide: true, range: [0, 1, 0.05] })
    blendStrength: number = 0.6;

    @property({ tooltip: '星光粒子亮度 (0 ~ 3)', slide: true, range: [0, 3, 0.1] })
    sparkleBoost: number = 1.0;

    @property({ type: Color, tooltip: '品质背景的主色' })
    paletteBase: Color = new Color(72, 144, 216, 255);

    @property({ type: Color, tooltip: '品质背景的高光色' })
    paletteAccent: Color = new Color(208, 240, 255, 255);

    @property({ tooltip: '彩色折射比例，仅欧泊与概念神使用', slide: true, range: [0, 1, 0.05] })
    palettePrism: number = 0;

    private _material: Material | null = null;
    private _sprite: Sprite | null = null;
    private _applied: boolean = false;
    private _destroyed: boolean = false;

    async onLoad(): Promise<void> {
        this._sprite = this.node.getComponent(Sprite);
        if (!this._sprite) { console.warn('[UniverseWithin] No Sprite.'); return; }

        const effect = await loadEffect();
        if (this._destroyed || !effect) {
            if (!effect) console.warn('[UniverseWithin] Effect not found.');
            return;
        }

        this._material = new Material();
        this._material.initialize({ effectAsset: effect, defines: { USE_TEXTURE: true } });

        this._sprite.customMaterial = this._material;
        this._applied = true;
        this.syncResolution();
        this.syncTune();
        this.syncPalette();
    }

    onDestroy(): void {
        this._destroyed = true;
        // 不要在 onDestroy 中写 customMaterial=null。Creator 3.8.7 在场景卸载时
        // 可能已经释放 Sprite 的渲染实体，从而触发 setSharedMaterial 的空引用异常。
        if (this._material) { this._material.destroy(); this._material = null; }
        this._applied = false;
    }

    /**
     * 同步精灵尺寸到 shader resolution uniform
     */
    syncResolution(): void {
        if (!this._material) return;
        const transform = this.node.getComponent(UITransform);
        if (!transform) return;
        const resolution = this.autoResolution
            ? new Vec2(transform.contentSize.width, transform.contentSize.height)
            : this.manualResolution;
        this._material.setProperty('resolution', resolution);
    }

    /** 手动设置分辨率 */
    setResolution(w: number, h: number): void {
        this.manualResolution = new Vec2(w, h);
        this.syncResolution();
    }

    /**
     * 同步所有调参到 shader tune uniform
     */
    syncTune(): void {
        if (!this._material) return;
        this._material.setProperty('tune', new Vec4(
            this.rotationSpeed,
            this.glowIntensity,
            this.blendStrength,
            this.sparkleBoost,
        ));
    }

    /** 设置由品质 UI 驱动的主色、高光色和少量彩色折射。 */
    setPalette(base: Color, accent: Color, prism: number): void {
        this.paletteBase = base.clone();
        this.paletteAccent = accent.clone();
        this.palettePrism = prism;
        this.syncPalette();
    }

    syncPalette(): void {
        if (!this._material) return;
        this._material.setProperty('paletteBase', new Vec4(
            this.paletteBase.r / 255,
            this.paletteBase.g / 255,
            this.paletteBase.b / 255,
            this.paletteBase.a / 255,
        ));
        this._material.setProperty('paletteAccent', new Vec4(
            this.paletteAccent.r / 255,
            this.paletteAccent.g / 255,
            this.paletteAccent.b / 255,
            this.paletteAccent.a / 255,
        ));
        this._material.setProperty('palettePrism', this.palettePrism);
    }

    getMaterial(): Material | null { return this._material; }
}

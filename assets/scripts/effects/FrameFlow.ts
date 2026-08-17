import { _decorator, Component, Sprite, Material, EffectAsset, Color, Vec4, resources } from 'cc';

const { ccclass, property } = _decorator;
const EFFECT_PATH = 'effects/frame-flow';

let _effectAsset: EffectAsset | null = null;
let _loadPromise: Promise<EffectAsset | null> | null = null;

function loadEffect(): Promise<EffectAsset | null> {
    if (_effectAsset) return Promise.resolve(_effectAsset);
    if (_loadPromise) return _loadPromise;
    _loadPromise = new Promise((resolve) => {
        resources.load(EFFECT_PATH, EffectAsset, (error, asset) => {
            if (error || !asset) { console.error('[FrameFlow] load failed.', error); resolve(null); return; }
            _effectAsset = asset; resolve(asset);
        });
    });
    return _loadPromise;
}

/** 头像框流光组件 — 高光沿边框旋转扫过 */
@ccclass('FrameFlow')
export class FrameFlow extends Component {

    @property({ type: Color, tooltip: '流光颜色' })
    lightColor: Color = new Color(255, 230, 102, 255);

    @property({ tooltip: '流光强度 (0 ~ 3)', slide: true, range: [0, 3, 0.1] })
    lightStrength: number = 1.0;

    @property({ tooltip: '旋转速度 (0.1 ~ 5)', slide: true, range: [0.1, 5, 0.1] })
    rotationSpeed: number = 1.0;

    @property({ tooltip: '光束宽度 (1 ~ 8), 越大越窄', slide: true, range: [1, 8, 0.5] })
    lightWidth: number = 3.0;

    private _material: Material | null = null;
    private _sprite: Sprite | null = null;
    private _destroyed: boolean = false;
    private _loadVersion: number = 0;

    async onLoad(): Promise<void> {
        this._sprite = this.node.getComponent(Sprite);
        if (!this._sprite) { console.warn('[FrameFlow] No Sprite.'); return; }
        await this.applyMaterial();
    }

    onEnable(): void {
        // 节点 active=false→true 时重建材质（GPU 资源可能在 deactivate 时被回收）
        if (this._sprite) {
            this.applyMaterial();
        }
    }

    onDisable(): void {
        // 释放 GPU 资源，下次 onEnable 重建
        this._loadVersion++;
        this.cleanupMaterial();
    }

    onDestroy(): void {
        this._destroyed = true;
        this._loadVersion++;
        // 场景切换时 Sprite 可能先于此组件释放渲染实体；此处不能再写 customMaterial。
        if (this._material) {
            this._material.destroy();
            this._material = null;
        }
    }

    private async applyMaterial(): Promise<void> {
        if (this._destroyed || !this.enabledInHierarchy) return;
        const loadVersion = ++this._loadVersion;
        this.cleanupMaterial();

        const effect = await loadEffect();
        if (
            this._destroyed
            || loadVersion !== this._loadVersion
            || !this.enabledInHierarchy
            || !effect
        ) {
            if (!effect) console.warn('[FrameFlow] Effect not found.');
            return;
        }

        this._material = new Material();
        this._material.initialize({ effectAsset: effect, defines: { USE_TEXTURE: true } });

        if (this._sprite) {
            this._sprite.customMaterial = this._material;
        }
        this.syncToMaterial();
    }

    private cleanupMaterial(): void {
        if (this._sprite && this._material && this._sprite.customMaterial === this._material) {
            this._sprite.customMaterial = null;
        }
        if (this._material) {
            this._material.destroy();
            this._material = null;
        }
    }

    syncToMaterial(): void {
        if (!this._material) return;
        const c = this.lightColor;
        this._material.setProperty('lightColor', new Vec4(c.r / 255, c.g / 255, c.b / 255, c.a / 255));
        this._material.setProperty('params', new Vec4(this.lightStrength, this.rotationSpeed, this.lightWidth, 0));
    }

    getMaterial(): Material | null { return this._material; }
}

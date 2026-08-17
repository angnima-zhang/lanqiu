import { _decorator, Component, Sprite, Material, EffectAsset, Color, Vec4, resources } from 'cc';

const { ccclass, property } = _decorator;
const EFFECT_PATH = 'effects/xray-avatar-mask';

let _effectAsset: EffectAsset | null = null;
let _loadPromise: Promise<EffectAsset | null> | null = null;

function loadEffect(): Promise<EffectAsset | null> {
    if (_effectAsset) return Promise.resolve(_effectAsset);
    if (_loadPromise) return _loadPromise;
    _loadPromise = new Promise((resolve) => {
        resources.load(EFFECT_PATH, EffectAsset, (error, asset) => {
            if (error || !asset) { console.error('[XrayAvatarScan] load failed.', error); resolve(null); return; }
            _effectAsset = asset; resolve(asset);
        });
    });
    return _loadPromise;
}

/** X光扫描组件 — 扫描线从左到右扫过头像，已扫描区域正常显示，未扫描区域变暗+蓝色X光色调 */
@ccclass('XrayAvatarScan')
export class XrayAvatarScan extends Component {

    @property({ type: Sprite, tooltip: '目标 Sprite，留空则自动取本节点的 Sprite 组件' })
    targetSprite: Sprite | null = null;

    @property({ tooltip: '是否在 onLoad 时自动播放' })
    playOnLoad: boolean = false;

    @property({ tooltip: '是否循环扫描，单次模式走 holdAfter→cleanup' })
    loop: boolean = true;

    @property({ tooltip: '扫描持续时间（秒）', slide: true, range: [0.5, 5, 0.1] })
    duration: number = 2.0;

    @property({ tooltip: '循环模式：每轮扫描结束后的停顿（秒）', visible: true })
    pauseDuration: number = 0.3;

    @property({ tooltip: '单次模式：扫描完后保持材质的时间（秒）', visible: true })
    holdAfter: number = 0.5;

    @property({ tooltip: '扫描过渡带宽度 0.01~0.2', slide: true, range: [0.01, 0.2, 0.01] })
    sweepWidth: number = 0.03;

    @property({ tooltip: '未扫描区域暗度 0=全亮 1=全黑', slide: true, range: [0, 1, 0.01] })
    dimness: number = 0.6;

    @property({ tooltip: '扫描边缘光晕衰减 0.005~0.1', slide: true, range: [0.005, 0.1, 0.005] })
    glowFalloff: number = 0.02;

    @property({ tooltip: '扫描边缘光晕颜色' })
    glowColor: Color = new Color(102, 204, 255, 255);

    @property({ tooltip: '未扫描区域 X光色调' })
    xrayTint: Color = new Color(13, 31, 102, 255);

    private _material: Material | null = null;
    private _sprite: Sprite | null = null;
    private _playing: boolean = false;
    private _destroyed: boolean = false;
    private _playToken: number = 0;

    onLoad(): void {
        this._sprite = this.targetSprite || this.node.getComponent(Sprite);
        if (!this._sprite) {
            console.warn('[XrayAvatarScan] 未找到 Sprite 组件，请挂载到有 Sprite 的节点上，或手动指定 targetSprite。');
            return;
        }
    }

    start(): void {
        if (this.playOnLoad && this._sprite) {
            this.play();
        }
    }

    onDestroy(): void {
        this._destroyed = true;
        this._playToken++;
        // 场景卸载时 Sprite 的渲染实体可能已释放，不能再写 customMaterial。
        if (this._material) {
            this._material.destroy();
            this._material = null;
        }
    }

    /** 播放 X光 扫描动画。返回 true 表示已开始播放，false 表示正在播放中或无法播放。 */
    play(): boolean {
        if (this._playing) return false;
        if (!this._sprite) return false;
        this._playing = true;
        const playToken = ++this._playToken;

        loadEffect().then((effect) => {
            if (this._destroyed || !effect || !this._playing || playToken !== this._playToken) return;

            if (!this._material) {
                this._material = new Material();
                this._material.initialize({ effectAsset: effect, defines: { USE_TEXTURE: true } });
                this.syncParams(0);
            }

            if (this._sprite && this._sprite.isValid) {
                this._sprite.customMaterial = this._material;
            }

            this._startAnimLoop(playToken);
        });

        return true;
    }

    /** 停止扫描并清理材质 */
    stop(): void {
        this._playToken++;
        this._playing = false;
        this.cleanupMaterial();
    }

    private _startAnimLoop(playToken: number): void {
        if (playToken !== this._playToken) {
            return;
        }
        if (this._destroyed || !this._material || !this._sprite || !this._sprite.isValid) {
            this.cleanupMaterial();
            return;
        }

        const startTime = Date.now();
        const scanDuration = Math.max(this.duration, 0.1);

        const tick = (): void => {
            if (playToken !== this._playToken) {
                return;
            }
            if (!this._playing || this._destroyed) {
                this.cleanupMaterial();
                return;
            }
            if (!this._material || !this._sprite || !this._sprite.isValid) {
                this.cleanupMaterial();
                return;
            }

            const elapsed = (Date.now() - startTime) / 1000;
            const t = Math.min(elapsed / scanDuration, 1);
            this.syncParams(t);

            if (t >= 1) {
                if (this.loop) {
                    setTimeout(() => this._startAnimLoop(playToken), this.pauseDuration * 1000);
                } else {
                    setTimeout(() => {
                        if (playToken !== this._playToken) {
                            return;
                        }
                        this.cleanupMaterial();
                        this._playing = false;
                    }, this.holdAfter * 1000);
                }
            } else {
                setTimeout(tick, 16);
            }
        };
        tick();
    }

    private syncParams(progress: number): void {
        if (!this._material) return;
        const c = this.glowColor;
        const t = this.xrayTint;
        this._material.setProperty('sweepParams', new Vec4(progress, this.sweepWidth, this.dimness, this.glowFalloff));
        this._material.setProperty('xrayTint', new Vec4(t.r / 255, t.g / 255, t.b / 255, t.a / 255));
        this._material.setProperty('glowColor', new Vec4(c.r / 255, c.g / 255, c.b / 255, c.a / 255));
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

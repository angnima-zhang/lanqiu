import {
    _decorator, Component, EffectAsset, Graphics, instantiate, Mask, Material,
    isValid, Node, Rect, resources, Sprite, UITransform, UIOpacity, UIRenderer, Vec3, Vec4,
} from 'cc';

const { ccclass } = _decorator;
const DURATION = 1;
const RETURN_DELAY = 0.3;
let effectPromise: Promise<EffectAsset | null> | null = null;

function loadEffect(): Promise<EffectAsset | null> {
    effectPromise ??= new Promise((resolve) => {
        resources.load('effects/portrait-upgrade-sweep', EffectAsset, (error, effect) => {
            if (error) console.warn('[PortraitUpgradeReveal] Sweep effect unavailable.', error);
            resolve(error ? null : effect);
        });
    });
    return effectPromise;
}

/** 用互补遮罩保留旧 UI，并随上扫闪光逐段显示新 UI，常驻品质材质不被替换。 */
@ccclass('PortraitUpgradeReveal')
export class PortraitUpgradeReveal extends Component {
    private snapshot: Node | null = null;
    private snapshotMaterials: Material[] = [];
    private newMask: Mask | null = null;
    private oldMask: Mask | null = null;
    private flash: Node | null = null;
    private flashMaterial: Material | null = null;
    private bounds = new Rect();
    private elapsed = 0;
    private playing = false;
    private version = 0;
    private resolveAnimation: (() => void) | null = null;
    private originalSiblingIndex = -1;

    public async play(refreshNewVisuals: () => Promise<void>): Promise<void> {
        this.cancel();
        const version = this.version;
        const effect = await loadEffect();
        if (!this.enabledInHierarchy || version !== this.version) return;
        if (!effect) {
            await refreshNewVisuals();
            return;
        }

        const transform = this.node.getComponent(UITransform)!;
        const worldBounds = transform.getBoundingBoxToWorld();
        const lower = transform.convertToNodeSpaceAR(new Vec3(worldBounds.xMin, worldBounds.yMin, 0));
        const upper = transform.convertToNodeSpaceAR(new Vec3(worldBounds.xMax, worldBounds.yMax, 0));
        this.bounds.set(lower.x, lower.y, upper.x - lower.x, upper.y - lower.y);

        // 只保留渲染组件：副本不执行 Widget、加载材质或游戏逻辑。
        this.snapshot = instantiate(this.node);
        this.snapshot.name = '品质升级-旧图';
        for (const component of this.snapshot.getComponentsInChildren(Component)) {
            if (!(component instanceof UITransform) && !(component instanceof UIRenderer)
                && !(component instanceof UIOpacity)) {
                component.destroy();
            }
        }
        for (const renderer of this.snapshot.getComponentsInChildren(UIRenderer)) {
            if (renderer.customMaterial) {
                const material = new Material();
                material.copy(renderer.customMaterial);
                renderer.customMaterial = material;
                this.snapshotMaterials.push(material);
            }
        }
        // 临时遮罩组放在页面最后，避免影响后续文字批次的 stencil 状态。
        this.originalSiblingIndex = this.node.getSiblingIndex();
        this.node.setSiblingIndex(this.node.parent!.children.length - 1);
        this.snapshot.parent = this.node.parent;
        this.snapshot.setSiblingIndex(this.node.getSiblingIndex() + 1);
        this.oldMask = this.snapshot.addComponent(Mask);
        this.oldMask.type = Mask.Type.GRAPHICS_STENCIL;
        this.newMask = this.node.addComponent(Mask);
        this.newMask.type = Mask.Type.GRAPHICS_STENCIL;
        this.drawMasks(0);

        this.flash = new Node('品质升级-上扫闪光');
        this.flash.layer = this.node.layer;
        this.flash.parent = this.node.parent;
        this.flash.setSiblingIndex(this.snapshot.getSiblingIndex() + 1);
        const flashTransform = this.flash.addComponent(UITransform);
        flashTransform.setContentSize(worldBounds.width, worldBounds.height);
        this.flash.setWorldPosition(worldBounds.center.x, worldBounds.center.y, this.node.worldPosition.z);
        // 尺寸按世界包围盒换回父节点坐标，适配 Canvas 缩放。
        const parentScale = this.flash.parent!.worldScale;
        flashTransform.setContentSize(worldBounds.width / Math.abs(parentScale.x), worldBounds.height / Math.abs(parentScale.y));
        const flashSprite = this.flash.addComponent(Sprite);
        flashSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        flashSprite.spriteFrame = this.node.getComponentInChildren(Sprite)!.spriteFrame;
        this.flashMaterial = new Material();
        this.flashMaterial.initialize({ effectAsset: effect });
        this.flashMaterial.setProperty('worldRect', new Vec4(worldBounds.x, worldBounds.y, worldBounds.width, worldBounds.height));
        flashSprite.customMaterial = this.flashMaterial;
        this.flash.active = false;

        try {
            await refreshNewVisuals();
            if (version !== this.version || !this.enabledInHierarchy) return;
            // 使用游戏帧时间：切后台/广告未真正回到前台时不会提前播放完。
            await new Promise<void>((resolve) => {
                this.resolveAnimation = resolve;
                this.elapsed = -RETURN_DELAY;
                this.playing = true;
            });
        } finally {
            if (version === this.version) this.clearVisuals();
        }
    }

    protected update(dt: number): void {
        if (!this.playing) return;
        this.elapsed += dt;
        if (this.elapsed < 0) return;
        const progress = Math.min(1, this.elapsed / DURATION);
        this.drawMasks(progress);
        this.flash!.active = progress < 1;
        this.flashMaterial!.setProperty('sweep', new Vec4(progress, 0.045, 0, 0));
        if (progress >= 1) {
            this.playing = false;
            const resolve = this.resolveAnimation;
            this.resolveAnimation = null;
            resolve?.();
        }
    }

    protected onDisable(): void { this.cancel(); }

    private drawMasks(progress: number): void {
        const { x, y, width, height } = this.bounds;
        const cut = height * progress;
        const newGraphics = this.newMask!.subComp as Graphics;
        const oldGraphics = this.oldMask!.subComp as Graphics;
        newGraphics.clear();
        oldGraphics.clear();
        // 空路径不提交 stencil；用零可见面积之外的小矩形保持遮罩有效。
        newGraphics.rect(x, progress === 0 ? y - 2 : y, width, Math.max(cut, 0.001));
        newGraphics.fill();
        oldGraphics.rect(x, y + cut, width, Math.max(height - cut, 0.001));
        oldGraphics.fill();
    }

    public cancel(): void {
        this.version += 1;
        this.playing = false;
        this.clearVisuals();
        const resolve = this.resolveAnimation;
        this.resolveAnimation = null;
        resolve?.();
    }

    private clearVisuals(): void {
        if (this.newMask?.isValid) {
            const graphics = this.newMask.subComp;
            this.newMask.enabled = false;
            // 先销毁 Mask，避免其 onDisable 再访问已释放的 Graphics 渲染实体。
            this.newMask.destroy();
            graphics?.destroy();
        }
        this.newMask = null;
        this.oldMask = null;
        if (this.snapshot?.isValid) {
            this.snapshot.active = false;
            this.snapshot.destroy();
        }
        this.snapshot = null;
        if (this.flash?.isValid) {
            this.flash.active = false;
            this.flash.destroy();
        }
        this.flash = null;
        this.flashMaterial?.destroy();
        this.flashMaterial = null;
        this.snapshotMaterials.forEach(material => material.destroy());
        this.snapshotMaterials = [];
        if (this.originalSiblingIndex >= 0) {
            const index = this.originalSiblingIndex;
            this.originalSiblingIndex = -1;
            // onDisable 可能发生在父节点递归停用中，此时不能同步调整子节点顺序。
            void Promise.resolve().then(() => {
                if (isValid(this.node, true)) this.node.setSiblingIndex(index);
            });
        }
    }
}

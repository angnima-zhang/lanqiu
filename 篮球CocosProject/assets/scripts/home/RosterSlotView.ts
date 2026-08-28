import {
    _decorator,
    Button,
    Color,
    Component,
    EffectAsset,
    Label,
    Material,
    Node,
    Sprite,
    SpriteFrame,
    tween,
    Tween,
    resources,
    UITransform,
    Vec4,
    Vec3,
} from 'cc';
import {
    forgetGrowingNumber,
    setGrowingNumber,
} from './NumberGrowthAnimator';

const { ccclass, property } = _decorator;

const FULL_OVR_DISPLAY_LIMIT = 10_000;
const QUALITY_FRAME_ROOT = 'images/UI/球员/头像框-方';
const QUALITY_BACKGROUND_ROOT = 'images/UI/球员/招募背景';
const EMPTY_SLOT_QUALITY_ID = 3;
const SLOT_GLOW_EFFECT_PATH = 'effects/slot-new-player-sweep';
const NEW_PLAYER_GLOW_SWEEP_COUNT = 3;
const NEW_PLAYER_GLOW_SWEEP_PERIOD = 0.7;
const EVENT_ICON_GLOW_PERIOD = 1.2;
const EVENT_ICON_PULSE_SCALE = 1.08;

interface SlotGlowBinding {
    sprite: Sprite;
    originalMaterial: Material | null;
    glowMaterial: Material;
}

const OVR_UNITS = [
    { divisor: 1_000, suffix: 'K' },
    { divisor: 1_000_000, suffix: 'M' },
    { divisor: 1_000_000_000, suffix: 'B' },
    { divisor: 1_000_000_000_000, suffix: 'T' },
    { divisor: 1_000_000_000_000_000, suffix: 'Q' },
] as const;

const OVR_UNIT_MULTIPLIER: Readonly<Record<string, number>> = {
    K: 1_000,
    M: 1_000_000,
    B: 1_000_000_000,
    T: 1_000_000_000_000,
    Q: 1_000_000_000_000_000,
};

const QUALITY_FRAME_INDEX_BY_ID: Readonly<Record<number, number>> = {
    3: 0,
    4: 1,
    5: 2,
    6: 3,
    7: 4,
    8: 5,
    9: 6,
    10: 7,
    11: 8,
    12: 9,
    13: 10,
    14: 11,
    15: 12,
    16: 13,
};

export function formatPlayerOverall(overall: number): string {
    const safeOverall = Math.max(0, Math.round(Number.isFinite(overall) ? overall : 0));
    if (safeOverall < FULL_OVR_DISPLAY_LIMIT) {
        return String(safeOverall);
    }

    let unitIndex = 0;
    while (
        unitIndex + 1 < OVR_UNITS.length
        && safeOverall >= OVR_UNITS[unitIndex + 1].divisor
    ) {
        unitIndex += 1;
    }

    let unit = OVR_UNITS[unitIndex];
    let scaledOverall = safeOverall / unit.divisor;
    if (
        unitIndex + 1 < OVR_UNITS.length
        && Number(scaledOverall.toFixed(2)) >= 1000
    ) {
        unit = OVR_UNITS[unitIndex + 1];
        scaledOverall = safeOverall / unit.divisor;
    }

    return `${scaledOverall.toFixed(2)}${unit.suffix}`;
}

export function getQualityFrameIndex(qualityId: number): number {
    const safeQualityId = Math.floor(Number.isFinite(qualityId) ? qualityId : 0);
    return QUALITY_FRAME_INDEX_BY_ID[safeQualityId] ?? 0;
}

export function parsePlayerOverall(displayValue: string): number {
    const match = displayValue.trim().toUpperCase().match(/^(\d+(?:\.\d+)?)\s*([KMBTQ]?)$/);
    if (!match) {
        return 0;
    }

    const value = Number(match[1]);
    const multiplier = match[2] ? OVR_UNIT_MULTIPLIER[match[2]] : 1;
    return Math.max(0, Math.round(value * multiplier));
}

@ccclass('RosterSlotView')
export class RosterSlotView extends Component {
    @property(Sprite)
    public qualityBackground: Sprite | null = null;

    @property(Sprite)
    public portrait: Sprite | null = null;

    @property(Label)
    public ovrLabel: Label | null = null;

    @property(Sprite)
    public qualityFrame: Sprite | null = null;

    @property(Button)
    public selectButton: Button | null = null;

    @property(Button)
    public eventButton: Button | null = null;

    private qualityFrameRequestVersion = 0;
    private newPlayerGlowRequestVersion = 0;
    private newPlayerGlowBindings: SlotGlowBinding[] = [];
    private newPlayerGlowSweepElapsed = 0;
    private newPlayerGlowCompletedSweeps = 0;
    private eventIconRequestVersion = 0;
    private eventIcon: Sprite | null = null;
    private eventNode: Node | null = null;
    private eventIconOriginalMaterial: Material | null = null;
    private eventIconGlowMaterial: Material | null = null;
    private eventIconGlowElapsed = 0;
    private eventIconOriginalScale = new Vec3(1, 1, 1);
    private eventIconPulseTween: Tween<Node> | null = null;
    private currentOverall = 0;

    protected onLoad(): void {
        const backgroundNode = this.node.getChildByName('背景')
            ?? this.node.getChildByName('Background');
        const portraitNode = this.node.getChildByName('头像') ?? this.node.getChildByName('Portrait');
        const ovrNode = this.node.getChildByName('ovr') ?? this.node.getChildByName('OVR');
        const frameNode = this.node.getChildByName('边框') ?? this.node.getChildByName('QualityFrame');
        const eventNode = this.node.getChildByName('事件');

        this.qualityBackground ??= backgroundNode?.getComponent(Sprite) ?? null;
        this.portrait ??= portraitNode?.getComponent(Sprite) ?? null;
        this.ovrLabel ??= ovrNode?.getComponent(Label) ?? null;
        this.qualityFrame ??= frameNode?.getComponent(Sprite) ?? this.node.getComponent(Sprite);
        this.selectButton ??= frameNode?.getComponent(Button) ?? this.node.getComponent(Button);
        this.eventNode = eventNode ?? null;
        this.eventIcon = eventNode?.getComponent(Sprite) ?? null;
        this.eventButton ??= eventNode?.getComponent(Button) ?? eventNode?.addComponent(Button) ?? null;
        if (this.eventNode) {
            this.eventNode.active = false;
        }

        this.currentOverall = this.ovrLabel ? parsePlayerOverall(this.ovrLabel.string) : 0;
        if (!this.qualityFrame) {
            console.error('[RosterSlotView] Missing quality frame Sprite.', this.node.name);
        }
    }

    protected onDestroy(): void {
        this.qualityFrameRequestVersion += 1;
        this.newPlayerGlowRequestVersion += 1;
        this.eventIconRequestVersion += 1;
        this.clearNewPlayerHighlight();
        this.clearEventIcon();
    }

    protected update(deltaTime: number): void {
        this.updateNewPlayerHighlight(deltaTime);
        if (!this.eventIconGlowMaterial) {
            return;
        }
        this.eventIconGlowElapsed += Math.max(0, deltaTime);
        this.eventIconGlowMaterial.setProperty(
            'timingParams',
            new Vec4(this.eventIconGlowElapsed, 0, 0, 0),
        );
    }

    private updateNewPlayerHighlight(deltaTime: number): void {
        if (this.newPlayerGlowBindings.length === 0) {
            return;
        }

        let remainingTime = Math.max(0, deltaTime);
        while (remainingTime > 0) {
            const timeUntilSweepEnds = NEW_PLAYER_GLOW_SWEEP_PERIOD
                - this.newPlayerGlowSweepElapsed;
            if (remainingTime < timeUntilSweepEnds) {
                this.newPlayerGlowSweepElapsed += remainingTime;
                break;
            }

            remainingTime -= timeUntilSweepEnds;
            this.newPlayerGlowSweepElapsed = 0;
            this.newPlayerGlowCompletedSweeps += 1;
            if (this.newPlayerGlowCompletedSweeps >= NEW_PLAYER_GLOW_SWEEP_COUNT) {
                this.clearNewPlayerHighlight();
                return;
            }
        }

        for (const binding of this.newPlayerGlowBindings) {
            binding.glowMaterial.setProperty(
                'timingParams',
                new Vec4(this.newPlayerGlowSweepElapsed, 0, 0, 0),
            );
        }
    }

    public setup(
        ovr: number,
        qualityId = 3,
        portraitFrame?: SpriteFrame | null,
    ): void {
        this.setOverall(ovr);
        this.setQuality(qualityId);
        if (portraitFrame !== undefined) {
            this.setPortrait(portraitFrame);
        }
    }

    public setOverall(ovr: number): void {
        const previousOverall = this.currentOverall;
        this.currentOverall = Math.max(0, Math.round(Number.isFinite(ovr) ? ovr : 0));
        setGrowingNumber(
            this.ovrLabel,
            this.currentOverall,
            (value) => formatPlayerOverall(Math.floor(value)).replace(/\.\d+(?=[KBTQ]$)/, ''),
            {
                animateGrowth: previousOverall > 0
                    && this.currentOverall > previousOverall,
                from: previousOverall,
            },
        );
    }

    public getOverall(): number {
        return this.currentOverall;
    }

    public setPortrait(portraitFrame: SpriteFrame | null): void {
        if (this.portrait) {
            this.portrait.spriteFrame = portraitFrame;
        }
    }

    public setQuality(qualityId: number): void {
        const frameIndex = getQualityFrameIndex(qualityId);
        const qualityIndex = String(frameIndex).padStart(2, '0');
        const resourcePath = `${QUALITY_FRAME_ROOT}/头像框${qualityIndex}-方/spriteFrame`;
        const backgroundResourcePath = `${QUALITY_BACKGROUND_ROOT}/招募背景${qualityIndex}/spriteFrame`;
        const requestVersion = ++this.qualityFrameRequestVersion;

        resources.load(resourcePath, SpriteFrame, (error, spriteFrame) => {
            if (requestVersion !== this.qualityFrameRequestVersion || !this.qualityFrame) {
                return;
            }
            if (error || !spriteFrame) {
                console.error(`[RosterSlotView] Failed to load quality frame: ${resourcePath}`, error);
                return;
            }
            this.qualityFrame.spriteFrame = spriteFrame;
        });

        resources.load(backgroundResourcePath, SpriteFrame, (error, spriteFrame) => {
            if (requestVersion !== this.qualityFrameRequestVersion || !this.qualityBackground) {
                return;
            }
            if (error || !spriteFrame) {
                console.error(
                    `[RosterSlotView] Failed to load quality background: ${backgroundResourcePath}`,
                    error,
                );
                return;
            }
            this.qualityBackground.spriteFrame = spriteFrame;
        });
    }

    public playNewPlayerHighlight(): void {
        const requestVersion = ++this.newPlayerGlowRequestVersion;
        this.clearNewPlayerHighlight();
        resources.load(SLOT_GLOW_EFFECT_PATH, EffectAsset, (error, effectAsset) => {
            if (
                requestVersion !== this.newPlayerGlowRequestVersion
                || !this.node.isValid
            ) {
                return;
            }
            if (error || !effectAsset) {
                console.warn('[RosterSlotView] New player glow is unavailable.', error);
                return;
            }

            const bindings: SlotGlowBinding[] = [];
            for (const sprite of this.node.getComponentsInChildren(Sprite)) {
                const transform = sprite.node.getComponent(UITransform);
                if (!sprite.spriteFrame || !transform) {
                    continue;
                }
                const material = new Material();
                material.initialize({
                    effectAsset,
                    defines: {
                        IS_GRAY: false,
                        USE_TEXTURE: true,
                    },
                });
                material.setProperty(
                    'spriteRect',
                    new Vec4(
                        transform.width,
                        transform.height,
                        transform.anchorPoint.x,
                        transform.anchorPoint.y,
                    ),
                );
                material.setProperty(
                    'shineColor',
                    new Color(255, 255, 255, 255),
                );
                material.setProperty(
                    'sweepParams',
                    new Vec4(0.28, 0.7, 0.32, 1),
                );
                material.setProperty(
                    'pulseParams',
                    new Vec4(0.3, 0.5, 0, 0),
                );
                material.setProperty('timingParams', new Vec4(0, 0, 0, 0));
                bindings.push({
                    sprite,
                    originalMaterial: sprite.customMaterial,
                    glowMaterial: material,
                });
                sprite.customMaterial = material;
            }
            this.newPlayerGlowBindings = bindings;
            this.newPlayerGlowSweepElapsed = 0;
            this.newPlayerGlowCompletedSweeps = 0;
        });
    }

    public setEventIcon(icon: SpriteFrame | null): void {
        this.eventIconRequestVersion += 1;
        this.clearEventIcon();
        if (!icon || !this.eventNode || !this.eventIcon) {
            return;
        }

        this.eventIcon.spriteFrame = icon;
        this.eventNode.active = true;
        this.eventIconOriginalScale.set(
            this.eventNode.scale.x,
            this.eventNode.scale.y,
            this.eventNode.scale.z,
        );
        this.eventIconPulseTween = tween(this.eventNode)
            .to(
                EVENT_ICON_GLOW_PERIOD * 0.5,
                {
                    scale: new Vec3(
                        this.eventIconOriginalScale.x * EVENT_ICON_PULSE_SCALE,
                        this.eventIconOriginalScale.y * EVENT_ICON_PULSE_SCALE,
                        this.eventIconOriginalScale.z,
                    ),
                },
                { easing: 'sineInOut' },
            )
            .to(
                EVENT_ICON_GLOW_PERIOD * 0.5,
                { scale: this.eventIconOriginalScale.clone() },
                { easing: 'sineInOut' },
            )
            .union()
            .repeatForever()
            .start();

        const requestVersion = this.eventIconRequestVersion;
        resources.load(SLOT_GLOW_EFFECT_PATH, EffectAsset, (error, effectAsset) => {
            if (
                requestVersion !== this.eventIconRequestVersion
                || !this.eventIcon
                || !this.eventIcon.node.isValid
            ) {
                return;
            }
            if (error || !effectAsset) {
                console.warn('[RosterSlotView] Event icon glow is unavailable.', error);
                return;
            }
            const transform = this.eventIcon.node.getComponent(UITransform);
            if (!transform || !this.eventIcon.spriteFrame) {
                return;
            }
            const material = new Material();
            material.initialize({
                effectAsset,
                defines: {
                    IS_GRAY: false,
                    USE_TEXTURE: true,
                },
            });
            material.setProperty(
                'spriteRect',
                new Vec4(
                    transform.width,
                    transform.height,
                    transform.anchorPoint.x,
                    transform.anchorPoint.y,
                ),
            );
            material.setProperty('shineColor', new Color(168, 248, 255, 255));
            material.setProperty(
                'sweepParams',
                new Vec4(0.44, EVENT_ICON_GLOW_PERIOD, 0.22, 0.76),
            );
            material.setProperty('pulseParams', new Vec4(0.62, EVENT_ICON_GLOW_PERIOD, 0, 0));
            material.setProperty('timingParams', new Vec4(0, 0, 0, 0));
            this.eventIconOriginalMaterial = this.eventIcon.customMaterial;
            this.eventIconGlowMaterial = material;
            this.eventIconGlowElapsed = 0;
            this.eventIcon.customMaterial = material;
        });
    }

    public clear(): void {
        this.qualityFrameRequestVersion += 1;
        this.newPlayerGlowRequestVersion += 1;
        this.eventIconRequestVersion += 1;
        this.clearNewPlayerHighlight();
        this.clearEventIcon();
        this.currentOverall = 0;
        if (this.ovrLabel) {
            forgetGrowingNumber(this.ovrLabel);
            this.ovrLabel.string = '';
        }
        this.setPortrait(null);
        this.setQuality(EMPTY_SLOT_QUALITY_ID);
    }

    private clearNewPlayerHighlight(): void {
        for (const binding of this.newPlayerGlowBindings) {
            if (
                binding.sprite.isValid
                && binding.sprite.customMaterial === binding.glowMaterial
            ) {
                binding.sprite.customMaterial = binding.originalMaterial;
            }
            binding.glowMaterial.destroy();
        }
        this.newPlayerGlowBindings = [];
        this.newPlayerGlowSweepElapsed = 0;
        this.newPlayerGlowCompletedSweeps = 0;
    }

    private clearEventIcon(): void {
        this.eventIconPulseTween?.stop();
        this.eventIconPulseTween = null;
        if (this.eventNode?.isValid) {
            this.eventNode.setScale(this.eventIconOriginalScale);
            this.eventNode.active = false;
        }
        if (
            this.eventIcon?.isValid
            && this.eventIconGlowMaterial
            && this.eventIcon.customMaterial === this.eventIconGlowMaterial
        ) {
            this.eventIcon.customMaterial = this.eventIconOriginalMaterial;
        }
        this.eventIconGlowMaterial?.destroy();
        this.eventIconGlowMaterial = null;
        this.eventIconOriginalMaterial = null;
        this.eventIconGlowElapsed = 0;
        if (this.eventIcon) {
            this.eventIcon.spriteFrame = null;
        }
    }
}

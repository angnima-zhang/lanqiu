import {
    _decorator,
    Button,
    Component,
    Label,
    Sprite,
    SpriteFrame,
    resources,
} from 'cc';

const { ccclass, property } = _decorator;

const FULL_OVR_DISPLAY_LIMIT = 10_000;
const QUALITY_FRAME_ROOT = 'images/UI/球员/头像框-方';

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
    3: 1,
    4: 1,
    5: 2,
    6: 2,
    7: 3,
    8: 3,
    9: 4,
    10: 4,
    11: 5,
    12: 5,
    13: 6,
    14: 7,
    15: 8,
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
    public portrait: Sprite | null = null;

    @property(Label)
    public ovrLabel: Label | null = null;

    @property(Sprite)
    public qualityFrame: Sprite | null = null;

    @property(Button)
    public selectButton: Button | null = null;

    private qualityFrameRequestVersion = 0;
    private currentOverall = 0;

    protected onLoad(): void {
        const portraitNode = this.node.getChildByName('头像') ?? this.node.getChildByName('Portrait');
        const ovrNode = this.node.getChildByName('ovr') ?? this.node.getChildByName('OVR');
        const frameNode = this.node.getChildByName('边框') ?? this.node.getChildByName('QualityFrame');

        this.portrait ??= portraitNode?.getComponent(Sprite) ?? null;
        this.ovrLabel ??= ovrNode?.getComponent(Label) ?? null;
        this.qualityFrame ??= frameNode?.getComponent(Sprite) ?? this.node.getComponent(Sprite);
        this.selectButton ??= frameNode?.getComponent(Button) ?? this.node.getComponent(Button);

        this.currentOverall = this.ovrLabel ? parsePlayerOverall(this.ovrLabel.string) : 0;

        if (!this.qualityFrame) {
            console.error('[RosterSlotView] Missing quality frame Sprite.', this.node.name);
        }
    }

    protected onDestroy(): void {
        this.qualityFrameRequestVersion += 1;
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
        this.currentOverall = Math.max(0, Math.round(Number.isFinite(ovr) ? ovr : 0));
        if (this.ovrLabel) {
            this.ovrLabel.string = formatPlayerOverall(this.currentOverall);
        }
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
        const resourcePath = `${QUALITY_FRAME_ROOT}/头像框${frameIndex}-方/spriteFrame`;
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
    }

    public clear(): void {
        this.qualityFrameRequestVersion += 1;
        this.currentOverall = 0;
        if (this.ovrLabel) {
            this.ovrLabel.string = '';
        }
        this.setPortrait(null);
        this.setQuality(0);
    }
}

import { Color, Label, Node, Sprite, Vec4 } from 'cc';
import { FrameFlow } from '../effects/FrameFlow';
import { OverallNumberEdgeFlow } from '../effects/OverallNumberEdgeFlow';
import { triggerOverallNumberImpact } from '../effects/OverallNumberShine';
import {
    QualityFrameShader,
    QualityFrameShaderKind,
} from '../effects/QualityFrameShader';
import { UniverseWithin } from '../effects/UniverseWithin';
const INJURY_OVERALL_COLOR = new Color(210, 99, 92, 255);
const TRAINING_OVERALL_COLOR = new Color(95, 176, 118, 255);
const originalOverallLabelColors = new WeakMap<Label, Color>();

export type OverallTrend = 'injury' | 'training' | null;

interface QualityVisualPreset {
    frameKind: QualityFrameShaderKind;
    framePrimary: Color;
    frameSecondary: Color;
    frameParams: Vec4;
    universeGlow: number;
    universeBlend: number;
    universeSparkle: number;
    universeBase: Color;
    universeAccent: Color;
    universePrism: number;
    numberEdge: Color;
    numberGlint: Color;
    numberFlow: Vec4;
    numberPrism: number;
    numberImpact: Color;
    numberImpactIntensity: number;
}

const DEFAULT_PRESET: QualityVisualPreset = {
    frameKind: 'metal',
    framePrimary: new Color(136, 72, 40, 255),
    frameSecondary: new Color(216, 136, 88, 255),
    frameParams: new Vec4(6.4, 0.11, 0.13, 30),
    universeGlow: 0.46,
    universeBlend: 0.13,
    universeSparkle: 0.16,
    universeBase: new Color(122, 56, 24, 255),
    universeAccent: new Color(232, 184, 120, 255),
    universePrism: 0,
    numberEdge: new Color(184, 120, 88, 255),
    numberGlint: new Color(232, 192, 136, 255),
    numberFlow: new Vec4(1.9, 0.24, 0.18, 0.46),
    numberPrism: 0,
    numberImpact: new Color(240, 192, 128, 255),
    numberImpactIntensity: 0.48,
};

const QUALITY_PRESETS: Readonly<Record<number, QualityVisualPreset>> = {
    3: DEFAULT_PRESET,
    4: { ...DEFAULT_PRESET, framePrimary: new Color(88, 120, 120, 255), frameSecondary: new Color(216, 248, 248, 255), frameParams: new Vec4(6.8, 0.1, 0.11, 32), universeGlow: 0.48, universeBlend: 0.14, universeSparkle: 0.18, universeBase: new Color(53, 92, 104, 255), universeAccent: new Color(184, 232, 232, 255), numberEdge: new Color(120, 168, 184, 255), numberGlint: new Color(232, 255, 255, 255), numberFlow: new Vec4(1.95, 0.25, 0.17, 0.44), numberImpact: new Color(232, 255, 255, 255), numberImpactIntensity: 0.45 },
    5: { ...DEFAULT_PRESET, framePrimary: new Color(136, 88, 8, 255), frameSecondary: new Color(248, 216, 88, 255), frameParams: new Vec4(5.8, 0.11, 0.16, 34), universeGlow: 0.54, universeBlend: 0.16, universeSparkle: 0.22, universeBase: new Color(122, 72, 0, 255), universeAccent: new Color(248, 216, 88, 255), numberEdge: new Color(200, 136, 8, 255), numberGlint: new Color(255, 240, 168, 255), numberFlow: new Vec4(2.0, 0.26, 0.18, 0.5), numberImpact: new Color(255, 240, 168, 255), numberImpactIntensity: 0.54 },
    6: { ...DEFAULT_PRESET, frameKind: 'crystal', framePrimary: new Color(8, 120, 8, 255), frameSecondary: new Color(168, 248, 216, 255), frameParams: new Vec4(6.8, 7.0, 0.16, 0.42), universeGlow: 0.58, universeBlend: 0.18, universeSparkle: 0.26, universeBase: new Color(7, 92, 28, 255), universeAccent: new Color(168, 248, 216, 255), numberEdge: new Color(8, 184, 8, 255), numberGlint: new Color(184, 255, 216, 255), numberFlow: new Vec4(2.0, 0.27, 0.18, 0.52), numberImpact: new Color(184, 255, 216, 255), numberImpactIntensity: 0.56 },
    7: { ...DEFAULT_PRESET, frameKind: 'crystal', framePrimary: new Color(8, 72, 184, 255), frameSecondary: new Color(120, 200, 255, 255), frameParams: new Vec4(6.6, 7.5, 0.18, 0.45), universeGlow: 0.65, universeBlend: 0.2, universeSparkle: 0.32, universeBase: new Color(8, 38, 96, 255), universeAccent: new Color(120, 200, 255, 255), numberEdge: new Color(24, 104, 216, 255), numberGlint: new Color(184, 232, 255, 255), numberFlow: new Vec4(2.0, 0.28, 0.19, 0.56), numberImpact: new Color(184, 232, 255, 255), numberImpactIntensity: 0.6 },
    8: { ...DEFAULT_PRESET, frameKind: 'crystal', framePrimary: new Color(184, 8, 8, 255), frameSecondary: new Color(255, 152, 120, 255), frameParams: new Vec4(6.3, 8.0, 0.19, 0.48), universeGlow: 0.7, universeBlend: 0.22, universeSparkle: 0.38, universeBase: new Color(104, 8, 8, 255), universeAccent: new Color(255, 152, 120, 255), numberEdge: new Color(216, 24, 24, 255), numberGlint: new Color(255, 192, 168, 255), numberFlow: new Vec4(2.0, 0.29, 0.19, 0.6), numberImpact: new Color(255, 192, 168, 255), numberImpactIntensity: 0.64 },
    9: { ...DEFAULT_PRESET, frameKind: 'crystal', framePrimary: new Color(136, 8, 184, 255), frameSecondary: new Color(240, 184, 255, 255), frameParams: new Vec4(6.1, 8.5, 0.21, 0.52), universeGlow: 0.78, universeBlend: 0.25, universeSparkle: 0.46, universeBase: new Color(58, 8, 96, 255), universeAccent: new Color(240, 184, 255, 255), numberEdge: new Color(168, 56, 216, 255), numberGlint: new Color(255, 208, 255, 255), numberFlow: new Vec4(2.05, 0.3, 0.2, 0.66), numberImpact: new Color(255, 208, 255, 255), numberImpactIntensity: 0.7 },
    10: { ...DEFAULT_PRESET, frameKind: 'crystal', framePrimary: new Color(88, 136, 168, 255), frameSecondary: new Color(168, 216, 248, 255), frameParams: new Vec4(6.0, 8.5, 0.22, 0.55), universeGlow: 0.86, universeBlend: 0.27, universeSparkle: 0.54, universeBase: new Color(24, 56, 80, 255), universeAccent: new Color(168, 216, 248, 255), numberEdge: new Color(120, 168, 200, 255), numberGlint: new Color(216, 248, 255, 255), numberFlow: new Vec4(2.05, 0.31, 0.2, 0.7), numberImpact: new Color(216, 248, 255, 255), numberImpactIntensity: 0.74 },
    11: { ...DEFAULT_PRESET, frameKind: 'crystal', framePrimary: new Color(200, 40, 120, 255), frameSecondary: new Color(255, 192, 216, 255), frameParams: new Vec4(5.8, 9.0, 0.24, 0.58), universeGlow: 0.94, universeBlend: 0.19, universeSparkle: 1.64, universeBase: new Color(112, 8, 48, 255), universeAccent: new Color(255, 192, 216, 255), numberEdge: new Color(232, 88, 152, 255), numberGlint: new Color(255, 224, 238, 255), numberFlow: new Vec4(2.1, 0.32, 0.21, 0.75), numberImpact: new Color(255, 224, 238, 255), numberImpactIntensity: 0.8 },
    12: { ...DEFAULT_PRESET, frameKind: 'crystal', framePrimary: new Color(168, 200, 248, 255), frameSecondary: new Color(255, 216, 232, 255), frameParams: new Vec4(5.7, 9.5, 0.28, 0.6), universeGlow: 0.98, universeBlend: 0.31, universeSparkle: 0.73, universeBase: new Color(130, 197, 232, 255), universeAccent: new Color(245, 180, 220, 255), universePrism: 0.3, numberEdge: new Color(168, 200, 248, 255), numberGlint: new Color(255, 224, 242, 255), numberFlow: new Vec4(2.1, 0.33, 0.22, 0.82), numberPrism: 0.3, numberImpact: new Color(255, 240, 252, 255), numberImpactIntensity: 0.88 },
    13: { ...DEFAULT_PRESET, frameKind: 'crystal', framePrimary: new Color(40, 168, 184, 255), frameSecondary: new Color(184, 248, 248, 255), frameParams: new Vec4(5.6, 10.0, 0.28, 0.62), universeGlow: 1.08, universeBlend: 0.34, universeSparkle: 0.84, universeBase: new Color(4, 76, 88, 255), universeAccent: new Color(184, 248, 248, 255), numberEdge: new Color(56, 184, 200, 255), numberGlint: new Color(208, 255, 255, 255), numberFlow: new Vec4(2.15, 0.34, 0.22, 0.86), numberImpact: new Color(208, 255, 255, 255), numberImpactIntensity: 0.94 },
    14: { ...DEFAULT_PRESET, frameKind: 'crystal', framePrimary: new Color(72, 136, 200, 255), frameSecondary: new Color(232, 255, 255, 255), frameParams: new Vec4(5.5, 10.5, 0.3, 0.65), universeGlow: 1.2, universeBlend: 0.37, universeSparkle: 0.95, universeBase: new Color(39, 104, 168, 255), universeAccent: new Color(232, 255, 255, 255), numberEdge: new Color(120, 184, 232, 255), numberGlint: new Color(255, 255, 255, 255), numberFlow: new Vec4(2.15, 0.35, 0.23, 0.92), numberImpact: new Color(255, 255, 255, 255), numberImpactIntensity: 1.0 },
    15: { ...DEFAULT_PRESET, frameKind: 'lightning', framePrimary: new Color(255, 240, 184, 255), frameSecondary: new Color(248, 168, 8, 255), frameParams: new Vec4(4.8, 0.72, 24, 2), universeGlow: 1.38, universeBlend: 0.42, universeSparkle: 1.1, universeBase: new Color(168, 90, 0, 255), universeAccent: new Color(255, 240, 184, 255), numberEdge: new Color(248, 200, 8, 255), numberGlint: new Color(255, 248, 208, 255), numberFlow: new Vec4(2.2, 0.36, 0.24, 1.08), numberImpact: new Color(255, 248, 208, 255), numberImpactIntensity: 1.15 },
    16: { ...DEFAULT_PRESET, frameKind: 'conceptGod', framePrimary: new Color(248, 200, 104, 255), frameSecondary: new Color(255, 240, 184, 255), frameParams: new Vec4(5.2, 0.16, 0.34, 0.66), universeGlow: 1.58, universeBlend: 0.46, universeSparkle: 1.34, universeBase: new Color(184, 102, 8, 255), universeAccent: new Color(248, 184, 232, 255), universePrism: 0.62, numberEdge: new Color(248, 200, 104, 255), numberGlint: new Color(255, 240, 184, 255), numberFlow: new Vec4(2.2, 0.36, 0.25, 1.18), numberPrism: 0.68, numberImpact: new Color(255, 240, 184, 255), numberImpactIntensity: 1.28 },
};

function getPreset(qualityId: number): QualityVisualPreset {
    return QUALITY_PRESETS[qualityId] ?? DEFAULT_PRESET;
}

export function applyPlayerQualityVisuals(
    portraitRoot: Node | null,
    qualityId: number,
): void {
    if (!portraitRoot) {
        return;
    }

    const preset = getPreset(qualityId);
    const frameNode = portraitRoot.getChildByName('头像框') ?? null;
    const frameFlow = frameNode?.getComponent(FrameFlow) ?? null;
    if (frameFlow) {
        frameFlow.enabled = false;
    }
    if (frameNode) {
        const frameShader = frameNode.getComponent(QualityFrameShader)
            ?? frameNode.addComponent(QualityFrameShader);
        frameShader.apply(
            preset.frameKind,
            preset.framePrimary,
            preset.frameSecondary,
            preset.frameParams,
        );
    }

    const universe = portraitRoot.getChildByName('bg')?.getComponent(UniverseWithin) ?? null;
    if (universe) {
        universe.rotationSpeed = 0.055;
        universe.glowIntensity = preset.universeGlow;
        universe.blendStrength = preset.universeBlend;
        universe.sparkleBoost = preset.universeSparkle;
        universe.setPalette(
            preset.universeBase,
            preset.universeAccent,
            preset.universePrism,
        );
        universe.enabled = true;
        universe.syncResolution();
        universe.syncTune();
    }
}

/** 让常驻总评流光与品质框、背景使用同一套主色和高光色。 */
export function applyOverallNumberQuality(label: Label | null, qualityId: number): void {
    if (!label) {
        return;
    }
    const preset = getPreset(qualityId);
    const edgeFlow = label.node.getComponent(OverallNumberEdgeFlow)
        ?? label.node.addComponent(OverallNumberEdgeFlow);
    edgeFlow.apply(
        preset.numberEdge,
        preset.numberGlint,
        preset.numberFlow,
        preset.numberPrism,
    );
}

/** 伤病、训练中的总评箭头沿用一套状态：伤病向下红色，训练向上绿色。 */
export function applyOverallTrendArrow(
    overallRoot: Node | null,
    trend: OverallTrend,
): void {
    const arrow = overallRoot?.getChildByName('箭头') ?? null;
    if (arrow) {
        arrow.active = trend !== null;
        arrow.angle = trend === 'training' ? 180 : 0;
        const sprite = arrow.getComponent(Sprite) ?? arrow.getComponentInChildren(Sprite);
        if (sprite && trend) {
            sprite.color = getOverallTrendColor(trend);
        }
    }
}

export function getOverallDefaultColor(label: Label | null): Color {
    if (!label) {
        return Color.WHITE.clone();
    }
    if (!originalOverallLabelColors.has(label)) {
        originalOverallLabelColors.set(label, label.color.clone());
    }
    return originalOverallLabelColors.get(label)!.clone();
}

export function getOverallTrendColor(trend: Exclude<OverallTrend, null>): Color {
    return (trend === 'training' ? TRAINING_OVERALL_COLOR : INJURY_OVERALL_COLOR).clone();
}

/** 招募揭示时的总评冲击色也跟随当前品质。 */
export function triggerOverallNumberQualityImpact(
    label: Label | null,
    qualityId: number,
): void {
    const preset = getPreset(qualityId);
    triggerOverallNumberImpact(
        label,
        preset.numberImpact,
        preset.numberImpactIntensity,
    );
}

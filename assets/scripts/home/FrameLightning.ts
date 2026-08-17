import { resources, EffectAsset, Material, Sprite, UITransform, Vec4 } from 'cc';

const EFFECT_PATH = 'effects/frame-lightning';

// ---- Shared loader (singleton) ----

let _effectAsset: EffectAsset | null = null;
let _loadPromise: Promise<EffectAsset | null> | null = null;

export async function loadFrameLightningEffect(): Promise<EffectAsset | null> {
    if (_effectAsset) {
        return _effectAsset;
    }
    if (_loadPromise) {
        return _loadPromise;
    }

    _loadPromise = new Promise((resolve) => {
        resources.load(EFFECT_PATH, EffectAsset, (error, asset) => {
            if (error || !asset) {
                console.error('[FrameLightning] Failed to load effect.', error);
                resolve(null);
                return;
            }
            _effectAsset = asset;
            resolve(asset);
        });
    });

    return _loadPromise;
}

// ---- Material factory ----

export function createFrameLightningMaterial(effectAsset: EffectAsset): Material {
    const material = new Material();
    material.initialize({
        effectAsset,
        defines: {
            IS_GRAY: false,
            USE_TEXTURE: true,
        },
    });
    return material;
}

// ---- Apply / Remove ----

export function applyFrameLightning(
    sprite: Sprite,
    material: Material,
): void {
    sprite.customMaterial = material;
}

export function removeFrameLightning(sprite: Sprite): void {
    sprite.customMaterial = null;
}

// ---- Quality presets ----
// Higher frame index = higher quality
// These set boltColor/glowColor/intensity/jaggedness per quality index

export interface LightningPreset {
    boltColor: Vec4;    // [r, g, b, a] 0~1
    glowColor: Vec4;
    intensity: number;
    jaggedness: number;
}

// TEMP: all presets maxed out for visibility testing
const PRESETS: Record<number, LightningPreset> = {
    8: { boltColor: new Vec4(1.0, 1.0, 1.0, 1.0), glowColor: new Vec4(0.2, 0.5, 1.0, 1.0), intensity: 1.0, jaggedness: 0.9 },
    7: { boltColor: new Vec4(1.0, 1.0, 1.0, 1.0), glowColor: new Vec4(0.2, 0.5, 1.0, 1.0), intensity: 1.0, jaggedness: 0.9 },
    6: { boltColor: new Vec4(1.0, 1.0, 1.0, 1.0), glowColor: new Vec4(0.2, 0.5, 1.0, 1.0), intensity: 1.0, jaggedness: 0.9 },
    5: { boltColor: new Vec4(1.0, 1.0, 1.0, 1.0), glowColor: new Vec4(0.2, 0.5, 1.0, 1.0), intensity: 1.0, jaggedness: 0.9 },
    4: { boltColor: new Vec4(1.0, 1.0, 1.0, 1.0), glowColor: new Vec4(0.2, 0.5, 1.0, 1.0), intensity: 1.0, jaggedness: 0.9 },
    3: { boltColor: new Vec4(1.0, 1.0, 1.0, 1.0), glowColor: new Vec4(0.2, 0.5, 1.0, 1.0), intensity: 1.0, jaggedness: 0.9 },
    2: { boltColor: new Vec4(1.0, 1.0, 1.0, 1.0), glowColor: new Vec4(0.2, 0.5, 1.0, 1.0), intensity: 1.0, jaggedness: 0.9 },
    1: { boltColor: new Vec4(1.0, 1.0, 1.0, 1.0), glowColor: new Vec4(0.2, 0.5, 1.0, 1.0), intensity: 0.2, jaggedness: 0.9 },
    0: { boltColor: new Vec4(1.0, 1.0, 1.0, 1.0), glowColor: new Vec4(0.2, 0.5, 1.0, 1.0), intensity: 0.1, jaggedness: 0.9 },
};

/**
 * Apply a quality-based preset to a lightning material.
 * @param frameIndex 0-8, from getQualityFrameIndex()
 */
export function applyLightningPreset(
    material: Material,
    frameIndex: number,
): void {
    const preset = PRESETS[Math.max(0, Math.min(8, Math.floor(frameIndex)))]
        ?? PRESETS[0];

    material.setProperty('boltColor', preset.boltColor);
    material.setProperty('glowColor', preset.glowColor);
    material.setProperty('intensity', preset.intensity);
    material.setProperty('jaggedness', preset.jaggedness);
}

/**
 * Synchronize the sprite's material size from UITransform.
 * Necessary when the sprite node is resized.
 */
export function syncFrameLightningSize(
    material: Material,
    sprite: Sprite,
): void {
    const transform = sprite.node.getComponent(UITransform);
    if (!transform) {
        return;
    }
    // The effect currently uses UV-space edge detection;
    // regenerating the material forces uniform layout to re-evaluate.
    // For this effect, the position-based uniforms are handled in the
    // vertex shader's built-in cc_local, so the fragment shader's
    // UV-based calculations are automatically correct regardless
    // of sprite size.
}

// ---- Lifecycle helpers ----

let _materialInstanceCount = 0;

/**
 * All-in-one: load effect, create material, apply preset, bind to sprite.
 * Returns the material for further tuning, or null on failure.
 */
export async function installFrameLightning(
    sprite: Sprite,
    frameIndex: number,
): Promise<Material | null> {
    const effect = await loadFrameLightningEffect();
    if (!effect) {
        return null;
    }

    const material = createFrameLightningMaterial(effect);
    applyLightningPreset(material, frameIndex);
    applyFrameLightning(sprite, material);
    _materialInstanceCount += 1;

    return material;
}

/**
 * Clean up a lightning material instance.
 */
export function uninstallFrameLightning(
    sprite: Sprite,
    material: Material,
): void {
    removeFrameLightning(sprite);
    material.destroy();
    _materialInstanceCount = Math.max(0, _materialInstanceCount - 1);
}

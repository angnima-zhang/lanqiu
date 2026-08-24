import {
    Color,
    Label,
    tween,
    Tween,
} from 'cc';

export type NumberFormatter = (value: number) => string;

interface NumberAnimationState {
    value: number;
    colorProgress: number;
}

interface NumberAnimationOptions {
    animateGrowth?: boolean;
    animateDecrease?: boolean;
    duration?: number;
    from?: number;
    colorFrom?: Readonly<Color>;
    colorTo?: Readonly<Color>;
    onComplete?: () => void;
}

const displayedValues = new WeakMap<Label, number>();
const activeStates = new WeakMap<Label, NumberAnimationState>();

export function setGrowingNumber(
    label: Label | null,
    targetValue: number,
    formatter: NumberFormatter,
    options: NumberAnimationOptions = {},
): void {
    if (!label || !label.isValid) {
        return;
    }

    const target = Number.isFinite(targetValue) ? targetValue : 0;
    const activeState = activeStates.get(label);
    if (activeState) {
        Tween.stopAllByTarget(activeState);
        activeStates.delete(label);
    }

    const previous = options.from
        ?? activeState?.value
        ?? displayedValues.get(label);
    const shouldAnimate = options.animateGrowth !== false
        && previous !== undefined
        && (
            target > previous
            || (options.animateDecrease === true && target < previous)
        );
    const hasColorTransition = Boolean(options.colorFrom && options.colorTo);
    const colorFrom = options.colorFrom?.clone() ?? null;
    const colorTo = options.colorTo?.clone() ?? null;
    if (!shouldAnimate) {
        label.string = formatter(target);
        displayedValues.set(label, target);
        if (hasColorTransition && colorTo) {
            label.color = colorTo;
        }
        options.onComplete?.();
        return;
    }

    const state: NumberAnimationState = { value: previous, colorProgress: 0 };
    const duration = Math.max(0.05, options.duration ?? 0.5);
    label.string = formatter(previous);
    displayedValues.set(label, previous);
    if (hasColorTransition && colorFrom) {
        label.color = colorFrom;
    }
    activeStates.set(label, state);
    tween(state)
        .to(
            duration,
            { value: target, colorProgress: 1 },
            {
                easing: 'cubicOut',
                onUpdate: () => {
                    if (!label.isValid) {
                        Tween.stopAllByTarget(state);
                        return;
                    }
                    label.string = formatter(state.value);
                    displayedValues.set(label, state.value);
                    if (hasColorTransition && colorFrom && colorTo) {
                        label.color = new Color(
                            Math.round(colorFrom.r + (colorTo.r - colorFrom.r) * state.colorProgress),
                            Math.round(colorFrom.g + (colorTo.g - colorFrom.g) * state.colorProgress),
                            Math.round(colorFrom.b + (colorTo.b - colorFrom.b) * state.colorProgress),
                            Math.round(colorFrom.a + (colorTo.a - colorFrom.a) * state.colorProgress),
                        );
                    }
                },
            },
        )
        .call(() => {
            if (label.isValid) {
                label.string = formatter(target);
                displayedValues.set(label, target);
                if (hasColorTransition && colorTo) {
                    label.color = colorTo;
                }
                options.onComplete?.();
            }
            activeStates.delete(label);
        })
        .start();
}

export function forgetGrowingNumber(label: Label | null): void {
    if (!label) {
        return;
    }
    const activeState = activeStates.get(label);
    if (activeState) {
        Tween.stopAllByTarget(activeState);
    }
    activeStates.delete(label);
    displayedValues.delete(label);
}

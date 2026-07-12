import math
from pathlib import Path

import numpy as np
from scipy.io import wavfile


SR = 44_100
BPM = 128
BEAT = 60.0 / BPM
BARS = 32
DURATION = BARS * 4 * BEAT  # exactly 60 seconds
N = int(SR * DURATION)
rng = np.random.default_rng(20260711)
mix = np.zeros((N, 2), dtype=np.float64)


def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = np.asarray(sig[: N - i], dtype=np.float64) * gain
    left = math.sqrt((1.0 - pan) * 0.5)
    right = math.sqrt((1.0 + pan) * 0.5)
    mix[i : i + len(sig), 0] += sig * left
    mix[i : i + len(sig), 1] += sig * right


def env(length, attack=0.005, release=0.08, decay=0.0, sustain=1.0):
    n = max(1, int(length * SR))
    e = np.ones(n)
    a = min(n, int(attack * SR))
    r = min(n - a, int(release * SR))
    if a:
        e[:a] = np.linspace(0, 1, a, endpoint=False)
    if decay > 0:
        d = min(n - a - r, int(decay * SR))
        if d:
            e[a : a + d] = np.linspace(1, sustain, d, endpoint=False)
            e[a + d : n - r] = sustain
    if r:
        e[-r:] *= np.linspace(1, 0, r)
    return e


def osc(freq, length, kind="sine", phase=0.0):
    t = np.arange(int(length * SR)) / SR
    p = 2 * np.pi * freq * t + phase
    if kind == "sine":
        return np.sin(p)
    if kind == "square":
        return np.sign(np.sin(p))
    if kind == "saw":
        return 2.0 * ((freq * t + phase / (2 * np.pi)) % 1.0) - 1.0
    raise ValueError(kind)


def midi(note):
    return 440.0 * 2 ** ((note - 69) / 12)


def kick():
    length = 0.42
    t = np.arange(int(length * SR)) / SR
    freq = 155 * np.exp(-t * 20) + 42
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t * 10)
    click = rng.normal(0, 1, len(t)) * np.exp(-t * 65)
    return (body + 0.12 * click) * env(length, attack=0.001, release=0.05)


def snare():
    length = 0.28
    t = np.arange(int(length * SR)) / SR
    noise = rng.normal(0, 1, len(t))
    tone = np.sin(2 * np.pi * 185 * t) + 0.45 * np.sin(2 * np.pi * 330 * t)
    return (0.78 * noise * np.exp(-t * 18) + 0.35 * tone * np.exp(-t * 14)) * env(length, 0.001, 0.06)


def hat(open_hat=False):
    length = 0.22 if open_hat else 0.075
    t = np.arange(int(length * SR)) / SR
    noise = rng.normal(0, 1, len(t))
    # Difference filter removes low frequencies and makes a crisp metallic hat.
    noise = np.concatenate([[0], np.diff(noise)])
    return noise * np.exp(-t * (15 if open_hat else 55)) * env(length, 0.001, 0.03)


def clap():
    length = 0.22
    t = np.arange(int(length * SR)) / SR
    noise = rng.normal(0, 1, len(t))
    bursts = np.zeros_like(t)
    for delay in (0.0, 0.018, 0.037):
        j = int(delay * SR)
        bursts[j:] += noise[: len(t) - j] * np.exp(-t[: len(t) - j] * 24)
    return bursts * env(length, 0.001, 0.05)


def bass(note, length=0.42):
    f = midi(note)
    sig = 0.72 * osc(f, length, "saw") + 0.55 * osc(f / 2, length, "sine")
    # Soft saturation gives weight without clipping.
    return np.tanh(sig * 1.25) * env(length, 0.004, 0.09, decay=0.08, sustain=0.68)


def synth_note(note, length=0.30):
    f = midi(note)
    sig = 0.5 * osc(f, length, "saw") + 0.25 * osc(f * 1.005, length, "square")
    sig += 0.2 * osc(f * 2, length, "sine")
    return np.tanh(sig) * env(length, 0.008, 0.12, decay=0.06, sustain=0.55)


def brass_chord(notes, length=0.24):
    sig = np.zeros(int(length * SR))
    for k, note in enumerate(notes):
        sig += osc(midi(note), length, "saw", phase=k * 0.2)
        sig += 0.25 * osc(midi(note) * 2, length, "square")
    sig /= len(notes) * 1.2
    return np.tanh(sig * 1.4) * env(length, 0.012, 0.10, decay=0.05, sustain=0.62)


# Four-bar harmonic loop: Em - C - G - D. Repeated eight times, so bar 32
# resolves naturally back to bar 1 when the file loops.
roots = [40, 36, 43, 38]
chords = [
    [52, 55, 59],  # Em
    [48, 52, 55],  # C
    [55, 59, 62],  # G
    [50, 54, 57],  # D
]

for bar in range(BARS):
    base = bar * 4 * BEAT
    root = roots[bar % 4]

    # Basketball-arena drum groove: strong backbeat, syncopated kicks, running hats.
    for b in (0.0, 1.75, 2.5):
        add(kick(), base + b * BEAT, 0.86)
    for b in (1.0, 3.0):
        add(snare(), base + b * BEAT, 0.34, -0.05)
        add(clap(), base + b * BEAT, 0.22, 0.08)
    for h in range(8):
        accent = 0.14 if h % 2 == 0 else 0.09
        add(hat(open_hat=(h == 7)), base + h * 0.5 * BEAT, accent, -0.35 if h % 2 == 0 else 0.35)

    # Bouncy bass line with octave pickup.
    pattern = [(0.0, root), (0.75, root + 7), (1.5, root), (2.25, root + 12), (3.0, root + 7), (3.5, root + 12)]
    for pos, note in pattern:
        add(bass(note), base + pos * BEAT, 0.28, -0.08)

    # Short arena-brass stabs leave room for gameplay sounds.
    for pos in (0.5, 2.0, 3.25):
        add(brass_chord(chords[bar % 4]), base + pos * BEAT, 0.20, 0.12)

    # Repeatable two-bar lead motif, varied by chord root but identical at every loop boundary.
    motif = [12, 14, 15, 19, 17, 15, 14, 12]
    if bar % 2 == 1:
        motif = [12, 15, 17, 19, 17, 15, 14, 10]
    for step, interval in enumerate(motif):
        pos = step * 0.5
        length = 0.32 * BEAT
        pan = -0.22 if step % 2 == 0 else 0.22
        add(synth_note(root + interval, length), base + pos * BEAT, 0.11, pan)

# Subtle stereo arena bed, periodic over the full file and tapered to zero at both ends.
t = np.arange(N) / SR
bed = rng.normal(0, 1, N)
bed = np.convolve(bed, np.ones(64) / 64, mode="same")
bed *= 0.012 * (0.65 + 0.35 * np.sin(2 * np.pi * t / (8 * BEAT)) ** 2)
edge = min(int(0.02 * SR), N // 2)
bed[:edge] *= np.linspace(0, 1, edge)
bed[-edge:] *= np.linspace(1, 0, edge)
mix[:, 0] += bed
mix[:, 1] += np.roll(bed, 97)

# Gentle bus saturation and peak normalization.
mix = np.tanh(mix * 1.08)
# Bring both file boundaries exactly to zero over 5 ms. This prevents a click
# when an engine jumps from the last sample back to the first sample.
loop_edge = int(0.005 * SR)
mix[:loop_edge] *= np.linspace(0, 1, loop_edge, endpoint=True)[:, None]
mix[-loop_edge:] *= np.linspace(1, 0, loop_edge, endpoint=True)[:, None]
peak = np.max(np.abs(mix))
mix *= 0.93 / max(peak, 1e-9)

out = Path(__file__).resolve().parents[1] / "篮球动感循环BGM_60秒.wav"
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print(out)
print(f"duration={N / SR:.6f}s samples={N} rate={SR} peak={np.max(np.abs(mix)):.4f}")

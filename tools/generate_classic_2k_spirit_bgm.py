import math
from pathlib import Path

import numpy as np
from scipy.io import wavfile


SR = 44_100
BPM = 96
BEAT = 60 / BPM
BARS = 24
N = int(SR * BARS * 4 * BEAT)  # exactly 60 seconds
rng = np.random.default_rng(20102013)
mix = np.zeros((N, 2), dtype=np.float64)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def envelope(seconds, attack=0.004, release=0.08, decay=0.0, sustain=1.0):
    size = max(1, int(seconds * SR))
    e = np.ones(size)
    a = min(size, int(attack * SR))
    r = min(size - a, int(release * SR))
    if a:
        e[:a] = np.linspace(0, 1, a, endpoint=False)
    if decay:
        d = min(size - a - r, int(decay * SR))
        if d:
            e[a:a + d] = np.linspace(1, sustain, d, endpoint=False)
            e[a + d:size - r] = sustain
    if r:
        e[-r:] *= np.linspace(1, 0, r)
    return e


def wave(freq, seconds, kind="sine", phase=0):
    t = np.arange(int(seconds * SR)) / SR
    p = 2 * np.pi * freq * t + phase
    if kind == "sine":
        return np.sin(p)
    if kind == "saw":
        return 2 * ((freq * t + phase / (2 * np.pi)) % 1) - 1
    if kind == "square":
        return np.sign(np.sin(p))
    raise ValueError(kind)


def place(sig, seconds, gain=1.0, pan=0.0):
    start = int(seconds * SR)
    if start >= N:
        return
    sig = np.asarray(sig[:N - start]) * gain
    left = math.sqrt((1 - pan) / 2)
    right = math.sqrt((1 + pan) / 2)
    mix[start:start + len(sig), 0] += sig * left
    mix[start:start + len(sig), 1] += sig * right


def kick():
    seconds = 0.42
    t = np.arange(int(seconds * SR)) / SR
    freq = 125 * np.exp(-17 * t) + 44
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-9 * t)
    knock = np.sin(2 * np.pi * 95 * t) * np.exp(-28 * t)
    return (body + 0.25 * knock) * envelope(seconds, 0.001, 0.06)


def snare():
    seconds = 0.34
    t = np.arange(int(seconds * SR)) / SR
    noise = rng.normal(0, 1, len(t))
    tone = np.sin(2 * np.pi * 198 * t)
    sig = 0.72 * noise * np.exp(-15 * t) + 0.38 * tone * np.exp(-12 * t)
    return sig * envelope(seconds, 0.001, 0.08)


def hat(opened=False):
    seconds = 0.18 if opened else 0.065
    t = np.arange(int(seconds * SR)) / SR
    noise = rng.normal(0, 1, len(t))
    noise = np.concatenate([[0], np.diff(noise)])
    return noise * np.exp(-(18 if opened else 60) * t) * envelope(seconds, 0.001, 0.025)


def rim():
    seconds = 0.11
    t = np.arange(int(seconds * SR)) / SR
    sig = np.sin(2 * np.pi * 1480 * t) + 0.5 * np.sin(2 * np.pi * 2210 * t)
    return sig * np.exp(-45 * t) * envelope(seconds, 0.001, 0.03)


def bass(note, seconds=0.45):
    f = midi(note)
    t = np.arange(int(seconds * SR)) / SR
    sig = 0.78 * np.sin(2 * np.pi * f * t)
    sig += 0.30 * np.sin(2 * np.pi * f * 2 * t)
    sig += 0.12 * wave(f, seconds, "saw")
    return np.tanh(sig * 1.4) * envelope(seconds, 0.006, 0.10, 0.08, 0.7)


def clav(note, seconds=0.20):
    f = midi(note)
    t = np.arange(int(seconds * SR)) / SR
    sig = wave(f, seconds, "square") + 0.45 * wave(f * 2, seconds, "saw")
    sig *= np.exp(-7 * t)
    return np.tanh(sig * 0.9) * envelope(seconds, 0.002, 0.06)


def brass(notes, seconds=0.32):
    sig = np.zeros(int(seconds * SR))
    for i, note in enumerate(notes):
        f = midi(note)
        sig += 0.72 * wave(f, seconds, "saw", i * 0.13)
        sig += 0.20 * wave(f * 2, seconds, "square", i * 0.09)
    sig /= len(notes)
    return np.tanh(sig * 1.5) * envelope(seconds, 0.018, 0.12, 0.07, 0.58)


def whistle(note, seconds=0.27):
    f = midi(note)
    t = np.arange(int(seconds * SR)) / SR
    vibrato = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t)
    phase = 2 * np.pi * np.cumsum(f * vibrato) / SR
    sig = np.sin(phase) + 0.18 * np.sin(2 * phase)
    return sig * envelope(seconds, 0.012, 0.08)


# Original four-bar progression in D minor, repeated six times so the ending
# cadence returns naturally to the opening bar: Dm7 - Bbmaj7 - Gm7 - A7.
roots = [38, 34, 31, 33]
chords = [
    [50, 53, 57, 60],
    [46, 50, 53, 57],
    [43, 46, 50, 53],
    [45, 49, 52, 55],
]

for bar in range(BARS):
    base = bar * 4 * BEAT
    root = roots[bar % 4]

    # Laid-back boom-bap groove with tiny swing offsets.
    for pos in (0.0, 1.62, 2.5):
        place(kick(), base + pos * BEAT, 0.82)
    for pos in (1.0, 3.0):
        place(snare(), base + pos * BEAT, 0.34, 0.05)
    for step in range(8):
        swing = 0.055 * BEAT if step % 2 else 0
        place(hat(opened=(step == 7)), base + step * 0.5 * BEAT + swing,
              0.12 if step % 2 == 0 else 0.075,
              -0.28 if step % 2 == 0 else 0.28)
    place(rim(), base + 2.75 * BEAT, 0.10, -0.22)

    # Funk bass: all notes are original and built around the current chord root.
    bassline = [(0.0, root), (0.75, root + 7), (1.5, root + 10),
                (2.0, root + 12), (2.75, root + 7), (3.5, root + 5)]
    for pos, note in bassline:
        place(bass(note), base + pos * BEAT, 0.27, -0.08)

    # Sample-like brass hits and clipped clavinet answers.
    for pos in (0.5, 2.25):
        place(brass(chords[bar % 4]), base + pos * BEAT, 0.19, 0.10)
    clav_pattern = [12, 15, 17, 10]
    for step, interval in enumerate(clav_pattern):
        place(clav(root + interval), base + (1.25 + step * 0.625) * BEAT,
              0.095, -0.22 if step % 2 == 0 else 0.22)

    # A short original arena-whistle response only in bars 3-4 of each cycle.
    if bar % 4 in (2, 3):
        notes = [root + 24, root + 22, root + 19]
        for step, note in enumerate(notes):
            place(whistle(note), base + (0.25 + step * 0.5) * BEAT, 0.065, 0.30)

# Low vinyl/arena texture for classic soundtrack character.
t = np.arange(N) / SR
texture = rng.normal(0, 1, N)
texture = np.convolve(texture, np.ones(24) / 24, mode="same")
texture *= 0.010 * (0.8 + 0.2 * np.sin(2 * np.pi * t / (4 * BEAT)) ** 2)
mix[:, 0] += texture
mix[:, 1] += np.roll(texture, 71)

mix = np.tanh(mix * 1.12)
edge = int(0.005 * SR)
mix[:edge] *= np.linspace(0, 1, edge)[:, None]
mix[-edge:] *= np.linspace(1, 0, edge)[:, None]
mix *= 0.93 / max(np.max(np.abs(mix)), 1e-9)

out = Path(__file__).resolve().parents[1] / "NBA2K经典气质_原创循环BGM_60秒.wav"
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print(out)
print(f"duration={N / SR:.6f}s rate={SR} samples={N} peak={np.max(np.abs(mix)):.4f}")

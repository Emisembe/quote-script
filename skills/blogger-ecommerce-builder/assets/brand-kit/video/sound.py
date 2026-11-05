"""Kreislo sound logo, made entirely in code (no samples, no licences needed).
python3 sound.py intro|outro out.wav   -> 48 kHz stereo WAV timed to the animation."""
import sys, wave, numpy as np

SR = 48000
rng = np.random.default_rng(7)

def env(n, a, r):            # attack/release envelope in samples
    e = np.ones(n)
    a, r = max(1, int(a)), max(1, int(r))
    e[:a] = np.linspace(0, 1, a)
    e[-r:] *= np.linspace(1, 0, r)
    return e

def lowpass(x, cut):         # one-pole low-pass with a cutoff curve (Hz, per sample)
    y = np.zeros_like(x); s = 0.0
    a = 1 - np.exp(-2 * np.pi * np.asarray(cut) / SR)
    a = np.broadcast_to(a, x.shape)
    for i in range(len(x)):
        s += a[i] * (x[i] - s); y[i] = s
    return y

def whoosh(dur, f0, f1, pan0=-0.6, pan1=0.6, gain=0.5):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    noise = rng.standard_normal(n)
    cut = f0 * (f1 / f0) ** t
    band = lowpass(noise, cut) - lowpass(noise, cut * 0.35)
    shape = np.sin(np.pi * t) ** 1.6
    sig = band * shape
    sig /= np.max(np.abs(sig)) + 1e-9
    pan = pan0 + (pan1 - pan0) * t
    return np.stack([sig * np.sqrt((1 - pan) / 2), sig * np.sqrt((1 + pan) / 2)], 1) * gain

def bell(freq, dur=2.2, gain=0.35):
    n = int(dur * SR); t = np.arange(n) / SR
    sig = np.zeros(n)
    for ratio, amp, decay in [(1, 1, 2.2), (2.0, 0.5, 3.0), (3.01, 0.25, 4.5), (4.2, 0.12, 6.0), (5.4, 0.06, 8.0)]:
        sig += amp * np.sin(2 * np.pi * freq * ratio * t) * np.exp(-decay * t)
    sig *= env(n, 0.004 * SR, 0.3 * SR)
    sig /= np.max(np.abs(sig))
    return np.stack([sig, sig], 1) * gain

def thump(dur=0.45, gain=0.7):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 70 * np.exp(-t * 4) + 38
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    click = rng.standard_normal(n) * np.exp(-t * 300) * 0.25
    s = sig + click
    return np.stack([s, s], 1) * gain

def tick(gain=0.12):
    n = int(0.05 * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 120) + rng.standard_normal(n) * np.exp(-t * 400) * 0.3
    return np.stack([s, s], 1) * gain

def pop(gain=0.25):
    n = int(0.18 * SR); t = np.arange(n) / SR
    f = 320 + 900 * t / 0.18
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18)
    return np.stack([s, s], 1) * gain

def pad(dur, notes=(174.61, 220.0, 261.63, 329.63), gain=0.06):
    n = int(dur * SR); t = np.arange(n) / SR
    sig = np.zeros((n, 2))
    for i, f in enumerate(notes):
        for det, ch in [(-0.6, 0), (0.6, 1)]:
            sig[:, ch] += np.sin(2 * np.pi * (f + det) * t + i) + 0.3 * np.sin(2 * np.pi * 2 * (f + det) * t)
    sig /= np.max(np.abs(sig))
    return sig * env(n, 1.2 * SR, 1.5 * SR)[:, None] * gain

def reverb(x, mix=0.25):
    out = x.copy()
    for d, g in [(0.029, 0.5), (0.037, 0.45), (0.041, 0.42), (0.053, 0.38), (0.071, 0.3), (0.089, 0.25)]:
        k = int(d * SR); y = np.zeros_like(x)
        y[k:] = x[:-k] * g
        for _ in range(3):
            y[k:] += y[:-k] * g * 0.6
        out += y * mix / 3
    return out

def place(track, sound, at):
    i = int(at * SR); j = min(len(track), i + len(sound))
    track[i:j] += sound[:j - i]

def build(kind):
    T = 6.0 if kind == 'intro' else 12.0
    tr = np.zeros((int(T * SR), 2))
    if kind == 'intro':
        place(tr, pad(5.6), 0.3)
        place(tr, whoosh(1.15, 400, 5000, -0.7, 0.7, 0.45), 0.22)
        place(tr, whoosh(0.75, 900, 7000, 0.4, -0.2, 0.35), 1.32)
        place(tr, thump(), 2.03)
        for i in range(6): place(tr, tick(0.07), 1.78 + i * 0.07)
        place(tr, bell(880.0), 3.0)
        place(tr, bell(1318.5, gain=0.22), 3.14)
        place(tr, whoosh(0.9, 3000, 12000, -0.5, 0.5, 0.08), 3.6)
        place(tr, whoosh(0.9, 500, 3000, 0.3, -0.3, 0.15), 4.0)
    else:
        place(tr, pad(11.5, notes=(146.83, 220.0, 261.63, 329.63)), 0.2)
        place(tr, whoosh(0.85, 500, 6000, -0.6, 0.6, 0.38), 0.28)
        place(tr, tick(0.15), 1.1)
        place(tr, bell(783.99, gain=0.28), 1.2)
        for i in range(3): place(tr, tick(0.08), 2.12 + i * 0.25)
        place(tr, pop(), 3.0)
        for at in (5.0, 9.0): place(tr, whoosh(0.9, 500, 3000, 0.3, -0.3, 0.12), at)
        place(tr, bell(1046.5, gain=0.2), 10.6)
    tr = reverb(tr)
    fade = int(0.7 * SR)
    tr[-fade:] *= np.linspace(1, 0, fade)[:, None]
    tr /= np.max(np.abs(tr)) / 0.89          # peak about -1 dBFS
    return tr

if __name__ == '__main__':
    kind, out = sys.argv[1], sys.argv[2]
    data = (build(kind) * 32767).astype('<i2')
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
    print('wrote', out)

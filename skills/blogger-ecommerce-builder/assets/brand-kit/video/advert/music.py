"""Music bed for the Kreislo advert, made in code (no samples, no licences). Follows timeline.json.
python3 music.py <timeline.json> <out.wav>"""
import sys, os, json, numpy as np, soundfile as sf
sys.path[:0] = [os.path.dirname(os.path.abspath(__file__)), os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')]
from sound import SR, rng, env, whoosh, bell, thump, tick, pad, reverb, place
tl = json.load(open(sys.argv[1])); T = tl['duration']
L = {x['key']: x for x in tl['lines']}
tr = np.zeros((int(T * SR) + SR, 2))
BEAT = 60 / 100.0
A1, F1, C2, G1 = 55.0, 43.65, 65.41, 49.0
CH = [(A1, (220.0, 261.63, 329.63, 440.0)), (F1, (174.61, 220.0, 261.63, 349.23)),
      (C2, (196.0, 261.63, 329.63, 392.0)), (G1, (196.0, 246.94, 293.66, 392.0))]

def bass(f, dur, gain):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) + 0.2 * np.sin(2 * np.pi * 3 * f * t)
    s = np.tanh(1.8 * s) * np.exp(-t * 5.5) * env(n, 0.004 * SR, 0.03 * SR)
    return np.stack([s, s], 1) * gain

def hat(gain):
    n = int(0.06 * SR); t = np.arange(n) / SR
    s = np.diff(rng.standard_normal(n + 1)) * np.exp(-t * 90)
    return np.stack([s * 0.9, s], 1) * gain

def sub_drone(dur, f, gain):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * env(n, 1.5 * SR, 1.0 * SR)
    return np.stack([s, s], 1) * gain

# 1. Hook: dark, quiet tension (pad + sub drone + a slow heartbeat)
hook_end = L['checked']['start']
place(tr, pad(hook_end + 0.5, notes=(110.0, 164.81, 220.0, 261.63), gain=0.05), 0.0)
place(tr, sub_drone(hook_end, 55.0, 0.18), 0.0)
for k in range(int(hook_end / (BEAT * 2))):
    place(tr, thump(0.35, 0.25), 0.5 + k * BEAT * 2)
place(tr, whoosh(1.4, 300, 6000, -0.6, 0.6, 0.35), hook_end - 1.3)
# 2. Drive: from "checked" to just before "brand": bass 8ths, kick, hats, chord pads
start = hook_end; stop = L['brand']['start'] - 0.8
place(tr, thump(0.6, 0.9), start)
b = 0; t = start
while t < stop - 0.01:
    bar = int(b // 8) % 4; root, chord = CH[bar]
    if b % 8 == 0: place(tr, pad(BEAT * 8 + 0.6, notes=chord, gain=0.045), t)
    place(tr, bass(root * 2, BEAT / 2 * 0.95, 0.22), t)
    place(tr, bass(root * 2, BEAT / 2 * 0.95, 0.16), t + BEAT / 2)
    if b % 2 == 0: place(tr, thump(0.32, 0.38), t)
    place(tr, hat(0.05), t + BEAT / 2)
    if b % 4 == 3: place(tr, tick(0.05), t + BEAT * 0.75)
    b += 1; t += BEAT
# 3. Riser and impact on the logo
br = L['brand']['start']
place(tr, whoosh(1.6, 200, 9000, -0.7, 0.7, 0.5), br - 1.55)
for i in range(8): place(tr, tick(0.04 + i * 0.01), br - 0.8 + i * 0.09)
place(tr, thump(0.9, 1.0), br - 0.05)
place(tr, pad(T - br + 0.3, notes=(220.0, 277.18, 329.63, 440.0), gain=0.06), br)
place(tr, sub_drone(T - br, 55.0, 0.2), br)
place(tr, bell(880.0, 3.0, 0.32), br + 0.05)
place(tr, bell(1318.5, 3.0, 0.2), br + 0.2)
tr = reverb(tr, 0.22)[:int(T * SR)]
fade = int(1.2 * SR); tr[-fade:] *= np.linspace(1, 0, fade)[:, None]
tr /= np.max(np.abs(tr)) / 0.89
sf.write(sys.argv[2], tr, SR)
print('music', round(len(tr) / SR, 2), 's')

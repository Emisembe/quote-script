"""Places the voice lines on a timeline, gives the voice a deeper, broadcast sound, writes vo.wav + timeline.json.
python3 build_voice.py <vo dir> <out dir> [pitch]"""
import sys, json, subprocess, os, numpy as np, soundfile as sf
src, out = sys.argv[1], sys.argv[2]; pitch = float(sys.argv[3]) if len(sys.argv) > 3 else 0.9
os.makedirs(out, exist_ok=True)
SR = 48000
GAP_BEFORE = {'hook': 0.6, 'second': 0.3, 'checked': 0.8, 'germany': 0.7, 'kenya': 0.7, 'sellers': 0.7, 'order': 0.6, 'brand': 0.8}
TAIL = 3.2
FX = ('rubberband=pitch=%s:formant=preserved:pitchq=quality,highpass=f=70,'
      'equalizer=f=120:t=q:w=1:g=3,equalizer=f=320:t=q:w=1.2:g=-2,equalizer=f=3300:t=q:w=1.4:g=3,equalizer=f=8000:t=q:w=1:g=1.5,'
      'acompressor=threshold=-22dB:ratio=3.5:attack=4:release=90:makeup=5,aresample=48000') % pitch
meta = json.load(open(f'{src}/lines.json'))
t = 0.0; lines = []; parts = []
for ln in meta['lines']:
    t += GAP_BEFORE[ln['key']]
    p = f"{out}/_{ln['key']}.wav"
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', f"{src}/{ln['key']}.wav", '-af', FX, '-ac', '1', p], check=True)
    a, sr = sf.read(p); assert sr == SR
    lines.append({'key': ln['key'], 'text': ln['text'], 'start': round(t, 3), 'end': round(t + len(a) / SR, 3)})
    parts.append((t, a)); t += len(a) / SR
total = t + TAIL
vo = np.zeros(int(total * SR) + 1)
for st, a in parts:
    i = int(st * SR); vo[i:i + len(a)] += a
vo *= 0.89 / (np.max(np.abs(vo)) + 1e-9)
sf.write(f'{out}/vo.wav', vo, SR)
json.dump({'duration': round(total, 3), 'lines': lines}, open(f'{out}/timeline.json', 'w'), indent=1)
print('duration', round(total, 2)); [print(l['key'], l['start'], l['end']) for l in lines]

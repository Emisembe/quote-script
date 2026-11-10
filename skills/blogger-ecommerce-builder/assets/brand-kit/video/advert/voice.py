"""Kreislo advert voice-over: one WAV per line + timing JSON.  python3 -I voice.py <voice> <outdir> [speed]"""
import sys, json, numpy as np, soundfile as sf, os
from kokoro_onnx import Kokoro
# Kokoro model files (kokoro-v1.0.onnx, voices-v1.0.bin) from github.com/thewh1teagle/kokoro-onnx/releases
TTS = os.environ.get('KOKORO_DIR', os.path.dirname(os.path.abspath(__file__)) + '/../tts') + '/'
LINES = [
 ("hook",    "Good things don't belong in the bin."),
 ("second",  "They deserve a second life."),
 ("checked", "At Kreislo, every washing machine, fridge, sofa and jacket is checked by hand, cleaned, and honestly described."),
 ("germany", "Pick it up in Giessen, or we deliver across Germany."),
 ("kenya",   "Building a home or a business in Kenya? We test it, pack it, and ship it. And you know the full price before you pay."),
 ("sellers", "Selling online? We store, pack and ship your orders, so you can focus on selling."),
 ("order",   "Order online, on WhatsApp, or on Telegram."),
 ("brand",   "Kreislo. Keep good things moving."),
]
FIX = {'kɹˈeɪsloʊ': 'kɹˈaɪsloʊ', 'dʒˈiːsən': 'ɡˈiːsən'}
voice, out = sys.argv[1], sys.argv[2]; speed = float(sys.argv[3]) if len(sys.argv) > 3 else 0.92
os.makedirs(out, exist_ok=True)
k = Kokoro(TTS + 'kokoro-v1.0.onnx', TTS + 'voices-v1.0.bin')
v = voice
if '+' in voice:   # blend, e.g. am_michael+am_onyx
    a, b = voice.split('+'); v = 0.6 * k.get_voice_style(a) + 0.4 * k.get_voice_style(b)
info = []
for key, text in LINES:
    ph = k.tokenizer.phonemize(text, 'en-us')
    for a, b in FIX.items(): ph = ph.replace(a, b)
    audio, sr = k.create(ph, voice=v, speed=speed, is_phonemes=True)
    sf.write(f'{out}/{key}.wav', audio, sr)
    info.append({'key': key, 'text': text, 'dur': round(len(audio) / sr, 3)})
json.dump({'voice': voice, 'speed': speed, 'sr': sr, 'lines': info}, open(f'{out}/lines.json', 'w'), indent=1)
print(voice, round(sum(x['dur'] for x in info), 2), 's')

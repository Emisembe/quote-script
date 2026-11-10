"""Packs the advert: 4K + HD for 16:9 and 9:16, stills, audio stems, script, voice samples, project files."""
import os, shutil, subprocess, json, glob
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out', 'Kreislo Advert')
shutil.rmtree(os.path.join(HERE, 'out'), ignore_errors=True); os.makedirs(OUT)
def ff(*a): subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *a], check=True)
tl = json.load(open(os.path.join(HERE, 'mix', 'timeline.json')))
D = tl['duration']
for folder, name, raw, (w, h), poster in [
    ('01 Advert - wide 16x9 (YouTube, Facebook, website)', 'Advert - wide 16x9', 'ad-desktop-4k.mp4', (1920, 1080), 9.0),
    ('02 Advert - vertical 9x16 (TikTok, Reels, Shorts, WhatsApp Status)', 'Advert - vertical 9x16', 'ad-mobile-4k.mp4', (1080, 1920), 9.0)]:
    d = os.path.join(OUT, folder); os.makedirs(d)
    src = os.path.join(HERE, 'raw', raw)
    shutil.copy(src, os.path.join(d, f'Kreislo - {name} - 4K {w*2}x{h*2}.mp4'))
    ff('-i', src, '-vf', f'scale={w}:{h}:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
       '-c:a', 'copy', '-movflags', '+faststart', os.path.join(d, f'Kreislo - {name} - HD {w}x{h}.mp4'))
    ff('-i', src, '-i', os.path.join(HERE, 'mix', 'music.wav'), '-map', '0:v', '-map', '1:a', '-vf', f'scale={w}:{h}:flags=lanczos',
       '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-af', 'volume=0.8',
       '-shortest', '-movflags', '+faststart', os.path.join(d, f'Kreislo - {name} - HD - music only (no voice).mp4'))
    ff('-ss', str(poster), '-i', src, '-frames:v', '1', os.path.join(d, f'Kreislo - {name} - still image.png'))
a = os.path.join(OUT, '03 Sound (voice-over, music, full mix)'); os.makedirs(a)
shutil.copy(os.path.join(HERE, 'mix', 'mix.wav'), os.path.join(a, 'Kreislo advert - full mix (voice + music).wav'))
shutil.copy(os.path.join(HERE, 'mix', 'vo.wav'), os.path.join(a, 'Kreislo advert - voice-over only.wav'))
shutil.copy(os.path.join(HERE, 'mix', 'music.wav'), os.path.join(a, 'Kreislo advert - music only.wav'))
script = 'Kreislo advert - voice-over script (%.0f seconds)\n\n' % D
for l in tl['lines']:
    script += '%5.1f s  %s\n' % (l['start'], l['text'])
script += '\nOn screen at the end: KREISLO - KEEP GOOD THINGS MOVING - kreislo.de - @kreislo (no phone number on purpose).\n'
open(os.path.join(OUT, 'Voice-over script.txt'), 'w').write(script)
v = os.path.join(OUT, '04 Voice samples (pick another voice)'); os.makedirs(v)
for f in glob.glob(os.path.join(HERE, 'samples', '*.mp3')): shutil.copy(f, v)
open(os.path.join(v, 'READ ME.txt'), 'w').write("Four voices reading the same lines. The advert uses A. Tell Claude which one you like better,\nor if you want a woman's voice, and the advert is rendered again with it (same video, new voice).\n\nIf you record the voice yourself or use another voice tool (e.g. Speechelo), use 'music only' video + your voice,\nor send the recording and it gets mixed in. The script with timings is in 'Voice-over script.txt'.\n")
p = os.path.join(OUT, '05 Project files (change text and render again)'); os.makedirs(p)
for f in ['ad.html', 'engine.js', 'logo.js', 'timeline.js', 'render.js']: shutil.copy(os.path.join(HERE, 'src', f), p)
for f in ['voice.py', 'build_voice.py', 'music.py', 'sound.py', 'mix.sh']: shutil.copy(os.path.join(HERE, f), p)
shutil.copytree(os.path.join(HERE, 'src', 'fonts'), os.path.join(p, 'fonts'))
open(os.path.join(OUT, 'READ ME.txt'), 'w').write(f"""Kreislo advert ({D:.0f} seconds, 60 frames per second)

Wide 16:9: YouTube (also as a YouTube ad), Facebook feed, your website, presentations.
Vertical 9:16: TikTok, Instagram Reels, YouTube Shorts, WhatsApp Status. Everything important sits above the
bottom area where TikTok and Instagram show captions and buttons.

4K for YouTube and big screens; HD is smaller and uploads faster (WhatsApp, Facebook).
'music only' = the same video without the voice, if you want to talk over it yourself.

Voice: made with Kokoro, an open text-to-speech voice (Apache 2.0 licence, free for commercial use).
Music and sound effects: made in code for Kreislo, so there are no music licences to worry about.
Fonts: Oswald and Open Sans (SIL Open Font Licence).
No phone number in the video on purpose: numbers change, videos stay online for years.

Before you run it as a paid ad: watch it once with sound, check every claim is true for you today
(e.g. 'we deliver across Germany', 'shipping to Kenya'), and add subtitles in the platform (most people watch
without sound; TikTok, Instagram and YouTube can make them automatically from the voice).
""")
open(os.path.join(p, 'READ ME.txt'), 'w').write("""Kreislo advert - project files

1. Change the spoken words: edit LINES in voice.py, then
     python3 voice.py am_michael vo            (needs: pip install kokoro-onnx soundfile + the Kokoro model files)
     python3 build_voice.py vo mix 0.9         (deeper broadcast sound; 1.0 = natural pitch)
     python3 music.py mix/timeline.json mix/music.wav
     bash mix.sh mix                           (voice + music, music ducks under the voice)
2. The on-screen words are in ad.html (search for the text). The timing follows timeline.js automatically.
3. Render: node render.js ad.html desktop ad-desktop.mp4 ad.wav 60   (and 'mobile' for 9:16)
   Needs Node + Playwright (Chromium) + ffmpeg.
""")
shutil.make_archive(os.path.join(HERE, 'Kreislo Advert'), 'zip', os.path.join(HERE, 'out'), 'Kreislo Advert')
print('packed', OUT)

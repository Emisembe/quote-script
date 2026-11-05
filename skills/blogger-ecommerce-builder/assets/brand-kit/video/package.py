"""Packs the rendered videos into one folder per video, with silent and HD versions, posters and READ MEs."""
import os, shutil, subprocess, json
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out', 'Kreislo Videos')
shutil.rmtree(os.path.join(HERE, 'out'), ignore_errors=True)
os.makedirs(OUT)

def ff(*args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)

HOW = """
Use it
- YouTube: add the intro at the start of your video in YouTube Studio's editor, or in CapCut, Shotcut,
  DaVinci Resolve, iMovie or Premiere (drag the MP4 onto the timeline before your clip).
- The "silent" file has no sound: use it if you add your own licensed music.
- 4K is for YouTube, big screens and editing; the HD file is smaller for WhatsApp and quick sharing.
- Sound: the whoosh and chime were made in code for Kreislo, so there are no music licences to worry about.
"""
VIDEOS = [
    ('01 Intro - desktop 16x9 (YouTube, website, presentations)', 'Intro - desktop 16x9', 'intro-desktop-4k.mp4', (1920, 1080), 'intro', 2.6,
     "Kreislo intro for wide screens: the arrow ring draws itself, spins into the O of KREISLO, the letters rise and\nthe tagline \"Keep good things moving\" appears. 6 seconds, 60 frames per second."),
    ('02 Intro - mobile 9x16 (TikTok, Reels, Shorts, WhatsApp Status)', 'Intro - mobile 9x16', 'intro-mobile-4k.mp4', (1080, 1920), 'intro', 2.6,
     "Kreislo intro for phones (vertical 9:16). Same animation as the desktop intro, laid out for vertical video.\n6 seconds, 60 frames per second. Keep it short at the start of TikToks and Reels: viewers decide in 2 seconds."),
    ('03 Outro - desktop 16x9 (YouTube end screen)', 'Outro - desktop 16x9', 'outro-desktop-4k.mp4', (1920, 1080), 'outro', 6.0,
     "Kreislo outro for YouTube: logo, \"Thanks for watching\", your website, WhatsApp and @kreislo, a Subscribe button,\nand two \"Watch next\" frames on the right. 12 seconds, 60 frames per second.\n\nYouTube end screen: in YouTube Studio > your video > End screen, add two Video elements and drag them onto the\ntwo orange frames, and a Subscribe element onto the Subscribe button. End screens can be 5-20 seconds long;\nthis outro is 12 seconds, so put it as the last 12 seconds of the video."),
    ('04 Outro - mobile 9x16 (TikTok, Reels, Shorts)', 'Outro - mobile 9x16', 'outro-mobile-4k.mp4', (1080, 1920), 'outro', 6.0,
     "Kreislo outro for phones (vertical 9:16): logo, the K symbol, \"Thanks for watching\", website, WhatsApp, @kreislo and\na Follow button. Everything sits above the bottom area where TikTok and Instagram show captions and buttons.\n12 seconds, 60 frames per second."),
]
for folder, name, raw, (w, h), kind, poster_t, about in VIDEOS:
    d = os.path.join(OUT, folder); os.makedirs(d)
    src = os.path.join(HERE, 'raw', raw)
    k4 = os.path.join(d, f'Kreislo - {name} - 4K {w*2}x{h*2}.mp4')
    shutil.copy(src, k4)
    ff('-i', src, '-c:v', 'copy', '-an', '-movflags', '+faststart', os.path.join(d, f'Kreislo - {name} - 4K {w*2}x{h*2} - silent.mp4'))
    ff('-i', src, '-vf', f'scale={w}:{h}:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
       '-c:a', 'copy', '-movflags', '+faststart', os.path.join(d, f'Kreislo - {name} - HD {w}x{h}.mp4'))
    ff('-ss', str(poster_t), '-i', src, '-frames:v', '1', os.path.join(d, f'Kreislo - {name} - still image.png'))
    open(os.path.join(d, 'READ ME.txt'), 'w').write(f"Kreislo - {name}\n{about}\n{HOW}\nTo change the words (website, phone, handles, tagline): see folder 06 Project files.\n")

snd = os.path.join(OUT, '05 Sound logo (WAV)'); os.makedirs(snd)
shutil.copy(os.path.join(HERE, 'src', 'intro.wav'), os.path.join(snd, 'Kreislo - sound logo - intro 6s.wav'))
shutil.copy(os.path.join(HERE, 'src', 'outro.wav'), os.path.join(snd, 'Kreislo - sound logo - outro 12s.wav'))
open(os.path.join(snd, 'READ ME.txt'), 'w').write("Kreislo sound logo: whoosh, landing thump and chime, made in code for Kreislo (no samples, no licences).\n48 kHz stereo WAV, timed to the intro (6 s) and outro (12 s). Use them under other videos or as a notification sound.\n")

proj = os.path.join(OUT, '06 Project files (change text and render again)'); os.makedirs(proj)
for f in ['intro.html', 'outro.html', 'engine.js', 'logo.js', 'render.js', 'sound.py']:
    shutil.copy(os.path.join(HERE, 'src', f), os.path.join(proj, f))
shutil.copytree(os.path.join(HERE, 'src', 'fonts'), os.path.join(proj, 'fonts'))
open(os.path.join(proj, 'READ ME.txt'), 'w').write("""Kreislo videos - project files (2D animation in code)

Change the words
- Open intro.html or outro.html in a text editor (Notepad, TextEdit). At the top is CONFIG: tagline, headline,
  sub line, button text, the three link lines (website, WhatsApp, @kreislo), and the length in seconds.
- To preview, open the file in Chrome. Add ?format=mobile to the address for the vertical version.
  (It shows the first frame; the full animation plays only when rendered.)

Render again (needs a computer with Node.js, ffmpeg and Playwright; or ask Claude to do it for you)
  npm i playwright && npx playwright install chromium
  python3 sound.py intro intro.wav
  node render.js intro.html desktop "Kreislo intro desktop.mp4" intro.wav 60
  node render.js intro.html mobile "Kreislo intro mobile.mp4" intro.wav 60
  python3 sound.py outro outro.wav
  node render.js outro.html desktop "Kreislo outro desktop.mp4" outro.wav 60
  node render.js outro.html mobile "Kreislo outro mobile.mp4" outro.wav 60
Every frame is drawn at 2x (3840x2160 or 2160x3840) and encoded with H.264 (High profile, CRF 16).

Files
- engine.js: the drawing tools (logo letters, arrow ring, icons, timing curves).
- logo.js: the Kreislo letters, the K symbol and the icons as vector shapes.
- sound.py: the sound logo (whoosh, thump, chime, soft chord), made with numbers only.
- fonts/: Oswald and Open Sans (SIL Open Font License).
""")
print('packed', OUT)

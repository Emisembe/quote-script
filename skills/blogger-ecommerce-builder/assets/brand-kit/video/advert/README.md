# Video advert with voice-over

A 40-second brand advert (16:9 and 9:16) whose animation follows a spoken script.

1. `voice.py <voice> vo` – speaks each line with Kokoro (open TTS, Apache 2.0, free for commercial use).
   Model files: `kokoro-v1.0.onnx` and `voices-v1.0.bin` from github.com/thewh1teagle/kokoro-onnx/releases
   (set `KOKORO_DIR`). Fix names with phonemes in `FIX` (Kreislo → "KRICE-lo", Gießen → "GHEE-sen").
   Good male voices: `am_michael` (clear), `am_onyx` (very deep), `am_fenrir`, `bm_george` (British);
   female: `af_heart`, `af_bella`, `bf_emma`.
2. `build_voice.py vo mix 0.9` – places the lines with pauses, lowers pitch about 2 semitones with formants kept
   (deeper, "powerful" sound), broadcast EQ + compression, writes `vo.wav` and `timeline.json`.
3. `music.py mix/timeline.json mix/music.wav` – music bed made in code (needs `../sound.py`): tension under the hook,
   a driving pulse from the first product line, riser and impact on the logo.
4. `bash mix.sh mix` – music ducks under the voice, loudness -14 LUFS.
5. Write `timeline.js` (`var TL = <timeline.json>;`), put it next to `ad.html` with `../engine.js`, `../logo.js`,
   `../render.js` and the fonts, then `node render.js ad.html desktop|mobile out.mp4 mix.wav 60`.
   On-screen words are timed per spoken word (`wt(line, wordIndex)`), so a new script re-times itself;
   check the word indexes after changing a line.
6. `package_ad.py` – 4K + HD, music-only versions, stills, audio stems, script, voice samples, project files.

Check every claim in the script is true for the business before it runs as a paid ad, keep phone numbers out
of videos, and tell the owner to add the platform's automatic subtitles.

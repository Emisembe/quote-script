# Video advert with voice-over

A 40-second brand advert (16:9 and 9:16) whose animation follows a spoken script.

1. `voice.py <voice> vo` – speaks each line with Kokoro (open TTS, Apache 2.0, free for commercial use).
   Model files: `kokoro-v1.0.onnx` and `voices-v1.0.bin` from github.com/thewh1teagle/kokoro-onnx/releases
   (set `KOKORO_DIR`). Fix names with phonemes in `FIX` (Kreislo → "KRICE-lo", Gießen → "GHEE-sen").
   Good male voices: `am_michael` (clear), `am_onyx` (very deep), `am_fenrir`, `bm_george` (British);
   female: `af_heart`, `af_bella`, `bf_emma`.
   A blend averages two voices: `voice.py am_liam+am_echo vo 0.95` (50/50). **Kreislo's chosen voice is this blend,
   `am_liam+am_echo`, speed 0.95, then `build_voice.py vo mix 0.877`** (pitch matched to a sample the owner liked,
   about 102 Hz). To match another sample: compare pitch and long-term spectrum of each voice and blend
   against it, then let the owner pick from 3 short samples by ear.
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

## Second advert: kits (`kits/`)

Same pipeline, different script: hook (a home? a workshop? a small farm?) → "buy once, not three times"
(3 short bars against one 10-year bar) → three kit cards with check badges and "+ spares for year one" →
a quote card with every line "included" and a "before you pay" stamp → "we buy it new for you" flow →
swap any item / order on WhatsApp → logo. `kits/voice.py` holds the lines, `kits/ad.html` the scenes,
`kits/timeline.js` the timing from `build_voice.py`. Never put a real price on the quote card unless it is
the actual price including shipping; the card shows "€ • • •" on purpose.

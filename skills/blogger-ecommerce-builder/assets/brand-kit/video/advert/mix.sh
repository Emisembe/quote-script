# Mix voice + music: the music ducks under the voice, loudness -14 LUFS (YouTube, TikTok, Instagram).
# bash mix.sh mix   -> mix/mix.wav
D=${1:-mix}
ffmpeg -hide_banner -loglevel error -y -i $D/music.wav -i $D/vo.wav -filter_complex \
"[1:a]aformat=channel_layouts=stereo,asplit=2[vo][sc];[0:a]volume=0.55[m];[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350:makeup=1[md];[md][vo]amix=inputs=2:normalize=0:weights=1 1,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11" \
-ar 48000 $D/mix.wav

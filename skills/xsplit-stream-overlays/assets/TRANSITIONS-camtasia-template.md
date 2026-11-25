# AfroKauf – Camtasia transitions (how to use)

The same AfroKauf colour sweep as in the live stream: coloured bands sweep across, the AfroKauf logo shows for a moment while the screen is fully covered, then the bands leave and show the next clip. Length 1.2 seconds, 30 fps.

## The files

| File | Use it for |
|---|---|
| AfroKauf - Transition - sweep left - desktop 16x9.mov | Normal videos (1920 x 1080), bands move from right to left |
| AfroKauf - Transition - sweep right - desktop 16x9.mov | The same, bands move from left to right (for variety) |
| AfroKauf - Transition - sweep left / right - mobile 9x16.mov | Vertical videos (1080 x 1920): TikTok, Reels, Shorts |
| ... (magenta key).mp4 | Backup if your Camtasia shows the .mov on black (see step 5) |

Use the .mov files first: they have a see-through background, so you see your video around the bands.

## How to put a transition between two clips

1. Import: File › Import › Media (or Ctrl+I) and choose the .mov file. It appears in the Media Bin.
2. Put your two clips next to each other on track 1, with no gap. The place where clip A ends and clip B starts is the cut.
3. Drag the transition onto track 2 (the track above), so that it starts 0.63 seconds before the cut (mobile: 0.70 seconds). At 30 fps that is 19 frames (mobile: 21 frames) before the cut.
   Easy way: move the playhead to the cut, press the left arrow key 19 times, and drop the transition's start at the playhead.
4. Play it: the screen is fully covered by the green panel with the logo exactly when clip A changes to clip B, so nobody sees the cut.
5. If you see a black box around the bands instead of your video: use the "(magenta key).mp4" file instead, then Visual Effects › Remove a Color, drag it onto the transition clip, choose the magenta colour and keep the tolerance low.
6. Your project size must match the file: desktop 1920 x 1080, mobile 1080 x 1920 (Project Settings).

## Tips
- Save time: after you placed it once, right-click the transition on the timeline › Add to Library. Next time drag it from the Library.
- Use the sweep for big changes (new topic, new shop, before and after an advert). Between small cuts a simple cut looks calmer.
- Sound: add a short "whoosh" sound effect at the start of the transition if you like (Camtasia's Library has some, or use a free sound you are allowed to use).
- The cut point and the timings are the same in every file of one size, so you can swap left and right without moving anything.

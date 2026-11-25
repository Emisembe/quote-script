# AfroKauf Live – Streaming guide for XSplit Broadcaster (and TikTok)

This guide explains every file in the folder "11 Live streaming (XSplit and TikTok)", how to set up XSplit once, and how to run a live show from start to end. Read part 1 to 4 once. Part 6 is your plan for each kind of show.

Last updated: 25 November 2026

## 1. What is in the folder

| File | What it is | Where it goes in XSplit |
|---|---|---|
| AfroKauf Live - News Bar - desktop 16x9.html | Lower third: title, headline, QR code, running ticker | Webpage source, above the camera |
| AfroKauf Live - News Bar - mobile 9x16.html | The same for a vertical (TikTok) screen | Webpage source, above the camera |
| AfroKauf Live - Break screen - desktop 16x9.html | Full screen for "Starting soon", "We'll be right back" (commercial break) or "Thanks for watching": countdown, adverts with QR codes, ticker | Webpage source in its own scene |
| AfroKauf Live - Break screen - mobile 9x16.html | The same for a vertical screen | Webpage source in its own scene |
| AfroKauf Live - Transition (stinger) - desktop 16x9.webm (and .mov) | The AfroKauf colour wipe between scenes | Transition settings |
| AfroKauf Live - Transition (stinger) - mobile 9x16.webm (and .mov) | The same for a vertical screen | Transition settings |
| Preview GIFs | How everything moves | Only to look at |

All HTML files work without internet: the AfroKauf font and the QR code maker are inside each file.

Download the whole folder to your laptop, for example to Documents › AfroKauf Live. Keep the files there: XSplit loads them from that place.

## 2. Set up XSplit once

### 2.1 Picture size and speed
At the top of XSplit you see three buttons: Output, the size (e.g. 1280 x 720) and the frames per second (e.g. 60.00 fps).

| Your laptop | Size | fps |
|---|---|---|
| Normal laptop, built-in camera | 1280 x 720 | 30 |
| Strong laptop, good camera, fast internet | 1920 x 1080 | 30 |
| TikTok (vertical) | 1080 x 1920 (custom size) | 30 |

A talk show does not need 60 fps. 30 fps gives your laptop and your internet half the work, so the picture stays smooth.

### 2.2 Is the picture sharp enough?
The AfroKauf overlays are sharp at every size: they are drawn as text, not as a picture. If the stream looks soft, the reason is almost always the camera or the light:
- Light: sit facing a window or a lamp. A bright light above or behind you makes the face dark and the picture grainy.
- Camera: the built-in laptop camera is the weakest part. A 1080p USB webcam (about 40–80 €) or your phone as a camera (part 6.4) is a big step up. In the camera source's settings choose its highest size (1920 x 1080).
- Internet: for 720p you need about 5 Mbit/s upload, for 1080p about 8 Mbit/s. A LAN cable is more stable than WiFi. Test your upload speed before the first show.
- Make a 2-minute test recording (Record button) and watch it before you go live.

### 2.3 Microphone
Add your microphone in XSplit's audio settings and speak normally: the level should move in the middle, not hit the end. A clip-on microphone or a USB microphone sounds much better than the laptop microphone.

## 3. The News Bar (lower third with QR code and ticker)

### 3.1 Change the text before the show
1. Right-click the file › Open with › Notepad.
2. At the top is a block marked EDIT HERE. Change only the text between the quotes "...":
   - title: the clay block, e.g. AFROKAUF LIVE, SHOP TALK, SEMINAR
   - headline: the main line, e.g. Shop owner Ada asks this question. Long text gets smaller by itself (max. 2 lines).
   - qr_link: the address the QR code opens, e.g. the shop's page or a product. "" (nothing between the quotes) hides the QR card.
   - qr_label: the small text under the QR code, e.g. SCAN ME
   - ticker: the running messages, one per line, each in quotes and followed by a comma
   - ticker_speed: 80 to 160 is good
   - show_seconds: 0 = stays until you hide it; 20 = slides out by itself after 20 seconds
3. Save (Ctrl+S).
4. One file per guest or topic: save copies with clear names, e.g. "News Bar - Ada Lagos Taste.html", "News Bar - Seminar booking.html".

### 3.2 Add it in XSplit
1. Click Add Source › Webpage, then choose the file with Browse (a file on your computer).
2. Set the webpage size to the same size as your screen (1920 x 1080, or 1080 x 1920 for TikTok) and make the source fill the whole screen.
3. In the list of sources, the News Bar must be ABOVE the camera (use the arrow buttons at the bottom right of the list).
4. You should see your camera everywhere except the bars. If you see a white or black background instead: in the source's settings add the custom CSS body { background: transparent !important; }. If it is still not see-through: set green_screen: true in the file and use XSplit's colour key on the source.

### 3.3 During the show
- Show and hide the bar with the eye icon next to the source, or give it a hotkey (part 5.2). It slides in when it appears.
- If it does not slide in again when you show it: right-click the source › Refresh.
- After changing the file in Notepad: right-click the source › Refresh.

## 4. Breaks: starting soon, commercial break, thanks for watching

One file, three uses. Make three copies and change the heading in each:

| Copy | heading | countdown_minutes | countdown_label |
|---|---|---|---|
| Break - Starting soon.html | STARTING SOON | 5 | until we start |
| Break - Be right back.html | WE’LL BE RIGHT BACK | 3 | until we continue |
| Break - Thanks.html | THANKS FOR WATCHING | 0 (no clock) | |

The right side shows adverts that change by themselves every few seconds (promo_seconds), each with its own QR code. This is your commercial break: use it for
- shops that pay for an advert (Premium shops, partners, wholesalers),
- AfroKauf offers: list your shop, deals of the week, the next seminar.

To change an advert: in the promos part, change title, text and qr_link. Copy a whole block { ... }, to add one, or delete a block to remove it. Keep the commas between the blocks.

The countdown starts when the scene is loaded. To start it again, right-click the source › Refresh.

Tip for a commercial break of 2–3 minutes: put background music in the break scene (Add Source › Media file, an MP3 you may use, e.g. from the YouTube Audio Library) and turn the volume down to about 20 %.

## 5. Scenes, transitions and hotkeys

### 5.1 Your scenes
Scenes are the buttons at the bottom right (Scene 1, Scene 2, +). Click + to add one, right-click to rename. Make these:

| Scene | What is in it (top to bottom) |
|---|---|
| 1 Starting soon | Break - Starting soon.html, music |
| 2 Live | News Bar, camera, microphone |
| 3 Guest / Interview | News Bar (guest copy), camera or video call (part 6), microphone |
| 4 Screen | News Bar (optional), camera small in a corner, screen capture (slides, website) |
| 5 Break | Break - Be right back.html, music |
| 6 Thanks | Break - Thanks.html, music |

Click a scene to send it live. To copy a source from one scene to another: select it › Copy, go to the other scene › Paste.

### 5.2 Hotkeys
In XSplit's settings (Tools › Settings › Hotkeys) you can give keys to scenes, and to showing or hiding a source. A good set: F1–F6 for the six scenes, F9 to show/hide the News Bar.

### 5.3 The AfroKauf transition
1. At the bottom right, click the Transition box (it shows e.g. "Cut: 0ms").
2. Choose the stinger transition (a video transition). Pick the file "AfroKauf Live - Transition (stinger) - desktop 16x9.webm".
3. Set the transition point (the moment XSplit switches the scene) to 633 ms. For the mobile file: 683 ms.
4. Click another scene: the colours sweep across, the AfroKauf logo appears and the new scene comes in.

If the transition shows a black background instead of your scene, use the .mov file instead of the .webm. If your XSplit version has no stinger transition, choose Fade with 300 ms: it is calm and always works.

## 6. How to use XSplit for each kind of show

### 6.1 Solo show (you talk, e.g. weekly offers)
Scenes: Starting soon › Live › Break › Live › Thanks.
News Bar: title AFROKAUF LIVE, headline = the topic, QR = the page with the offers. Show the bar for 20 seconds at the start of each topic, then hide it so viewers see your face.

### 6.2 Interview in the same room (shop owner next to you)
- One camera with both people in the picture, or two cameras (two Video device sources side by side).
- One News Bar copy per person, e.g. "Ada Obi – Lagos Taste Afroshop, Frankfurt" with the QR code to her shop page. Show it when the person starts speaking, hide it after 15–20 seconds, show it again after a break.
- Two microphones are best. One microphone between you works if the room is quiet.

### 6.3 Interview with a guest far away (video call)
1. Start the call on the laptop (WhatsApp Desktop, Google Meet, Zoom or Skype).
2. In XSplit add a screen capture of the call window and crop it to the guest's picture.
3. Put your camera and the guest's picture side by side, News Bar on top.
4. Sound: make sure XSplit records the computer sound (the guest's voice) as well as your microphone. Use headphones, otherwise the guest hears an echo.

### 6.4 Shop tour or product show (from inside a shop)
- Use your phone as a camera: XSplit has a phone app for this (XSplit Connect: Webcam), or use any phone webcam app. The phone camera is much better than the laptop camera.
- News Bar with the QR code to the product or the shop page: viewers scan and order straight away.
- Check the shop's WiFi before the show, or use your phone's hotspot.

### 6.5 Seminar or presentation (slides)
- Scene "Screen": screen capture of the slides in full screen, your camera small in a corner (bottom right, above the bar).
- News Bar: title SEMINAR, QR code to the booking page.
- Use breaks with the break screen and adverts for the next seminar.

### 6.6 TikTok (vertical)
- Make a second set of scenes at 1080 x 1920 with the mobile files (News Bar mobile, Break screen mobile, mobile transition). In XSplit you can save this as its own presentation (File › Save as), e.g. "AfroKauf TikTok".
- Keep important things away from the bottom fifth and the right edge: TikTok puts its buttons and comments there. The mobile files are already placed for this.
- Going live from XSplit to TikTok needs a TikTok stream key, which TikTok gives only to some accounts (reports say about 1,000 followers, and since July 2025 mostly gaming content for outside software). Without a key: use TikTok LIVE Studio (TikTok's computer app) with the same mobile files (add source › Link), or bring XSplit into TikTok LIVE Studio as a camera (XSplit's virtual camera). The TikTok phone app cannot show overlays.

### 6.7 Record only (for YouTube, Facebook or Camtasia)
Use the same scenes and press Record instead of Stream. Edit the recording later in Camtasia with the AfroKauf Camtasia assets.

## 7. Checklist before every live show
- Laptop plugged in, other programs closed, notifications off (Windows: Focus).
- Internet tested; LAN cable if possible.
- News Bar copies and break screens edited and saved; sources refreshed in XSplit.
- QR codes tested with your phone.
- Microphone level checked; headphones for video calls.
- Light in front of you.
- Scene 1 (Starting soon) on air 5 minutes before the start.
- Short test recording watched.

## 8. Problems and fixes

| What you see | Fix |
|---|---|
| White or black box instead of see-through | Source settings › custom CSS body { background: transparent !important; }, or green_screen: true + colour key |
| Bars too big, too small or cut off | Webpage size = screen size (1920 x 1080 or 1080 x 1920) and the source fills the whole screen |
| Changes in Notepad do not show | Right-click the source › Refresh |
| The countdown does not start again | Right-click the break source › Refresh |
| QR code does not scan from the screen | Make the QR link shorter (e.g. the shop's main page); the 1080p size scans more easily |
| Stream stutters | 30 fps instead of 60, 1280 x 720 instead of 1920 x 1080, LAN cable, close other programs |
| Guest hears an echo | Use headphones |
| Transition shows black | Use the .mov file, or Fade 300 ms |

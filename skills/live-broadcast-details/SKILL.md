---
name: live-broadcast-details
description: Fill in the "Broadcast Details" of a live stream – title, description, tags, category, privacy, latency, thumbnail, location and the tick boxes – for YouTube, Facebook, TikTok and LinkedIn, in XSplit, OBS, Streamlabs, StreamYard or the platform itself. Gives a short field-by-field guide and ready-to-paste texts for the user's show, plus a test-then-go-live routine. Use when the user shows a "Broadcast Details" / "Go live" / "Live event" window, asks what to write in title, description or tags for a live, which category, privacy or latency to choose, or wants live details for a new show, brand or project.
---

# Live broadcast details (YouTube, Facebook, TikTok, LinkedIn)

Answer **briefly**: one table per platform (field → what to put), then ready-to-paste texts for the user's show.
Use the user's real links, handles and show name; never invent them – ask or leave a clear placeholder like `[your link]`.

## 1. Ask (or take from context)
Show name, topic of this episode, guest (name, business, city), main link, second link (sign-up, offer, booking),
3 hashtags, language, audience city/country, date/time if scheduled.

## 2. Field guide

**Both / all platforms**
- "Ask every time" (XSplit): keep it, so each live gets fresh details. "Save as default" only for a fixed weekly show.
- Always test first with privacy *Only me* (Facebook) / *Unlisted* (YouTube) for 2 minutes, then go live *Public*.
- Replace any test text (e.g. "dfgds") before going live.

**Facebook**

| Field | Put |
|---|---|
| Live Video | *New Live*, or the scheduled live (created via "Manage scheduled live videos") |
| Title | Short, topic first, show name in it |
| Description | 2–3 sentences, main link, 3 hashtags |
| Content Tags | 3–6 topics |
| Location Check In | City (optional; helps local reach) |
| Privacy | *Only me* for the test, *Public* for the real live |

**YouTube**

| Field | Put |
|---|---|
| Live Event | *New Live Event*, or the scheduled event |
| Title | Max. 100 characters; most important words in the first ~60 |
| Description | First 2 lines = what it is + main link (they show before "more"); then second link, guest, hashtags (max. 3 used above the title). Limit 5,000 characters |
| Tags | 5–10 keywords incl. brand, topic, city (all tags together max. 500 characters) |
| Category | *People & Blogs* (talk, community), *Education* (seminar, how-to), *Howto & Style*, *News & Politics*; not *Comedy* unless it is comedy |
| Privacy | *Unlisted* to test, *Public* live, *Private* = only you |
| Latency | *Normal* = best quality; *Low* = chatting with viewers; *Ultra-low* only for very fast interaction (lower quality) |
| Service Type | *RTMP* (leave as is) |
| Thumbnail | 1280×720 JPG/PNG, under 2 MB, brand design, 3–5 big words, a face if possible |
| Enable DVR | On (viewers can rewind) |
| Auto end when stream stops | On |
| 360°, backup server, manual transition, closed captions | Off (unless needed) |

**TikTok LIVE:** short title (a few words, topic + hook), choose a topic category, turn on comments; going live from
outside software needs a stream key that TikTok gives only to some accounts. **LinkedIn Live:** professional title,
description with the business benefit, needs approval/eligibility on LinkedIn.

## 3. Output format (ready to paste)

```
TITLE:        <Show>: <topic of this episode> (<city or guest>)
DESCRIPTION:  <1 sentence what viewers get>.
              <Main action>: <main link>
              <Second action>: <second link>
              Guest: <name>, <business>, <city>.
              #<Brand> #<Topic> #<City or Community>
TAGS:         <brand>, <topic>, <topic + city>, <community>, <guest business>
CATEGORY:     <YouTube category>   PRIVACY: Public (test: Unlisted / Only me)
LATENCY:      Normal (Low if many live questions)
THUMBNAIL:    "<3–5 words>" + photo of host/guest, brand colours, 1280×720
```

Give a second version in German (or the audience's language) when the audience is in Germany or the user writes German.

## 4. Before "Start broadcast"
Overlays and scenes ready, microphone level checked, internet tested, Starting-soon scene on air, links in the
description tested on a phone, thumbnail uploaded, privacy set to Public.

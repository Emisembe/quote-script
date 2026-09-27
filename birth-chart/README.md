# Natal Chart Studio

An interactive birth chart that runs entirely in the browser. It calculates the chart from birth data. Nothing is typed in by hand.

**`index.html` is the whole app in one file.** Upload just that file to any web host, or open it straight from your computer. It works offline: the astronomy library, styles, code and every explanation are inside it. Only the Google Fonts need a connection, and the page falls back to system fonts without them.

It works for anyone. Press **New chart**, enter a name, date, time and city, and the chart is calculated. The city search fills in the historical UTC offset, including daylight saving time. For places not in the list, type the coordinates and choose any of the world's time zones.

## Today's sky (transits on the wheel)

**Today's sky** on the Chart tab draws an outer ring with the planets' positions on any date. You can move the date with the −1M, −1W, −1D, Today, +1D, +1W and +1M buttons, with a slider covering two years either side, or by typing a date. A transiting planet with a solid outline is in close aspect to the chart. Tap it to see which points it touches and what that means, and which house it is passing through.

## Juno and the composite chart

- **Juno**, the asteroid of committed partnership, appears on the wheel. It has a specific explanation for every sign and house, and a *Commitment and marriage* section in the Love answer of Life guidance.
- **Compatibility** now includes:
  - the **composite chart**, the relationship read as one chart built from the midpoints of both, with its focus house and a reading of every composite planet;
  - each person's Juno and any Juno contacts to the partner's Sun, Moon, Venus or Ascendant, a classic marriage indicator;
  - Juno in the *Long-term commitment* score.

## Accuracy of Juno, Chiron and Lilith

These three come from tables generated from the **Swiss Ephemeris** (`src/ephem-data.js`, 88 KB, built by `tools/make_ephemeris.py`). The tables hold geocentric longitudes every 10 days from 1800 to 2200. Against Swiss Ephemeris at 300 random dates, the largest error is 0.5′ for Juno, 0.3′ for Chiron and 0.3′ for mean Lilith.

## Birth place search

Every birth-place field searches the built-in list instantly. With an internet connection it also searches **every city and town worldwide** through the free Open-Meteo geocoding service. The result fills in the coordinates and the historical time zone. Without a connection, the built-in list and manual coordinates still work.

## Life guidance

The **Life guidance** tab answers practical questions such as "What career suits me?", "What kind of partner suits me?", "How do I handle money?" or "What is my purpose?". Type a question, and it is matched by keywords to one of nine topics: career, love, money, home and family, wellbeing, purpose, friends, learning, and strengths and challenges. You can also pick a topic directly. Each answer:

- names the chart factors it is based on, and each one opens that placement on the wheel,
- combines the traditional significators for that topic. For career that means the Midheaven, the 10th and 6th houses and their rulers, the Sun, Saturn and the dominant planet. For love it means Venus, Mars, the Moon, the Descendant and the 7th and 5th houses,
- gives concrete output where it makes sense: ranked career fields with reasons, an employed or self-employed lean, love language, and earning and spending style,
- lists supportive and challenging aspects, upcoming slow-planet transits for that topic over the next 12 months, and questions to reflect on,
- works without a birth time, using planets and signs only,
- can be printed with **Print this answer**.

Question matching is keyword-based and runs offline. No AI service is involved.

## Compatibility

The **Compatibility** tab compares any two people. It scores seven areas of life from 0 to 100: emotional connection, romance and attraction, communication, values and lifestyle, long-term commitment, friendship and growth, and handling conflict. Each score combines:

- aspects between the two charts, weighted by how close they are and which planets describe that area,
- element harmony between the key placements (for example the two Moons for emotions),
- house overlays, meaning where each person's planets fall in the other's houses, when both birth times are known.

A separate **similarity** score compares element and modality mix and shared signs. Each area lists what helps and what needs care, with a written explanation. **Print report** prints a clean, light-coloured copy of the results, and **Print reading** does the same for the full natal reading.

## Responsive layout

The wheel resizes its symbols from its on-screen width, so they stay readable and tappable on phones. On screens under 900px, a tapped item opens as a bottom sheet over the page. Tables drop secondary columns under 600px. Layout is tested at 320, 360, 375, 414, 768, 1024 and 1440 px wide with no horizontal scrolling.

## Editing

The sources live in `src/`. After changing them, rebuild the single file:

```
python3 build.py
```

## Files

| File | Job |
| --- | --- |
| `src/content-signs.js`, `src/content-houses.js` | A specific explanation for every planet and point in every sign and every house |
| `src/content-aspects.js` | A theme for every pair of points, plus how each one expresses itself in easy and hard aspects |
| `src/content-topics.js` | Career fields, work style, love languages, money style, wellbeing, and question-to-topic routing |
| `src/ephem-data.js` | Swiss Ephemeris tables for Juno, Chiron and mean Lilith (generated) |
| `src/content-juno.js` | Juno in signs and houses, and composite-chart interpretations |
| `tools/make_ephemeris.py` | Regenerates `ephem-data.js` from the Swiss Ephemeris |
| `src/compat.js` | Compatibility scoring, similarity and house overlays |
| `src/content-aspects-natal.js` | 213 paragraphs written for specific natal aspects: every planet pair plus key points, each as conjunction, flowing and challenging |
| `src/content-sunmoon.js` | All 144 Sun–Moon sign combinations |
| `src/content-transits.js` | 135 transit paragraphs: Jupiter to Pluto over the Sun, Moon, personal planets, Jupiter, Saturn, Ascendant and Midheaven |
| `src/content-learn.js` | Glossary, retrograde meanings, transit themes, pattern explanations |
| `src/vendor/astronomy.browser.min.js` | astronomy-engine 2.1.19 (MIT), bundled so no CDN is needed |
| `src/engine.js` | Astronomy and astrology maths: planets, nodes, Lilith, Chiron, angles, Vertex, Part of Fortune, four house systems, aspects, patterns, transits, life cycles |
| `src/content.js` | Interpretation text for points, signs, houses, aspects, elements, modes, Moon phases and chart shapes |
| `src/cities.js` | Offline city list with IANA time zones, plus a historical UTC offset lookup through `Intl` |
| `src/app.js` | UI: SVG wheel, detail panel, tabs, customization, birth data form, saving and sharing |
| `src/styles.css` | Light and dark theme tokens and all component styles |

## How the calculation works

- **Planets** come from [astronomy-engine](https://github.com/cosinekitty/astronomy) (VSOP87 and NOVAS-grade), rotated into the true ecliptic of date, which gives tropical longitudes. The engine corrects for light time and aberration.
- **Angles**: the MC and Ascendant come from the sidereal time, the true obliquity and the latitude. The Vertex is the Ascendant of the co-latitude, always in the western half of the chart.
- **Houses**: Placidus uses an iterative semi-arc solution and falls back to Porphyry above the polar circles. Whole sign, Equal and Porphyry are also available.
- **Nodes**: the true node comes from the Moon's osculating orbit. The mean node is also available.
- **Lilith** is the mean lunar apogee (Meeus).
- **Chiron**: astronomy-engine has no Chiron, so its orbit is integrated with the library's N-body gravity simulator, starting from perihelion elements. Accuracy is about ±0.5°. It was checked against the 1977 discovery position, the 2010 Pisces ingress and the 2018 Aries ingress.
- **Retrograde** status and daily motion come from a central difference over ±6 hours.

### Verified against the reference screenshots

The screenshots showed positions but no birth data. Solving for the time and place that reproduce them gives **15 September 1990, about 23:00 local time (UTC+3), Nairobi**. The engine matches every planet to within one arcminute. House cusps and angles differ by 1–3′, which is down to the exact birth minute. The *Chart data* tab shows this comparison live.

## Interaction model

- Hovering a planet, sign, house or aspect line previews it in the side panel and isolates its connections on the wheel.
- Clicking or tapping keeps the panel open, and Esc closes it. The panel sits beside the wheel instead of on top of it.
- Keyboard: Tab to the wheel, arrow keys move between points along the zodiac, and Enter pins a point.
- Links inside the panel jump between related items: aspect partners, house rulers and sign rulers.
- Rows in the data tables open that item on the wheel.
- **Customize chart**: house system, node type, which points to show, aspect lines, minor aspects, orb width, and glyphs or letters.
- **Birth data form**: city search with automatic historical UTC offset (daylight saving included), manual coordinates or offset, and an unknown-time mode (noon chart, no houses, Moon range shown).
- **Save**: charts are kept in this browser, and **Copy chart code** makes a portable code to reopen a chart anywhere.

## Changes from the reference design

1. The chart name was repeated three times in every popup, including an "…chart chart" chip, and a native browser tooltip overlapped the card. It now appears once, and there is no native tooltip.
2. The popup covered the wheel. Details now live in a side panel, which moves below the wheel on phones.
3. Planet glyphs were low contrast. They are full contrast now, and focus mode dims only the unrelated points.
4. There were no visible aspect relationships. Aspect lines are drawn and colour-coded, and each placement lists its aspects with orb and applying or separating.
5. The text was generic. Each placement is built from planet, sign and house, plus dignity, house rulership and aspects.
6. There was no keyboard access. The wheel now supports keyboard navigation.
7. The reference showed no birth data. The chart is now calculated from any birth data, with verification.

## Next improvements

- Draw transits as an outer ring on the wheel for a chosen date.
- Add progressions and a solar return chart.
- Add synastry: overlay two saved charts.
- Add online city search (for example Open-Meteo geocoding) where the host allows network requests.
- Export the wheel as SVG or PNG.

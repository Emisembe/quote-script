# Natal Chart Studio

An interactive birth chart that runs entirely in the browser. It calculates the chart from birth data. Nothing is typed in by hand.

Open `index.html` in a browser. The only network requests are Google Fonts and `astronomy-engine`, loaded from cdn.jsdelivr.net.

## Files

| File | Job |
| --- | --- |
| `engine.js` | Astronomy and astrology maths: planets, nodes, Lilith, Chiron, angles, Vertex, Part of Fortune, four house systems, aspects, patterns, transits, life cycles |
| `content.js` | Interpretation text for points, signs, houses, aspects, elements, modes, Moon phases and chart shapes |
| `cities.js` | Offline city list with IANA time zones, plus a historical UTC offset lookup through `Intl` |
| `app.js` | UI: SVG wheel, detail panel, tabs, customization, birth data form, saving and sharing |
| `styles.css` | Light and dark theme tokens and all component styles |

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

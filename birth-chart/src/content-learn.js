/*
 * Explanations of the concepts: glossary, retrograde meanings, transit themes, patterns.
 */
(function (root) {
  'use strict';

  const RETRO = {
    mercury: 'Mercury retrograde at birth often gives a reflective, original mind. You may think before speaking, revisit ideas and learn in your own way.',
    venus: 'Venus retrograde at birth points to values and love worked out from the inside. You may be slow to trust and highly individual in taste.',
    mars: 'Mars retrograde at birth turns drive inward. You may plan carefully before acting and hold anger in before it comes out.',
    jupiter: 'Jupiter retrograde at birth gives a personal, inward faith. Growth comes through reflection rather than outer expansion.',
    saturn: 'Saturn retrograde at birth internalises rules. You may be your own harshest critic and build authority from inside.',
    uranus: 'Uranus retrograde at birth internalises the urge for freedom, which shows as a private independence of mind.',
    neptune: 'Neptune retrograde at birth deepens the inner spiritual and imaginative life.',
    pluto: 'Pluto retrograde at birth points to deep inner transformation and psychological insight.',
    chiron: 'Chiron retrograde at birth turns healing inward. Understanding your own wound comes before helping others.',
    nnode: 'The nodes are almost always retrograde. This is normal and carries no special meaning.',
    snode: 'The nodes are almost always retrograde. This is normal and carries no special meaning.'
  };

  const TRANSIT = {
    jupiter: { theme: 'growth, opportunity and optimism', length: 'Lasts a few weeks, longer if Jupiter turns retrograde.' },
    saturn: { theme: 'tests, responsibility and consolidation', length: 'Lasts several months across up to three passes.' },
    uranus: { theme: 'sudden change, awakening and liberation', length: 'Lasts about a year across up to three passes.' },
    neptune: { theme: 'dissolution, inspiration and uncertainty', length: 'Lasts one to two years and builds gradually.' },
    pluto: { theme: 'deep transformation, power and rebirth', length: 'Lasts one to two years and works slowly and deeply.' },
    mars: { theme: 'energy, drive and conflict', length: 'Lasts a few days.' },
    sun: { theme: 'focus and vitality', length: 'Lasts a day or two.' },
    mercury: { theme: 'thoughts, news and conversations', length: 'Lasts a day or two.' },
    venus: { theme: 'love, pleasure and money', length: 'Lasts a day or two.' }
  };

  const PATTERN_INFO = {
    'Grand Trine': 'Three planets 120° apart form a triangle of easy flow in one element. It is a natural gift, but it can breed complacency unless it is challenged.',
    'T-Square': 'Two planets in opposition, both square to a third, form the focal point. It is a powerful engine of drive and stress. The focal planet is where you act to release the tension.',
    'Yod': 'Two planets in sextile, both quincunx a third, form the "finger of fate" apex. It suggests a special task or calling that needs constant adjustment.',
    'Stellium': 'Three or more planets in one sign concentrate energy there, and that sign\'s qualities dominate the personality.'
  };

  const GLOSSARY = [
    { term: 'Birth chart', text: 'A map of the sky from the exact place and moment of birth. Each planet sits in a sign (how it acts) and a house (where in life it acts), and planets connect through aspects.' },
    { term: 'Zodiac signs', text: 'Twelve 30° sections of the ecliptic, the Sun\'s path. Each sign has an element (fire, earth, air, water) and a modality (cardinal, fixed, mutable). This chart uses the tropical zodiac, which starts at the March equinox.' },
    { term: 'Planets', text: 'The Sun and Moon (the lights), the personal planets (Mercury, Venus, Mars), the social planets (Jupiter, Saturn) and the outer planets (Uranus, Neptune, Pluto). Outer planets move slowly and describe generations.' },
    { term: 'Houses', text: 'Twelve divisions of the sky based on the birth time and place. They describe areas of life. Different systems divide them differently. Placidus is the most common, and Whole sign is the oldest.' },
    { term: 'Ascendant (AC)', text: 'The sign rising on the eastern horizon at birth. It shapes appearance, first impressions and approach to life. It needs an accurate birth time, because it moves about 1° every 4 minutes.' },
    { term: 'Midheaven (MC)', text: 'The highest point of the ecliptic at birth. It relates to career, reputation and public direction.' },
    { term: 'Descendant and IC', text: 'The points opposite the Ascendant and Midheaven. The Descendant relates to partners, and the IC to home and roots.' },
    { term: 'Aspects', text: 'Angles between planets. Conjunction 0°, sextile 60°, square 90°, trine 120° and opposition 180° are major. The quincunx 150° and others are minor.' },
    { term: 'Orb', text: 'How far from exact an aspect can be and still count. Tighter orbs mean stronger aspects. You can change the orb width under Customize chart.' },
    { term: 'Applying and separating', text: 'An applying aspect is still getting closer to exact and is thought to be growing. A separating one has already peaked.' },
    { term: 'Retrograde (R)', text: 'When a planet appears to move backward from Earth. In a birth chart it suggests that planet\'s energy works more inwardly or reflectively.' },
    { term: 'Lunar nodes', text: 'Where the Moon\'s path crosses the Sun\'s path. The North Node shows a direction of growth, and the South Node shows familiar habits.' },
    { term: 'Chiron', text: 'A small body orbiting between Saturn and Uranus. It is associated with a core sensitivity that can become a source of wisdom and healing.' },
    { term: 'Black Moon Lilith', text: 'The Moon\'s farthest point from Earth, its apogee. It is associated with raw instinct, autonomy and what refuses to be tamed.' },
    { term: 'Vertex', text: 'A calculated point on the western side of the chart linked to encounters that feel fated.' },
    { term: 'Part of Fortune', text: 'A calculated point from the Ascendant, Sun and Moon, linked with ease and wellbeing.' },
    { term: 'Dignity', text: 'How comfortable a planet is in a sign. Domicile and exaltation are strong, while detriment and fall are challenged but can become sources of unusual skill.' },
    { term: 'Chart ruler', text: 'The planet that rules the Ascendant sign. It acts like the chart\'s steering wheel.' },
    { term: 'Transits', text: 'Where the planets are now, compared with the birth chart. Slow planets (Jupiter to Pluto) mark the longest and most significant periods.' },
    { term: 'Saturn return', text: 'When Saturn comes back to its birth position, around ages 29, 58 and 87. It is a major period of maturity and restructuring.' },
    { term: 'Sect', text: 'Whether you were born during the day (Sun above the horizon) or at night. It affects which planets tend to work more smoothly.' }
  ];

  root.ChartLearn = { RETRO, TRANSIT, PATTERN_INFO, GLOSSARY };
})(typeof window !== 'undefined' ? window : globalThis);

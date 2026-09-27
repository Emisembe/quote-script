/*
 * Interpretation text. Every sentence is assembled from these parts, so a
 * placement reads as: what the planet does + how the sign colours it +
 * where the house points it + what it is in conversation with.
 */
(function (root) {
  'use strict';

  const POINTS = {
    sun:     { name: 'Sun',     glyph: '☉', letters: 'Su', group: 'Luminary', core: 'Identity, vitality and the qualities you are here to grow into.', keywords: ['purpose', 'will', 'vitality'] },
    moon:    { name: 'Moon',    glyph: '☽', letters: 'Mo', group: 'Luminary', core: 'Emotional needs, instinct and what makes you feel safe.', keywords: ['needs', 'mood', 'belonging'] },
    mercury: { name: 'Mercury', glyph: '☿', letters: 'Me', group: 'Personal planet', core: 'How you notice, think, learn and put experience into words.', keywords: ['mind', 'speech', 'learning'] },
    venus:   { name: 'Venus',   glyph: '♀', letters: 'Ve', group: 'Personal planet', core: 'What you value and find beautiful, and how you draw people close.', keywords: ['values', 'love', 'taste'] },
    mars:    { name: 'Mars',    glyph: '♂', letters: 'Ma', group: 'Personal planet', core: 'Drive, desire and how you act when something matters.', keywords: ['drive', 'courage', 'anger'] },
    jupiter: { name: 'Jupiter', glyph: '♃', letters: 'Ju', group: 'Social planet', core: 'Growth, faith and where life keeps offering room to expand.', keywords: ['growth', 'meaning', 'luck'] },
    saturn:  { name: 'Saturn',  glyph: '♄', letters: 'Sa', group: 'Social planet', core: 'Limits, responsibility and the slow work that makes you capable.', keywords: ['structure', 'duty', 'mastery'] },
    uranus:  { name: 'Uranus',  glyph: '♅', letters: 'Ur', group: 'Outer planet', core: 'Independence, disruption and the need to change what no longer fits.', keywords: ['freedom', 'change', 'originality'] },
    neptune: { name: 'Neptune', glyph: '♆', letters: 'Ne', group: 'Outer planet', core: 'Imagination, ideals and where the edges of things blur.', keywords: ['dreams', 'empathy', 'illusion'] },
    pluto:   { name: 'Pluto',   glyph: '♇', letters: 'Pl', group: 'Outer planet', core: 'Power, intensity and the deep changes that rebuild a life.', keywords: ['power', 'depth', 'renewal'] },
    nnode:   { name: 'North Node', glyph: '☊', letters: 'NN', group: 'Lunar node', core: 'A direction of growth that feels unfamiliar at first and rewarding over time.', keywords: ['growth edge', 'direction'] },
    snode:   { name: 'South Node', glyph: '☋', letters: 'SN', group: 'Lunar node', core: 'Familiar strengths and habits that are easy to lean on too hard.', keywords: ['comfort zone', 'past skill'] },
    chiron:  { name: 'Chiron',  glyph: '⚷', letters: 'Ch', group: 'Centaur', core: 'A sore spot that, once understood, becomes a source of skill and care for others.', keywords: ['wound', 'healing', 'teaching'] },
    lilith:  { name: 'Black Moon Lilith', glyph: '⚸', letters: 'BL', group: 'Calculated point', core: 'Raw instinct and the parts of you that refuse to be tamed or explained.', keywords: ['autonomy', 'taboo', 'instinct'] },
    asc:     { name: 'Ascendant', glyph: 'AC', letters: 'AC', group: 'Angle', core: 'The eastern horizon at birth: your way into life and the first impression you give.', keywords: ['approach', 'body', 'style'] },
    dsc:     { name: 'Descendant', glyph: 'DC', letters: 'DC', group: 'Angle', core: 'The western horizon: what you look for in partners and tend to see in others.', keywords: ['partners', 'projection'] },
    mc:      { name: 'Midheaven', glyph: 'MC', letters: 'MC', group: 'Angle', core: 'The top of the chart: public direction, calling and visible contribution.', keywords: ['career', 'reputation'] },
    ic:      { name: 'Imum Coeli', glyph: 'IC', letters: 'IC', group: 'Angle', core: 'The base of the chart: home, roots and private foundations.', keywords: ['roots', 'home', 'privacy'] },
    vertex:  { name: 'Vertex',  glyph: 'Vx', letters: 'Vx', group: 'Calculated point', core: 'A point linked with meetings and events that feel arranged by fate.', keywords: ['encounters', 'turning points'] },
    fortune: { name: 'Part of Fortune', glyph: '⊗', letters: 'PF', group: 'Arabic part', core: 'Where ease and material wellbeing tend to come most naturally.', keywords: ['ease', 'prosperity'] }
  };

  const SIGN_STYLE = {
    ari: 'In Aries it acts quickly, directly and with a need to go first.',
    tau: 'In Taurus it moves steadily, sensually and with an eye on what lasts.',
    gem: 'In Gemini it works curiously and flexibly, through talk and exchange.',
    can: 'In Cancer it works protectively and intuitively, through belonging.',
    leo: 'In Leo it works warmly and visibly, from the heart.',
    vir: 'In Virgo it works carefully and practically, through refinement and service.',
    lib: 'In Libra it works through relationship, fairness and a sense of balance.',
    sco: 'In Scorpio it works intensely and privately, through depth and change.',
    sag: 'In Sagittarius it works openly and optimistically, through exploration.',
    cap: 'In Capricorn it works strategically and patiently, through responsibility.',
    aqu: 'In Aquarius it works independently and inventively, with the group in mind.',
    pis: 'In Pisces it works through empathy, imagination and letting go.'
  };

  const SIGN_TEXT = {
    ari: 'Cardinal fire. Aries starts things and finds itself through courage and honest desire.',
    tau: 'Fixed earth. Taurus steadies, grows and protects what can be trusted and enjoyed.',
    gem: 'Mutable air. Gemini collects information, connects ideas and keeps things moving.',
    can: 'Cardinal water. Cancer protects, remembers and builds belonging through care.',
    leo: 'Fixed fire. Leo creates, shines and gains confidence through heartfelt expression.',
    vir: 'Mutable earth. Virgo observes, improves and makes things useful through practice.',
    lib: 'Cardinal air. Libra relates, weighs options and looks for fairness and beauty.',
    sco: 'Fixed water. Scorpio looks beneath the surface and transforms through truth and intimacy.',
    sag: 'Mutable fire. Sagittarius searches for meaning through travel, candour and belief.',
    cap: 'Cardinal earth. Capricorn builds structure and authority through patience and realism.',
    aqu: 'Fixed air. Aquarius questions convention and contributes through invention and shared vision.',
    pis: 'Mutable water. Pisces imagines, empathises and dissolves boundaries.'
  };

  const HOUSES = [
    { title: 'Self & identity', area: 'identity, the body and how you meet life' },
    { title: 'Money & values', area: 'income, possessions, values and self-worth' },
    { title: 'Communication & learning', area: 'learning, siblings, daily conversation and your neighbourhood' },
    { title: 'Home & roots', area: 'home, family and emotional foundations' },
    { title: 'Creativity & pleasure', area: 'creativity, romance, play and children' },
    { title: 'Work & wellbeing', area: 'daily work, health, craft and routines' },
    { title: 'Partnership', area: 'partnership, contracts and one-to-one bonds' },
    { title: 'Intimacy & transformation', area: 'intimacy, shared money, trust and transformation' },
    { title: 'Belief & exploration', area: 'belief, travel, higher learning and perspective' },
    { title: 'Career & contribution', area: 'vocation, reputation and public responsibility' },
    { title: 'Community & aspirations', area: 'friends, networks, causes and future goals' },
    { title: 'Rest & inner life', area: 'rest, retreat, endings and the unconscious' }
  ];

  const ASPECT_TEXT = {
    conjunction: 'fuses with',
    opposition: 'pulls against',
    trine: 'flows easily with',
    square: 'pushes against',
    sextile: 'opens a door to',
    quincunx: 'needs constant adjustment with',
    semisextile: 'sits awkwardly beside',
    semisquare: 'grates on',
    sesquiquadrate: 'agitates'
  };

  const ASPECT_MEANING = {
    conjunction: 'The two functions act as one. Hard to separate, strong in either direction.',
    opposition: 'A see-saw. Awareness comes through other people and through finding the middle.',
    trine: 'A natural talent. Easy to use, and easy to take for granted.',
    square: 'Friction that forces action. The source of much of a chart\'s drive.',
    sextile: 'An opportunity that rewards effort. Helpful when you reach for it.',
    quincunx: 'Two things that do not speak the same language and need regular recalibration.',
    semisextile: 'A mild, neighbourly irritation that asks for small adjustments.',
    semisquare: 'Low-level friction, felt as restlessness more than crisis.',
    sesquiquadrate: 'Pressure that builds quietly and then asks for release.'
  };

  const ELEMENTS = {
    fire:  { name: 'Fire',  text: 'Enthusiasm, initiative and faith. Fire gets things started.' },
    earth: { name: 'Earth', text: 'Practicality, patience and results. Earth makes things real.' },
    air:   { name: 'Air',   text: 'Ideas, language and perspective. Air connects and explains.' },
    water: { name: 'Water', text: 'Feeling, memory and intuition. Water bonds and protects.' }
  };

  const MODES = {
    cardinal: { name: 'Cardinal', text: 'Starting. You tend to initiate and set direction.' },
    fixed:    { name: 'Fixed',    text: 'Sustaining. You tend to hold steady and see things through.' },
    mutable:  { name: 'Mutable',  text: 'Adapting. You tend to adjust, translate and keep options open.' }
  };

  // Moon phase at birth, by Sun–Moon elongation.
  const MOON_PHASES = [
    { max: 45,  name: 'New Moon',        text: 'Instinctive and forward-leaning. You tend to act before the plan is clear.' },
    { max: 90,  name: 'Crescent',        text: 'Pushing past old patterns to establish something of your own.' },
    { max: 135, name: 'First Quarter',   text: 'Built for decisive action and for working through crises.' },
    { max: 180, name: 'Gibbous',         text: 'Analytical and improving. You refine things until they work.' },
    { max: 225, name: 'Full Moon',       text: 'Relationship-aware. Clarity comes through other people.' },
    { max: 270, name: 'Disseminating',   text: 'A natural teacher who shares what has been learned.' },
    { max: 315, name: 'Last Quarter',    text: 'Re-evaluating. You tend to question and restructure beliefs.' },
    { max: 360, name: 'Balsamic',        text: 'Reflective and future-oriented, finishing a cycle and seeding the next.' }
  ];

  // Signature: dominant element + mode maps to one sign.
  const SIGNATURE = {
    'fire-cardinal': 'ari', 'earth-fixed': 'tau', 'air-mutable': 'gem', 'water-cardinal': 'can',
    'fire-fixed': 'leo', 'earth-mutable': 'vir', 'air-cardinal': 'lib', 'water-fixed': 'sco',
    'fire-mutable': 'sag', 'earth-cardinal': 'cap', 'air-fixed': 'aqu', 'water-mutable': 'pis'
  };

  const SHAPES = {
    Bundle:   'All planets within about 120°. Energy is concentrated and specialised.',
    Bowl:     'Planets fill about half the wheel. A strong sense of mission toward what is missing.',
    Bucket:   'A bowl with one planet on the far side acting as a handle that directs everything.',
    Locomotive: 'Planets span about two-thirds of the wheel. Self-driven, with steady momentum.',
    Seesaw:   'Two opposing groups. Life is spent weighing one side against the other.',
    Splash:   'Planets spread around the whole wheel. Wide interests and many talents.',
    Splay:    'Irregular clusters. Individualistic and resistant to being categorised.'
  };

  root.ChartContent = { POINTS, SIGN_STYLE, SIGN_TEXT, HOUSES, ASPECT_TEXT, ASPECT_MEANING, ELEMENTS, MODES, MOON_PHASES, SIGNATURE, SHAPES };
})(typeof window !== 'undefined' ? window : globalThis);

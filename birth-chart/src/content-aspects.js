/*
 * Aspect interpretations: a theme for every pair of points, plus how each
 * point expresses itself when the contact flows (gift) or grinds (challenge).
 */
(function (root) {
  'use strict';

  const PAIR = {
    'sun|moon': 'will and needs, head and heart, what you want and what you need',
    'sun|mercury': 'identity and thinking; your ideas carry your personality',
    'sun|venus': 'identity and affection; charm, taste and the wish to be liked',
    'sun|mars': 'identity and drive; courage, energy and competitiveness',
    'sun|jupiter': 'identity and growth; confidence, generosity and optimism',
    'sun|saturn': 'identity and limits; discipline, self-doubt and hard-won authority',
    'sun|uranus': 'identity and freedom; originality and a need to be different',
    'sun|neptune': 'identity and imagination; sensitivity, idealism and blurred self-image',
    'sun|pluto': 'identity and power; intensity, willpower and deep self-renewal',
    'sun|nnode': 'identity and life direction; your core self is tied to your growth path',
    'sun|chiron': 'identity and healing; a sensitivity about being yourself that becomes wisdom',
    'sun|lilith': 'identity and raw instinct; refusing to be tamed',
    'sun|asc': 'identity and presentation; who you are shows readily',
    'sun|mc': 'identity and vocation; purpose and career are linked',
    'moon|mercury': 'feelings and thoughts; how easily you can put emotions into words',
    'moon|venus': 'needs and affection; tenderness, comfort and emotional charm',
    'moon|mars': 'feelings and action; emotional courage, temper and protectiveness',
    'moon|jupiter': 'feelings and growth; emotional generosity, faith and warmth',
    'moon|saturn': 'feelings and control; emotional reserve, duty and resilience',
    'moon|uranus': 'feelings and freedom; changeable moods and a need for emotional space',
    'moon|neptune': 'feelings and imagination; deep empathy, dreams and sensitivity',
    'moon|pluto': 'feelings and power; intense emotions, loyalty and emotional transformation',
    'moon|nnode': 'emotional needs and life direction',
    'moon|chiron': 'emotional needs and old wounds around care',
    'moon|lilith': 'emotional needs and untamed instinct',
    'moon|asc': 'feelings and presentation; your moods show easily',
    'moon|mc': 'feelings and public life; care and reputation are linked',
    'mercury|venus': 'mind and charm; graceful speech and artistic thinking',
    'mercury|mars': 'mind and drive; quick, sharp and sometimes combative thinking',
    'mercury|jupiter': 'mind and expansion; big ideas, teaching and optimism',
    'mercury|saturn': 'mind and structure; careful, serious and thorough thinking',
    'mercury|uranus': 'mind and originality; flashes of insight and unusual ideas',
    'mercury|neptune': 'mind and imagination; poetic, intuitive but sometimes vague thinking',
    'mercury|pluto': 'mind and depth; penetrating, persuasive and investigative thought',
    'mercury|nnode': 'thinking and your growth path',
    'mercury|chiron': 'thinking and a sore spot about being heard or understood',
    'mercury|lilith': 'thinking and saying the unsayable',
    'mercury|asc': 'mind and presentation; you come across as articulate',
    'mercury|mc': 'mind and career; communication is part of your work',
    'venus|mars': 'love and desire; attraction, passion and creative energy',
    'venus|jupiter': 'love and abundance; generosity, pleasure and good fortune',
    'venus|saturn': 'love and commitment; loyalty, caution and serious bonds',
    'venus|uranus': 'love and freedom; sudden attractions and unconventional relationships',
    'venus|neptune': 'love and idealism; romance, art and the risk of illusion',
    'venus|pluto': 'love and intensity; obsession, depth and transformation through love',
    'venus|nnode': 'love and your growth path; relationships guide direction',
    'venus|chiron': 'love and a sore spot about being lovable',
    'venus|lilith': 'love and uncompromising desire',
    'venus|asc': 'charm and presentation; you come across as attractive and pleasant',
    'venus|mc': 'values and career; art, beauty or diplomacy in your work',
    'mars|jupiter': 'drive and expansion; enthusiasm, boldness and big ventures',
    'mars|saturn': 'drive and restraint; endurance, frustration and disciplined effort',
    'mars|uranus': 'drive and disruption; sudden action, rebellion and inventiveness',
    'mars|neptune': 'drive and ideals; inspired action or scattered energy',
    'mars|pluto': 'drive and power; enormous willpower and intensity',
    'mars|nnode': 'drive and your growth path; action moves you forward',
    'mars|chiron': 'drive and a sore spot about asserting yourself',
    'mars|lilith': 'drive and raw instinct; fierce independence',
    'mars|asc': 'energy and presentation; you come across as dynamic and direct',
    'mars|mc': 'drive and career; ambition and competitive work',
    'jupiter|saturn': 'growth and limits; balancing expansion with realism',
    'jupiter|uranus': 'growth and freedom; lucky breaks and sudden opportunities',
    'jupiter|neptune': 'growth and ideals; faith, compassion and spiritual vision',
    'jupiter|pluto': 'growth and power; ambition and large-scale transformation',
    'jupiter|nnode': 'growth and life direction; faith supports your path',
    'jupiter|chiron': 'growth and healing; wisdom gained from pain',
    'jupiter|lilith': 'growth and untamed freedom',
    'jupiter|asc': 'optimism and presentation; you come across as warm and generous',
    'jupiter|mc': 'growth and career; opportunities for success and recognition',
    'saturn|uranus': 'tradition and change; the tension between old structures and new ideas',
    'saturn|neptune': 'reality and dreams; making ideals practical',
    'saturn|pluto': 'structure and power; endurance under pressure',
    'saturn|nnode': 'responsibility and your growth path',
    'saturn|chiron': 'limits and healing; maturity through difficulty',
    'saturn|lilith': 'rules and rebellion',
    'saturn|asc': 'seriousness and presentation; you come across as mature and reserved',
    'saturn|mc': 'discipline and career; slow, steady success',
    'uranus|neptune': 'a generational link between innovation and ideals',
    'uranus|pluto': 'a generational link between revolution and transformation',
    'uranus|nnode': 'freedom and your growth path',
    'uranus|chiron': 'freedom and healing; breakthroughs around old wounds',
    'uranus|lilith': 'freedom and radical instinct',
    'uranus|asc': 'originality and presentation; you come across as unusual',
    'uranus|mc': 'change and career; an unconventional path',
    'neptune|pluto': 'a generational link between ideals and transformation',
    'neptune|nnode': 'ideals and your growth path',
    'neptune|chiron': 'compassion and healing; a healer\'s sensitivity',
    'neptune|lilith': 'dreams and untamed instinct',
    'neptune|asc': 'imagination and presentation; you come across as gentle or elusive',
    'neptune|mc': 'ideals and career; creative, spiritual or caring work',
    'pluto|nnode': 'power and your growth path; a fated sense of transformation',
    'pluto|chiron': 'power and healing; deep psychological renewal',
    'pluto|lilith': 'power and untamed instinct',
    'pluto|asc': 'intensity and presentation; you come across as powerful and magnetic',
    'pluto|mc': 'power and career; influence and ambition',
    'nnode|chiron': 'growth path and healing',
    'nnode|lilith': 'growth path and untamed instinct',
    'nnode|asc': 'growth path and presentation',
    'nnode|mc': 'growth path and career',
    'chiron|lilith': 'wound and untamed instinct',
    'chiron|asc': 'healing and presentation; a visible sensitivity',
    'chiron|mc': 'healing and career; a vocation in healing or teaching',
    'lilith|asc': 'untamed instinct and presentation',
    'lilith|mc': 'untamed instinct and career',
    'asc|mc': 'presentation and career'
  };

  // How each point shows up when the aspect helps (gift) or strains (challenge).
  const EXPRESS = {
    sun: ['confidence and a clear sense of purpose', 'ego clashes or trouble knowing what you want'],
    moon: ['emotional ease and good instincts', 'moodiness or unmet emotional needs'],
    mercury: ['clear thinking and good communication', 'misunderstandings or nervous overthinking'],
    venus: ['charm, pleasure and easy relationships', 'indulgence or relationship friction'],
    mars: ['energy, courage and effective action', 'impatience, anger or conflict'],
    jupiter: ['luck, faith and generosity', 'excess, overconfidence or overpromising'],
    saturn: ['discipline, stability and mastery', 'fear, delay or harsh self-judgement'],
    uranus: ['insight, originality and welcome change', 'disruption, restlessness or rebellion'],
    neptune: ['inspiration, compassion and imagination', 'confusion, escapism or disillusionment'],
    pluto: ['depth, resilience and personal power', 'control struggles or compulsions'],
    nnode: ['a clear sense of direction', 'tension between comfort and growth'],
    chiron: ['wisdom and the ability to help others heal', 're-opened wounds'],
    lilith: ['authentic, fearless expression', 'defiance or feelings of rejection'],
    asc: ['an easy way of presenting yourself', 'friction in how you come across'],
    mc: ['career support', 'career pressure or conflicting goals']
  };

  const FAMILY = {
    conjunction: 'These two work as one unit, so each amplifies the other.',
    trine: 'This is an easy flow and a natural talent that works without effort.',
    sextile: 'This is an opportunity that pays off when you make use of it.',
    square: 'This is dynamic friction. It creates stress and also the drive to act and grow.',
    opposition: 'This is a push and pull. Awareness grows through balancing both sides, often through other people.',
    quincunx: 'These two do not naturally understand each other and need constant small adjustments.',
    semisextile: 'This is a mild link that needs a little effort to integrate.',
    semisquare: 'This is low-level friction felt as irritation.',
    sesquiquadrate: 'This is built-up tension that seeks release.'
  };

  const ORDER = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'nnode', 'chiron', 'lilith', 'asc', 'mc'];

  function pairTheme(a, b) {
    const [x, y] = ORDER.indexOf(a) <= ORDER.indexOf(b) ? [a, b] : [b, a];
    return PAIR[`${x}|${y}`] || null;
  }

  // Full sentence reading for an aspect.
  function readAspect(a, b, aspectKey, tone, names) {
    const theme = pairTheme(a, b);
    const parts = [];
    if (theme) parts.push(`This contact links ${theme}.`);
    parts.push(FAMILY[aspectKey] || '');
    const ea = EXPRESS[a], eb = EXPRESS[b];
    if (ea && a === b) {
      if (tone === 'flow') parts.push(`At its best, both people bring ${ea[0]}.`);
      else if (tone === 'tension') parts.push(`Under pressure this shows as ${ea[1]} on both sides. Worked with consciously, it turns into ${ea[0]}.`);
      else if (aspectKey === 'conjunction') parts.push(`It doubles ${ea[0]}, and when unbalanced it doubles ${ea[1]}.`);
      else parts.push(`Each expresses ${ea[0]} in a different way, which takes some adjusting.`);
    } else if (ea && eb) {
      if (tone === 'flow') parts.push(`At its best: ${ea[0]} supported by ${eb[0]}.`);
      else if (tone === 'tension') parts.push(`Under pressure: ${ea[1]}, meeting ${eb[1]}. Worked with consciously, it turns into ${ea[0]} and ${eb[0]}.`);
      else if (aspectKey === 'conjunction') parts.push(`It can bring ${ea[0]} and ${eb[0]}, or, when unbalanced, ${ea[1]} and ${eb[1]}.`);
      else parts.push(`It asks you to reconcile ${names[0]}'s need for ${ea[0]} with ${names[1]}'s need for ${eb[0]}.`);
    }
    return parts.join(' ');
  }

  // Natal reading: a paragraph written for this exact pair and aspect type when one exists.
  function natalAspect(a, b, aspectKey, tone, names) {
    const table = root.ChartNatalAspects || {};
    const [x, y] = ORDER.indexOf(a) <= ORDER.indexOf(b) ? [a, b] : [b, a];
    const entry = table[`${x}|${y}`];
    const slot = aspectKey === 'conjunction' ? 0 : ['trine', 'sextile'].includes(aspectKey) ? 1 : ['square', 'opposition'].includes(aspectKey) ? 2 : -1;
    if (entry && slot >= 0 && entry[slot]) {
      const theme = pairTheme(a, b);
      return (theme ? `This contact links ${theme}. ` : '') + entry[slot];
    }
    return readAspect(a, b, aspectKey, tone, names);
  }

  root.ChartAspectText = { PAIR, EXPRESS, FAMILY, pairTheme, readAspect, natalAspect };
})(typeof window !== 'undefined' ? window : globalThis);

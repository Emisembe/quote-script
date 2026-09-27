/*
 * Life-topic knowledge used by the Life guidance tab: career fields, work style,
 * love languages, money style, wellbeing, and the keywords that route a typed
 * question to a topic. Sign arrays follow zodiac order (Aries ... Pisces).
 */
(function (root) {
  'use strict';

  const CAREER_BY_SIGN = [
    ['entrepreneurship', 'emergency services', 'sport and fitness', 'military or security', 'sales', 'start-ups'],
    ['finance and banking', 'food and hospitality', 'design and craft', 'agriculture and land', 'music', 'real estate'],
    ['writing and journalism', 'teaching', 'media and marketing', 'sales and trade', 'translation', 'transport and logistics'],
    ['care and nursing', 'hospitality and catering', 'property and housing', 'childcare and education', 'social work', 'history and heritage'],
    ['performing arts', 'leadership and management', 'entertainment and events', 'education of young people', 'fashion and luxury', 'politics'],
    ['health and medicine', 'analysis and research', 'editing and quality control', 'administration', 'nutrition', 'engineering'],
    ['law and mediation', 'design and art', 'diplomacy and HR', 'fashion and beauty', 'counselling', 'partnership businesses'],
    ['psychology and therapy', 'research and investigation', 'finance and insurance', 'surgery and medicine', 'crisis work', 'detective work'],
    ['higher education', 'travel and tourism', 'publishing', 'law', 'religion and philosophy', 'international business'],
    ['management and administration', 'government and public service', 'architecture and construction', 'finance', 'consulting', 'running an established business'],
    ['technology and IT', 'science', 'social causes and NGOs', 'innovation and start-ups', 'aviation', 'networks and community work'],
    ['arts, film and music', 'healing and therapy', 'charity and social care', 'spiritual work', 'photography', 'marine or pharmaceutical fields']
  ];

  const CAREER_BY_PLANET = {
    sun: { fields: ['leadership', 'self-employment', 'visible or creative roles'], style: 'You need work where you are recognised and can lead.' },
    moon: { fields: ['caring professions', 'working with the public', 'food and home'], style: 'You work best where you feel emotionally invested and can look after people.' },
    mercury: { fields: ['communication', 'writing', 'trade', 'IT', 'teaching'], style: 'You need mental variety and a steady flow of information.' },
    venus: { fields: ['art and design', 'beauty', 'diplomacy', 'luxury goods'], style: 'You need pleasant surroundings and good relationships at work.' },
    mars: { fields: ['sport', 'engineering', 'surgery', 'competitive business', 'military'], style: 'You need challenge, autonomy and physical or competitive energy.' },
    jupiter: { fields: ['law', 'education', 'publishing', 'travel', 'consulting'], style: 'You need growth, meaning and room to expand.' },
    saturn: { fields: ['management', 'government', 'science', 'architecture'], style: 'You build slowly and reach authority through expertise.' },
    uranus: { fields: ['technology', 'science', 'innovation', 'freelance work'], style: 'You need freedom, variety and room to innovate. Rigid hierarchies frustrate you.' },
    neptune: { fields: ['film and music', 'healing', 'charity', 'spiritual work'], style: 'You need meaningful, imaginative or compassionate work.' },
    pluto: { fields: ['psychology', 'research', 'finance', 'crisis management'], style: 'You are drawn to power, depth and transformation.' }
  };

  const WORK_STYLE = {
    fire: 'You work best with enthusiasm, autonomy and visible goals. Routine drains you, and starting new projects energises you.',
    earth: 'You work best with clear structure, tangible results and fair pay. You are reliable and build steadily.',
    air: 'You work best with people, ideas and communication. You need variety, conversation and intellectual freedom.',
    water: 'You work best when the work means something to you emotionally and the atmosphere feels safe. You read people well.',
    cardinal: 'You like to initiate and lead projects.',
    fixed: 'You like to sustain, deepen and finish what you start.',
    mutable: 'You like variety and adapting to change, and you are good at juggling.'
  };

  const LOVE_LANGUAGE = {
    fire: { gives: 'enthusiasm, compliments and shared adventures', needs: 'excitement, admiration and freedom' },
    earth: { gives: 'practical help, physical affection and reliability', needs: 'consistency, touch and tangible effort' },
    air: { gives: 'conversation, ideas and humour', needs: 'mental connection, space and honest talk' },
    water: { gives: 'emotional attunement, care and loyalty', needs: 'reassurance, closeness and emotional depth' }
  };

  const MONEY_BY_SIGN = [
    'You earn by taking initiative and competing. Income can come in bursts, so an emergency buffer helps.',
    'You build money steadily and value security. Long-term saving and property suit you.',
    'You earn through communication, trade or several income streams. Budget tracking keeps it from scattering.',
    'You tie money to security and family. Property and saving for the home appeal to you.',
    'You earn through creativity or leadership and like to spend generously. Plan so that pride does not drive purchases.',
    'You manage money carefully and earn through skill and service. Detailed budgeting comes naturally.',
    'You earn through partnership, beauty or people skills. Shared finances need clear agreements.',
    'You are strategic and private about money. Investments, shared resources and research into finances suit you.',
    'You are optimistic and generous with money and earn through teaching, travel or big ideas. Watch overspending.',
    'You are disciplined and long-term with money, building wealth gradually through career.',
    'You earn through unusual or technological work, and income may fluctuate. Innovative investments attract you.',
    'Your relationship with money is fluid. Automatic savings and a trusted adviser help, and income can come from creative or caring work.'
  ];

  const WELLBEING = [
    'Recharges through physical exercise, competition and quick wins. Traditionally linked with the head: watch stress headaches and burnout from rushing.',
    'Recharges through nature, good food, music and comfort. Traditionally linked with the throat and neck: keep moving, and don\'t let comfort become stagnation.',
    'Recharges through variety, reading, walking and conversation. Traditionally linked with the lungs, arms and nerves: manage mental overload and breathe deeply.',
    'Recharges through home, family and cooking. Traditionally linked with the stomach and chest: emotions show up in digestion.',
    'Recharges through creativity, play and appreciation. Traditionally linked with the heart and back: joy is medicine.',
    'Recharges through routine, order and useful activity. Traditionally linked with the digestive system: watch worry and perfectionism.',
    'Recharges through beauty, harmony and good company. Traditionally linked with the kidneys and lower back: balance and avoid people-pleasing fatigue.',
    'Recharges through solitude, depth and intense focus. Traditionally linked with the reproductive system: release emotions rather than holding them.',
    'Recharges through travel, outdoor movement and learning. Traditionally linked with the hips and thighs: pace yourself and avoid excess.',
    'Recharges through achievement, structure and time in nature. Traditionally linked with bones, knees and teeth: rest is productive too.',
    'Recharges through friends, new ideas and freedom. Traditionally linked with circulation and ankles: take breaks from screens.',
    'Recharges through music, water, sleep and spiritual practice. Traditionally linked with the feet and immune system: protect your energy and boundaries.'
  ];

  const TOPICS = [
    { key: 'career', name: 'Career and vocation', icon: '♑', examples: ['What career suits me?', 'Should I be self-employed?', 'What is my work style?'],
      words: ['career', 'job', 'work', 'profession', 'vocation', 'business', 'boss', 'calling', 'purpose at work', 'study', 'employ', 'promotion', 'company', 'self-employed', 'entrepreneur'] },
    { key: 'love', name: 'Love and relationships', icon: '♀', examples: ['What kind of partner suits me?', 'How do I show love?', 'What makes relationships hard for me?'],
      words: ['love', 'relationship', 'partner', 'marriage', 'marry', 'romance', 'dating', 'boyfriend', 'girlfriend', 'husband', 'wife', 'soulmate', 'attract', 'divorce', 'breakup', 'crush'] },
    { key: 'money', name: 'Money and resources', icon: '♉', examples: ['How do I handle money?', 'Where can wealth come from?'],
      words: ['money', 'finance', 'wealth', 'rich', 'income', 'salary', 'invest', 'debt', 'saving', 'spend', 'financial'] },
    { key: 'home', name: 'Home and family', icon: '♋', examples: ['What do I need at home?', 'What shaped my family life?'],
      words: ['home', 'family', 'parent', 'mother', 'father', 'house', 'roots', 'children', 'kids', 'move', 'relocate'] },
    { key: 'health', name: 'Wellbeing and energy', icon: '☉', examples: ['How do I recharge?', 'What drains my energy?'],
      words: ['health', 'wellbeing', 'energy', 'stress', 'tired', 'burnout', 'body', 'fitness', 'sleep', 'recharge'] },
    { key: 'purpose', name: 'Life purpose and growth', icon: '☊', examples: ['What is my purpose?', 'What am I here to learn?'],
      words: ['purpose', 'meaning', 'destiny', 'growth', 'lesson', 'soul', 'spiritual', 'path', 'why am i', 'mission'] },
    { key: 'friends', name: 'Friends and community', icon: '♒', examples: ['What kind of friends suit me?', 'How do I fit into groups?'],
      words: ['friend', 'social', 'community', 'group', 'network', 'belong', 'team'] },
    { key: 'mind', name: 'Learning and communication', icon: '☿', examples: ['How do I learn best?', 'How do I communicate?'],
      words: ['learn', 'study', 'school', 'education', 'communicat', 'talk', 'speak', 'write', 'think', 'university', 'exam'] },
    { key: 'strengths', name: 'Strengths and challenges', icon: '△', examples: ['What are my natural talents?', 'What are my biggest challenges?'],
      words: ['strength', 'talent', 'gift', 'weakness', 'challenge', 'good at', 'struggle', 'personality', 'who am i'] }
  ];

  // Route a free-text question to the best topic; returns null when nothing matches.
  function routeQuestion(q) {
    q = q.toLowerCase();
    let best = null, bestScore = 0;
    for (const t of TOPICS) {
      const score = t.words.reduce((s, w) => s + (q.includes(w) ? w.length : 0), 0);
      if (score > bestScore) { best = t; bestScore = score; }
    }
    return best;
  }

  root.ChartTopics = { CAREER_BY_SIGN, CAREER_BY_PLANET, WORK_STYLE, LOVE_LANGUAGE, MONEY_BY_SIGN, WELLBEING, TOPICS, routeQuestion };
})(typeof window !== 'undefined' ? window : globalThis);

/*
 * Detailed career guidance and team building for the Life guidance tab.
 * SIGN_CAREER follows zodiac order (Aries ... Pisces).
 */
(function (root) {
  'use strict';

  // Concrete roles, the environment that suits, what to avoid and a first step, per sign.
  const SIGN_CAREER = [
    { roles: ['founder or start-up lead', 'sales manager', 'emergency or rescue worker', 'personal trainer or coach', 'project launcher', 'surgeon', 'police or military officer', 'competitive athlete'],
      env: 'Fast, competitive and goal-driven, with room to act on your own initiative and clear wins to aim for.', avoid: 'Slow bureaucracy, endless meetings and roles where you only maintain what others started.', start: 'Pick one bold project with a deadline and lead it from start to finish. Results are your CV.' },
    { roles: ['financial adviser or banker', 'chef or food entrepreneur', 'interior or product designer', 'real-estate agent', 'farmer or landscape designer', 'jeweller or craftsperson', 'singer or music producer', 'property manager'],
      env: 'Stable, well-paid and comfortable, where quality matters and you can build something lasting at your own pace.', avoid: 'Constant change, unstable income and rushed work that cannot be done properly.', start: 'Turn a practical skill into steady income, then grow it slowly. Certifications and a strong portfolio matter for you.' },
    { roles: ['journalist or content writer', 'teacher or trainer', 'marketing or social-media manager', 'salesperson or trader', 'translator or interpreter', 'podcaster or broadcaster', 'logistics coordinator', 'IT support or developer'],
      env: 'Varied, social and full of information, with several projects at once and plenty of conversation.', avoid: 'Repetitive, isolated work with one task all day and no one to talk to.', start: 'Write, speak or teach publicly about what you know. Several income streams suit you better than one.' },
    { roles: ['nurse or midwife', 'chef or caterer', 'childcare worker or teacher', 'social worker', 'real-estate or housing officer', 'historian or museum curator', 'family therapist', 'hospitality manager'],
      env: 'Warm and supportive, where people feel like family and your care makes a visible difference.', avoid: 'Cold, cut-throat cultures and roles with no emotional meaning.', start: 'Start where you already care: a cause, a community or a home-based business. Trust grows your work.' },
    { roles: ['manager or director', 'actor, presenter or performer', 'event organiser', 'brand manager', 'fashion or luxury retail', 'youth leader or teacher', 'creative director', 'politician or public figure'],
      env: 'Visible and creative, where your work is recognised and you can lead or perform.', avoid: 'Invisible back-office roles and bosses who take the credit.', start: 'Put yourself in front of an audience: present, lead an event or build a personal brand.' },
    { roles: ['doctor, nurse or pharmacist', 'data analyst', 'editor or proofreader', 'accountant', 'nutritionist or dietitian', 'quality-control or compliance officer', 'administrator or office manager', 'engineer'],
      env: 'Orderly and useful, with clear standards and work that helps people in practical ways.', avoid: 'Chaos, sloppy standards and roles with no tangible result.', start: 'Become the person who fixes and improves things. Specialise and get certified.' },
    { roles: ['lawyer or mediator', 'HR manager', 'diplomat or public-relations officer', 'graphic or fashion designer', 'beauty or styling professional', 'counsellor', 'wedding or event planner', 'business partner in a firm'],
      env: 'Harmonious and attractive, with partnership, fairness and good relationships at its heart.', avoid: 'Hostile, unfair or ugly environments and working entirely alone.', start: 'Partner with someone whose skills complement yours, and offer mediation, design or advice.' },
    { roles: ['psychologist or therapist', 'researcher or investigator', 'surgeon', 'financial analyst or investor', 'insurance or risk specialist', 'crisis or turnaround manager', 'forensic scientist', 'detective or security specialist'],
      env: 'Deep, private and intense, where you can investigate, transform and hold real power or trust.', avoid: 'Superficial work, office politics without depth and being micromanaged.', start: 'Specialise deeply in one area that others find difficult or taboo. Mastery is your edge.' },
    { roles: ['lecturer or professor', 'travel or tour professional', 'publisher or author', 'lawyer', 'international business manager', 'religious or spiritual leader', 'coach or motivational speaker', 'import/export trader'],
      env: 'Free, meaningful and broad, with learning, travel and a bigger purpose.', avoid: 'Narrow, repetitive roles and being tied to one desk or one place.', start: 'Study or teach something you believe in. International connections open doors for you.' },
    { roles: ['executive or general manager', 'civil servant', 'architect', 'engineer or construction manager', 'accountant or auditor', 'management consultant', 'business owner', 'project manager'],
      env: 'Structured and ambitious, with a clear ladder, real responsibility and long-term rewards.', avoid: 'Disorganised places, unclear authority and work with no future.', start: 'Choose a field with a clear ladder and climb it patiently. Your authority grows with age.' },
    { roles: ['software developer or IT specialist', 'scientist or engineer', 'NGO or social-enterprise worker', 'product innovator', 'pilot or aviation professional', 'community or network organiser', 'UX researcher', 'freelancer in technology'],
      env: 'Innovative, independent and future-focused, with like-minded people and a cause.', avoid: 'Rigid hierarchies, outdated methods and dress codes for their own sake.', start: 'Join or build a community around a new idea. Technology and networks multiply your reach.' },
    { roles: ['artist, musician or filmmaker', 'therapist or healer', 'nurse or carer', 'photographer', 'charity or aid worker', 'spiritual teacher', 'marine biologist', 'pharmacist'],
      env: 'Creative, compassionate and calm, where imagination and kindness are valued.', avoid: 'Harsh, purely numbers-driven or highly political workplaces.', start: 'Give your creativity or compassion a practical channel and a steady routine to protect your energy.' }
  ];

  // Talents and roles linked to a strong planet.
  const PLANET_CAREER = {
    sun: { talent: 'leadership and being seen', roles: ['team leader', 'self-employed professional', 'presenter'] },
    moon: { talent: 'caring for people and reading the public mood', roles: ['carer', 'customer-experience lead', 'hospitality'] },
    mercury: { talent: 'communication, analysis and trade', roles: ['writer', 'analyst', 'salesperson', 'teacher'] },
    venus: { talent: 'beauty, harmony and relationships', roles: ['designer', 'diplomat', 'stylist'] },
    mars: { talent: 'drive, courage and competition', roles: ['entrepreneur', 'athlete', 'engineer', 'surgeon'] },
    jupiter: { talent: 'growth, teaching and opportunity', roles: ['teacher', 'lawyer', 'consultant', 'publisher'] },
    saturn: { talent: 'structure, discipline and expertise', roles: ['manager', 'administrator', 'architect'] },
    uranus: { talent: 'innovation and independent thinking', roles: ['technologist', 'inventor', 'freelancer'] },
    neptune: { talent: 'imagination, healing and compassion', roles: ['artist', 'healer', 'charity worker'] },
    pluto: { talent: 'depth, research and transformation', roles: ['psychologist', 'researcher', 'investor'] }
  };

  // Questions to judge a job offer, keyed by what the chart most needs.
  const OFFER_CHECK = {
    fire: 'Will I lead something of my own within the first year?', earth: 'Is the pay fair and stable, and are the expectations clear?',
    air: 'Will I learn and talk with interesting people every week?', water: 'Do I trust these people, and does the work mean something to me?',
    cardinal: 'Can I start new things here?', fixed: 'Can I stay and build here for years?', mutable: 'Will the work stay varied?'
  };

  // Team roles. A chart covers a role when the listed planets are prominent.
  const TEAM_ROLES = [
    { key: 'lead', name: 'Leader', does: 'Sets direction, makes final calls and represents the team.', planets: ['sun', 'jupiter'], signs: ['Leo', 'Aries', 'Capricorn'], mbti: 'EJ types (ENTJ, ESTJ, ENFJ)', ask: 'Tell me about a time you had to make an unpopular decision.' },
    { key: 'drive', name: 'Driver', does: 'Pushes for results, deadlines and momentum when things stall.', planets: ['mars', 'pluto'], signs: ['Aries', 'Scorpio', 'Capricorn'], mbti: 'ESTP, ENTJ, ESTJ', ask: 'What is the hardest target you have hit, and how?' },
    { key: 'vision', name: 'Visionary', does: 'Sees the big picture, new ideas and where the market is going.', planets: ['jupiter', 'uranus', 'neptune'], signs: ['Sagittarius', 'Aquarius', 'Pisces'], mbti: 'NP types (ENTP, ENFP, INTP)', ask: 'Where do you think this field will be in five years?' },
    { key: 'build', name: 'Organiser', does: 'Turns plans into systems, schedules and budgets that work.', planets: ['saturn', 'mercury'], signs: ['Capricorn', 'Virgo', 'Taurus'], mbti: 'SJ types (ISTJ, ESTJ, ISFJ)', ask: 'Walk me through how you would plan a project from scratch.' },
    { key: 'finish', name: 'Finisher', does: 'Checks quality and details and makes sure work is actually completed.', planets: ['saturn'], signs: ['Virgo', 'Taurus', 'Scorpio'], mbti: 'ISTJ, ISFJ, INTJ', ask: 'Tell me about a mistake you caught before anyone else did.' },
    { key: 'connect', name: 'Connector', does: 'Brings in clients, partners and resources, and keeps the network alive.', planets: ['mercury', 'venus', 'jupiter'], signs: ['Gemini', 'Libra', 'Sagittarius'], mbti: 'EP and EF types (ENFP, ESFP, ESFJ)', ask: 'Who in your network could help us in the first month?' },
    { key: 'care', name: 'Team carer', does: 'Notices how people feel, keeps morale up and resolves friction.', planets: ['moon', 'venus', 'neptune'], signs: ['Cancer', 'Pisces', 'Libra'], mbti: 'SF and NF types (ISFJ, ESFJ, INFJ)', ask: 'How have you helped a struggling colleague?' },
    { key: 'expert', name: 'Specialist', does: 'Brings deep technical knowledge the team relies on.', planets: ['mercury', 'saturn', 'uranus', 'pluto'], signs: ['Virgo', 'Aquarius', 'Scorpio'], mbti: 'IT types (INTJ, INTP, ISTP)', ask: 'Explain the most complex thing you know in simple words.' }
  ];

  // What each element brings to a team, and who to recruit when it is missing.
  const ELEMENT_TEAM = {
    fire: { brings: 'energy, courage and the will to start', recruit: 'someone with fire (Aries, Leo or Sagittarius strong in their chart) to start things, sell and keep morale and momentum high', role: 'drive' },
    earth: { brings: 'practicality, budgets and follow-through', recruit: 'someone with earth (Taurus, Virgo or Capricorn strong) to handle operations, money and deadlines', role: 'build' },
    air: { brings: 'ideas, communication and contacts', recruit: 'someone with air (Gemini, Libra or Aquarius strong) for communication, networking and fresh ideas', role: 'connect' },
    water: { brings: 'empathy, loyalty and reading people', recruit: 'someone with water (Cancer, Scorpio or Pisces strong) to care for clients and the team and to read the mood', role: 'care' }
  };
  const MODE_TEAM = {
    cardinal: { brings: 'starting and initiative', recruit: 'an initiator (Aries, Cancer, Libra or Capricorn) to launch and push new things' },
    fixed: { brings: 'persistence and finishing', recruit: 'a finisher (Taurus, Leo, Scorpio or Aquarius) who stays the course and completes the work' },
    mutable: { brings: 'flexibility and adapting', recruit: 'an adapter (Gemini, Virgo, Sagittarius or Pisces) who handles change and juggles priorities' }
  };

  const LEAD_STYLE = {
    fire: 'You lead from the front by example and enthusiasm. Give people a clear goal and a reason to be excited, then let them run.',
    earth: 'You lead through structure, reliability and fairness. People trust you because you deliver. Remember to share the vision, not only the plan.',
    air: 'You lead through ideas, conversation and inclusion. People follow because they feel heard. Make sure decisions actually get made.',
    water: 'You lead through care, loyalty and intuition. People feel safe with you. Set boundaries so kindness does not become carrying everyone.'
  };

  const HIRING = [
    'Hire for character first and skills second: skills can be taught, honesty and reliability cannot.',
    'Fill the gaps in your chart rather than hiring people just like you. Similar people agree easily but share the same blind spots.',
    'Give a small paid trial task before committing. How someone works beats how they interview.',
    'Check how they speak about past teams and bosses. Blame on everyone else is a warning.',
    'Agree roles, decision rights and how disagreements are settled in writing at the start.',
    'Compare your chart with a key person\'s chart on Compatibility → Business & work before a partnership.'
  ];

  root.ChartCareer = { SIGN_CAREER, PLANET_CAREER, OFFER_CHECK, TEAM_ROLES, ELEMENT_TEAM, MODE_TEAM, LEAD_STYLE, HIRING };
})(typeof window !== 'undefined' ? window : globalThis);

/*
 * Love & connection: how to connect with each sign, polarity, palmistry, personality
 * types (MBTI), choosing a partner, boundaries and timing. Written for anyone, about anyone.
 */
(function (root) {
  'use strict';

  // By sign (zodiac order). Used for the Sun (who they are), Venus (what attracts them),
  // Moon (what makes them feel safe) and Mars (what excites them).
  const SIGNS = [
    { energy: 'Bold, spontaneous, competitive and direct. Acts first, thinks later, and moves fast in attraction too.',
      attracted: 'Confidence, a playful challenge, and someone who takes the lead without hesitating.',
      connect: 'Be direct and decisive. Challenge them playfully, match their energy, keep things moving.',
      avoid: 'Passivity, asking permission for everything, hesitation, being predictable.',
      lead: 'high', needs: 'to feel they inspire you',
      say: ['"You make me want to be bolder."', '"You\'re the most alive person I\'ve been around in a long time."'],
      dates: ['an active date: climbing, go-karts, a hike', 'a spontaneous plan made on the day', 'a friendly competition'] },
    { energy: 'Sensual, patient, loyal and comfort-loving. Moves slowly and deliberately and is rarely impulsive.',
      attracted: 'Stability, quality, physical presence, and reliability shown through consistent action.',
      connect: 'Take them somewhere genuinely nice. Be patient: they warm slowly, but their loyalty is complete once given.',
      avoid: 'Rushing, inconsistency, cheap or low-effort plans, sudden changes of plan.',
      lead: 'medium', needs: 'to feel safe and cherished',
      say: ['"I feel completely at ease with you. That\'s rare for me."', '"I love just being near you, no agenda."'],
      dates: ['a really good meal', 'a garden, market or countryside walk', 'cooking together'] },
    { energy: 'Witty, curious, social and restless. Changes mood quickly and needs constant mental stimulation.',
      attracted: 'Wit, intelligence, surprise, and someone who can keep up with the banter.',
      connect: 'Be funny and surprising. Bring lots of topics and let the conversation wander.',
      avoid: 'Getting too heavy too early, predictability, demanding deep emotional intensity before they are ready.',
      lead: 'medium', needs: 'to feel mentally matched',
      say: ['"Talking to you never gets boring."', '"You keep surprising me, and I like that."'],
      dates: ['a quiz night or bookshop', 'a walk through a lively part of town', 'a talk, comedy show or festival'] },
    { energy: 'Nurturing, intuitive, emotionally sensitive and protective of the people they love.',
      attracted: 'Emotional safety, and someone who makes them feel protected and genuinely cared for.',
      connect: 'Be consistent and gentle. Remember the small things they tell you and create warmth.',
      avoid: 'Emotional games, hot-and-cold behaviour, anything that makes them feel unsafe.',
      lead: 'high', needs: 'to feel emotionally protected',
      say: ['"You don\'t have to be strong all the time, not with me."', '"Let me take care of you too."'],
      dates: ['a home-cooked dinner', 'a quiet place by the water', 'something tied to a happy memory of theirs'] },
    { energy: 'Warm, generous, loyal and proud. Shines brightest when genuinely seen and celebrated.',
      attracted: 'Confidence, warmth, and someone secure enough to celebrate them without competing.',
      connect: 'Give specific, genuine appreciation, not flattery. Make them feel extraordinary.',
      avoid: 'Competing for attention, being stingy with appreciation, making them feel invisible.',
      lead: 'medium', needs: 'to feel seen and celebrated',
      say: ['"You light up every room, and I don\'t think you fully know it."', '"I love watching you in your element."'],
      dates: ['a show, concert or stylish event', 'dressing up for somewhere special', 'a celebration of something they achieved'] },
    { energy: 'Detail-oriented, analytical, quietly caring. Reserved on the surface, deeply loyal underneath.',
      attracted: 'Competence, thoughtfulness, reliability, and someone who notices the small things.',
      connect: 'Show that you are capable and organised. Notice details about them. Be interesting without ego.',
      avoid: 'Sloppiness, lateness, arrogance, pushing emotional intimacy before they are ready.',
      lead: 'medium', needs: 'to feel genuinely valued',
      say: ['"The care you put into things is genuinely impressive."', '"I notice how much you pour into everything."'],
      dates: ['a well-planned outing that runs on time', 'a cooking or craft class', 'a museum or a long walk with real conversation'] },
    { energy: 'Harmonious, romantic, charming and social, and often torn between options.',
      attracted: 'Romance, beauty, good manners, and someone who plans lovely experiences and makes decisions.',
      connect: 'Plan beautiful dates, be gracious, and decide confidently. They are relieved when someone else chooses.',
      avoid: 'Unresolved conflict, rudeness, pressure, careless or unattractive settings.',
      lead: 'high', needs: 'to feel chosen and appreciated',
      say: ['"You bring so much beauty into my life without trying."', '"Making you happy isn\'t a chore. I want to."'],
      dates: ['an art gallery or beautiful restaurant', 'a concert or dance', 'a picnic somewhere scenic'] },
    { energy: 'Intense, magnetic, private and fiercely loyal. Feels everything strongly and trusts very few people.',
      attracted: 'Depth, mystery and strength: someone who is not afraid of their intensity.',
      connect: 'Keep a little mystery early on. Be honest about your feelings without desperation, and stay steady when tested.',
      avoid: 'Lying (they will sense it), evasiveness, shallow small talk.',
      lead: 'high', needs: 'to feel they can trust you',
      say: ['"I\'m not going anywhere. You can trust me."', '"I want to know all of you, not just the easy parts."'],
      dates: ['a deep one-to-one conversation somewhere private', 'a mystery, escape room or night walk', 'a film followed by a real discussion'] },
    { energy: 'Adventurous, philosophical, honest and freedom-loving. Lives to widen their world.',
      attracted: 'Adventure, humour, and someone who expands their horizons without clipping their wings.',
      connect: 'Plan experiences, not just dinners. Be honest and interesting about ideas.',
      avoid: 'Possessiveness, boring plans, neediness, pinning them down too early.',
      lead: 'low', needs: 'to feel free and understood',
      say: ['"Being around you makes me want to see more of the world."', '"I love that you\'re exactly who you are."'],
      dates: ['a day trip somewhere new', 'food from another culture', 'an outdoor adventure'] },
    { energy: 'Ambitious, disciplined, privately warm and long-term in their thinking.',
      attracted: 'Ambition, reliability and someone with a vision they are working towards.',
      connect: 'Show your work ethic and long-term plans. Be reliable every single time.',
      avoid: 'Laziness, flakiness, financial carelessness, rushing intimacy before trust is built.',
      lead: 'medium', needs: 'to feel respected',
      say: ['"I see everything you\'re building, and it matters."', '"You don\'t have to carry everything alone."'],
      dates: ['a classic, well-organised evening', 'a historic place or a good bar', 'planning something ambitious together'] },
    { energy: 'Independent, unconventional and humanitarian; detached until they decide you are worth it.',
      attracted: 'Originality, respect for their independence, and a mind that thinks differently.',
      connect: 'Be original, support their causes, give them space and stimulate their mind.',
      avoid: 'Clinginess, conventional scripts, emotional pressure, asking for too much too soon.',
      lead: 'low', needs: 'to feel understood, not pressured',
      say: ['"You think unlike anyone I\'ve met."', '"I\'m not trying to change you. I like who you are."'],
      dates: ['a science museum, planetarium or tech event', 'volunteering together', 'something nobody else would think of'] },
    { energy: 'Dreamy, empathetic, creative and spiritual. Absorbs others\' feelings and needs time to recover.',
      attracted: 'Gentle strength: someone who grounds them while honouring their depth.',
      connect: 'Be patient and present, appreciate their creativity, create magical moments.',
      avoid: 'Harsh criticism, coldness, being overly logical about feelings, dismissing their intuition.',
      lead: 'high', needs: 'to feel like home to you',
      say: ['"You feel like a place I want to stay."', '"I\'d rather be lost with you than found with anyone else."'],
      dates: ['the sea, a lake or a river', 'live music or an art event', 'stargazing'] }
  ];
  const LEAD_TEXT = {
    high: 'Responds strongly to a steady, decisive partner who takes the lead.',
    medium: 'Likes a partner who leads with calm confidence, while sharing decisions.',
    low: 'Wants freedom and equality more than being led. Inspire them; do not direct them.'
  };

  const POLARITY = {
    intro: 'Polarity is the contrast between two kinds of energy. Active energy (traditionally called masculine, yang or electric) is purposeful, direct, decisive and steady under pressure. Receptive energy (feminine, yin or magnetic) is flowing, expressive, intuitive and present. Everyone has both, whatever their gender.',
    points: [
      'Attraction often grows from contrast: when one person holds steady and the other flows, they magnetise each other. When both bring the same energy, it can feel more like friendship.',
      'Contrast is not a rule about roles. Many couples switch: one leads at work and the other at home, one leads in a crisis and the other in celebrations.',
      'Active energy is not aggression. It is clarity and calm, especially when the other person is emotional.',
      'Receptive energy is not weakness. It is openness, feeling and the ability to receive.'
    ],
    active: ['Purpose-driven', 'Direct', 'Decisive', 'Steady under pressure', 'Leads'],
    receptive: ['Expressive', 'Flowing', 'Intuitive', 'Present', 'Receives']
  };

  const PALM = {
    intro: 'Palmistry (chiromancy) is a traditional practice found in many cultures. Treat it as a fun conversation and a prompt for reflection, not as a fact about anyone.',
    hands: 'Tradition reads the non-dominant hand as the inner self and potential, and the dominant hand as the personality shown to the world. When the two hands look very different, the person adapts strongly to their surroundings.',
    lines: {
      heart: { name: 'Heart line', where: 'Runs across the top of the palm, from below the little finger.', means: 'Attitude to love and emotional life: how deep, how expressive, how smooth or stormy.' },
      head: { name: 'Head line', where: 'Runs across the middle of the palm, starting between thumb and index finger.', means: 'Thinking style: focus, memory, self-control and creativity. Long and straight suggests logic; curved suggests imagination.' },
      life: { name: 'Life line', where: 'Arcs around the base of the thumb towards the wrist.', means: 'Vitality, energy and major life changes. Its length does not predict lifespan.' },
      fate: { name: 'Fate line', where: 'Rises from the base of the palm towards the middle finger.', means: 'How strongly outside circumstances and career shape the life path.' },
      sun: { name: 'Sun (Apollo) line', where: 'Rises towards the ring finger.', means: 'Talent, popularity and visible success; also called the line of success.' },
      union: { name: 'Relationship lines', where: 'Short lines on the edge of the palm, below the little finger.', means: 'Orientation to close relationships. Several lines are read as several significant bonds.' },
      venus: { name: 'Girdle of Venus', where: 'An arc above the heart line, under the middle and ring fingers.', means: 'Strong sense of beauty, artistic sensitivity and expressive love; easily hurt.' },
      solomon: { name: 'Ring of Solomon', where: 'A fine curve around the base of the index finger. Rare.', means: 'Insight into people, intuition and interest in psychology.' },
      bracelets: { name: 'Bracelet lines', where: 'Lines where the wrist meets the palm.', means: 'Traditionally linked with health, prosperity and good connections; clear lines are read as a good sign.' }
    },
    shapes: [
      { el: 'earth', name: 'Earth hand', look: 'Square palm, square fingers, palm about as long as the fingers.', read: 'Practical, grounded, reliable and hands-on. Can be stubborn.' },
      { el: 'air', name: 'Air hand', look: 'Square or rectangular palm with long fingers.', read: 'Sociable, curious and intellectual. Comfortable with ideas; can seem cool.' },
      { el: 'water', name: 'Water hand', look: 'Long, narrow palm with long, flexible, tapering fingers.', read: 'Creative, perceptive and sympathetic. Intuitive and sometimes moody.' },
      { el: 'fire', name: 'Fire hand', look: 'Long palm with shorter fingers.', read: 'Spontaneous, enthusiastic and bold. Can be impulsive.' }
    ],
    nails: [
      { shape: 'long', name: 'Long nails', read: 'Gentle, romantic and imaginative, with an eye for detail. Can be too trusting.' },
      { shape: 'wide', name: 'Wide nails', read: 'Direct, open-minded and a good debater; can be quick-tempered.' },
      { shape: 'oval', name: 'Round or oval nails', read: 'Easy-going, adaptable and sociable; a natural peacekeeper.' },
      { shape: 'triangle', name: 'Triangular nails', read: 'Creative and detail-aware; can be sensitive or stubborn.' },
      { shape: 'almond', name: 'Almond nails', read: 'Honest, kind, imaginative and polite; impatient with unfairness.' }
    ],
    chinese: [
      { el: 'Metal', read: 'Square palms and nails: rational, a natural leader, stable but emotionally reserved in love.' },
      { el: 'Wood', read: 'Long palm and fingers, firm thumb: independent, creative and idealistic in love.' },
      { el: 'Water', read: 'Wide, soft palm with short fingers: quick learner, adaptable, drawn to very different people.' },
      { el: 'Fire', read: 'Long palm and fingers: emotional and quick, falls in love fast but may cool quickly.' },
      { el: 'Earth', read: 'Thick palm, strong thumb base: wise, self-sacrificing, slow to show feelings.' }
    ]
  };

  // Personality types (MBTI). best/good/hard are typical pairings, not rules.
  const MBTI = {
    INTJ: { name: 'Architect', group: 'Analyst', core: 'Strategic, independent, high standards, private.', love: 'Slow to commit, deeply loyal; shows love through plans and acts of service.', connect: 'Be direct, no games; talk ideas; respect their solitude.', hear: '"The way you think about the long game is different from anyone I know."', best: ['ENFP', 'ENTP', 'INFJ'], hard: ['ESFJ', 'ESFP'] },
    INTP: { name: 'Logician', group: 'Analyst', core: 'Analytical, abstract, unconventional, curious.', love: 'Needs mental connection first; shows love through deep conversation and inside jokes.', connect: 'Challenge their ideas respectfully; do not push for constant contact.', hear: '"I\'ll never get bored talking to you."', best: ['ENTJ', 'ESTJ', 'ENFJ'], hard: ['ESFJ', 'ESFP'] },
    ENTJ: { name: 'Commander', group: 'Analyst', core: 'Decisive, strategic, driven, a natural leader.', love: 'Clear about what they want; shows love by making things happen.', connect: 'Hold your own in a debate; show ambition and direction.', hear: '"You don\'t wait for things to happen, you build them."', best: ['INTP', 'ISTP', 'INFP'], hard: ['ISFP', 'ISFJ'] },
    ENTP: { name: 'Debater', group: 'Analyst', core: 'Quick-witted, inventive, loves possibilities and debate.', love: 'Needs intellectual chemistry; gets curious about you when it is real.', connect: 'Debate them on something real; have your own passions.', hear: '"You just made me rethink that completely."', best: ['INFJ', 'INTJ', 'ENFP'], hard: ['ISFJ', 'ISTJ'] },
    INFJ: { name: 'Advocate', group: 'Diplomat', core: 'Empathetic, visionary, private, purposeful.', love: 'Wants a rare, deep connection; gives everything once open.', connect: 'Be authentic and purposeful; ask deep questions and listen.', hear: '"I see who you really are, and I like that person."', best: ['ENTP', 'ENFP', 'INTJ'], hard: ['ESTP', 'ESFP'] },
    INFP: { name: 'Mediator', group: 'Diplomat', core: 'Idealistic, creative, authentic, gentle.', love: 'Looks for a soulful bond; needs reassurance to open up.', connect: 'Be completely real; never dismiss their feelings.', hear: '"I don\'t want to change you. I want to understand you."', best: ['ENFJ', 'INFJ', 'ENFP'], hard: ['ESTJ', 'ENTJ'] },
    ENFJ: { name: 'Protagonist', group: 'Diplomat', core: 'Charismatic, caring, inspiring, organised.', love: 'Devoted and generous; needs effort returned and appreciated.', connect: 'Show you are growing; appreciate their efforts specifically.', hear: '"You pour so much into others. Let me pour back into you."', best: ['INFP', 'ISFP', 'INFJ'], hard: ['ISTP', 'ESTP'] },
    ENFP: { name: 'Campaigner', group: 'Diplomat', core: 'Enthusiastic, creative, free-spirited, warm.', love: 'Falls fast; needs freedom and a relationship that feels like an adventure.', connect: 'Be enthusiastic and spontaneous; take their dreams seriously.', hear: '"Being around you makes ordinary moments feel bigger."', best: ['INTJ', 'INFJ', 'ENFJ'], hard: ['ISTJ', 'ESTJ'] },
    ISTJ: { name: 'Logistician', group: 'Sentinel', core: 'Dependable, thorough, private, keeps their word.', love: 'Slow to fall, unwavering once committed; shows love through reliability.', connect: 'Be consistent and keep your word; avoid drama.', hear: '"You\'re someone I can actually count on."', best: ['ESFP', 'ESTP', 'ESTJ'], hard: ['ENFP', 'INFP'] },
    ISFJ: { name: 'Defender', group: 'Sentinel', core: 'Warm, devoted, quietly strong, remembers everything.', love: 'Nurturing; shows interest through care rather than words.', connect: 'Appreciate them out loud; be gentle and consistent.', hear: '"I notice everything you do for people. It\'s not invisible to me."', best: ['ESFP', 'ESTP', 'ESTJ'], hard: ['ENTP', 'ENFP'] },
    ESTJ: { name: 'Executive', group: 'Sentinel', core: 'Organised, direct, traditional, committed.', love: 'Takes commitment seriously; shows love by providing stability.', connect: 'Be clear about intentions; be dependable in small things.', hear: '"You get things done while others are still talking."', best: ['ISFP', 'ISTP', 'ISTJ'], hard: ['INFP', 'ENFP'] },
    ESFJ: { name: 'Consul', group: 'Sentinel', core: 'Warm, social, attentive, a community builder.', love: 'Very attentive; needs regular reassurance that love is returned.', connect: 'Be warm to everyone; thank them for specific things.', hear: '"You make everyone feel at home. Do people tell you that enough?"', best: ['ISFP', 'ISTP', 'ISFJ'], hard: ['INTP', 'ENTP'] },
    ISTP: { name: 'Virtuoso', group: 'Explorer', core: 'Practical, independent, calm, hands-on.', love: 'Opens up slowly; time spent together is their love language.', connect: 'Give space; invite them into activities, not long talks.', hear: '"I like that you\'re comfortable just being."', best: ['ESTJ', 'ESFJ', 'ENTJ'], hard: ['ENFJ', 'INFJ'] },
    ISFP: { name: 'Adventurer', group: 'Explorer', core: 'Gentle, artistic, present, private about feelings.', love: 'Shows love through thoughtful acts and shared beauty, rarely in words.', connect: 'Be non-judgemental; share experiences; appreciate their creativity.', hear: '"You see beauty in things most people walk past."', best: ['ESTJ', 'ESFJ', 'ESFP'], hard: ['ENTJ', 'INTJ'] },
    ESTP: { name: 'Entrepreneur', group: 'Explorer', core: 'Bold, energetic, perceptive, lives in the moment.', love: 'Playful and physical; needs excitement and novelty.', connect: 'Be bold, make plans happen now, make them laugh.', hear: '"I like that you go for things, no hesitation."', best: ['ISFJ', 'ISTJ', 'ENTJ'], hard: ['INFJ', 'INFP'] },
    ESFP: { name: 'Entertainer', group: 'Explorer', core: 'Fun, warm, spontaneous, sociable.', love: 'Affectionate and generous; needs a partner who enjoys the present.', connect: 'Be fun and warm, and show real depth underneath.', hear: '"You make ordinary moments worth remembering."', best: ['ISTJ', 'ISFJ', 'ENFP'], hard: ['INTJ', 'INTP'] }
  };
  function mbtiMatch(a, b) {
    if (!MBTI[a] || !MBTI[b]) return null;
    if (MBTI[a].best.includes(b) || MBTI[b].best.includes(a)) return { level: 'best', text: 'A classic complementary pairing: each brings what the other lacks.' };
    if (MBTI[a].hard.includes(b) || MBTI[b].hard.includes(a)) return { level: 'hard', text: 'A more challenging pairing: different needs and pace. It can work well with patience and clear communication, and often brings the most growth.' };
    const shared = [...a].filter((c, i) => c === b[i]).length;
    return shared >= 2 ? { level: 'good', text: 'A workable pairing with enough in common to understand each other easily.' } : { level: 'good', text: 'A workable pairing of different styles. Talk openly about how each of you likes to plan, decide and recharge.' };
  }

  const CHOOSE = {
    method: [
      { k: 'Ask', t: 'The right questions, and listen to what the answers really reveal.' },
      { k: 'Watch', t: 'Behaviour under pressure shows who someone is.' },
      { k: 'Wait', t: 'Give it time. Character reveals itself; it does not need to be announced.' }
    ],
    questions: [
      { q: 'What is your relationship like with your family?', good: 'Close with healthy boundaries; can talk about difficulties with warmth.', watch: 'Intense anger with no reflection, or a family described as perfect.' },
      { q: 'What did your last relationship teach you?', good: 'Takes some responsibility and names what they learned about themselves.', watch: 'All the blame on the ex, or clearly not over it yet.' },
      { q: 'How do you handle disagreements?', good: '"I need a little time to calm down, then I want to talk it through."', watch: 'Shuts down, walks out, or escalates to shouting or ultimatums.' },
      { q: 'What does a happy relationship look like to you?', good: 'Respect, growth, communication, fun, support and safety, described realistically.', watch: 'Only about what they receive, or control described as romance.' },
      { q: 'Where do you see yourself in three to five years?', good: 'Some direction, and goals compatible with the life you want.', watch: 'No reflection at all, or goals that clash with yours on family, place or faith.' },
      { q: 'What makes someone a good friend?', good: 'Loyalty and honesty, backed by long-term friendships.', watch: 'No long-term friends, or "I only trust myself".' },
      { q: 'What are you working on in yourself right now?', good: 'Names something real without shame.', watch: '"Nothing", especially when combined with defensiveness.' }
    ],
    watch: ['How they treat waiters, drivers and cleaners', 'How they respond to your bad news', 'How they handle frustration that is not their fault', 'Whether they show up when you are ill or struggling', 'Whether they keep small promises', 'How they talk about other people', 'How fair they are with money', 'Whether they actually listen and remember'],
    green: ['Has their own life, friends and goals', 'Is consistent: the same person on date one and month six', 'Respects your time, space and people', 'Can receive love, not only give it', 'Speaks well of you to others', 'Apologises and changes behaviour', 'Makes hard conversations feel safe', 'Celebrates your wins without competing', 'Is kind even when tired, hungry or stressed', 'You feel like yourself around them'],
    red: ['Love-bombing: overwhelming attention very early', 'Isolating you from friends and family', 'Lying about small things', 'Never taking responsibility', 'Using your vulnerabilities against you', 'Jealousy or possessiveness framed as love', 'Contempt: mocking, eye-rolling, making you feel small', 'Wanting to change who you fundamentally are', 'Hot-and-cold behaviour that keeps you anxious', 'You always end up apologising and walking on eggshells'],
    truth: 'You cannot love someone into becoming ready. Become someone worth choosing, and then choose wisely.',
    nonneg: ['Shared core values (faith, family, integrity)', 'How they treat you under stress', 'Honesty and accountability', 'Feeling safe to be yourself', 'Compatible life direction (family, location, lifestyle)', 'Commitment to their own growth', 'Mutual respect in practice'],
    prefs: ['Height and physical type', 'Career or income level', 'Shared hobbies', 'Overlap of friends', 'Communication style (can be learned)', 'Introvert or extrovert balance', 'Tidiness and how weekends are spent']
  };

  const BOUNDARIES = {
    principles: ['Be clear. A kind no heals faster than a vague maybe.', 'Do not ghost. One honest message is owed.', 'Do not over-explain. Say it briefly and stop.', 'Only say "maybe another time" if you mean it.', 'The more time someone has invested, the more personal the conversation should be: in person or a call rather than a text.'],
    scripts: [
      { when: 'Someone you barely know asks you out', say: '"Thank you for asking, I mean that. But I don\'t feel that kind of connection. I hope you find someone great."' },
      { when: 'After one or two dates', say: '"I\'ve enjoyed spending time with you, but I don\'t feel a romantic spark, and I didn\'t want to just disappear on you."' },
      { when: 'A friend tells you they have feelings for you', say: '"It means a lot that you trusted me with that. I don\'t feel the same way, and our friendship matters to me. I understand if you need some space."' },
      { when: 'Ending something undefined', say: '"I owe you honesty. I\'m not in a place to give you what you deserve, and it isn\'t fair to keep going in circles."' },
      { when: 'Someone keeps pushing after a soft no', say: '"I want to be respectful and clear: I\'m not interested romantically, and that won\'t change."' },
      { when: 'Protecting your time', say: '"I keep my evenings for recharging, but weekends work well for me."' },
      { when: 'Slowing the pace', say: '"I like where this is going. I just move at my own pace, and I don\'t want to rush something good."' },
      { when: 'A behaviour that bothers you', say: '"When you do that, it doesn\'t sit right with me. I\'d rather tell you directly than let it build."' }
    ],
    avoid: ['"Maybe when the timing is right" (unless timing really is the only issue)', '"You\'re amazing, anyone would be lucky to have you" as a softener', '"Let\'s still hang out!" before the other person has had time to recover', 'Carrying on exactly as before after saying no']
  };

  const TIMING = {
    slots: [
      { from: 6, to: 11, name: 'Morning', best: 'A warm good morning or something light that makes them smile.', avoid: 'Heavy topics and serious requests.', level: 2 },
      { from: 11, to: 14, name: 'Midday', best: 'A quick question about their day, or making plans for later.', avoid: 'Long paragraphs and several messages in a row.', level: 2 },
      { from: 14, to: 18, name: 'Afternoon', best: 'Something light or funny; or simply let the silence breathe.', avoid: 'Anything that needs a thoughtful answer.', level: 1 },
      { from: 18, to: 21, name: 'Evening (golden window)', best: 'Real conversations, calls, sharing something personal, making plans.', avoid: 'Pulling back just when the conversation opens up.', level: 3 },
      { from: 21, to: 24, name: 'Late evening', best: 'Deeper, personal conversation and a warm goodnight, if you have already been talking.', avoid: 'Starting cold, or starting a conflict: emotions run hotter at night.', level: 2 },
      { from: 0, to: 6, name: 'After midnight', best: 'Use rarely. Be sure of what a message at this hour communicates.', avoid: 'Anything you would not want read in the morning.', level: 0 }
    ],
    days: [
      'Sunday: reflective and open. Good for a meaningful call or check-in.',
      'Monday: busy reset. Keep it warm and brief.',
      'Tuesday: settled into the week. Good for real conversation and plans.',
      'Wednesday: mid-week sweet spot for making plans.',
      'Thursday: best day to suggest weekend plans.',
      'Friday: social and energetic. Good for spontaneous plans, not serious talks.',
      'Saturday: social and active. Do something together rather than text.'
    ],
    replies: ['Long replies matter more than fast replies.', 'Match the other person\'s pace roughly, without turning it into a game.', 'Do not double-text into silence. One message is enough.', 'Reply when it feels right, and live a full life in between.']
  };

  root.ChartConnect = { SIGNS, LEAD_TEXT, POLARITY, PALM, MBTI, mbtiMatch, CHOOSE, BOUNDARIES, TIMING };
})(typeof window !== 'undefined' ? window : globalThis);

/*
 * Personality types (MBTI) across areas of life, how two types work together,
 * and tags that let career suggestions from a type be compared with the chart.
 * Love profiles live in content-connect.js (ChartConnect.MBTI).
 */
(function (root) {
  'use strict';

  const DIMENSIONS = [
    { a: 'E', b: 'I', name: 'Energy', A: 'Extravert: recharges with people and action, thinks out loud.', B: 'Introvert: recharges alone, thinks before speaking.' },
    { a: 'S', b: 'N', name: 'Information', A: 'Sensing: trusts facts, details and experience.', B: 'Intuition: trusts patterns, ideas and possibilities.' },
    { a: 'T', b: 'F', name: 'Decisions', A: 'Thinking: decides by logic and consistency.', B: 'Feeling: decides by values and the effect on people.' },
    { a: 'J', b: 'P', name: 'Lifestyle', A: 'Judging: likes plans, closure and deadlines.', B: 'Perceiving: likes options, flexibility and adapting.' }
  ];

  // Career tags, matched against the chart's career fields by keyword.
  const TAG_WORDS = {
    tech: /tech|\bIT\b|innovation|engineering|aviation|start-up|science/i,
    science: /science|research|analysis|engineering|investigation|detective/i,
    care: /care|nursing|social|childcare|healing|therapy|counselling|charity|health|medicine|nutrition|psychology/i,
    arts: /art|design|music|film|fashion|beauty|photography|performing|craft|creative|entertainment/i,
    business: /business|entrepreneur|sales|trade|management|finance|banking|consulting|real estate|start-up|self-employment|leadership|insurance|luxury/i,
    people: /teaching|education|HR|diplomacy|mediation|counselling|public|community|networks|hospitality|young people/i,
    words: /writing|journalism|media|publishing|translation|communication|marketing/i,
    law: /law|government|politics|public service|mediation|military|security|administration/i,
    action: /sport|fitness|emergency|military|surgery|crisis|security|competitive|travel|tourism|transport/i,
    structure: /administration|management|editing|quality|architecture|construction|government|logistics|established/i,
    spirit: /spiritual|religion|philosophy|healing|charity|heritage/i
  };
  const tagsOf = field => Object.keys(TAG_WORDS).filter(t => TAG_WORDS[t].test(field));

  const LIFE = {
    INTJ: { career: ['strategy and consulting', 'engineering and systems design', 'research and science', 'finance and investment', 'law'], tags: ['science', 'tech', 'business', 'law', 'structure'],
      work: 'Works best alone or with a small, competent team, with a long-range goal and the freedom to design how to reach it.', lead: 'long-term strategy, systems and quality standards',
      money: 'A planner: invests early, researches before buying and dislikes waste. Can be too private about money with a partner.',
      stress: 'Incompetence, pointless rules, constant interruptions and being forced to improvise.', recover: 'Solitude, a hard problem to solve, and a plan put back in order.',
      learn: 'Self-directed and conceptual: wants the theory and the why first, then masters it alone.', comm: 'Brief, direct and logical. May skip the warmth people need to hear the message.',
      grow: 'Share the plan before it is finished, ask for input and show appreciation out loud.', friends: 'A few deep, long-term friends who enjoy ideas and do not need constant contact.' },
    INTP: { career: ['software and data', 'science and research', 'philosophy and academia', 'engineering', 'analysis and design'], tags: ['tech', 'science', 'spirit', 'words'],
      work: 'Needs autonomy, interesting problems and time to think. Routine and micromanagement drain them quickly.', lead: 'problem-solving, research and improving how things work',
      money: 'Indifferent to money until it limits freedom. Benefits from automatic saving so it does not depend on attention.',
      stress: 'Emotional pressure, small talk, rigid deadlines and being rushed to a decision.', recover: 'Time alone with a fascinating topic, a game or a project with no audience.',
      learn: 'By questioning everything and building their own model. Bored by memorising without understanding.', comm: 'Precise, curious and full of caveats. Can sound detached when they are actually engaged.',
      grow: 'Finish and ship things, and say what they feel as well as what they think.', friends: 'A small circle that enjoys long conversations, debates and shared interests.' },
    ENTJ: { career: ['executive management', 'entrepreneurship', 'law', 'consulting', 'finance and investment'], tags: ['business', 'law', 'structure', 'science'],
      work: 'Thrives in charge of something ambitious with clear goals, measurable results and capable people around them.', lead: 'direction, decisions, targets and negotiation',
      money: 'Ambitious and strategic with money: builds income, invests and expects a return. Watch spending on status.',
      stress: 'Inefficiency, indecision, losing control of an outcome and feeling incompetent.', recover: 'A clear win, exercise and time to reset the plan.',
      learn: 'Fast, goal-driven and practical: learns what serves the objective, from experts and by doing.', comm: 'Direct, confident and decisive. Can steamroll quieter people without meaning to.',
      grow: 'Listen fully before deciding, and value feelings as real information.', friends: 'Friends who are driven, honest and up for a challenge; loyal once trust is earned.' },
    ENTP: { career: ['entrepreneurship and start-ups', 'marketing and media', 'consulting', 'law and debate', 'innovation and technology'], tags: ['business', 'tech', 'words', 'law'],
      work: 'Thrives on new ideas, variety and challenge. Starts brilliantly and needs others to finish and maintain.', lead: 'new ideas, pitching, opportunities and solving problems in a crisis',
      money: 'Spends on experiences and new ventures; income can be irregular. Needs a buffer and a partner or tool for the details.',
      stress: 'Routine, rules for their own sake, detail work and people who will not engage with ideas.', recover: 'A lively conversation, a new project or a change of scene.',
      learn: 'By debating, experimenting and jumping between topics. Learns fastest when they can argue with the material.', comm: 'Quick, witty and provocative. Plays devil\'s advocate, which others can take as an attack.',
      grow: 'Follow through, and check whether the other person wants a debate or support.', friends: 'Many friends and wide networks; loves people who can keep up and argue back.' },
    INFJ: { career: ['counselling and psychology', 'writing', 'education', 'healthcare', 'non-profit and social causes'], tags: ['care', 'words', 'people', 'spirit'],
      work: 'Needs meaningful work aligned with their values, a calm environment and time to work deeply.', lead: 'vision, purpose, people development and the culture of a team',
      money: 'Careful and values-driven: spends on meaning, not status. Can undercharge for their work.',
      stress: 'Conflict, injustice, superficial work and too much time with people without recovery.', recover: 'Solitude, writing, nature and one honest conversation.',
      learn: 'Through big-picture understanding and personal meaning; writes to think.', comm: 'Warm, thoughtful and insightful. Avoids conflict until they suddenly close the door.',
      grow: 'Voice needs early instead of absorbing them, and accept imperfect people and plans.', friends: 'A few very close friends; deep conversation over large groups.' },
    INFP: { career: ['writing and the arts', 'counselling', 'education', 'design', 'social and environmental causes'], tags: ['arts', 'words', 'care', 'spirit'],
      work: 'Needs work that expresses their values, creative freedom and a kind atmosphere.', lead: 'creative direction, values, writing and caring for people',
      money: 'Idealistic about money and may avoid budgets. Does best with a simple system and money tied to a meaningful goal.',
      stress: 'Criticism of their values, harsh environments, bureaucracy and pressure to conform.', recover: 'Creative time, music, nature and quiet reflection.',
      learn: 'When they care about the subject; through stories, imagination and personal connection.', comm: 'Gentle, sincere and expressive in writing. May hold back in person to keep the peace.',
      grow: 'Turn ideals into small daily actions and speak up in disagreements.', friends: 'Loyal, accepting friendships with people who appreciate their inner world.' },
    ENFJ: { career: ['teaching and training', 'HR and coaching', 'public relations', 'counselling', 'leadership in non-profits'], tags: ['people', 'care', 'words', 'business'],
      work: 'Thrives leading and developing people towards a shared purpose, with plenty of collaboration.', lead: 'people, team morale, presentations and partnerships',
      money: 'Generous, often spends on others. Needs to budget for themselves as carefully as they do for loved ones.',
      stress: 'Disharmony, being unappreciated, cold environments and feeling they have let someone down.', recover: 'Time with close people, then genuine time alone without helping anyone.',
      learn: 'In groups and through discussion; teaching others is how they master a subject.', comm: 'Warm, persuasive and encouraging. Can over-accommodate or tell people what they want to hear.',
      grow: 'Let others solve their own problems, and look after their own needs first.', friends: 'A wide, warm circle; the organiser who keeps everyone connected.' },
    ENFP: { career: ['marketing and creative media', 'coaching and counselling', 'entrepreneurship', 'teaching', 'journalism'], tags: ['words', 'arts', 'people', 'business', 'care'],
      work: 'Thrives on variety, people, creativity and possibility; struggles with repetitive admin.', lead: 'brainstorming, inspiring people, networking and launches',
      money: 'Spontaneous with money and generous. Automatic savings and a simple spending plan protect them.',
      stress: 'Routine, micromanagement, too many details and feeling boxed in.', recover: 'Talking it out with a friend, new experiences and creative play.',
      learn: 'By exploring, connecting ideas and doing it with others. Needs variety to stay engaged.', comm: 'Enthusiastic, expressive and encouraging. Can jump topics or promise more than they can deliver.',
      grow: 'Finish what they start and protect focus from new ideas.', friends: 'Many friendships and easy connection; needs a few who also go deep.' },
    ISTJ: { career: ['accounting and finance', 'law and compliance', 'administration and operations', 'engineering', 'public service'], tags: ['structure', 'business', 'law', 'science'],
      work: 'Works best with clear expectations, proven methods, responsibility and time to do things properly.', lead: 'operations, processes, quality control and keeping commitments',
      money: 'Disciplined saver and careful spender; plans for the long term. Can be too cautious to invest.',
      stress: 'Chaos, broken commitments, last-minute changes and unclear instructions.', recover: 'Routine, order restored, a familiar place and quiet time.',
      learn: 'Step by step, with facts, examples and practice. Wants to know the right way first.', comm: 'Clear, factual and reliable. May seem blunt or reserved about feelings.',
      grow: 'Stay open to new methods, and say appreciation out loud, not only through actions.', friends: 'A few long-standing, dependable friendships built over years.' },
    ISFJ: { career: ['nursing and healthcare', 'teaching', 'administration', 'social work', 'hospitality and customer care'], tags: ['care', 'people', 'structure'],
      work: 'Thrives in a stable, harmonious team where their care and reliability help real people.', lead: 'client care, organisation, follow-up and team support',
      money: 'Careful and security-minded; saves for family. Watch over-giving and saying yes to every request.',
      stress: 'Conflict, criticism, sudden change and feeling taken for granted.', recover: 'Home, comfort, a familiar routine and someone noticing their effort.',
      learn: 'Through practical steps, examples and a patient teacher; remembers details well.', comm: 'Kind, attentive and tactful. May hide their own needs to avoid conflict.',
      grow: 'Say no without guilt and let others carry their share.', friends: 'Loyal, thoughtful friendships; remembers birthdays and shows up when it matters.' },
    ESTJ: { career: ['management and operations', 'business administration', 'law enforcement and security', 'finance', 'project management'], tags: ['structure', 'business', 'law', 'action'],
      work: 'Thrives organising people and resources towards clear goals, with rules everyone follows.', lead: 'project management, deadlines, procedures and accountability',
      money: 'Practical and responsible: budgets, saves and expects money to be handled properly.',
      stress: 'Disorganisation, laziness, unclear authority and rules being ignored.', recover: 'Getting things back in order, physical activity and time with family.',
      learn: 'Through structured, practical training and clear standards; respects proven expertise.', comm: 'Direct, organised and decisive. Can come across as controlling or impatient.',
      grow: 'Leave room for other ways of doing things and ask how people feel.', friends: 'Reliable, traditional friendships; the one who plans the gatherings.' },
    ESFJ: { career: ['healthcare', 'teaching', 'HR and administration', 'sales and customer relations', 'events and hospitality'], tags: ['care', 'people', 'business', 'structure'],
      work: 'Thrives in a friendly, cooperative workplace where they can help people and see the results.', lead: 'client relations, events, team harmony and practical support',
      money: 'Organised and generous, especially with family and gifts. Plan for personal goals too.',
      stress: 'Conflict, criticism, feeling unappreciated and cold or impersonal settings.', recover: 'Time with loved ones, appreciation and a restored routine.',
      learn: 'In groups, with practical examples and clear steps; enjoys helping others learn too.', comm: 'Warm, friendly and supportive. Can take disagreement personally.',
      grow: 'Separate other people\'s opinions from their own worth, and make decisions for themselves.', friends: 'A large, warm network; the host and the one who remembers everyone.' },
    ISTP: { career: ['engineering and mechanics', 'technology and IT', 'emergency services', 'aviation and transport', 'skilled trades'], tags: ['tech', 'action', 'science'],
      work: 'Needs hands-on problems, freedom to work their own way and minimal meetings.', lead: 'troubleshooting, technical work and acting calmly in a crisis',
      money: 'Practical and independent; spends on tools, gear and experiences. Needs a buffer for spontaneous purchases.',
      stress: 'Emotional demands, too many rules, meetings and being micromanaged.', recover: 'Solitude, physical activity and fixing or building something.',
      learn: 'By doing, taking things apart and trial and error. Theory comes after experience.', comm: 'Brief, practical and calm. May seem distant when they are simply private.',
      grow: 'Share plans and feelings with the people who depend on them, and commit for the long run.', friends: 'Easy-going friendships built around shared activities rather than talk.' },
    ISFP: { career: ['art and design', 'music and photography', 'healthcare and therapy', 'nature and animal care', 'crafts'], tags: ['arts', 'care', 'spirit'],
      work: 'Needs creative freedom, a kind atmosphere and work they can see and touch.', lead: 'design, presentation, craftsmanship and caring for clients',
      money: 'Lives in the moment; spends on beauty and experiences. A simple plan for the future helps.',
      stress: 'Harsh criticism, rigid rules, conflict and pressure to be someone they are not.', recover: 'Nature, art, music and time alone.',
      learn: 'Hands-on and visually, at their own pace, in a supportive setting.', comm: 'Gentle, modest and sincere. Shows more through actions than words.',
      grow: 'Plan ahead and speak up for what they want.', friends: 'A few close, accepting friends; loyal and quietly caring.' },
    ESTP: { career: ['sales and entrepreneurship', 'sport and fitness', 'emergency services', 'marketing', 'real estate and trading'], tags: ['business', 'action', 'people'],
      work: 'Thrives in fast-moving, practical work with risk, people and immediate results.', lead: 'sales, negotiation, action in a crisis and turning ideas into deals',
      money: 'Bold with money; enjoys risk and quick returns. Needs limits and a long-term plan.',
      stress: 'Boredom, long theory, being tied down and slow processes.', recover: 'Physical activity, socialising and a new challenge.',
      learn: 'By doing, in real situations, with immediate feedback.', comm: 'Direct, energetic and persuasive. Can be blunt or impatient with long discussions.',
      grow: 'Think through consequences, and stay with feelings and plans for the long term.', friends: 'Lively friendships built on fun and adventure; the life of the group.' },
    ESFP: { career: ['entertainment and events', 'hospitality and tourism', 'sales', 'fitness and beauty', 'childcare and teaching'], tags: ['arts', 'people', 'action', 'care'],
      work: 'Thrives with people, variety and energy, where their warmth and fun make a difference.', lead: 'client experience, events, morale and presentations',
      money: 'Enjoys spending on fun and others. Automatic savings and a fun budget keep both happy.',
      stress: 'Routine, isolation, conflict and long-term planning with no immediate result.', recover: 'Socialising, music, movement and doing something enjoyable.',
      learn: 'By doing, with other people, in a lively and practical way.', comm: 'Warm, spontaneous and entertaining. May avoid serious or difficult conversations.',
      grow: 'Plan for the future and face problems before they grow.', friends: 'A big, fun circle; generous and quick to include everyone.' }
  };

  // Who leads which tasks, by preference.
  const TASKS = {
    E: 'networking, sales and being the public face', I: 'research, deep work and writing',
    S: 'operations, details and quality', N: 'vision, strategy and new ideas',
    T: 'negotiation, finance and hard decisions', F: 'clients, team culture and people issues',
    J: 'planning, deadlines and follow-through', P: 'adapting, new opportunities and problem-solving'
  };

  const WORK_DIM = [
    { i: 0, same: 'You recharge the same way, so meeting rhythm and pace come naturally.', diff: 'One thinks out loud, the other thinks first. Send agendas before meetings and give the quieter partner time to answer.' },
    { i: 1, same: 'You take in information the same way, so you agree easily on what matters.', diff: 'One sees details and facts, the other sees patterns and possibilities. Let the visionary set direction and the detail person test it against reality.' },
    { i: 2, same: 'You decide the same way, so decisions are quick, but check for the blind spot you share.', diff: 'One decides by logic, the other by people and values. Ask both "does it work?" and "how will people feel?" before big decisions.' },
    { i: 3, same: 'You share a working rhythm: both plan ahead, or both stay flexible. Make sure someone owns deadlines.', diff: 'One wants plans and closure, the other wants options. Agree which decisions are fixed and where flexibility is welcome.' }
  ];

  function workPair(a, b) {
    if (!LIFE[a] || !LIFE[b]) return null;
    const dims = WORK_DIM.map(d => ({ name: DIMENSIONS[d.i].name, same: a[d.i] === b[d.i], text: a[d.i] === b[d.i] ? d.same : d.diff }));
    const lead = [0, 1, 2, 3].map(i => ({ dim: DIMENSIONS[i].name, a: TASKS[a[i]], b: TASKS[b[i]], same: a[i] === b[i] }));
    const shared = dims.filter(d => d.same).length;
    const summary = shared >= 3 ? 'Very similar working styles: easy agreement, but you share blind spots. Bring in an outside view for big decisions.'
      : shared === 2 ? 'A balanced pairing: enough in common to agree easily and enough difference to cover each other\'s gaps.'
      : 'Very different working styles: you cover each other\'s blind spots well if you agree clear roles and respect each other\'s way of working.';
    return { dims, lead, summary };
  }

  root.ChartMBTI = { DIMENSIONS, LIFE, TASKS, workPair, tagsOf };
})(typeof window !== 'undefined' ? window : globalThis);

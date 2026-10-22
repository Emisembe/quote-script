/*
 * Conflict resolution for the Compatibility reports (love and work).
 * Built from each person's Mars (how they fight), Moon (what calms them) and
 * Mercury (how to talk to them), plus the specific tense contacts between the charts.
 */
(function (root) {
  'use strict';

  // By element of Mars: how the person fights.
  const FIGHT = {
    fire: 'Flares up fast and says it straight, then moves on quickly. Holding a grudge is rare, but so is patience in the moment.',
    earth: 'Slow to anger and stubborn once there. Digs in, goes quiet or argues on facts and fairness. Pushing harder makes them more immovable.',
    air: 'Argues with words and logic, debates, sometimes goes cool and detached. Can talk around feelings instead of naming them.',
    water: 'Takes it personally and may withdraw, sulk or hit where it hurts. Remembers hurts for a long time.'
  };
  // By element of the Moon: what de-escalates them.
  const CALM = {
    fire: 'a short break to move or blow off steam, then a direct, honest conversation and quick action',
    earth: 'time, a calm tone, practical solutions and seeing a concrete change in behaviour',
    air: 'a reasoned conversation, being heard out fully, and space to think before deciding',
    water: 'reassurance first, feeling understood before any solutions, and a gentle, private setting'
  };
  // By element of Mercury: how to talk to them.
  const TALK = {
    fire: 'Be brief and direct, get to the point and focus on what to do next.',
    earth: 'Be specific and factual, give examples and a clear plan.',
    air: 'Explain your reasoning, ask questions, and let them respond.',
    water: 'Start with how you feel and how they might feel; tone matters more than words.'
  };

  // Bridging two temperaments.
  const BRIDGE = {
    'fire|fire': 'Both of you ignite quickly. Agree that either person can call a ten-minute pause, and use it.',
    'earth|earth': 'Both of you dig in. Break deadlocks with a time limit and an outside opinion, or by testing both options on a small scale.',
    'air|air': 'Both of you can argue in circles. Write the options down, pick criteria, and decide.',
    'water|water': 'Both of you feel deeply and may avoid the issue. Name the hurt early instead of waiting for it to build.',
    'fire|air': 'Air fans fire: discussions escalate fast but resolve fast. Keep humour, and avoid saying things just to win.',
    'earth|water': 'A naturally steadying pair. Earth offers practical help; water needs to feel it is cared about, not just fixed.',
    'fire|earth': 'Fire wants action now; earth wants to be sure first. Agree a deadline that gives earth time and fire a date to move.',
    'fire|water': 'Fire says it bluntly; water feels it deeply. Fire: soften the delivery. Water: say what hurt instead of withdrawing.',
    'air|earth': 'Air explores ideas; earth wants the practical outcome. Air: bring it down to a concrete next step. Earth: allow some brainstorming first.',
    'air|water': 'Air reasons; water feels. Air: acknowledge feelings before logic. Water: put the need into clear words.'
  };
  const bridge = (a, b) => BRIDGE[`${a}|${b}`] || BRIDGE[`${b}|${a}`];

  const MODE_BRIDGE = {
    'cardinal|cardinal': 'Both of you want to lead and start. Split leadership by area so you are not steering the same thing.',
    'fixed|fixed': 'Both of you hold your ground. Look for the shared goal behind the positions, and agree when you will revisit a decision.',
    'mutable|mutable': 'Both of you adapt so much that decisions drift. Write down what was agreed and who will do it.',
    'cardinal|fixed': 'One pushes for change, the other protects what exists. Change in stages, keeping what already works.',
    'cardinal|mutable': 'One decides fast, the other keeps options open. Agree a decision date and stick to it.',
    'fixed|mutable': 'One holds firm, the other keeps shifting. Fix the essentials; stay flexible on the details.'
  };
  const modeBridge = (a, b) => MODE_BRIDGE[`${a}|${b}`] || MODE_BRIDGE[`${b}|${a}`];

  // Resolution tips for tense contacts, by the planets involved (most specific first).
  const PAIR_FIX = [
    { has: ['mars', 'mars'], fix: 'Two strong wills. Take turns leading, compete against a shared target instead of each other, and use physical activity to let off steam.' },
    { has: ['mars', 'saturn'], fix: 'One pushes, the other blocks. Agree in advance on rules, timelines and limits, so neither feels controlled or held back.' },
    { has: ['mars', 'pluto'], fix: 'Power struggles can escalate. Never negotiate while angry, avoid ultimatums, and keep everything transparent.' },
    { has: ['mars', 'moon'], fix: 'Directness hurts feelings. Lead with care, choose timing, and say "I feel" rather than "you always".' },
    { has: ['mars', 'mercury'], fix: 'Words turn into arguments. Slow down, let each person finish, and repeat back what you heard before replying.' },
    { has: ['mars', 'sun'], fix: 'Egos clash. Give credit openly, separate responsibilities, and challenge ideas rather than the person.' },
    { has: ['mars', 'venus'], fix: 'Desire and values pull apart. Talk about expectations openly and make time for enjoyment, not only problems.' },
    { has: ['saturn', 'moon'], fix: 'One can feel criticised or emotionally cold. Express appreciation regularly and pair any criticism with warmth.' },
    { has: ['saturn', 'sun'], fix: 'One may feel judged or held back. Recognise each other\'s contribution and agree on standards together.' },
    { has: ['saturn', 'venus'], fix: 'Affection or money can feel rationed. Agree on what "enough" looks like, and show appreciation in concrete ways.' },
    { has: ['saturn', 'mercury'], fix: 'Ideas get shot down. Separate brainstorming from evaluating, and give feedback in writing with suggestions.' },
    { has: ['pluto'], fix: 'Control and jealousy can creep in. Keep things transparent, respect privacy, and never use secrets as leverage.' },
    { has: ['uranus'], fix: 'One needs freedom, the other stability. Build in independence and agree in advance how changes will be announced.' },
    { has: ['neptune'], fix: 'Confusion or unclear expectations. Confirm agreements in writing, check facts, and do not assume.' },
    { has: ['mercury'], fix: 'Different thinking styles. Summarise decisions in writing and ask "What did you hear me say?".' },
    { has: ['moon'], fix: 'Different emotional needs. Acknowledge feelings first, then problem-solve.' },
    { has: ['jupiter'], fix: 'Over-promising or different beliefs. Set realistic limits and respect each other\'s views.' },
    { has: ['venus'], fix: 'Different values or tastes. Name what each of you values most and look for the option that honours both.' },
    { has: ['sun'], fix: 'Different directions. Find the shared goal and give each person an area to lead.' }
  ];
  function fixFor(a, b) {
    for (const r of PAIR_FIX) {
      if (r.has.length === 2 && ((r.has[0] === a && r.has[1] === b) || (r.has[0] === b && r.has[1] === a))) return r.fix;
    }
    for (const r of PAIR_FIX) if (r.has.length === 1 && (a === r.has[0] || b === r.has[0])) return r.fix;
    return 'Talk it through calmly and look for the shared goal behind the disagreement.';
  }

  const STEPS = {
    love: [
      'Pause. If either of you is flooded, take a 20-minute break and agree when you will come back to it.',
      'Speak from your side: "I felt … when … because I need …", not "You always …".',
      'Listen and repeat back what you heard until the other person says "Yes, that is it".',
      'Name the shared goal: what you both want from the relationship.',
      'Agree one small, specific change each, and when you will check in.',
      'Repair: a gesture of affection or appreciation after the talk, in the other person\'s love language.'
    ],
    work: [
      'Separate the issue from the person. Write down the disagreement in one or two neutral sentences.',
      'Each partner states their position and, more importantly, the interest behind it (what they need to protect or achieve).',
      'Return to the shared goal and the written agreement: what does it say, and what serves the business?',
      'Generate at least three options, including a small test or a time-limited trial.',
      'Decide using the agreed decision rights. If still stuck, bring in a neutral mentor or mediator.',
      'Record the decision, the owner and a review date. If disagreements become constant, use the exit terms fairly.'
    ]
  };

  const TIMING = [
    'Choose a calm moment. Traditionally, avoid starting hard conversations on Full Moon days, when emotions run high.',
    'The waning Moon (after the Full Moon, especially the Last Quarter) is the traditional time to clear the air, forgive and close old issues.',
    'During Mercury retrograde, misunderstandings are more likely. Double-check what was agreed, and use it to revisit old disagreements rather than to sign new terms.',
    'A Venus day (Friday) or Venus hour suits reconciliation; a Mercury hour suits a clear, practical discussion.'
  ];

  root.ChartConflict = { FIGHT, CALM, TALK, bridge, modeBridge, fixFor, STEPS, TIMING };
})(typeof window !== 'undefined' ? window : globalThis);

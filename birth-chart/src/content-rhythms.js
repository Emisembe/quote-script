/*
 * Cosmic rhythms: practical notes on the Sun–Moon polarity, the Moon cycle, the seasons,
 * the seven classical planets as forces of creation, the elements, planetary days and hours.
 * Symbolic tradition is presented as tradition; astronomical facts are kept accurate.
 */
(function (root) {
  'use strict';

  // Eight Moon phases: what the tradition uses each one for.
  const PHASES = [
    { name: 'New Moon', from: 0, to: 22.5, verb: 'Begin', use: 'Set intentions and start new projects, habits or chapters. What you plant now grows as the Moon grows.', avoid: 'Judging results. It is too early to see anything.', prompt: 'What do I want to grow over the next four weeks?' },
    { name: 'Waxing Crescent', from: 22.5, to: 67.5, verb: 'Commit', use: 'Take the first concrete steps. Gather resources, make plans visible and tell someone your goal.', avoid: 'Giving up at the first obstacle.', prompt: 'What is the smallest next step I can take today?' },
    { name: 'First Quarter', from: 67.5, to: 112.5, verb: 'Act', use: 'Push through resistance and make decisions. Problems that show up now show you what to fix.', avoid: 'Avoiding hard choices.', prompt: 'What decision have I been postponing?' },
    { name: 'Waxing Gibbous', from: 112.5, to: 157.5, verb: 'Refine', use: 'Adjust, edit and improve. Work hard and prepare for the peak.', avoid: 'Starting something completely new.', prompt: 'What needs fine-tuning before it is finished?' },
    { name: 'Full Moon', from: 157.5, to: 202.5, verb: 'See', use: 'Culmination and clarity. Celebrate results, notice what has come to light, and reflect, journal or meditate. Traditionally a time for affirmations and releasing.', avoid: 'Impulsive decisions and forming new habits you do not want. Emotions run high, so pause before reacting.', prompt: 'What has this cycle revealed to me?' },
    { name: 'Waning Gibbous', from: 202.5, to: 247.5, verb: 'Share', use: 'Teach, share and give thanks. Pass on what you learned and distribute what you made.', avoid: 'Hoarding information or credit.', prompt: 'Who can benefit from what I learned?' },
    { name: 'Last Quarter', from: 247.5, to: 292.5, verb: 'Release', use: 'Let go, declutter, forgive and close loops. Break habits that no longer serve you.', avoid: 'Clinging to what is finished.', prompt: 'What am I ready to let go of?' },
    { name: 'Waning Crescent', from: 292.5, to: 337.5, verb: 'Rest', use: 'Rest, reflect and recharge. Dream and plan quietly before the next New Moon.', avoid: 'Overworking. Energy is lowest now.', prompt: 'What do I need in order to start fresh?' },
    { name: 'New Moon', from: 337.5, to: 360, verb: 'Begin', use: 'Set intentions and start new projects, habits or chapters. What you plant now grows as the Moon grows.', avoid: 'Judging results. It is too early to see anything.', prompt: 'What do I want to grow over the next four weeks?' }
  ];
  const phaseOf = angle => PHASES.find(p => angle >= p.from && angle < p.to) || PHASES[0];

  // The Moon moves through a sign in about 2.5 days; each sign colours the mood of those days.
  const MOON_DAY = [
    'Moon in Aries: energetic and impatient. Good for starting, sport and bold moves.',
    'Moon in Taurus: calm and sensual. Good for finances, cooking, gardening and steady work.',
    'Moon in Gemini: busy and talkative. Good for meetings, writing, errands and learning.',
    'Moon in Cancer: tender and home-focused. Good for family, cooking, rest and nurturing.',
    'Moon in Leo: warm and expressive. Good for creativity, celebrations and being visible.',
    'Moon in Virgo: practical and tidy. Good for health routines, organising and detailed work.',
    'Moon in Libra: social and harmonious. Good for partnerships, negotiation and beauty.',
    'Moon in Scorpio: intense and private. Good for research, deep talks and letting go.',
    'Moon in Sagittarius: optimistic and restless. Good for travel, study and big-picture plans.',
    'Moon in Capricorn: serious and focused. Good for planning, structure and career moves.',
    'Moon in Aquarius: inventive and detached. Good for groups, technology and new ideas.',
    'Moon in Pisces: dreamy and sensitive. Good for art, meditation, rest and compassion.'
  ];

  // The four seasons of the year (and of any project).
  const SEASONS = [
    { key: 'spring', name: 'Spring', theme: 'Growth', text: 'Plant and grow. Start what you planned in winter, build momentum and learn by doing.', signs: 'Aries, Taurus, Gemini' },
    { key: 'summer', name: 'Summer', theme: 'Action', text: 'Act, produce and be visible. This is the season of peak output, selling and expanding.', signs: 'Cancer, Leo, Virgo' },
    { key: 'autumn', name: 'Autumn', theme: 'Reflection', text: 'Harvest and reflect. Review what worked, keep what is valuable, cut what is not.', signs: 'Libra, Scorpio, Sagittarius' },
    { key: 'winter', name: 'Winter', theme: 'Planning', text: 'Rest, study and plan. Design next year, strengthen foundations and build skills.', signs: 'Capricorn, Aquarius, Pisces' }
  ];

  // The seven classical planets as the seven forces any creation needs.
  const SEVEN = {
    saturn: { force: 'Structure', role: 'Time, discipline and form', question: 'Do I give it time, a plan and consistency?', weak: 'Projects stay ideas, or collapse for lack of routine and patience.', practice: 'Set a fixed schedule and a deadline. Small daily repetition beats bursts.' },
    jupiter: { force: 'Meaning', role: 'The why, faith and vision', question: 'Do I know why this matters?', weak: 'Motivation fades because the purpose is unclear.', practice: 'Write one sentence on why this matters and who it helps.' },
    mars: { force: 'Protection', role: 'Courage, defence and drive', question: 'Will I defend it and push through resistance?', weak: 'Other people\'s doubts or the first obstacle stop the work.', practice: 'Decide in advance how you will respond to criticism and setbacks.' },
    sun: { force: 'Will', role: 'Purpose, vitality and action', question: 'Am I putting my whole self and energy into it?', weak: 'You act half-heartedly or for other people\'s approval.', practice: 'Connect the work to who you are. Work in the morning when energy is highest.' },
    venus: { force: 'Beauty', role: 'Form, value and attraction', question: 'Is it pleasing, valuable and attractive to others?', weak: 'The result works but nobody is drawn to it.', practice: 'Spend time on presentation, design and how it feels to receive.' },
    mercury: { force: 'Intellect', role: 'Thought, skill and communication', question: 'Have I thought it through and can I explain it?', weak: 'Good ideas are poorly planned or poorly communicated.', practice: 'Write the plan down and explain it to someone in two minutes.' },
    moon: { force: 'Care', role: 'Emotion, care and nurture', question: 'Do I genuinely care about it?', weak: 'Without emotional investment you will not keep going.', practice: 'Notice how it makes you feel. Build in rest so care does not burn out.' }
  };

  // Planetary days (the names of the week come from these rulers).
  const DAYS = {
    sun: { day: 'Sunday', use: 'Leadership, visibility, confidence, important beginnings, time with children.' },
    moon: { day: 'Monday', use: 'Home, family, emotions, cooking, rest, intuition and care.' },
    mars: { day: 'Tuesday', use: 'Hard work, exercise, courage, competition and tackling difficult tasks.' },
    mercury: { day: 'Wednesday', use: 'Communication, writing, contracts, study, trade and short trips.' },
    jupiter: { day: 'Thursday', use: 'Growth, teaching, law, generosity, planning big goals and asking for opportunities.' },
    venus: { day: 'Friday', use: 'Love, beauty, art, socialising, pleasure, money and reconciliation.' },
    saturn: { day: 'Saturday', use: 'Structure, discipline, cleaning up, long-term planning and finishing.' }
  };

  // Elements in the order of creation, as the pentagram is traditionally read.
  const CREATION = [
    { el: 'spirit', name: 'Spirit', step: 'Awareness', text: 'Awareness has a will: something wants to exist.' },
    { el: 'air', name: 'Air', step: 'Thought', text: 'The will becomes a thought, an idea and a plan.' },
    { el: 'water', name: 'Water', step: 'Desire', text: 'The thought becomes a desire, felt and cared about.' },
    { el: 'fire', name: 'Fire', step: 'Will in action', text: 'Desire becomes energy and drive to act.' },
    { el: 'earth', name: 'Earth', step: 'Form', text: 'Action takes physical form in the world.' }
  ];

  // Long-form notes pages.
  const NOTES = [
    {
      id: 'sun-moon', title: 'The Sun and the Moon: conscious and subconscious',
      body: [
        'Astrology treats the Sun and Moon as the two lights of the chart and as the oldest pair of opposites: day and night, active and receptive, yang and yin. In the Hermetic tradition the Sun is called electric (it radiates outward and acts directly) and the Moon magnetic (it draws in, reflects and responds).',
        'Psychologically the Sun describes the conscious self: what you choose, aim for and are aware of. The Moon describes the subconscious: habits, memories, moods and emotional reactions that run automatically. Much of daily behaviour comes from the Moon side, which is why understanding your Moon sign often explains more about everyday reactions than your Sun sign does.',
        'A useful way to apply this: use the "Sun" part of the day for action and decisions, and the quieter "Moon" hours of the evening and night for imagination, reflection and ideas. Many people find their best ideas arrive when they stop pushing.',
        'The Sun and Moon are also used as symbols of masculine and feminine principles. Every person has both. Reading them as qualities inside one person (directness and receptiveness, action and feeling) is more useful than reading them as rules for how men and women must behave.'
      ]
    },
    {
      id: 'moon-cycle', title: 'Working with the Moon cycle',
      body: [
        'The Moon goes from New Moon to Full Moon and back in about 29.5 days (the synodic month), so each half takes roughly 14.75 days. It completes a full circuit of the zodiac in about 27.3 days, spending around 2.5 days in each sign. The word "month" comes from "moon".',
        'Tradition reads the cycle like a growing plant: begin at the New Moon, build while it waxes, see results and gain clarity at the Full Moon, then share, release and rest while it wanes. Starting a project near a New Moon is a classic way to "let it grow with the Moon".',
        'The Full Moon is traditionally a high-emotion, high-visibility time when the subconscious is closest to the surface. That is why it is used for reflection, affirmations and releasing, and why the tradition warns against forming habits you do not want at that time.',
        'The Moon really does move the ocean tides through gravity, together with the Sun. The tradition extends this to the body\'s fluids and moods. The menstrual cycle (averaging about 28–29 days) is often linked symbolically with the lunar month, but large studies have not found that cycles follow the Moon\'s phases. Treat that link as symbolism, not biology.'
      ]
    },
    {
      id: 'seasons', title: 'The seasons of the year and of any project',
      body: [
        'Spring is growth, summer is action, autumn is reflection and winter is planning. The cycle applies to a business year, a project or a life chapter as much as to the weather.',
        'In astrology the seasons begin at the equinoxes and solstices: spring at 0° Aries, summer at 0° Cancer, autumn at 0° Libra and winter at 0° Capricorn (in the northern hemisphere). Near the equator, for example in Kenya, temperature seasons are weak and the rains define the year, so the zodiac seasons are best read symbolically.',
        'You also have a personal year that starts on your birthday, when the Sun returns to its birth position. The first quarter after your birthday is your personal spring, the second your summer, the third your autumn and the last your winter. Planning in your personal winter and launching in your personal spring aligns effort with your own cycle.',
        'Many people get stuck by skipping a season: always acting without reflecting, or always planning without acting. Moving through all four keeps growth sustainable.'
      ]
    },
    {
      id: 'seven', title: 'The seven planets: seven forces of creation',
      body: [
        'Classical astrology works with seven visible planets, which also gave the days of the week their names. Each can be read as a force that any creation needs: Saturn gives structure and time, Jupiter meaning, Mars protection and courage, the Sun will and vitality, Venus beauty and value, Mercury thought and communication, and the Moon care and emotional investment.',
        'When a goal keeps failing, ask which force is missing. No plan or routine is Saturn. No clear reason is Jupiter. Giving up under pressure is Mars. Half-hearted effort is the Sun. Nobody wants the result: Venus. Muddled planning or explanation: Mercury. Not caring enough to continue: the Moon.',
        'Your chart shows which forces come easily and which need deliberate work. A planet in its own sign or exaltation usually expresses its force naturally; one in detriment or fall, retrograde or under pressure from hard aspects often needs more conscious effort, and can become a real skill once developed.',
        '"As above, so below" sums up the idea: the person is seen as a small model of the cosmos (the microcosm reflecting the macrocosm), so the same seven forces are found in the sky and in you.'
      ]
    },
    {
      id: 'elements', title: 'The elements and the cycle of creation',
      body: [
        'The four elements are a map of how anything comes into being. Air is thought, water is feeling and desire, fire is will and energy, and earth is physical action and form. The fifth point, spirit, is awareness itself.',
        'The pentagram is traditionally read as this process: awareness has a will, the will becomes a thought, the thought becomes a desire, the desire turns into action, and the result returns to spirit as experience.',
        'Your element balance shows where this process runs smoothly for you and where it stalls. Strong air but little earth often means many ideas and few finished results. Strong earth but little fire means steady work without enough drive or joy. Strong water but little air means deep feeling that is hard to put into a plan.',
        'Strengthen a weak element deliberately. Weak air: write and talk ideas through. Weak water: reconnect with why you care. Weak fire: move your body and set bold goals. Weak earth: make routines and finish small tasks.'
      ]
    },
    {
      id: 'polarity', title: 'Electric and magnetic: the two polarities',
      body: [
        'Fire and air signs are called yang, active or electric: outgoing, direct and initiating. Earth and water signs are yin, receptive or magnetic: inward, steadying and responsive. Everybody has a mix.',
        'A chart heavy in yang tends to act first and push outward; it benefits from patience and listening. A chart heavy in yin tends to absorb, wait and attract; it benefits from stating needs directly and taking initiative.',
        'In relationships the same idea explains a lot of friction: one person speaks directly ("Let\'s get food") while another hints ("Are you hungry?"). Neither is wrong. Recognising the two styles, in yourself and in a partner, makes communication easier.'
      ]
    },
    {
      id: 'day-night', title: 'Day and night: action and imagination',
      body: [
        'Daytime belongs to the Sun: action, work, decisions and being seen. Night belongs to the Moon: rest, dreams, imagination and quiet thinking.',
        'Planetary hours are an old timing system built on this. Each day is ruled by one planet (Sunday the Sun, Monday the Moon, Tuesday Mars, Wednesday Mercury, Thursday Jupiter, Friday Venus, Saturday Saturn), and the daylight and night are each divided into twelve "hours" ruled in turn by the seven planets. They are used to pick a moment that matches the task, such as a Mercury hour for an important email or a Venus hour for a date.',
        'Planetary hours are not 60 minutes long: they are one twelfth of the actual daylight or night at your location, so they change with the season and the place.'
      ]
    },
    {
      id: 'signs-within', title: 'All twelve signs live in you',
      body: [
        'When people say "I am a Virgo" they mean the Sun\'s sign: the main focus of the personality. But every sign is somewhere in every chart, because the twelve signs are spread across the twelve houses. Each sign is an energy you can draw on, in the area of life where it falls.',
        'In brief: Aries is initiative, Taurus values, Gemini understanding, Cancer family and nurturing, Leo creativity and leadership, Virgo healing and refinement, Libra partnership and justice, Scorpio bonding and transformation, Sagittarius wisdom and belief, Capricorn structure and achievement, Aquarius community and innovation, and Pisces compassion and spirituality.',
        'The table on this page shows where each sign falls in your chart, so you can see where each of these energies is most active in your life.'
      ]
    },
    {
      id: 'use-wisely', title: 'Using these notes wisely',
      body: [
        'Astrology is a symbolic language for reflection, timing and self-understanding. It describes tendencies, not fixed fate, and it works best alongside practical effort and good judgement.',
        'It is not a substitute for medical, psychological or financial advice. Thought, purpose and meaningful work do support wellbeing, but mental health conditions are real and treatable, and prescribed treatment should never be stopped because of an astrological idea. Use these notes together with professional care, not instead of it.',
        'Where astronomy and tradition differ, this app keeps the astronomy accurate (planetary positions, Moon phases and sunrise times are calculated precisely) and labels symbolic ideas as tradition.'
      ]
    }
  ];

  root.ChartRhythms = { PHASES, phaseOf, MOON_DAY, SEASONS, SEVEN, DAYS, CREATION, NOTES };
})(typeof window !== 'undefined' ? window : globalThis);

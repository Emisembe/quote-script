/*
 * Placement-in-sign interpretations. Arrays follow zodiac order:
 * Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces.
 */
(function (root) {
  'use strict';
  const IN_SIGN = {
    sun: [
      'You come alive by starting things. Your identity is built through courage, competition and being first, and you feel most yourself when you act rather than wait for permission.',
      'You grow into yourself slowly and steadily. Security, comfort and tangible results matter, and your strength is patience and loyalty once you commit.',
      'Curiosity drives your identity. You need variety, conversation and ideas, and you often understand yourself by talking things through.',
      'Your sense of self is tied to belonging. You protect the people and places you love, and your confidence grows when you feel emotionally safe.',
      'You are meant to create and to be seen. Warmth, generosity and self-expression are central, and recognition matters because it confirms who you are.',
      'You find yourself through usefulness and skill. You notice details others miss and feel most whole when you are improving something that matters.',
      'You define yourself through relationship and balance. Fairness, beauty and good company matter, and you often see yourself most clearly through other people.',
      'Your identity is built in depth. You look for the truth beneath the surface, commit completely and are renewed by facing what others avoid.',
      'You are a seeker. Meaning, freedom and experience feed your sense of self, and you grow by exploring ideas, places and beliefs.',
      'You become yourself through achievement and responsibility. You take the long view, respect structure and tend to grow more confident with age.',
      'You are here to be yourself on your own terms. Independence, ideas and community matter, and you often see where things are heading before others do.',
      'Your identity is fluid and imaginative. Compassion, art and spirituality feed you, and you grow by trusting intuition while keeping healthy boundaries.'
    ],
    moon: [
      'Your feelings are quick, hot and honest. You need freedom to react and to act on emotion, and you recover fast once something is said out loud.',
      'You need stability, comfort and physical ease to feel safe. Good food, familiar routines and reliable people calm you, and change unsettles you more than you show.',
      'You process feelings by talking, reading and thinking them through. You need mental stimulation and variety, and boredom can feel like distress.',
      'Your emotions run deep and are tied to home and family. You need to nurture and be nurtured, and memory and the past hold strong emotional power.',
      'You need warmth, appreciation and room to express yourself. When you feel unseen you can feel unloved, and generosity comes naturally when you feel valued.',
      'You feel safe when life is ordered and useful. You calm yourself by fixing, tidying or helping, and you may worry when things are out of your control.',
      'You need harmony and companionship to feel settled. Conflict upsets your balance, and you often sense what others feel before you know what you feel yourself.',
      'Your feelings are intense and private. You need trust and emotional honesty, and once hurt you remember. Your loyalty is total when trust is earned.',
      'You need space, adventure and a sense of meaning. You lift your mood through movement, humour and new experiences, and you dislike emotional confinement.',
      'You keep feelings in check and prefer to handle things yourself. You feel safe through competence and structure, and you soften when you feel respected.',
      'You need emotional independence and friendship as much as closeness. You often think about feelings rather than drown in them, and you value people who accept you as you are.',
      'You are highly sensitive and absorb the moods around you. You need quiet, creativity and time alone to recover, and your compassion is deep and instinctive.'
    ],
    mercury: [
      'You think fast and speak directly. You decide quickly, enjoy debate and learn best by doing, though patience with slow explanations does not come easily.',
      'You think carefully and practically. Once you form an opinion you hold it, and you learn best at your own pace with something concrete in front of you.',
      'Your mind is quick, versatile and endlessly curious. You connect ideas easily, talk well and learn by sampling many subjects at once.',
      'You think with your feelings and remember through emotion. You listen well, pick up on tone and learn best in a safe, familiar setting.',
      'You speak with confidence and flair. You think in big pictures, tell stories well and want your ideas to be recognised as your own.',
      'Your mind is precise, analytical and detail-oriented. You notice errors, solve practical problems and learn by breaking things down step by step.',
      'You think by weighing options and considering other views. You are diplomatic and persuasive, though decisions can take time.',
      'Your mind is penetrating and investigative. You read between the lines, keep secrets well and are drawn to research and hidden truths.',
      'You think in big ideas and broad principles. You are frank, philosophical and enthusiastic, though details can slip past you.',
      'You think strategically and realistically. You speak with authority, plan ahead and value knowledge that has practical use.',
      'Your mind is original, objective and future-focused. You question assumptions and enjoy ideas that challenge convention.',
      'You think in images, impressions and intuition. You absorb information rather than analyse it, and you communicate well through art, music or story.'
    ],
    venus: [
      'You love boldly and directly. Attraction is instant and you enjoy the chase, though you need passion to stay interested.',
      'You love through the senses and through loyalty. You value comfort, beauty and quality, and you show love through steady presence and physical care.',
      'You are attracted to minds as much as bodies. Conversation, humour and variety keep love alive, and you dislike feeling tied down.',
      'You love by caring for others and creating a home. You need emotional security in relationships and are deeply loyal to family and close friends.',
      'You love generously and dramatically. Romance, admiration and fun matter, and you give warmth freely when you feel cherished.',
      'You show love through practical help and attention to detail. You are discerning about who you let close and value reliability over grand gestures.',
      'You are drawn to harmony, beauty and partnership. You are charming and fair-minded, and relationships are central to your happiness.',
      'You love intensely and completely. You want emotional and physical depth, and you value loyalty above everything. Jealousy can be the shadow side.',
      'You love freely and optimistically. You need adventure and shared growth in relationships, and you are attracted to people who broaden your world.',
      'You take love seriously and commit for the long term. You show affection through reliability and effort, and you value status and loyalty.',
      'You need friendship and freedom inside love. You are attracted to the unusual and value equality, and you can seem cool until trust is built.',
      'You love compassionately and romantically. You idealise partners and can be self-sacrificing, so love works best with clear boundaries.'
    ],
    mars: [
      'Your drive is direct, competitive and fast. You act first and think later, anger flares and fades quickly, and you thrive on challenges.',
      'You act slowly but with enormous stamina. Once committed you are hard to stop, and anger builds slowly but lasts. Pressure makes you dig in.',
      'You act through words and ideas. You multitask, argue well and get restless, and your energy scatters unless you have variety.',
      'You act to protect what you care about. You may avoid direct confrontation and express anger indirectly, but you fight fiercely for family.',
      'You act with pride, courage and style. You need your efforts to be seen, and you lead naturally when your heart is in it.',
      'You act with precision and diligence. You work hard and methodically, and frustration shows up as criticism or worry.',
      'You act through cooperation and negotiation. You may find it hard to assert yourself directly and often fight on behalf of fairness or others.',
      'Your drive is intense, strategic and persistent. You hold nothing back once committed, and you rarely forget a wrong.',
      'You act with enthusiasm and a sense of mission. You need freedom and a cause, and your energy is best spent on exploration and belief.',
      'You act with discipline and ambition. You pace yourself for long goals and are effective in positions of responsibility.',
      'You act independently and for causes you believe in. You resist being told what to do and work best with freedom to innovate.',
      'You act on intuition and inspiration. Your energy comes in waves, and you are motivated by compassion, art or ideals rather than competition.'
    ],
    jupiter: [
      'You grow by taking initiative. Faith in yourself opens doors, and luck tends to follow bold moves and pioneering ventures.',
      'You grow through steady accumulation. Resources, comfort and generosity come easily, and patience pays off financially.',
      'You grow through learning, talking and connecting. Opportunities come through networks, writing, teaching and travel.',
      'You grow through care and belonging. Family, home and emotional generosity bring blessings, and you create a sense of home for others.',
      'You grow through creativity and self-expression. Generosity and confidence attract support, and you inspire others by example.',
      'You grow through service and skill. Improvements, health and useful work bring rewards, and you find meaning in doing things well.',
      'You grow through partnership and fairness. Relationships and collaborations open doors, and diplomacy is one of your gifts.',
      'You grow through depth and transformation. Shared resources, research and crises reveal hidden strength.',
      'You grow through exploration and belief. Travel, study and philosophy expand you, and optimism is your natural setting.',
      'You grow through discipline and responsibility. Success comes step by step, and structure is the source of your luck.',
      'You grow through community and original ideas. Friends, groups and progressive causes bring opportunities.',
      'You grow through compassion and imagination. Spiritual life, art and service to others bring deep rewards.'
    ],
    saturn: [
      'Your lesson is learning to act with confidence without rushing. Self-assertion may feel risky at first, and courage is built through practice.',
      'Your lesson concerns security and self-worth. Money or stability may feel scarce early on, and you learn to build lasting value.',
      'Your lesson concerns communication and learning. You may doubt your intelligence at first and become a careful, authoritative thinker.',
      'Your lesson concerns emotional security. Early family life may have felt restrictive, and you learn to build the home you need.',
      'Your lesson concerns self-expression. You may fear being seen or judged, and you learn to create with discipline and earned confidence.',
      'Your lesson concerns work, health and perfectionism. You learn to be thorough without being harsh on yourself.',
      'Your lesson concerns relationships and commitment. Partnerships may come later or carry responsibility, and they become more stable over time.',
      'Your lesson concerns trust, power and intimacy. You learn to face fears of loss and to share control.',
      'Your lesson concerns belief and meaning. You may question faith deeply and build a philosophy grounded in experience.',
      'Saturn is at home here. You are serious, capable and ambitious, and you are learning that achievement is not the same as worth.',
      'Saturn is strong here. You are learning to balance individuality with belonging, and to build systems that serve many people.',
      'Your lesson concerns boundaries and faith. You learn to give structure to compassion and imagination without being overwhelmed.'
    ],
    uranus: [
      'Your generation breaks new ground through bold, independent action and a pioneering spirit.',
      'Your generation revolutionises money, values and the relationship with the earth and the body.',
      'Your generation changes how people communicate, learn and share information.',
      'Your generation reinvents home and family structures and the meaning of belonging.',
      'Your generation redefines creativity, romance and self-expression.',
      'Your generation transforms work, health and daily routines, often through technology.',
      'Your generation changes the rules of partnership, marriage and fairness.',
      'Your generation exposes taboos around sex, power, death and shared resources.',
      'Your generation revolutionises belief, education, travel and global connection.',
      'Your generation challenges institutions, governments and traditional structures of authority.',
      'Your generation drives innovation, networks and collective progress.',
      'Your generation dissolves old boundaries in spirituality, art and collective imagination.'
    ],
    neptune: [
      'A generation idealising courage and new beginnings.',
      'A generation idealising nature, comfort and material security.',
      'A generation idealising information, communication and ideas.',
      'A generation idealising home, family and national belonging.',
      'A generation idealising creativity, glamour and self-expression.',
      'A generation idealising service, health and practical help.',
      'A generation idealising love, harmony and partnership.',
      'A generation idealising depth, transformation and the hidden.',
      'A generation idealising freedom, faith and exploration.',
      'A generation dissolving and rebuilding structures, institutions and ideas of success.',
      'A generation idealising technology, equality and collective progress.',
      'A generation deeply attuned to spirituality, art and collective empathy.'
    ],
    pluto: [
      'A generation transformed through self-assertion and conflict.',
      'A generation transformed through money, resources and values.',
      'A generation transformed through information and communication.',
      'A generation transformed through home, family and homeland.',
      'A generation transformed through creativity, ego and personal power.',
      'A generation transformed through work, health and technology.',
      'A generation transforming relationships, justice and social contracts.',
      'A generation confronting sexuality, death, power and shared wealth.',
      'A generation transforming belief, religion, law and global culture.',
      'A generation transforming institutions, governments and economic structures.',
      'A generation transforming technology, networks and collective ideals.',
      'A generation transforming spirituality and the collective imagination.'
    ],
    nnode: [
      'Growth comes through independence and self-assertion. The South Node in Libra leans on keeping the peace, so the task is to trust your own wants.',
      'Growth comes through simplicity, patience and self-worth. The South Node in Scorpio leans on crisis and intensity, so the task is to build calm and stability.',
      'Growth comes through curiosity, listening and everyday learning. The South Node in Sagittarius leans on certainty, so the task is to ask questions.',
      'Growth comes through emotional openness and home. The South Node in Capricorn leans on control and achievement, so the task is to let yourself need people.',
      'Growth comes through creativity and heartfelt self-expression. The South Node in Aquarius leans on detachment and the group, so the task is to shine as yourself.',
      'Growth comes through practical service and daily discipline. The South Node in Pisces leans on escape and drift, so the task is to ground your gifts.',
      'Growth comes through partnership and cooperation. The South Node in Aries leans on going it alone, so the task is to share.',
      'Growth comes through intimacy, trust and change. The South Node in Taurus leans on comfort and possession, so the task is to let go and merge.',
      'Growth comes through faith, exploration and big-picture thinking. The South Node in Gemini leans on information and chatter, so the task is to find meaning.',
      'Growth comes through responsibility and public contribution. The South Node in Cancer leans on dependence and the past, so the task is to step into authority.',
      'Growth comes through community and future-oriented ideas. The South Node in Leo leans on personal drama, so the task is to serve something larger.',
      'Growth comes through compassion, faith and surrender. The South Node in Virgo leans on criticism and control, so the task is to trust the process.'
    ],
    chiron: [
      'The wound concerns identity and the right to exist as yourself. Healing comes through courageously taking up space, which later helps others do the same.',
      'The wound concerns worth, the body or security. Healing comes through valuing yourself beyond what you have or produce.',
      'The wound concerns being heard or feeling intelligent. Healing turns you into a gifted communicator or teacher.',
      'The wound concerns family, home or nurturing. Healing comes through becoming a source of care for yourself and others.',
      'The wound concerns being seen and appreciated. Healing comes through creative self-expression that encourages others to shine.',
      'The wound concerns health, perfection or being useful. Healing turns you into a skilled healer, helper or practitioner.',
      'The wound concerns relationships and fairness. Healing comes through balanced partnership and helping others relate well.',
      'The wound concerns trust, loss or power. Healing gives you the strength to guide others through crisis.',
      'The wound concerns belief and meaning. Healing comes through finding a personal philosophy, which you can then teach.',
      'The wound concerns authority, success or failure. Healing comes through becoming a fair, humane authority yourself.',
      'The wound concerns belonging and feeling different. Healing comes through embracing your uniqueness and supporting other outsiders.',
      'The wound concerns boundaries, faith or feeling overwhelmed. Healing comes through spiritual practice and compassionate service.'
    ],
    lilith: [
      'Raw instinct shows up as fierce independence and anger at being controlled.',
      'Raw instinct shows up through sensuality and resistance to being owned or valued as an object.',
      'Raw instinct shows up through speech: saying what is unsaid and refusing to be silenced.',
      'Raw instinct shows up around family and mothering, and the refusal to follow expected roles.',
      'Raw instinct shows up as a hunger to be seen without apology, and resistance to dimming yourself.',
      'Raw instinct shows up as rebellion against perfectionism, service roles or bodily control.',
      'Raw instinct shows up in relationships, where you refuse to be the one who always compromises.',
      'Raw instinct shows up as intense sexuality, depth and a refusal to be shamed.',
      'Raw instinct shows up as freedom of belief and resistance to dogma.',
      'Raw instinct shows up as defiance of authority and a need to set your own rules.',
      'Raw instinct shows up as radical individuality and rejection of group pressure.',
      'Raw instinct shows up through spirituality, imagination and resistance to being defined.'
    ],
    asc: [
      'You meet life head-on. You come across as energetic, direct and quick to act, and people see you as brave, sometimes impatient.',
      'You meet life calmly and steadily. You come across as grounded, sensual and reliable, and people find you reassuring.',
      'You meet life with curiosity. You come across as lively, talkative and youthful, and people see you as clever and adaptable.',
      'You meet life cautiously and caringly. You come across as warm, sensitive and protective, and people feel looked after.',
      'You meet life with presence. You come across as warm, confident and expressive, and people notice when you enter a room.',
      'You meet life carefully. You come across as modest, observant and helpful, and people see you as capable and precise.',
      'You meet life graciously. You come across as charming, diplomatic and attractive, and people find you easy to be around.',
      'You meet life guardedly. You come across as intense, magnetic and private, and people sense depth before they know you.',
      'You meet life with optimism. You come across as open, friendly and adventurous, and people find your enthusiasm contagious.',
      'You meet life seriously. You come across as composed, capable and mature, and people trust you with responsibility.',
      'You meet life as an individual. You come across as friendly but independent and a little unusual, and people see you as original.',
      'You meet life softly. You come across as gentle, dreamy and receptive, and people feel understood by you.'
    ],
    mc: [
      'Your calling involves leadership, initiative and pioneering work. You are known for courage and drive.',
      'Your calling involves building value: finance, craft, design, food or the land. You are known for reliability.',
      'Your calling involves communication: writing, teaching, media, sales or connecting people. You are known for ideas.',
      'Your calling involves care: family, property, hospitality or nurturing professions. You are known for protectiveness.',
      'Your calling involves visibility: creative work, performance, leadership or working with children. You are known for warmth.',
      'Your calling involves skill and service: health, analysis, editing or craft. You are known for competence.',
      'Your calling involves people and fairness: law, design, diplomacy or partnership work. You are known for grace.',
      'Your calling involves depth: research, psychology, finance, medicine or crisis work. You are known for intensity.',
      'Your calling involves expanding minds: education, travel, publishing, law or faith. You are known for vision.',
      'Your calling involves authority and structure: management, government or long-term building. You are known for ambition.',
      'Your calling involves innovation and community: technology, science, activism or networks. You are known for originality.',
      'Your calling involves imagination and compassion: the arts, healing, charity or spirituality. You are known for sensitivity.'
    ],
    vertex: [
      'Fated encounters push you toward independence and courage.',
      'Fated encounters push you toward stability and self-worth.',
      'Fated encounters come through conversations, siblings and learning.',
      'Fated encounters come through family, home and emotional bonds.',
      'Fated encounters come through romance, creativity and play.',
      'Fated encounters come through work, health and service.',
      'Fated encounters come through partners and agreements.',
      'Fated encounters come through intimacy, crisis and shared resources.',
      'Fated encounters come through travel, teachers and belief.',
      'Fated encounters come through career and people in authority.',
      'Fated encounters come through friends, groups and causes.',
      'Fated encounters come through retreat, dreams and hidden situations.'
    ],
    fortune: [
      'Ease comes from taking initiative.', 'Ease comes from steady, sensual pleasures.', 'Ease comes from learning and conversation.',
      'Ease comes from home and caring for others.', 'Ease comes from creative play.', 'Ease comes from useful work done well.',
      'Ease comes from partnership and beauty.', 'Ease comes from depth and shared resources.', 'Ease comes from travel and study.',
      'Ease comes from discipline and achievement.', 'Ease comes from friends and new ideas.', 'Ease comes from imagination and faith.'
    ]
  };
  // Outer points share their pair's text, mirrored.
  IN_SIGN.snode = IN_SIGN.nnode.map((_, i) => IN_SIGN.nnode[(i + 6) % 12].replace(/^Growth comes through/, 'The familiar pull is away from').replace(/The South Node in \w+ leans on/, 'Comfort lies in'));
  IN_SIGN.dsc = IN_SIGN.asc.map((_, i) => 'You are drawn to partners who show qualities of ' + ['Aries: bold, direct and independent', 'Taurus: steady, sensual and loyal', 'Gemini: clever, talkative and light', 'Cancer: caring, protective and emotional', 'Leo: warm, generous and confident', 'Virgo: capable, helpful and precise', 'Libra: charming, fair and cultured', 'Scorpio: intense, loyal and deep', 'Sagittarius: free, honest and adventurous', 'Capricorn: mature, reliable and ambitious', 'Aquarius: original, friendly and independent', 'Pisces: gentle, imaginative and compassionate'][i] + '.');
  IN_SIGN.ic = IN_SIGN.asc.map((_, i) => 'Your private foundations have the flavour of ' + ['Aries: a lively, independent home where you learned to fend for yourself', 'Taurus: a need for a comfortable, stable and well-furnished base', 'Gemini: a busy home full of talk, books and movement', 'Cancer: strong family bonds and a deep need for a nest', 'Leo: a home that is a stage for warmth, pride and creativity', 'Virgo: an orderly, practical home where usefulness was valued', 'Libra: a harmonious home where peace and beauty matter', 'Scorpio: emotional intensity and privacy at the roots', 'Sagittarius: a home linked to travel, faith or other cultures', 'Capricorn: responsibility and structure learned early at home', 'Aquarius: an unconventional home or a sense of not quite belonging', 'Pisces: a sensitive, fluid home with blurred boundaries'][i] + '.');

  root.ChartSignText = IN_SIGN;
})(typeof window !== 'undefined' ? window : globalThis);

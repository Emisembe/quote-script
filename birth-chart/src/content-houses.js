/*
 * Placement-in-house interpretations, houses 1–12 in order.
 */
(function (root) {
  'use strict';
  const IN_HOUSE = {
    sun: [
      'Your personality is front and centre. You are recognisable, self-directed and happiest when leading your own life.',
      'You build identity through earning, owning and valuing. Financial independence is part of your self-respect.',
      'You shine through communication, learning and your local world. Writing, teaching and siblings may be important.',
      'Your identity is rooted in home, family and heritage. Private life matters more than public show.',
      'You shine through creativity, romance, play and children. You need a stage for self-expression.',
      'You find purpose in work, skill and health. Being useful and improving things is where you feel most yourself.',
      'You come alive in partnership. Close relationships and collaborations are central to your sense of self.',
      'You are drawn to depth, crisis and transformation. Shared resources, intimacy and research shape who you become.',
      'You grow through travel, study and belief. A search for meaning drives your identity.',
      'Your identity is tied to career and public life. Achievement and reputation matter, and you may be well known in your field.',
      'You shine among friends, groups and causes. Your identity is bound up with the future you want to help build.',
      'Your light works behind the scenes. You need solitude, reflection and spiritual life, and you may do your best work out of view.'
    ],
    moon: [
      'Your feelings show on your face. You are emotionally responsive and people read your moods easily.',
      'You feel safe when you have resources. Money and possessions carry emotional weight.',
      'You process feelings through talk and writing. You need a busy, connected everyday life.',
      'The Moon is at home here. Family, home and roots are central to your emotional wellbeing.',
      'You need fun, romance and creative outlets to feel emotionally alive. Children may be very important.',
      'You find emotional security in routines and work. Your body and health respond strongly to your moods.',
      'You need a close partner to feel emotionally complete. You are sensitive to others and may take on their feelings.',
      'Your emotions run very deep. You are drawn to intense bonds and may feel the need to control emotional risk.',
      'You need freedom, travel and meaning to feel emotionally satisfied. Foreign places may feel like home.',
      'Your emotional life is linked to public life. You may work with the public or care deeply about reputation.',
      'You find emotional belonging in friendship and groups. You care about community and social causes.',
      'Your feelings are private and sometimes hidden even from yourself. You need regular retreat and quiet.'
    ],
    mercury: [
      'You are quick-witted and talkative, and your mind is part of your identity.',
      'You think about money and value, and you may earn through ideas, words or trade.',
      'Mercury is at home here. You are a natural communicator, learner and networker.',
      'You think about home and family, and you may work from home or keep family records.',
      'You communicate creatively and playfully, and you may teach, write or perform.',
      'You have a practical, analytical mind suited to detailed work and problem-solving.',
      'You think best in dialogue with others, and you may negotiate, advise or consult.',
      'You have an investigative mind drawn to secrets, psychology and research.',
      'You think in big ideas and may study, publish, teach or travel for learning.',
      'Your career involves communication, and your words carry public weight.',
      'You think collectively and connect people through ideas and networks.',
      'You think intuitively and privately. Much of your thinking goes on beneath the surface.'
    ],
    venus: [
      'You are charming and attractive, and grace and beauty come naturally to you.',
      'You enjoy comfort and beautiful things, and you may earn through art or beauty.',
      'You speak pleasantly and enjoy social exchange, and relationships with siblings may be warm.',
      'You create a beautiful, harmonious home and value family closeness.',
      'You love romance, pleasure and creativity, and you have an artistic streak.',
      'You find pleasure in work and service, and relationships may start at work.',
      'Venus is at home here. Partnership is a major source of happiness.',
      'You seek intense, transformative love and may benefit from shared resources.',
      'You love adventure and may fall for someone from a different culture.',
      'Charm helps your career, and you may work in art, beauty or diplomacy.',
      'You enjoy friendship and social groups, and friends may become lovers.',
      'You love secretly or selflessly, and your compassion runs deep.'
    ],
    mars: [
      'You are energetic, assertive and competitive, and you come across as a doer.',
      'You work hard for money and fight for financial independence.',
      'You are quick to speak your mind and can be argumentative or persuasive.',
      'You put energy into home and family, though tension at home can flare.',
      'You pursue pleasure, romance and creative projects with passion.',
      'You work tirelessly and need physical activity to stay well.',
      'You attract strong partners and may experience relationships as a place of conflict or drive.',
      'You have intense desires and strength in crisis, and you may deal with shared finances or power struggles.',
      'You fight for your beliefs and are drawn to adventure, sport or travel.',
      'You are ambitious and driven to succeed in a visible career.',
      'You work hard for groups and causes and may lead a team or movement.',
      'Your drive works behind the scenes. Anger may be suppressed, and energy is best spent on hidden or spiritual work.'
    ],
    jupiter: [
      'You are optimistic, generous and larger than life.',
      'You have good potential for wealth and generosity with resources.',
      'You learn easily and benefit from communication, writing and short travel.',
      'Your home and family bring blessings, and your home may be spacious.',
      'You have luck in creativity, romance and children.',
      'You find opportunities through work and service, and your health tends to recover well.',
      'Partners bring growth and benefits, and marriage can be fortunate.',
      'You benefit from shared resources, inheritance or research, and you come through crises well.',
      'Jupiter is at home here. Travel, study and philosophy bring great rewards.',
      'Career success and public recognition are likely.',
      'Friends and groups bring luck, and your hopes tend to be realised.',
      'Hidden protection and spiritual growth. You help others quietly.'
    ],
    saturn: [
      'You may seem serious or reserved and grow into confidence over time.',
      'Financial lessons teach you to build security slowly and wisely.',
      'You may doubt your communication skills and become careful and precise with words.',
      'Home life may have felt heavy or strict, and building your own foundations becomes a lifelong task.',
      'Fun and creativity may feel difficult at first, and you develop creative mastery with time.',
      'You are a hard worker who needs to guard against overwork and health neglect.',
      'Relationships carry responsibility and may come later, and commitments are serious and lasting.',
      'Lessons about trust, sexuality and shared resources shape you.',
      'You question belief deeply and build a practical personal philosophy.',
      'Career success comes through hard work and patience, and authority grows with time.',
      'You may feel like an outsider in groups and become a responsible organiser.',
      'Hidden fears and solitude are lessons, and inner discipline grows through reflection.'
    ],
    uranus: [
      'You come across as unusual, independent and hard to predict.', 'Your income may be irregular, and you earn through innovative work.',
      'Your mind is original and you learn in unconventional ways.', 'Your home life is unconventional or often changing.',
      'You love freedom in romance and have unusual creative talents.', 'You need variety at work and may work with technology.',
      'You need freedom inside relationships and may attract unusual partners.', 'Sudden changes come through shared resources or crises.',
      'Your beliefs are unconventional and you may travel unexpectedly.', 'Your career takes unusual turns and you may be an innovator in your field.',
      'You are drawn to progressive groups and unusual friends.', 'Hidden inventiveness and sudden intuitive insights.'
    ],
    neptune: [
      'You seem dreamy, gentle or elusive, and people project onto you.', 'Your attitude to money may be idealistic or vague.',
      'You have an imaginative, poetic mind but may struggle with details.', 'Your home or family carries an ideal or a confusion.',
      'Your creativity and romantic imagination are strong.', 'You are drawn to service, healing or artistic work.',
      'You may idealise partners and need clear agreements.', 'You have deep psychic sensitivity and blurred boundaries in intimacy.',
      'You are drawn to spirituality, mysticism and distant places.', 'Your career may involve art, film, healing or charity.',
      'Your friendships are idealistic and you are drawn to spiritual groups.', 'Neptune is at home here. You have a rich inner life and deep compassion.'
    ],
    pluto: [
      'You have a powerful, intense presence that others feel immediately.', 'You experience deep transformation around money and possessions.',
      'You have a penetrating mind and powerful words.', 'Intense family dynamics are the root of personal transformation.',
      'Creativity and love are intense and transformative.', 'You transform through work and health, and you may be drawn to healing professions.',
      'Relationships transform you, and power dynamics play out with partners.', 'Pluto is at home here. You are fearless around crisis, sexuality and shared resources.',
      'Your beliefs undergo radical change, and travel can transform you.', 'You pursue power and influence in your career.',
      'Group involvement transforms you, and you may lead movements.', 'Hidden strength and deep psychological insight.'
    ],
    nnode: [
      'Growth comes through developing yourself and taking the lead.', 'Growth comes through building your own resources and values.',
      'Growth comes through learning, asking and everyday communication.', 'Growth comes through home, family and emotional roots.',
      'Growth comes through creativity, joy and self-expression.', 'Growth comes through service, routine and health.',
      'Growth comes through partnership and cooperation.', 'Growth comes through intimacy and shared resources.',
      'Growth comes through study, travel and meaning.', 'Growth comes through career and public responsibility.',
      'Growth comes through friendship and community.', 'Growth comes through spirituality, rest and letting go.'
    ],
    chiron: [
      'The sore spot concerns identity and appearance.', 'The sore spot concerns money and self-worth.', 'The sore spot concerns learning and being heard.',
      'The sore spot concerns family and home.', 'The sore spot concerns creativity and being seen.', 'The sore spot concerns health and work.',
      'The sore spot concerns partnership.', 'The sore spot concerns trust and intimacy.', 'The sore spot concerns belief and education.',
      'The sore spot concerns career and authority.', 'The sore spot concerns belonging to groups.', 'The sore spot concerns solitude and the spiritual life.'
    ],
    lilith: [
      'Your untamed side shows in how you present yourself.', 'Your untamed side shows around money and pleasure.', 'Your untamed side shows in how you speak.',
      'Your untamed side shows at home and in family roles.', 'Your untamed side shows in romance and creativity.', 'Your untamed side shows at work and in your body.',
      'Your untamed side shows in partnerships.', 'Your untamed side shows in sexuality and power.', 'Your untamed side shows in belief and freedom.',
      'Your untamed side shows in career and in how you deal with authority.', 'Your untamed side shows among groups and friends.', 'Your untamed side lives in the unconscious.'
    ]
  };
  IN_HOUSE.snode = IN_HOUSE.nnode.map((_, i) => 'Familiar territory lies in ' + ['self-reliance', 'possessions and security', 'information and small talk', 'family and the past', 'personal drama and attention', 'work and routine', 'pleasing partners', 'crisis and intensity', 'certainty and belief', 'status and control', 'the group and detachment', 'escape and withdrawal'][i] + '. Useful skills, but not the direction of growth.');
  IN_HOUSE.fortune = ['Ease comes from being yourself.', 'Ease comes from earning and resources.', 'Ease comes from learning and talk.', 'Ease comes from home.', 'Ease comes from creativity and play.', 'Ease comes from useful work.', 'Ease comes from partnership.', 'Ease comes from shared resources.', 'Ease comes from travel and study.', 'Ease comes from career.', 'Ease comes from friends.', 'Ease comes from solitude and reflection.'];
  IN_HOUSE.vertex = ['Encounters shape your identity.', 'Encounters change your finances or values.', 'Encounters come through neighbours and siblings.', 'Encounters come through family.', 'Encounters come through romance.', 'Encounters come through work.', 'Encounters come through partners.', 'Encounters come through crisis or intimacy.', 'Encounters come through travel.', 'Encounters come through career.', 'Encounters come through friends.', 'Encounters come through hidden places.'];

  root.ChartHouseText = IN_HOUSE;
})(typeof window !== 'undefined' ? window : globalThis);

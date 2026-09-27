/*
 * Juno (the asteroid of committed partnership) and composite-chart interpretations.
 * Loaded after content.js, content-signs.js, content-houses.js and content-aspects.js, which it extends.
 */
(function (root) {
  'use strict';
  root.ChartContent.POINTS.juno = {
    name: 'Juno', glyph: '⚵', letters: 'Jn', group: 'Asteroid',
    core: 'Committed partnership: what you need from a long-term partner and what makes a marriage or lasting bond feel right.',
    keywords: ['commitment', 'marriage', 'loyalty']
  };

  root.ChartSignText.juno = [
    'In a committed partner you need independence, honesty and a shared sense of adventure. You want a partner, not a keeper.',
    'In a committed partner you need loyalty, stability and physical affection. Security and shared comforts hold the bond together.',
    'In a committed partner you need a best friend to talk to. Mental connection, humour and variety keep the bond alive.',
    'In a committed partner you need emotional safety and a real home together. Family and caretaking are central to the bond.',
    'In a committed partner you need admiration, loyalty and warmth. You want to feel proud of each other.',
    'In a committed partner you need reliability and practical care. Shared routines and helping each other build the bond.',
    'In a committed partner you need equality, fairness and grace. Partnership itself is deeply important to you.',
    'In a committed partner you need total trust and emotional depth. Commitment is intense and transformative, and betrayal is the deepest fear.',
    'In a committed partner you need freedom, growth and shared beliefs. You bond over travel, learning and meaning.',
    'In a committed partner you need responsibility and long-term goals. You take commitment seriously and build for the future.',
    'In a committed partner you need friendship and space. An unconventional arrangement may suit you better than a traditional one.',
    'In a committed partner you need spiritual and emotional connection. Compassion is essential, and you need clear boundaries so you do not over-give.'
  ];

  root.ChartHouseText.juno = [
    'Partnership shapes your identity, and you may be known as part of a couple.',
    'Commitment is tied to shared money and values. Financial agreements matter in marriage.',
    'You need a partner you can talk to every day, and you may meet through local circles, study or siblings.',
    'Marriage is tied to home and family. Building a household together is central.',
    'You want romance and fun to continue in commitment, and children may be a strong theme.',
    'Commitment shows up in daily life and routine, and you may meet a partner through work.',
    'Juno is at home here. Marriage and committed partnership are a major life theme.',
    'Commitment is deep, intense and transformative, with themes of shared resources and trust.',
    'You may commit to someone from another culture or meet through travel or study.',
    'Partnership is linked to career or status, and you may work with a partner.',
    'You want a partner who is also a friend, and you may meet through groups.',
    'Commitment has a private or spiritual side, and past-life or karmic feelings may surround partners.'
  ];

  // Natal aspect themes for Juno, used by the aspect explanations.
  const AT = root.ChartAspectText;
  Object.assign(AT.PAIR, {
    'sun|juno': 'identity and commitment; partnership is central to who you are',
    'moon|juno': 'emotional needs and commitment; you need to feel at home with a partner',
    'venus|juno': 'love and commitment; romance and marriage point the same way or pull apart',
    'mars|juno': 'desire and commitment; passion and loyalty in long-term bonds',
    'saturn|juno': 'duty and commitment; serious, lasting or delayed partnership',
    'juno|asc': 'commitment and presentation; you come across as partnership-minded',
    'juno|mc': 'commitment and career; partner and profession are linked'
  });
  AT.EXPRESS.juno = ['loyal, committed partnership', 'tension between freedom and commitment'];

  // Composite chart: the relationship itself as one chart.
  root.ChartComposite = {
    intro: 'A composite chart blends two charts into one by taking the midpoint of each pair of planets. It describes the relationship itself as if it were a third person, with its own purpose, needs and style.',
    POINT: {
      sun: 'The purpose of the relationship: what it is for and what it helps both of you become.',
      moon: 'The emotional climate of the relationship: what makes it feel safe, and its daily moods.',
      mercury: 'How the relationship thinks and talks: its conversations, plans and misunderstandings.',
      venus: 'How the relationship expresses love and pleasure, and what it values.',
      mars: 'The relationship\'s drive and how it handles conflict and desire.',
      jupiter: 'Where the relationship grows, finds luck and shares optimism.',
      saturn: 'The relationship\'s commitments, responsibilities and tests: what makes it last.',
      juno: 'The kind of commitment this relationship asks for.',
      asc: 'How the relationship comes across to others and how you act together.',
      mc: 'The public face and shared goals of the relationship.',
      nnode: 'Where the relationship is meant to grow together.',
      chiron: 'The shared sore spot the relationship can heal.'
    },
    HOUSE_FOCUS: [
      'The relationship is strongly about who you each are. It is very visible and shapes your identities.',
      'The relationship is built around shared resources, values and security.',
      'The relationship thrives on talk, ideas and everyday companionship.',
      'The relationship is centred on home, family and emotional roots.',
      'The relationship is about romance, fun, creativity and perhaps children.',
      'The relationship is built on daily routines, shared work and practical support.',
      'The relationship is about partnership itself, with commitment and one-to-one devotion at its heart.',
      'The relationship is intense and transformative, involving shared resources and deep trust.',
      'The relationship expands horizons through travel, study and shared beliefs.',
      'The relationship has a public purpose, with shared ambitions or work together.',
      'The relationship is a friendship at heart, oriented toward shared goals and community.',
      'The relationship has a private, spiritual or hidden side.'
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);

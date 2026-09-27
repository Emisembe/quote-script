/*
 * Specific natal aspect interpretations.
 * Key "a|b" (in ChartAspectText ORDER) -> [conjunction, harmonious (trine/sextile), challenging (square/opposition)].
 */
(function (root) {
  'use strict';
  const N = {
    // ---- Sun ----
    'sun|moon': [
      'Born near a New Moon, your will and your feelings pull in the same direction. You know what you want and go after it single-mindedly, though you may find it hard to see yourself from the outside.',
      'What you want and what you need usually agree. This gives inner peace, emotional stability and an easy relationship between head and heart, which others find reassuring.',
      'What you want and what you need often disagree, so you can feel divided between ambition and comfort. Learning to honour both sides turns this into great self-awareness and drive.'
    ],
    'sun|mercury': [
      'Your thinking and your identity are closely linked. You speak with conviction and identify strongly with your ideas, so learning to hear criticism of an idea without feeling personally attacked is part of your growth.',
      'Mercury is never far from the Sun, so this contact is always a close one. It shows a mind that works in harmony with your purpose.',
      'Mercury is never far from the Sun, so this contact is always a close one. It shows a mind that works in harmony with your purpose.'
    ],
    'sun|venus': [
      'Charm, warmth and a love of beauty are part of your identity. You attract people easily and want to be liked, and art or relationships can become central to how you express yourself.',
      'You have natural grace and a talent for making others feel comfortable. Pleasure and relationships come easily, and you have good aesthetic judgement.',
      'Venus is never far from the Sun, so this contact is always a close one. It adds charm and a desire for harmony to your personality.'
    ],
    'sun|mars': [
      'You have strong drive, courage and a competitive streak. You act decisively and need physical outlets for your energy. Patience and listening are the skills to develop.',
      'Your will and your energy work together, which gives confidence, stamina and effective leadership. You tackle challenges directly and usually get results.',
      'Your drive can clash with your sense of self, which shows up as impatience, conflict or pushing too hard. Channelled into sport, work or a cause, it becomes formidable determination.'
    ],
    'sun|jupiter': [
      'You radiate optimism, generosity and confidence, and people are drawn to your enthusiasm. Opportunities come your way, but you may overpromise or overextend.',
      'Luck and good will tend to follow you. You are generous, hopeful and philosophical, and growth comes naturally when you trust yourself.',
      'Big ambitions can outrun your resources. You may overestimate, overspend or overcommit. Learning moderation turns this into real, lasting expansion.'
    ],
    'sun|saturn': [
      'You are serious, responsible and hard on yourself, often carrying weight early in life. Success comes slowly but lasts, and you grow more confident with age.',
      'Discipline supports your purpose. You are patient, reliable and able to build something lasting, and people trust you with responsibility.',
      'You may doubt yourself or feel blocked by authority figures, especially early in life. The lesson is to become your own authority. Maturity brings strength and respect.'
    ],
    'sun|uranus': [
      'You are original, independent and hard to predict. You need freedom to be yourself and may break with convention. Your life has sudden turning points.',
      'Your individuality is an asset. You bring fresh ideas and innovation, and people see you as refreshingly original without being disruptive.',
      'You resist control and may rebel or change direction suddenly. Restlessness is the shadow side. Channelled well, it makes you a genuine innovator.'
    ],
    'sun|neptune': [
      'You are sensitive, imaginative and idealistic, and your sense of self can be fluid. Art, music, spirituality or service can give it shape. Clear boundaries protect you.',
      'Imagination and compassion strengthen your identity. You have artistic or spiritual gifts and a gentle, inspiring presence.',
      'You may struggle to know who you are or be drawn to escapism, illusion or self-sacrifice. Grounding practices and honest self-reflection help, and your sensitivity becomes a gift.'
    ],
    'sun|pluto': [
      'You have an intense, powerful personality and life brings deep transformations. You are drawn to hidden truths and have great resilience.',
      'You have natural personal power, focus and the ability to regenerate after setbacks. You can lead others through change.',
      'Power struggles, especially with authority, are a theme. You may fear losing control. Facing that fear brings enormous strength and self-mastery.'
    ],
    'sun|nnode': [
      'Expressing yourself fully is part of your life direction, and being true to yourself moves you forward.',
      'Your natural character supports your growth path, and opportunities arrive when you act as yourself.',
      'There is a tension between who you are now and who you are growing into. The nodes ask you to integrate both.'
    ],
    'sun|chiron': [
      'A core sensitivity about self-worth or identity becomes your source of wisdom. You often help others believe in themselves.',
      'Your healing journey strengthens your identity, and you have a gift for mentoring and teaching.',
      'Old wounds around being seen or valued can resurface. Working with them makes you a compassionate guide.'
    ],
    'sun|asc': [
      'Your personality is visible and consistent. People see who you are straight away, and you radiate your Sun sign strongly.',
      'Your inner self and outer manner work well together, so you come across as authentic and confident.',
      'How you come across and who you feel yourself to be can differ, and others may misread you at first. Relationships teach you to align the two.'
    ],
    'sun|mc': [
      'Your career is bound up with your identity. You are ambitious and likely to be publicly visible or recognised.',
      'Career and purpose support each other, and you find it natural to pursue work that fits who you are.',
      'Home and career, or personal and public life, may compete for your energy. Balancing them is a lifelong task.'
    ],
    // ---- Moon ----
    'moon|mercury': [
      'Your thoughts and feelings are closely linked. You communicate emotionally, remember through feeling and read moods well, though objectivity can be hard.',
      'You express feelings easily and understand others intuitively. You are a sympathetic listener with a good memory.',
      'Head and heart may argue, and you may overthink feelings or speak before processing them. Writing things down helps.'
    ],
    'moon|venus': [
      'You are affectionate, gentle and emotionally warm. You need harmony, beauty and love, and you often have artistic taste.',
      'You give and receive love easily and create comfort around you. People feel cared for in your presence.',
      'What you need emotionally and what you find attractive may differ. You can seek comfort through indulgence. Understanding your needs brings better relationships.'
    ],
    'moon|mars': [
      'Your emotions are strong and quick. You are protective, passionate and quick-tempered, and anger flares when you feel threatened.',
      'You act on your feelings with courage and are good in emergencies. You defend those you love.',
      'Moods can turn into irritation or conflict, especially in close relationships. Physical activity and naming feelings early help a great deal.'
    ],
    'moon|jupiter': [
      'You are emotionally generous, warm and optimistic. You feel things in a big way and need space and meaning.',
      'Faith and good humour carry you through hard times. You are kind, protective and popular.',
      'Emotional excess, such as overeating, overspending or overpromising, can be a pattern. Learning when "enough" is enough brings contentment.'
    ],
    'moon|saturn': [
      'You may have learned early to control or hide your feelings. You are responsible, resilient and reliable, and you slowly learn that it is safe to need people.',
      'You are emotionally steady and dependable, and you offer others a sense of security. Your feelings mature well over time.',
      'You may feel emotionally unsupported, lonely or too serious. Loosening self-control and allowing support are the lessons. Once you do, you are deeply resilient.'
    ],
    'moon|uranus': [
      'Your emotional life is changeable and original. You need independence even in close bonds, and sudden changes of mood or circumstance are common.',
      'You adapt quickly to change and bring an unusual, open-minded emotional style. Friendship is an important part of love for you.',
      'You may swing between wanting closeness and needing space, which can unsettle relationships. Building in freedom helps you stay connected.'
    ],
    'moon|neptune': [
      'You are highly sensitive, empathic and intuitive, and you soak up other people\'s feelings. Art, music and spirituality nourish you. Boundaries are essential.',
      'Your imagination and compassion are strong, and you may have psychic or artistic gifts. You are a natural carer.',
      'You may idealise people, feel confused about what you feel or escape into fantasy. Reality checks and grounding routines protect your big heart.'
    ],
    'moon|pluto': [
      'Your emotions are intense and all-or-nothing. You bond deeply, sense what is hidden and may have experienced emotional upheaval early.',
      'You have emotional depth and the ability to heal and transform, and you support others through crisis.',
      'Jealousy, control or fear of abandonment can surface in close bonds. Facing emotional fears brings profound renewal.'
    ],
    'moon|nnode': ['Emotional growth and home life are part of your path.', 'Your instincts guide you toward your growth path.', 'Old emotional habits may pull you away from growth, so notice where comfort holds you back.'],
    'moon|chiron': ['Emotional sensitivity around care or nurturing becomes a gift for supporting others.', 'You heal others through empathy and understanding.', 'Early emotional hurts may resurface in close relationships. Self-care is the healing path.'],
    'moon|asc': ['Your feelings show on your face, and you come across as caring, sensitive and approachable.', 'Your emotional instincts and outward manner fit together, and people find you easy to connect with.', 'Your moods can affect how you come across. Learning to pause before reacting helps.'],
    'moon|mc': ['Your public life is emotionally charged, and you may work with the public, family or care.', 'Your emotional intelligence supports your career.', 'Home and career may compete for your attention, and each needs time.'],
    // ---- Mercury ----
    'mercury|venus': ['You speak gracefully and have an eye for beauty. You are diplomatic and may have literary, musical or artistic talent.', 'You communicate with charm and tact, which helps in negotiation, sales and relationships.', 'Venus and Mercury stay close together, so this contact is rarely hard. It shows a pleasant, social mind.'],
    'mercury|mars': ['Your mind is quick and sharp, and you argue well. You think fast and speak directly, sometimes too bluntly.', 'You think and act decisively. You are a persuasive speaker with mental energy and courage.', 'Words can become weapons. You may be argumentative or impatient in discussion, so debate, writing and strategy games are good outlets.'],
    'mercury|jupiter': ['You think big and optimistically and love learning, teaching and ideas. Details can get lost in the big picture.', 'You learn easily and communicate with enthusiasm. Teaching, writing, law and travel suit you.', 'You may exaggerate, overlook details or promise more than you can deliver. Fact-checking and focus balance your vision.'],
    'mercury|saturn': ['You think carefully, seriously and methodically. You may have doubted your intelligence early on and became an expert through effort.', 'Your mind is disciplined, practical and reliable. You concentrate well and plan well.', 'Self-doubt, pessimism or communication blocks may slow you down. Patience turns this into deep expertise.'],
    'mercury|uranus': ['Your mind is brilliant, original and fast, with flashes of insight. Technology and science suit you, though you can be impatient with slower thinkers.', 'You think inventively and objectively, and you see solutions others miss.', 'Your thinking can be scattered, nervous or contrarian. Grounding ideas in practical steps helps them land.'],
    'mercury|neptune': ['Your mind is imaginative and poetic and thinks in images. You are creative, intuitive and sometimes vague.', 'You communicate creatively and with compassion, and you may have a gift for writing, music or healing words.', 'Confusion, forgetfulness or misunderstandings are possible. Writing things down and checking facts protects you.'],
    'mercury|pluto': ['Your mind is penetrating, investigative and persuasive. You uncover secrets and dig deep.', 'You have strong powers of concentration and research, and your words carry weight.', 'Your thinking can become obsessive, suspicious or controlling in debate. Learning to let go of mental battles brings peace.'],
    'mercury|asc': ['You come across as articulate, curious and talkative.', 'Your communication skills help your self-presentation.', 'What you say and how you come across may not match. Mindful communication helps.'],
    'mercury|mc': ['Communication is central to your career.', 'Words, trade or teaching support your professional path.', 'Career communication can be stressful. Clear agreements help.'],
    'mercury|chiron': ['A sensitivity about being heard becomes a gift for teaching and explaining.', 'You find words that help others heal.', 'Old fears about intelligence or voice can resurface. Speaking up is part of the healing.'],
    // ---- Venus ----
    'venus|mars': ['You have strong passion and magnetism. Love and desire are closely linked, and you pursue romance actively. Creative energy is high.', 'Attraction flows easily, and you balance giving and taking in love. There is creative and romantic talent here.', 'Desire and affection may pull in different directions, which creates passionate but stormy relationships. Understanding what you want versus what you value brings balance.'],
    'venus|jupiter': ['You are generous, affectionate and fond of pleasure. Love and money often come with some ease.', 'Good fortune in relationships and finances is likely. You are warm-hearted and sociable.', 'Overindulgence in pleasure, spending or romance is the risk. Moderation keeps the blessings flowing.'],
    'venus|saturn': ['You take love seriously and may be shy or cautious. You commit for the long term, sometimes with an older or more serious partner.', 'Love is loyal and durable, and you build lasting relationships and wealth over time.', 'Fear of rejection, loneliness or feeling unlovable can make love feel hard. Patience and self-worth work bring deep, stable relationships later.'],
    'venus|uranus': ['You are attracted to the unusual and need freedom in love. Sudden attractions and unconventional relationships are likely.', 'You bring excitement and originality to relationships while keeping friendship at the heart of them.', 'You may be drawn to unavailable people or leave suddenly when you feel confined. Building freedom into commitment is the key.'],
    'venus|neptune': ['You are deeply romantic, artistic and idealistic about love. You may have musical or visual talent.', 'Your compassion and artistic sense are strong. Love has a spiritual, soulful quality.', 'You may idealise partners and later feel disappointed, or give too much. Seeing people as they really are protects your heart.'],
    'venus|pluto': ['Love is intense, magnetic and transformative. You love completely and can be jealous or possessive.', 'You form deep, loyal bonds and are good at renewing relationships.', 'Power struggles, obsession or fear of betrayal can appear in love. Trust and letting go are the lessons.'],
    'venus|nnode': ['Relationships and values point you toward your life direction.', 'Love and beauty support your growth path.', 'Comfort in love may pull you away from growth.'],
    'venus|chiron': ['A sensitivity about being lovable becomes a gift for helping others feel accepted.', 'You heal through love, art and beauty.', 'Old hurts around love or self-worth can resurface. Self-acceptance is the medicine.'],
    'venus|asc': ['You come across as attractive, charming and pleasant.', 'Grace and diplomacy help you make a good first impression.', 'You may try too hard to please. Authenticity is more attractive.'],
    'venus|mc': ['Art, beauty or diplomacy may shape your career, and you are liked in public.', 'Charm and good relationships support your career.', 'Career and love life may compete. Balance helps.'],
    // ---- Mars ----
    'mars|jupiter': ['You have enormous energy and enthusiasm. You are bold, adventurous and competitive, sometimes overconfident.', 'Your actions tend to succeed. You have good timing and courage and are often lucky in sport or business.', 'Overconfidence, risk-taking or taking on too much can backfire. Planning and pacing make you unstoppable.'],
    'mars|saturn': ['You have disciplined drive and great endurance. Frustration may build when you are blocked, but you achieve through persistence.', 'You combine energy with discipline, which makes you an effective and strategic worker who finishes what you start.', 'Stop-start energy, frustration or suppressed anger is common. Structured exercise and realistic goals release the tension.'],
    'mars|uranus': ['Your energy comes in sudden bursts, and you are rebellious, inventive and quick to act. Accidents can come from haste.', 'You act with originality and speed and are good in a crisis and in technical work.', 'Impulsiveness, restlessness or sudden anger are the risks. Slowing down at key moments protects you.'],
    'mars|neptune': ['Your drive is linked to ideals, art or spirituality. You may act on inspiration, and energy can fluctuate.', 'You act with compassion and creativity and fight for causes you believe in.', 'Low energy, confusion about what you want, or passive-aggressive patterns may appear. Clear goals help.'],
    'mars|pluto': ['You have immense willpower and intensity, and you rarely give up. You need constructive outlets for your power.', 'You have strength, stamina and the ability to transform situations through focused action.', 'Power struggles or explosive anger can arise. Mastering this energy through sport or deep work makes you formidable.'],
    'mars|nnode': ['Action and courage move you along your path.', 'Your drive supports your growth path.', 'Impulsive action may pull you off course.'],
    'mars|chiron': ['A sensitivity about assertion becomes the ability to empower others.', 'You fight for those who have been hurt.', 'Old wounds around anger or confidence may resurface.'],
    'mars|asc': ['You come across as energetic, direct and assertive, sometimes aggressive.', 'You make a strong, confident impression.', 'You may seem more confrontational than you mean to.'],
    'mars|mc': ['You are ambitious and competitive in your career and drawn to leadership.', 'Your drive supports your career.', 'Conflicts with bosses or in public life are possible. Channel your ambition carefully.'],
    // ---- Jupiter ----
    'jupiter|saturn': ['You balance expansion and caution. Growth comes through structured effort, and you may reach success later but steadily.', 'You combine vision with realism, which is excellent for business and long-term planning.', 'You may swing between optimism and pessimism, or between risk and caution. Finding the middle path brings wisdom.'],
    'jupiter|uranus': ['You have a restless, inventive optimism and sudden lucky breaks. You need freedom to grow.', 'Unexpected opportunities and original thinking open doors for you.', 'Rash decisions or sudden changes of plan can undo progress. Pausing before leaping helps.'],
    'jupiter|neptune': ['You are idealistic, spiritual and compassionate, with a strong imagination and faith.', 'You have generous vision and spiritual or artistic gifts.', 'Unrealistic expectations or escapism may cause disappointment, so ground your dreams in practice.'],
    'jupiter|pluto': ['You are ambitious for influence and large-scale change.', 'You have the power to achieve big goals and regenerate resources.', 'An urge for too much power or control can backfire.'],
    'jupiter|asc': ['You come across as warm, generous and optimistic.', 'You make a positive, confident impression that opens doors.', 'You may overpromise or appear overconfident.'],
    'jupiter|mc': ['You have good prospects for career growth and recognition.', 'Opportunities and mentors help your career.', 'Overexpansion or poor judgement in career choices is the risk.'],
    // ---- Saturn ----
    'saturn|uranus': ['There is tension between tradition and change. You may build new structures from old ones.', 'You combine innovation with practicality, which is excellent for reform.', 'You may feel torn between security and freedom. Integration brings inventive stability.'],
    'saturn|neptune': ['You are learning to give form to dreams and ideals.', 'Your practical idealism can turn visions into reality.', 'Fear and confusion may blur boundaries. Grounding spiritual life helps.'],
    'saturn|pluto': ['You have great endurance and seriousness under pressure.', 'You have the strength to rebuild after loss.', 'Heavy pressure or control issues may arise, and resilience is the result.'],
    'saturn|asc': ['You come across as serious, reserved and mature.', 'You make a reliable, trustworthy impression.', 'You may seem distant or feel self-conscious. Warmth grows with age.'],
    'saturn|mc': ['Your career is built slowly, with responsibility and authority.', 'Discipline brings steady career success.', 'Career obstacles teach patience, and success tends to come later.'],
    // ---- Outer planets (generational) ----
    'uranus|neptune': ['A generational link between innovation and idealism.', 'A generation that blends vision with invention.', 'A generation whose ideals and innovations collide.'],
    'uranus|pluto': ['A generation of radical change.', 'A generation able to reform society.', 'A generation living through upheaval.'],
    'neptune|pluto': ['A generational link between ideals and transformation.', 'This long sextile links a century of generations through deep spiritual and cultural change.', 'A generation facing collective crises of belief.'],
    // ---- Asc / MC with outer ----
    'uranus|asc': ['You come across as unusual and independent.', 'You make a fresh, original impression.', 'You may seem unpredictable.'],
    'neptune|asc': ['You come across as gentle, dreamy or elusive.', 'You make a compassionate, artistic impression.', 'Others may project onto you.'],
    'pluto|asc': ['You come across as intense and magnetic.', 'You make a powerful, focused impression.', 'You may seem intimidating.']
  };

  root.ChartNatalAspects = N;
})(typeof window !== 'undefined' ? window : globalThis);

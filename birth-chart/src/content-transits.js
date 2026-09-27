/*
 * Specific transit interpretations: "mover|natal" -> [conjunction, harmonious (trine/sextile), challenging (square/opposition)].
 */
(function (root) {
  'use strict';
  const TR = {
    // ---- Jupiter ----
    'jupiter|sun': ['A high point for confidence and recognition. A good time to start ventures, ask for opportunities and be visible.', 'Things flow your way. Luck, support and optimism make this a good time to grow and take reasonable risks.', 'Opportunities come with the risk of overdoing it. Watch overconfidence, overspending and overcommitting.'],
    'jupiter|moon': ['Emotional warmth and generosity. Home and family may expand, through a move, a birth or a reunion.', 'You feel content and emotionally supported. A good time for home improvements and family time.', 'Emotional excess or overindulgence is possible. Keep your comfort habits in check.'],
    'jupiter|mercury': ['Big ideas and good news. A great time for study, writing, contracts and travel.', 'Clear, optimistic thinking. Good for negotiations, learning and publishing.', 'Details may be overlooked. Read contracts carefully and avoid overpromising.'],
    'jupiter|venus': ['A lucky period for love, pleasure and money. Relationships and creative work flourish.', 'Harmony in love and finances. A good time for socialising, art and purchases.', 'Overspending or indulgence in pleasure is the risk. Enjoy yourself, within limits.'],
    'jupiter|mars': ['High energy and courage. Good for bold action, sport and new projects.', 'Your efforts succeed. A great time to push forward with confidence.', 'Rash action or overconfidence can backfire. Plan before you charge.'],
    'jupiter|jupiter': ['Your Jupiter return: a new twelve-year cycle of growth. Set intentions for the next chapter.', 'Growth comes steadily. Opportunities fit your values.', 'Growth pains. Choose which opportunities truly matter.'],
    'jupiter|saturn': ['Expansion meets structure. A good time to grow something solid.', 'Effort pays off. Recognition for long-term work.', 'Tension between growth and limits. Balance ambition with realism.'],
    'jupiter|asc': ['You feel confident and look good. People respond warmly, and a new personal chapter opens.', 'Personal opportunities and good first impressions come your way.', 'You may overextend yourself personally. Pace yourself.'],
    'jupiter|mc': ['Career breakthroughs and public recognition are likely. Promotions and new roles.', 'Career support and good reputation.', 'Career opportunities may clash with home life. Choose carefully.'],
    // ---- Saturn ----
    'saturn|sun': ['A defining test of identity and purpose. Hard work, responsibility and maturity, often with lasting rewards. Energy can feel low, so rest.', 'Steady progress through effort. Your authority and reputation grow.', 'Pressure, obstacles or authority conflicts. A reality check that strips away what is not essential. Persist.'],
    'saturn|moon': ['Emotional seriousness. Family responsibilities or feelings of loneliness can arise, and emotional maturity follows.', 'Emotional stability grows. A good time to establish home and routines.', 'Emotional heaviness or family pressure. Allow support and practise self-care.'],
    'saturn|mercury': ['Serious thinking and study. Good for focused learning, planning and important documents.', 'Clear, disciplined thinking. Good for contracts and long-term plans.', 'Communication delays or worries. Be patient and double-check.'],
    'saturn|venus': ['Relationships are tested and either deepen into commitment or end. Finances need care.', 'Love and money stabilise. A good time for commitment and saving.', 'Loneliness, relationship strain or tight money. Focus on what is truly valuable.'],
    'saturn|mars': ['Energy meets resistance. Disciplined effort works, and force does not.', 'Persistent effort brings real results. Great for long projects and training.', 'Frustration and blocked energy. Avoid conflict and use structured exercise.'],
    'saturn|jupiter': ['Growth is put through a reality check. Consolidate rather than expand.', 'Steady, well-planned growth.', 'Tension between expansion and limits. Simplify your plans.'],
    'saturn|saturn': ['Your Saturn return (around ages 29, 58 and 87): a major life review. What is authentic stays, and what is not falls away.', 'Structures you have built are rewarded.', 'A Saturn square or opposition: a checkpoint that tests your life structures. Adjust where needed.'],
    'saturn|asc': ['A serious new personal chapter. You take on responsibility, and your health and appearance need care.', 'You come across as mature and capable. Good for self-discipline.', 'Personal pressure or relationship strain. Take care of your body.'],
    'saturn|mc': ['A career peak or restructuring. You reap what you have built, for better or worse.', 'Solid career progress through effort.', 'Career pressure or conflict with authority. Reassess your direction.'],
    // ---- Uranus ----
    'uranus|sun': ['A liberation of identity. Sudden change, new freedom and reinvention. Expect the unexpected.', 'Exciting, positive changes. Fresh starts feel natural.', 'Disruption and restlessness. You may break free from what no longer fits, sometimes abruptly.'],
    'uranus|moon': ['Emotional awakening. Changes at home, a move or new freedom in family life.', 'Welcome changes in home and emotional life.', 'Emotional upheaval or sudden changes at home. Stay flexible.'],
    'uranus|mercury': ['Brilliant, sudden ideas. Great for technology, learning new skills and new ways of thinking.', 'Inventive, fast thinking and exciting news.', 'Nervous tension and scattered thinking. Unexpected news.'],
    'uranus|venus': ['Sudden attractions or changes in relationships. You need freedom in love, and your taste changes.', 'Exciting new connections, creative breakthroughs and a financial windfall are possible.', 'Relationships may be disrupted or end suddenly, and money can be unpredictable.'],
    'uranus|mars': ['A surge of restless, rebellious energy. Great for bold new starts. Take care with accidents.', 'Energetic, original action and quick success.', 'Impulsiveness and accident risk. Slow down and channel the energy.'],
    'uranus|jupiter': ['Sudden opportunities and lucky breaks.', 'Unexpected growth.', 'Rash decisions. Think before you jump.'],
    'uranus|saturn': ['Old structures change. Reform your life.', 'You modernise traditions and structures in a positive way.', 'Tension between security and freedom. A midlife reform.'],
    'uranus|asc': ['A personal reinvention: new image, new relationships, new direction.', 'Refreshing personal changes.', 'Unsettling changes in relationships or self-image.'],
    'uranus|mc': ['A sudden career change or breakthrough. You may go freelance or take a new path.', 'Innovative career developments.', 'Career instability or sudden changes.'],
    // ---- Neptune ----
    'neptune|sun': ['Identity becomes softer and more spiritual. Your ego dissolves and something inspired emerges. Energy can be low, so avoid major decisions based on illusion.', 'Inspiration, compassion and creative flow.', 'Confusion about direction, fatigue or disillusionment. Seek clarity and truth.'],
    'neptune|moon': ['Heightened sensitivity and intuition. Emotional boundaries soften.', 'Emotional and spiritual nourishment.', 'Emotional confusion or family uncertainty. Protect your boundaries.'],
    'neptune|mercury': ['Imaginative thinking. Great for creative writing, but check facts.', 'Intuitive insight and artistic communication.', 'Confusion, misunderstandings or deception. Read the small print.'],
    'neptune|venus': ['Romantic idealism and artistic inspiration. Love feels magical.', 'Spiritual love and creative flow.', 'Illusions in love or money. See people clearly.'],
    'neptune|mars': ['Energy is linked to ideals, and drive can be low or inspired.', 'Compassionate, inspired action.', 'Low energy or unclear goals. Rest and refocus.'],
    'neptune|jupiter': ['Spiritual expansion and faith.', 'Inspired optimism.', 'Unrealistic hopes. Ground your dreams.'],
    'neptune|saturn': ['Structures dissolve and dreams take form.', 'Practical idealism.', 'Uncertainty about foundations. Clarify what is real.'],
    'neptune|asc': ['Your self-image softens and you become more sensitive to your surroundings.', 'An inspired, compassionate presence.', 'Confusion in relationships or self-image.'],
    'neptune|mc': ['Your career becomes more idealistic, creative or spiritual.', 'Inspired career direction.', 'Career uncertainty. Avoid illusions about your path.'],
    // ---- Pluto ----
    'pluto|sun': ['Deep transformation of identity. An old self dies and a stronger one emerges. Power issues arise.', 'Personal empowerment and regeneration.', 'Power struggles and intense pressure. Profound growth through crisis.'],
    'pluto|moon': ['Deep emotional transformation. Family dynamics change fundamentally.', 'Emotional healing and depth.', 'Emotional intensity or family crisis. Let old patterns go.'],
    'pluto|mercury': ['Deep, obsessive thinking. Research and psychology are favoured.', 'Powerful insight and persuasion.', 'Mental intensity or power struggles through words.'],
    'pluto|venus': ['Love and values transform. Intense relationships.', 'Deep, renewing love and financial regeneration.', 'Jealousy, obsession or financial pressure. Let go of control.'],
    'pluto|mars': ['Immense drive and willpower.', 'Powerful, effective action.', 'Conflicts and power struggles. Use strength wisely.'],
    'pluto|jupiter': ['Ambition grows, and so does your influence.', 'Growth in power and resources.', 'Overreaching or power conflicts.'],
    'pluto|saturn': ['Structures are rebuilt from the ground up.', 'Deep, lasting consolidation.', 'Intense pressure on life structures.'],
    'pluto|asc': ['A personal metamorphosis.', 'Personal empowerment.', 'Intense relationship dynamics.'],
    'pluto|mc': ['A career transformation or rise to power.', 'Growing influence.', 'Career power struggles.']
  };
  root.ChartTransitText = TR;
})(typeof window !== 'undefined' ? window : globalThis);

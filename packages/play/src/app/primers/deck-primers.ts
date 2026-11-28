/**
 * Learn mode, tutorial piece 4: the written half of each deck primer, keyed by the
 * `MODERN_DECKS` id (packages/common/src/game/modern-decks.ts).
 *
 * Written from the card text as implemented in packages/sets (each card was checked
 * against a card database when its deck was added; see docs/RYUU_PROGRESS.md). A primer
 * only says what the cards do and how they fit together; it makes no claims about
 * matchups or win rates, which nobody has measured here. The generated half (evolution
 * lines, Prize cards, Weakness, attacks) is in `deck-primer-analysis.ts`.
 */
export interface DeckPrimerText {
  /** The game plan in two or three sentences. */
  plan: string;
  /** Short practical tips: what to set up first, what to hold, what to watch for. */
  tips: string[];
}

export const DECK_PRIMERS: { [deckId: string]: DeckPrimerText } = {

  'sv-tr-mewtwo': {
    plan: 'Fill your Bench with Team Rocket\'s Pokémon, then attack with Team Rocket\'s Mewtwo ex: Erasure Ball '
      + 'does 160, plus 60 for each Energy (up to 2) you discard from your Benched Pokémon. Team Rocket\'s Spidops '
      + 'is the backup attacker and the Energy engine: its Charging Up Ability attaches a Basic Energy from your '
      + 'discard pile to itself each turn, which refills what Erasure Ball throws away.',
    tips: [
      'Mewtwo ex can\'t attack at all until you have 4 or more Team Rocket\'s Pokémon in play (Power Saver). '
        + 'Count them before you plan an attack.',
      'Rocket Rush on Spidops does 30 for each Team Rocket\'s Pokémon in play, so a full Bench helps it too.',
      'Team Rocket\'s Articuno\'s Repelling Veil stops the effects of attacks (not damage) on your Basic Team '
        + 'Rocket\'s Pokémon.',
      'Mewtwo ex gives up 2 Prize cards and has a Retreat Cost of 3: think before you leave it in the Active Spot.',
    ]
  },

  'sv-dragapult': {
    plan: 'Evolve Dreepy into Drakloak into Dragapult ex, then use Phantom Dive every turn: 200 damage to the '
      + 'Active Pokémon and 6 damage counters spread over the opponent\'s Bench however you like. The counters '
      + 'set up later Knock Outs, so plan two turns ahead. Munkidori\'s Adrena-Brain can move 3 more damage '
      + 'counters onto an opponent\'s Pokémon.',
    tips: [
      'Get several Dreepy down early; each Drakloak\'s Recon Directive looks at 2 cards and keeps 1, which helps '
        + 'you find the rest of the line.',
      'Phantom Dive needs a Fire and a Psychic Energy. Munkidori needs a Darkness Energy for Adrena-Brain.',
      'Budew\'s Itchy Pollen stops the opponent playing Items on their next turn, a good start while you set up.',
      'Dragapult ex gives up 2 Prize cards; Meowth ex and Fezandipiti ex give up 2 as well, so bench them only when '
        + 'you need them.',
    ]
  },

  'sv-dragapult-dusknoir': {
    plan: 'The same Dragapult ex plan (Phantom Dive: 200 to the Active and 6 damage counters on the Bench), with '
      + 'Dusknoir and Dusclops to finish Pokémon off. Cursed Blast puts 13 (Dusknoir) or 5 (Dusclops) damage '
      + 'counters on any of the opponent\'s Pokémon, and then your Pokémon is Knocked Out.',
    tips: [
      'Cursed Blast Knocks Out your own Pokémon, so the opponent takes a Prize card for it. Use it when the '
        + 'Knock Out it gives you is worth more.',
      'Duskull\'s Come and Get You puts up to 3 Duskull from your discard pile onto your Bench.',
      'Phantom Dive needs a Fire and a Psychic Energy.',
    ]
  },

  'sv-dragapult-blaziken': {
    plan: 'Two Stage 2 attackers. Dragapult ex spreads damage with Phantom Dive (200 to the Active, 6 damage '
      + 'counters on the Bench), and Blaziken ex hits hard with Smolder-sault (200, but it can\'t attack on your '
      + 'next turn). Blaziken ex\'s Seething Spirit attaches a Basic Energy from your discard pile to one of your '
      + 'Pokémon once a turn, which keeps your attackers powered.',
    tips: [
      'Because Smolder-sault can\'t be used two turns in a row, switch between Blaziken ex and Dragapult ex.',
      'Torchic\'s Collect draws a card; Chi-Yu\'s Ground Melter does 60 more if a Stadium is in play, then '
        + 'discards it.',
      'Both main attackers are Pokémon ex (2 Prize cards each).',
    ]
  },

  'sv-alakazam': {
    plan: 'Evolve Abra into Kadabra into Alakazam, drawing cards as you go (Psychic Draw: 2 cards for Kadabra, '
      + '3 for Alakazam, when you evolve from your hand). Alakazam\'s Powerful Hand then puts 2 damage counters '
      + 'on the opponent\'s Active Pokémon for each card in your hand, so a big hand is the whole point.',
    tips: [
      'Powerful Hand places damage counters, so Weakness and Resistance don\'t apply.',
      'Dudunsparce\'s Run Away Draw draws 3 cards and shuffles Dudunsparce back into your deck.',
      'Watch your deck size: this deck draws a lot, and a player who can\'t draw at the start of their turn loses.',
      'Flutter Mane in the Active Spot turns off the opponent\'s Active Pokémon\'s Abilities.',
    ]
  },

  'sv-ns-zoroark': {
    plan: 'Evolve N\'s Zorua into N\'s Zoroark ex, then use Night Joker to copy an attack from one of your '
      + 'Benched N\'s Pokémon: N\'s Zekrom\'s Rampaging Thunder (250), N\'s Reshiram\'s Virtuous Flame (170) or '
      + 'N\'s Purrloin\'s Thieving Swipe. Night Joker costs only two Darkness Energy, whatever the copied attack '
      + 'costs.',
    tips: [
      'Zoroark ex\'s Trade Ability: discard a card from your hand to draw 2.',
      'Keep at least one N\'s Pokémon on the Bench, or Night Joker has nothing to copy.',
      'If you copy Rampaging Thunder, that Zoroark ex can\'t attack on your next turn.',
      'Pecharunt ex\'s Subjugating Chains swaps a Benched Darkness Pokémon into the Active Spot (it becomes '
        + 'Poisoned).',
    ]
  },

  'sv-mega-excadrill': {
    plan: 'Evolve Drilbur into Mega Excadrill ex and power it with Metal Energy from Metang\'s Metal Maker (look '
      + 'at the top 4 cards, attach any Basic Metal Energy you find). Maximum Drilling does 200, or 330 with 2 '
      + 'extra Energy attached.',
    tips: [
      'Mega Excadrill ex gives up 3 Prize cards and has a Retreat Cost of 4: protect it.',
      'Genesect ex\'s Metallic Signal searches your deck for 2 Evolution Metal Pokémon.',
      'Drilbur\'s Call for Family puts 2 Basic Pokémon from your deck onto your Bench.',
      'Mega Skarmory ex\'s Sonic Ripper does 220 to any one of the opponent\'s Pokémon.',
    ]
  },

  'sv-slowking': {
    plan: 'Slowking\'s Seek Inspiration discards your top card; if it is a Pokémon without a Rule Box, Slowking '
      + 'uses one of its attacks. The deck is full of single Pokémon with strong attacks (Metagross, Annihilape, '
      + 'Drapion, Zeraora and more) for Slowking to borrow. Mega Kangaskhan ex is the other attacker: Rapid-Fire '
      + 'Combo does 200, plus 50 for each heads until you flip tails.',
    tips: [
      'Seek Inspiration only costs Psychic and Colorless, whatever the borrowed attack costs.',
      'Pokémon ex (with a Rule Box) that Seek Inspiration discards do nothing.',
      'Mega Kangaskhan ex\'s Run Errand draws 2 cards while it is in the Active Spot. It gives up 3 Prize cards.',
      'Latias ex\'s Skyliner gives your Basic Pokémon no Retreat Cost.',
    ]
  },

  'sv-festival-lead': {
    plan: 'Play Festival Grounds, then attack twice a turn with a Pokémon that has the Festival Lead Ability '
      + '(Dipplin, Goldeen, Seaking). If the first attack Knocks Out the Active Pokémon, the second one hits the '
      + 'new Active. Thwackey\'s Boom Boom Groove searches your deck for any card while a Festival Lead Pokémon is '
      + 'Active.',
    tips: [
      'Without Festival Grounds in play, Festival Lead does nothing.',
      'Dipplin\'s Do the Wave does 20 for each of your Benched Pokémon, so fill your Bench.',
      'Most of these Pokémon have 40-100 HP. Shaymin\'s Flower Curtain and Rabsca\'s Spherical Shield protect your '
        + 'Bench.',
    ]
  },

  'sv-basic-box': {
    plan: 'No evolutions: only Basic Pokémon, so you can attack from the first turn you are allowed to. Mega '
      + 'Kangaskhan ex is the main attacker (Rapid-Fire Combo: 200, plus 50 for each heads until tails), with '
      + 'Teal Mask Ogerpon ex, Latias ex, Raging Bolt ex and others for different situations.',
    tips: [
      'Most Pokémon here give up 2 or 3 Prize cards, so the opponent needs fewer Knock Outs than usual.',
      'Latias ex\'s Skyliner gives your Basic Pokémon no Retreat Cost, so you can swap attackers freely.',
      'Teal Mask Ogerpon ex\'s Teal Dance attaches a Grass Energy from your hand and draws a card.',
    ]
  },

  'sv-dhelmise': {
    plan: 'Put Pokémon with the Hide \'n\' Sneak Ability into your discard pile, then attack with Dhelmise: '
      + 'Vengeful Anchor does 30, or 170 once 4 or more Hide \'n\' Sneak Pokémon are in your discard pile. '
      + 'Banette\'s Puppet Pull (80) also searches your deck for any card.',
    tips: [
      'Sinistcha\'s Matcha Spin puts 4 damage counters on each of the opponent\'s Pokémon once you have 6 or more '
        + 'Hide \'n\' Sneak Pokémon in your discard pile.',
      'Poltchageist has 30 HP: don\'t start a game with it alone in play if you can avoid it.',
      'Watch your deck size: Puppet Pull and the draw Supporters use up your deck quickly.',
    ]
  },

  'sv-ogerpon-meganium': {
    plan: 'Teal Mask Ogerpon ex attaches Grass Energy with Teal Dance and attacks with Myriad Leaf Shower (30, plus '
      + '30 for each Energy on both Active Pokémon). Meganium\'s Wild Growth makes each Basic Grass Energy provide '
      + 'two Grass Energy, which powers it up quickly. Hydrapple ex is the second attacker: Syrup Storm does 30 '
      + 'more for each Grass Energy on all your Pokémon.',
    tips: [
      'Evolve Chikorita into Meganium early: Wild Growth makes every attack in the deck cheaper.',
      'Hydrapple ex\'s Ripening Charge attaches a Grass Energy from your hand and heals 30 from that Pokémon.',
      'Celebi\'s Traverse Time searches your deck for up to 3 Grass Pokémon and Stadiums.',
    ]
  },

  'sv-mega-lucario': {
    plan: 'Evolve Riolu into Mega Lucario ex. Aura Jab (130) attaches up to 3 Basic Fighting Energy from your '
      + 'discard pile to your Benched Pokémon, powering the next attacker; Mega Brave (270) is the big hit but '
      + 'can\'t be used two turns in a row.',
    tips: [
      'Alternate Aura Jab and Mega Brave, or switch between two Mega Lucario ex.',
      'Lunatone\'s Lunar Cycle (with Solrock in play) discards a Fighting Energy from your hand to draw 3; that '
        + 'Energy is then ready for Aura Jab.',
      'Mega Lucario ex gives up 3 Prize cards.',
    ]
  },

  'sv-lopunny': {
    plan: 'Mega Lopunny ex\'s Gale Thrust does 60, or 230 if it moved from your Bench to the Active Spot this '
      + 'turn, so switch it in and attack in the same turn. Mega Froslass ex is the second attacker '
      + '(Resentful Refrain: 50 for each card in the opponent\'s hand).',
    tips: [
      'Dunsparce\'s Trading Places and Buneary\'s Run Around switch your Active Pokémon with a Benched one.',
      'Spiky Hopper (160) ignores effects on the opponent\'s Active Pokémon.',
      'Both Mega Pokémon ex give up 3 Prize cards.',
    ]
  },

  'sv-greninja': {
    plan: 'Evolve Froakie into Frogadier into Greninja ex. Shinobi Blade does 170 and searches your deck for a '
      + 'card; Mirage Barrage discards 2 Energy to do 120 to 2 of the opponent\'s Pokémon. Dusknoir\'s Cursed '
      + 'Blast and the Mega Pokémon ex (Mega Froslass ex, Mega Starmie ex) finish what Greninja starts.',
    tips: [
      'Frogadier\'s Summoning Jutsu searches your deck for up to 3 Pokémon.',
      'Cursed Blast Knocks Out your own Dusknoir or Dusclops, which gives the opponent a Prize card.',
      'Mega Starmie ex\'s Nebula Beam (210) ignores Weakness, Resistance and effects on the Active Pokémon.',
    ]
  },

  'sv-dragapult-dudunsparce': {
    plan: 'Dragapult ex\'s Phantom Dive (200 to the Active, 6 damage counters on the Bench) with Dudunsparce for '
      + 'cards: Run Away Draw draws 3 and shuffles Dudunsparce back into your deck. Dudunsparce ex\'s Tenacious '
      + 'Tail does 60 for each of the opponent\'s Pokémon ex in play.',
    tips: [
      'Before Run Away Draw, check that you still have a Pokémon to promote if your Active is Knocked Out.',
      'Phantom Dive needs a Fire and a Psychic Energy.',
      'Shaymin\'s Flower Curtain protects your Benched Pokémon without a Rule Box from attack damage.',
    ]
  },

  'sv-rockets-honchkrow': {
    plan: 'Team Rocket\'s Honchkrow\'s Rocket Feathers does 60 for each Supporter with "Team Rocket" in its name '
      + 'you discard from your hand, so collect them. Team Rocket\'s Murkrow\'s Deceit searches your deck for a '
      + 'Supporter.',
    tips: [
      'Holding Team Rocket\'s Supporters is the point: count your hand before you play one.',
      'Team Rocket\'s Porygon2\'s R Command does 20 for each Team Rocket\'s Supporter in your discard pile.',
      'Watch your deck size: this deck searches and draws a lot.',
    ]
  },

  'sv-alakazam-dusknoir': {
    plan: 'Alakazam\'s Powerful Hand (2 damage counters on the Active Pokémon for each card in your hand) with '
      + 'Dusknoir\'s Cursed Blast (13 damage counters on any of the opponent\'s Pokémon, then Dusknoir is Knocked '
      + 'Out). Kadabra and Alakazam draw cards when you evolve them from your hand.',
    tips: [
      'Patrat\'s Watchful Eye stops damage counters being moved by either player.',
      'Cursed Blast gives the opponent a Prize card for your Dusknoir or Dusclops.',
      'Watch your deck size: this deck draws a lot.',
    ]
  },

  'sv-cynthias-garchomp': {
    plan: 'Evolve Cynthia\'s Gible into Gabite into Garchomp ex. Corkscrew Dive (100) lets you draw until you '
      + 'have 6 cards; Draconic Buster (260) discards all its Energy. Cynthia\'s Roserade\'s Cheer On to Glory '
      + 'adds 30 to every Cynthia\'s Pokémon attack on the Active Pokémon.',
    tips: [
      'Cynthia\'s Gabite\'s Champion\'s Call searches your deck for a Cynthia\'s Pokémon once a turn.',
      'Garchomp ex has no Retreat Cost.',
      'Two Roserade in play add 60 to each attack.',
    ]
  },

  'sv-sharpedo-toxtricity': {
    plan: 'Mega Sharpedo ex\'s Hungry Jaws does 120, or 270 if Sharpedo has any damage counters on it. '
      + 'Toxtricity\'s Sinister Surge attaches a Darkness Energy from your deck to a Benched Darkness Pokémon and '
      + 'puts 2 damage counters on it, so a Benched Mega Sharpedo ex gets an Energy and turns on Hungry Jaws at the '
      + 'same time.',
    tips: [
      'Mega Sharpedo ex has no Retreat Cost; Greedy Fang (70) draws 2 cards.',
      'Pecharunt ex\'s Subjugating Chains swaps a Benched Darkness Pokémon into the Active Spot (it becomes '
        + 'Poisoned).',
      'Mega Sharpedo ex gives up 3 Prize cards.',
    ]
  },

  'sv-lucario-hariyama': {
    plan: 'Mega Lucario ex is the main attacker: Aura Jab (130) attaches up to 3 Basic Fighting Energy from your '
      + 'discard pile to your Benched Pokémon, and Mega Brave (270) is the big hit. Hariyama picks the target: '
      + 'when you evolve Makuhita into it from your hand, Heave-Ho Catcher may switch in 1 of the opponent\'s '
      + 'Benched Pokémon, and Wild Press does 210 (and 70 to Hariyama itself).',
    tips: [
      'Evolve Hariyama on the turn you want to Knock Out a Benched Pokémon: the Ability only works as it evolves.',
      'Salvatore evolves a Pokémon straight from your deck, even one you put down this turn, but only into a '
        + 'card without an Ability (Mega Lucario ex, not Hariyama). Mega Signal finds Mega Lucario ex.',
      'Lunatone\'s Lunar Cycle (with Solrock in play) discards a Fighting Energy from your hand to draw 3; that '
        + 'Energy is then ready for Aura Jab.',
      'Mega Lucario ex gives up 3 Prize cards and Meowth ex 2.',
    ]
  },

  'sv-mega-golisopod': {
    plan: 'Mega Golisopod ex is the attacker: Finishing Blow costs only 1 Grass Energy and does 60, or 220 when '
      + 'the opponent\'s Active Pokémon already has damage counters on it. Set those counters up first: Risky '
      + 'Ruins puts 2 on every Basic non-Darkness Pokémon the opponent benches, Munkidori\'s Adrena-Brain '
      + '(with a Darkness Energy on Munkidori) moves counters onto it, and Cacturne\'s Linear Attack does 30 to any of their Pokémon.',
    tips: [
      'Quadruple Hold (160) stops the Defending Pokémon from retreating during the opponent\'s next turn.',
      'Wimpod has no Retreat Cost while the opponent has any Pokémon ex in play (its Punk Out Ability).',
      'Wally\'s Compassion heals all damage from a Mega Evolution Pokémon ex, but its Energy goes back to your '
        + 'hand; Finishing Blow needs only 1 Energy to get going again.',
      'Cacturne\'s Punishing Needles does 50 more for each of the opponent\'s Pokémon in play with an Ability.',
      'Risky Ruins hits your own Benched Basics too (Wimpod, Dreepy), so Adrena-Brain has counters to move.',
      'Mega Golisopod ex gives up 3 Prize cards. Hero\'s Cape (+100 HP) keeps it alive longer.',
    ]
  },

  'sv-grimmsnarl-froslass': {
    plan: 'Marnie\'s Grimmsnarl ex is the attacker: Shadow Bullet (2 Darkness Energy) does 180 to the Active '
      + 'Pokémon and 30 to a Benched one. Evolve it from your hand (Rare Candy works too) and its Punk Up Ability '
      + 'attaches up to 5 Darkness Energy from your deck to your Marnie\'s Pokémon, so it can attack at once. '
      + 'Froslass and Munkidori spread damage counters on the side.',
    tips: [
      'Froslass\'s Freezing Shroud puts 1 damage counter on every Pokémon with an Ability between turns, yours '
        + 'too (Munkidori, Shaymin), but never on a Froslass.',
      'Munkidori\'s Adrena-Brain (with a Darkness Energy on it) moves up to 3 damage counters from your Pokémon '
        + 'onto one of the opponent\'s, so Freezing Shroud\'s counters on your side are not wasted.',
      'Spikemuth Gym lets each player search their deck for a Marnie\'s Pokémon once a turn; '
        + 'Team Rocket\'s Petrel finds any Trainer card (Rare Candy, Boss\'s Orders).',
      'Shaymin keeps your Benched Pokémon without a Rule Box safe from attack damage.',
      'Budew\'s Itchy Pollen stops the opponent playing Item cards during their next turn.',
      'Marnie\'s Grimmsnarl ex gives up 2 Prize cards.',
    ]
  },

  'sv-talonflame-dusknoir': {
    plan: 'Mega Kangaskhan ex draws cards (Run Errand, in the Active Spot) and hits with Rapid-Fire Combo. '
      + 'Once it is in play, Talonflame ex\'s Excited Dive puts Talonflame ex straight from your hand onto your '
      + 'Bench, no Fletchling needed; its Talon Hunt (150) only costs 2 Energy and finds any 2 cards. '
      + 'Dusclops and Dusknoir Knock Themselves Out with Cursed Blast to put 5 or 13 damage counters where you need them.',
    tips: [
      'To use Excited Dive, open Talonflame ex in your hand (click it) and press its Ability. '
        + 'You need a Colorless Mega Evolution Pokémon ex (Mega Kangaskhan ex) in play and room on your Bench.',
      'Ignition Energy gives CCC on an Evolution Pokémon, so one is enough for Talon Hunt, but it is discarded '
        + 'at the end of your turn. Neo Upper Energy gives every type, 2 at a time, on a Stage 2 Pokémon.',
      'Cursed Blast Knocks Out your own Dusclops or Dusknoir, so the opponent takes a Prize card for it: '
        + 'use it when it wins a Prize race, not just because it can.',
      'Dusk Ball looks at the bottom 7 cards of your deck for a Pokémon; Hilda finds an Evolution Pokémon and an Energy.',
      'Jamming Tower turns off every Pokémon Tool in play, yours and the opponent\'s (Hero\'s Cape, Air Balloon).',
      'Latias ex\'s Skyliner lets your Basic Pokémon retreat for free; Mega Kangaskhan ex gives up 3 Prize cards.',
    ]
  },

  'sv-mega-greninja': {
    plan: 'Mega Greninja ex is the attacker. Evolve Froakie into Frogadier, then Mega Greninja ex (Rare Candy '
      + 'skips Frogadier). In the Active Spot, its Mortal Shuriken Ability discards a Basic Water Energy from your '
      + 'hand to put 6 damage counters on any of the opponent\'s Pokémon, and Ninja Spinner (2 Water) does 120, '
      + 'or 200 if you put a Water Energy from it back into your hand. Greninja ex finishes damaged Pokémon.',
    tips: [
      'Mortal Shuriken is once a turn and only while Mega Greninja ex is Active: keep Basic Water Energy in your '
        + 'hand for it. Ninja Spinner\'s returned Energy can be attached again next turn, or discarded to Shuriken.',
      'Greninja ex (30th Celebration) Stealthy Slash costs 1 Water and does 30 for each damage counter on 1 of the '
        + 'opponent\'s Pokémon: after a Shuriken (6 counters) that is 180 to a Benched one.',
      'Greninja ex (Twilight Masquerade) Shinobi Blade does 170 and finds any card; Mirage Barrage hits 2 Pokémon for 120.',
      'Surfing Beach lets each player switch their Active Water Pokémon with a Benched Water Pokémon once a turn, '
        + 'so a damaged Mega Greninja ex can step back. Zinnia\'s Trust switches and brings an Energy along.',
      'Mega Kangaskhan ex draws 2 cards a turn in the Active Spot (Run Errand) and lets Talonflame ex dive onto '
        + 'your Bench from your hand; Talon Hunt finds any 2 cards.',
      'Mega Greninja ex and Mega Kangaskhan ex each give up 3 Prize cards.',
    ]
  },

};

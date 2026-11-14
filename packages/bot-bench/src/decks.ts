/**
 * Benchmark decks. Every entry is a real card implemented in packages/sets,
 * referenced by its `fullName` exactly as a player's saved deck would be.
 *
 * These are purpose-built 60-card lists (not reproductions of official theme
 * decks). The Base Set lists are legal in the "Base Sets" format; the
 * Black & White era lists use Base Set basic energy, because the "Standard"
 * format defined in init.js contains no basic energy cards, so they are only
 * legal with unlimited rules (which is what the harness uses by default).
 */

export interface BenchDeck {
  name: string;
  description: string;
  /**
   * Which card pool the deck is built from. Decks only give a meaningful win
   * rate against decks of the same era: a Black & White list beats a Base Set
   * list on card power alone, whichever bot is driving it. See `decksForEra`.
   */
  era: BenchEra;
  cards: string[];
}

export type BenchEra = 'bs' | 'bw' | 'sv';

type DeckList = Array<[string, number]>;

function expand(list: DeckList): string[] {
  const cards: string[] = [];
  for (const [name, count] of list) {
    for (let i = 0; i < count; i++) {
      cards.push(name);
    }
  }
  return cards;
}

function deck(name: string, description: string, era: BenchEra, list: DeckList): BenchDeck {
  return { name, description, era, cards: expand(list) };
}

export const benchDecks: BenchDeck[] = [

  deck('bs-fire', 'Base Set: Charizard / Arcanine / Ninetales', 'bs', [
    ['Charmander BS', 4],
    ['Charmeleon BS', 2],
    ['Charizard BS', 1],
    ['Growlithe BS', 3],
    ['Arcanine BS', 2],
    ['Vulpix BS', 2],
    ['Ninetales BS', 1],
    ['Ponyta BS', 2],
    ['Magmar BS', 2],
    ['Bill BS', 4],
    ['Professor Oak BS', 2],
    ['Pokémon Breeder BS', 1],
    ['Potion BS', 2],
    ['Switch BS', 2],
    ['PlusPower BS', 2],
    ['Energy Retrieval BS', 2],
    ['Gust of Wind BS', 1],
    ['Fire Energy BS', 23],
    ['Double Colorless Energy BS', 2]
  ]),

  deck('bs-water', 'Base Set: Blastoise / Poliwrath / Starmie / Dewgong', 'bs', [
    ['Squirtle BS', 4],
    ['Wartortle BS', 2],
    ['Blastoise BS', 1],
    ['Poliwag BS', 3],
    ['Poliwhirl BS', 2],
    ['Poliwrath BS', 1],
    ['Staryu BS', 3],
    ['Starmie BS', 2],
    ['Seel BS', 2],
    ['Dewgong BS', 1],
    ['Bill BS', 4],
    ['Professor Oak BS', 2],
    ['Pokémon Breeder BS', 1],
    ['Super Potion BS', 2],
    ['Switch BS', 2],
    ['Energy Removal BS', 2],
    ['Gust of Wind BS', 1],
    ['Water Energy BS', 23],
    ['Double Colorless Energy BS', 2]
  ]),

  deck('bs-lightning', 'Base Set: Raichu / Magneton / Electrode / Zapdos', 'bs', [
    ['Pikachu BS', 4],
    ['Raichu BS', 2],
    ['Magnemite BS', 3],
    ['Magneton BS', 2],
    ['Voltorb BS', 3],
    ['Electrode BS', 1],
    ['Electabuzz BS', 2],
    ['Zapdos BS', 1],
    ['Bill BS', 4],
    ['Professor Oak BS', 2],
    ['Computer Search BS', 1],
    ['PlusPower BS', 3],
    ['Potion BS', 2],
    ['Switch BS', 2],
    ['Gust of Wind BS', 2],
    ['Lightning Energy BS', 24],
    ['Double Colorless Energy BS', 2]
  ]),

  deck('bs-fighting', 'Base Set: Machamp / Dugtrio / Onix / Hitmonchan', 'bs', [
    ['Machop BS', 4],
    ['Machoke BS', 3],
    ['Machamp BS', 1],
    ['Diglett BS', 3],
    ['Dugtrio BS', 1],
    ['Sandshrew BS', 3],
    ['Onix BS', 2],
    ['Hitmonchan BS', 2],
    ['Bill BS', 4],
    ['Professor Oak BS', 2],
    ['Pokémon Breeder BS', 1],
    ['PlusPower BS', 3],
    ['Defender BS', 2],
    ['Super Potion BS', 2],
    ['Switch BS', 2],
    ['Fighting Energy BS', 25]
  ]),

  deck('bs-psychic', 'Base Set: Alakazam / Haunter / Mewtwo / Jynx', 'bs', [
    ['Abra BS', 4],
    ['Kadabra BS', 3],
    ['Alakazam BS', 2],
    ['Gastly BS', 3],
    ['Haunter BS', 2],
    ['Drowzee BS', 2],
    ['Mewtwo BS', 1],
    ['Jynx BS', 2],
    ['Bill BS', 4],
    ['Professor Oak BS', 2],
    ['Pokémon Breeder BS', 1],
    ['Super Potion BS', 2],
    ['Pokémon Center BS', 1],
    ['Switch BS', 2],
    ['Scoop Up BS', 1],
    ['Gust of Wind BS', 2],
    ['Psychic Energy BS', 24],
    ['Double Colorless Energy BS', 2]
  ]),

  deck('bw-emboar', 'Black & White era: Emboar / Reshiram (BS energy)', 'bw', [
    ['Tepig BW', 4],
    ['Pignite BW', 3],
    ['Emboar LTR', 3],
    ['Reshiram BW', 3],
    ['Rare Candy SUM', 2],
    ['Professor Juniper BW', 4],
    ['Cheren EPO', 2],
    ['Bianca EPO', 2],
    ['Ultra Ball PLB', 3],
    ['Level Ball NXD', 2],
    ['Pokemon Catcher SSH', 2],
    ['Switch SSH', 2],
    ['Max Potion EPO', 1],
    ['Exp Share SUM', 1],
    ['Fire Energy BS', 26]
  ]),

  deck('bw-zekrom', 'Black & White era: Eelektrik / Zekrom (BS energy)', 'bw', [
    ['Tynamo NV', 4],
    ['Eelektrik NV', 3],
    ['Zekrom BW', 3],
    ['Emolga DRX', 2],
    ['Professor Juniper BW', 4],
    ['Cheren EPO', 2],
    ['Bianca EPO', 2],
    ['Ultra Ball PLB', 3],
    ['Level Ball NXD', 2],
    ['Pokemon Catcher SSH', 2],
    ['Switch SSH', 2],
    ['PlusPower BW', 3],
    ['Max Potion EPO', 1],
    ['Super Rod NV', 1],
    ['Crushing Hammer EPO', 2],
    ['Lightning Energy BS', 24]
  ])

];

/**
 * The decks of one era. A round robin restricted to a single era is what makes
 * the win-rate table a measure of the bot rather than of power creep: within
 * an era the decks sit inside a ~13 point spread, across eras they span ~78.
 */
export function decksForEra(era: BenchEra): BenchDeck[] {
  return benchDecks.filter(d => d.era === era);
}

export const benchEras: BenchEra[] = ['bs', 'bw'];

/**
 * Today's Standard (Scarlet & Violet era) decks: real tournament lists, played
 * under `modernStandardRules()` (see `rulesForDecks`). Kept out of the default
 * pool and out of `benchEras` so the older-era benchmarks and the smoke run are
 * unchanged; run them with `--decks <name>` (one name = mirror games).
 * Basic Energy is the Diamond & Pearl print the modern format reuses.
 */
export const modernBenchDecks: BenchDeck[] = [

  // 2026 NAIC Masters Top 8, Juho Kallama (data/meta-decks/naic-2026-team-rocket-mewtwo.json)
  deck('sv-tr-mewtwo', 'Standard (Scarlet & Violet): Team Rocket\'s Mewtwo ex / Spidops', 'sv', [
    ['Team Rocket\'s Mewtwo ex DRI', 2],
    ['Team Rocket\'s Spidops DRI', 4],
    ['Team Rocket\'s Tarountula DRI', 4],
    ['Team Rocket\'s Articuno DRI', 2],
    ['Team Rocket\'s Mimikyu DRI', 2],
    ['Lillie\'s Clefairy ex JTG', 1],
    ['Lillie\'s Determination MEG', 4],
    ['Team Rocket\'s Ariana DRI', 4],
    ['Team Rocket\'s Giovanni DRI', 3],
    ['Team Rocket\'s Proton DRI', 2],
    ['Team Rocket\'s Petrel DRI', 1],
    ['Prism Tower CRI', 2],
    ['Team Rocket\'s Factory DRI', 1],
    ['Team Rocket\'s Transceiver DRI', 4],
    ['Ultra Ball MEG', 4],
    ['Night Stretcher SFA', 3],
    ['Bug Catching Set TWM', 2],
    ['Lucky Helmet TWM', 2],
    ['Energy Switch SVI', 1],
    ['Maximum Belt TEF', 1],
    ['Team Rocket\'s Energy DRI', 4],
    ['Grass Energy EVO', 6],
    ['Psychic Energy EVO', 1]
  ]),

  // Fall 2026 Regionals stock list (data/meta-decks/regional-2026-dragapult.json)
  deck('sv-dragapult', 'Standard (Scarlet & Violet): Dragapult ex', 'sv', [
    ['Dreepy TWM', 4],
    ['Drakloak TWM', 4],
    ['Dragapult ex TWM', 3],
    ['Munkidori TWM', 2],
    ['Budew ASC', 2],
    ['Dunsparce TEF', 1],
    ['Dudunsparce TEF', 1],
    ['Meowth ex POR', 1],
    ['Fezandipiti ex ASC', 1],
    ['Lillie\'s Determination MEG', 4],
    ['Boss\'s Orders MEG', 3],
    ['Crispin SCR', 2],
    ['Rosa\'s Encouragement POR', 1],
    ['Judge POR', 1],
    ['Buddy-Buddy Poffin TEF', 4],
    ['Poké Pad POR', 4],
    ['Crushing Hammer POR', 4],
    ['Ultra Ball MEG', 3],
    ['Night Stretcher ASC', 3],
    ['Unfair Stamp TWM', 1],
    ['Risky Ruins MEG', 2],
    ['Fire Energy EVO', 3],
    ['Psychic Energy EVO', 3],
    ['Darkness Energy EVO', 3]
  ]),

  // Fall 2026 Regionals (data/meta-decks/regional-2026-dragapult-dusknoir.json)
  deck('sv-dragapult-dusknoir', 'Standard (Scarlet & Violet): Dragapult ex / Dusknoir', 'sv', [
    ['Dreepy TWM', 4],
    ['Drakloak TWM', 4],
    ['Dragapult ex TWM', 3],
    ['Duskull PRE', 2],
    ['Dusclops PRE', 2],
    ['Dusknoir PRE', 1],
    ['Budew ASC', 1],
    ['Munkidori TWM', 1],
    ['Fezandipiti ex ASC', 1],
    ['Meowth ex POR', 1],
    ['Lillie\'s Determination MEG', 4],
    ['Boss\'s Orders MEG', 3],
    ['Dawn PFL', 2],
    ['Crispin SCR', 2],
    ['Rosa\'s Encouragement POR', 1],
    ['Buddy-Buddy Poffin TEF', 4],
    ['Poké Pad POR', 4],
    ['Ultra Ball MEG', 4],
    ['Rare Candy MEG', 2],
    ['Night Stretcher ASC', 2],
    ['Special Red Card CRI', 1],
    ['Unfair Stamp TWM', 1],
    ['Team Rocket\'s Watchtower DRI', 2],
    ['Fire Energy EVO', 3],
    ['Psychic Energy EVO', 3],
    ['Darkness Energy EVO', 2]
  ]),

  // Fall 2026 Regionals (data/meta-decks/regional-2026-dragapult-blaziken.json)
  deck('sv-dragapult-blaziken', 'Standard (Scarlet & Violet): Dragapult ex / Blaziken ex', 'sv', [
    ['Dreepy TWM', 4],
    ['Drakloak TWM', 4],
    ['Dragapult ex TWM', 2],
    ['Torchic DRI', 2],
    ['Combusken DRI', 1],
    ['Blaziken ex JTG', 2],
    ['Munkidori TWM', 2],
    ['Budew ASC', 1],
    ['Chi-Yu TWM', 1],
    ['Fezandipiti ex ASC', 1],
    ['Meowth ex POR', 1],
    ['Lillie\'s Determination MEG', 4],
    ['Boss\'s Orders MEG', 3],
    ['Crispin SCR', 2],
    ['Judge POR', 2],
    ['Buddy-Buddy Poffin TEF', 4],
    ['Poké Pad POR', 4],
    ['Ultra Ball MEG', 4],
    ['Rare Candy MEG', 3],
    ['Night Stretcher ASC', 2],
    ['Unfair Stamp TWM', 1],
    ['Team Rocket\'s Watchtower DRI', 2],
    ['Fire Energy EVO', 3],
    ['Psychic Energy EVO', 3],
    ['Darkness Energy EVO', 2]
  ]),

  // Fall 2026 Regionals (data/meta-decks/regional-2026-alakazam-dudunsparce.json)
  deck('sv-alakazam', 'Standard (Scarlet & Violet): Alakazam / Dudunsparce', 'sv', [
    ['Abra MEG', 4],
    ['Kadabra MEG', 4],
    ['Alakazam MEG', 3],
    ['Dunsparce JTG', 3],
    ['Dudunsparce TEF', 2],
    ['Flutter Mane TEF', 1],
    ['Elgyem BLK', 1],
    ['Genesect SFA', 1],
    ['Fezandipiti ex ASC', 1],
    ['Lillie\'s Clefairy ex JTG', 1],
    ['Dawn PFL', 4],
    ['Hilda WHT', 3],
    ['Boss\'s Orders MEG', 2],
    ['Eri TEF', 1],
    ['Buddy-Buddy Poffin TEF', 4],
    ['Poké Pad POR', 4],
    ['Rare Candy MEG', 2],
    ['Wondrous Patch PFL', 2],
    ['Night Stretcher ASC', 1],
    ['Sacred Ash DRI', 1],
    ['Special Red Card CRI', 1],
    ['Lillie\'s Pearl JTG', 2],
    ['Handheld Fan TWM', 1],
    ['Nighttime Mine ASC', 2],
    ['Battle Cage PFL', 1],
    ['Telepathic Psychic Energy POR', 4],
    ['Psychic Energy EVO', 2],
    ['Mist Energy TEF', 1],
    ['Enriching Energy SSP', 1]
  ]),

  // Fall 2026 Regionals (data/meta-decks/regional-2026-ns-zoroark.json)
  deck('sv-ns-zoroark', 'Standard (Scarlet & Violet): N\'s Zoroark ex', 'sv', [
    ['N\'s Zorua JTG', 4],
    ['N\'s Zoroark ex JTG', 4],
    ['Munkidori TWM', 2],
    ['N\'s Reshiram JTG', 1],
    ['N\'s Zekrom ASC', 1],
    ['N\'s Purrloin JTG', 1],
    ['Fezandipiti ex ASC', 1],
    ['Pecharunt ex SFA', 1],
    ['Tatsugiri TWM', 1],
    ['Lillie\'s Determination MEG', 4],
    ['Boss\'s Orders MEG', 3],
    ['Cyrano SSP', 2],
    ['Judge POR', 2],
    ['Brock\'s Scouting JTG', 1],
    ['Janine\'s Secret Art PRE', 1],
    ['Black Belt\'s Training JTG', 1],
    ['Buddy-Buddy Poffin TEF', 4],
    ['Poké Pad POR', 3],
    ['N\'s PP Up JTG', 3],
    ['Ultra Ball MEG', 2],
    ['Night Stretcher ASC', 2],
    ['Secret Box TWM', 1],
    ['Special Red Card CRI', 1],
    ['Air Balloon ASC', 1],
    ['Binding Mochi PRE', 1],
    ['Punk Helmet PFL', 1],
    ['Team Rocket\'s Watchtower DRI', 3],
    ['Darkness Energy EVO', 8]
  ]),

  // Fall 2026 Regionals (data/meta-decks/regional-2026-mega-excadrill.json)
  deck('sv-mega-excadrill', 'Standard (Scarlet & Violet): Mega Excadrill ex', 'sv', [
    ['Beldum TEF', 3],
    ['Beldum CRI', 1],
    ['Metang TEF', 4],
    ['Metagross CRI', 1],
    ['Drilbur PBL', 3],
    ['Mega Excadrill ex PBL', 2],
    ['Piplup PFL', 2],
    ['Empoleon ex PFL', 1],
    ['Genesect ex BLK', 2],
    ['Mega Skarmory ex POR', 1],
    ['Fezandipiti ex ASC', 1],
    ['Brock\'s Scouting JTG', 4],
    ['Team Rocket\'s Petrel DRI', 4],
    ['Boss\'s Orders MEG', 1],
    ['Kieran TWM', 1],
    ['Buddy-Buddy Poffin TEF', 4],
    ['Pokégear 3.0 SVI', 4],
    ['Jumbo Ice Cream PFL', 1],
    ['Switch MEG', 1],
    ['Rare Candy MEG', 1],
    ['Hero\'s Cape TEF', 1],
    ['Metal Energy EVO', 17]
  ]),

  // Fall 2026 Regionals (data/meta-decks/regional-2026-slowking.json)
  deck('sv-slowking', 'Standard (Scarlet & Violet): Slowking', 'sv', [
    ['Slowpoke SCR', 3],
    ['Slowking SCR', 3],
    ['Mega Kangaskhan ex MEG', 3],
    ['Kyurem SFA', 2],
    ['Latias ex SSP', 2],
    ['Metagross CRI', 1],
    ['Annihilape PBL', 1],
    ['Fezandipiti ex ASC', 1],
    ['Lillie\'s Clefairy ex JTG', 1],
    ['Meowth ex POR', 1],
    ['Drapion POR', 1],
    ['Munkidori TWM', 1],
    ['Mew ex 30C', 1],
    ['Zeraora DRI', 1],
    ['Lillie\'s Determination MEG', 4],
    ['Ciphermaniac\'s Codebreaking TEF', 3],
    ['Crispin SCR', 1],
    ['Ultra Ball MEG', 4],
    ['Poké Pad POR', 3],
    ['Wondrous Patch PFL', 3],
    ['Night Stretcher ASC', 2],
    ['Switch MEG', 1],
    ['Secret Box TWM', 1],
    ['Lucky Helmet TWM', 2],
    ['Academy at Night SFA', 4],
    ['Telepathic Psychic Energy POR', 4],
    ['Psychic Energy EVO', 3],
    ['Darkness Energy EVO', 2],
    ['Boomerang Energy TWM', 1]
  ]),

  // Fall 2026 Regionals (data/meta-decks/regional-2026-festival-lead.json)
  deck('sv-festival-lead', 'Standard (Scarlet & Violet): Festival Lead', 'sv', [
    ['Applin TWM', 3],
    ['Applin TWM 126', 1],
    ['Dipplin TWM', 3],
    ['Grookey TWM', 3],
    ['Thwackey TWM', 4],
    ['Goldeen TWM', 2],
    ['Seaking PRE', 1],
    ['Rellor TEF', 1],
    ['Rabsca TEF', 1],
    ['Shaymin DRI', 1],
    ['Lillie\'s Determination MEG', 4],
    ['Boss\'s Orders MEG', 2],
    ['Gladion\'s Final Battle PBL', 2],
    ['Kieran TWM', 1],
    ['Lana\'s Aid TWM', 1],
    ['Buddy-Buddy Poffin TEF', 4],
    ['Poké Pad POR', 4],
    ['Bug Catching Set TWM', 3],
    ['Ultra Ball MEG', 2],
    ['Night Stretcher ASC', 2],
    ['Secret Box TWM', 1],
    ['Air Balloon ASC', 3],
    ['Brave Bangle WHT', 2],
    ['Festival Grounds TWM', 4],
    ['Grass Energy EVO', 4],
    ['Growing Grass Energy POR', 1]
  ]),

  // Fall 2026 Regionals (data/meta-decks/regional-2026-basic-box.json)
  deck('sv-basic-box', 'Standard (Scarlet & Violet): Basic Box', 'sv', [
    ['Mega Kangaskhan ex MEG', 4],
    ['Meowth ex POR', 3],
    ['Teal Mask Ogerpon ex TWM', 2],
    ['Wellspring Mask Ogerpon ex TWM', 2],
    ['Latias ex SSP', 2],
    ['Lillie\'s Clefairy ex JTG', 2],
    ['Raging Bolt ex TEF', 1],
    ['Chien-Pao SSP', 1],
    ['Iron Crown ex TEF', 1],
    ['Passimian SSP', 1],
    ['Fezandipiti ex ASC', 1],
    ['Iron Leaves ex TEF', 1],
    ['Crispin SCR', 4],
    ['Cyrano SSP', 2],
    ['Boss\'s Orders MEG', 2],
    ['Ciphermaniac\'s Codebreaking TEF', 1],
    ['Energy Switch MEG', 4],
    ['Ultra Ball MEG', 4],
    ['Night Stretcher ASC', 2],
    ['Unfair Stamp TWM', 1],
    ['Glass Trumpet SCR', 1],
    ['Area Zero Underdepths SCR', 3],
    ['Grass Energy EVO', 6],
    ['Psychic Energy EVO', 3],
    ['Lightning Energy EVO', 2],
    ['Fighting Energy EVO', 2],
    ['Water Energy EVO', 2]
  ]),

  // Fall 2026 Regionals (data/meta-decks/regional-2026-dhelmise.json)
  deck('sv-dhelmise', 'Standard (Scarlet & Violet): Dhelmise', 'sv', [
    ['Poltchageist PBL', 4],
    ['Sinistcha PBL', 2],
    ['Dhelmise PBL', 4],
    ['Dunsparce JTG', 3],
    ['Dudunsparce TEF', 2],
    ['Shuppet PBL', 2],
    ['Banette PBL', 4],
    ['Lillie\'s Clefairy ex JTG', 2],
    ['Bloodmoon Ursaluna ex TWM', 1],
    ['Latias ex SSP', 1],
    ['Lillie\'s Determination MEG', 4],
    ['Gwynn PBL', 4],
    ['Boss\'s Orders MEG', 3],
    ['Explorer\'s Guidance TEF', 2],
    ['Black Belt\'s Training JTG', 1],
    ['Ultra Ball MEG', 4],
    ['Poké Pad POR', 4],
    ['Night Stretcher ASC', 3],
    ['Prism Tower CRI', 3],
    ['Telepathic Psychic Energy POR', 4],
    ['Psychic Energy EVO', 2],
    ['Legacy Energy TWM', 1]
  ]),

  // Fall 2026 online (data/meta-decks/online-2026-ogerpon-meganium-hydrapple.json)
  deck('sv-ogerpon-meganium', 'Standard (Scarlet & Violet): Ogerpon Meganium Hydrapple', 'sv', [
    ['Teal Mask Ogerpon ex TWM', 4],
    ['Chikorita ASC', 2],
    ['Bayleef MEG', 2],
    ['Meganium MEG', 2],
    ['Applin TWM', 2],
    ['Dipplin TWM', 2],
    ['Hydrapple ex SCR', 2],
    ['Meowth ex POR', 2],
    ['Fezandipiti ex ASC', 1],
    ['Celebi MEG', 1],
    ['Tapu Bulu SFA', 1],
    ['Lillie\'s Determination MEG', 4],
    ['Boss\'s Orders MEG', 2],
    ['Team Rocket\'s Petrel DRI', 1],
    ['Briar SCR', 1],
    ['Judge POR', 1],
    ['Lana\'s Aid TWM', 1],
    ['Bug Catching Set TWM', 4],
    ['Ultra Ball MEG', 4],
    ['Night Stretcher ASC', 2],
    ['Unfair Stamp TWM', 1],
    ['Poké Pad POR', 1],
    ['Forest of Vitality MEG', 4],
    ['Grass Energy EVO', 13]
  ]),

  // Fall 2026 online (data/meta-decks/online-2026-mega-lucario.json)
  deck('sv-mega-lucario', 'Standard (Scarlet & Violet): Mega Lucario ex', 'sv', [
    ['Riolu PRE', 3],
    ['Riolu MEG', 1],
    ['Mega Lucario ex MEG', 3],
    ['Dunsparce JTG', 3],
    ['Dudunsparce TEF', 2],
    ['Dudunsparce ex JTG', 1],
    ['Solrock MEG', 2],
    ['Lunatone MEG', 2],
    ['Lillie\'s Determination MEG', 4],
    ['Boss\'s Orders MEG', 4],
    ['Hilda WHT', 2],
    ['Lisia\'s Appeal SSP', 1],
    ['Poké Pad POR', 4],
    ['Fighting Gong MEG', 4],
    ['Premium Power Pro MEG', 4],
    ['Buddy-Buddy Poffin TEF', 2],
    ['Ultra Ball MEG', 2],
    ['Lucky Helmet TWM', 2],
    ['Gravity Mountain SSP', 2],
    ['Fighting Energy EVO', 8],
    ['Rocky Fighting Energy POR', 3],
    ['Legacy Energy TWM', 1]
  ]),

  // Fall 2026 online (data/meta-decks/online-2026-lopunny-dudunsparce.json)
  deck('sv-lopunny', 'Standard (Scarlet & Violet): Lopunny Dudunsparce', 'sv', [
    ['Buneary PFL', 3],
    ['Mega Lopunny ex PFL', 2],
    ['Dunsparce JTG', 2],
    ['Dunsparce TEF', 1],
    ['Dudunsparce TEF', 2],
    ['Snorunt ASC', 2],
    ['Mega Froslass ex ASC', 2],
    ['Meowth ex POR', 1],
    ['Mew ex 30C', 1],
    ['Fan Rotom SCR', 1],
    ['Lillie\'s Clefairy ex JTG', 1],
    ['Lillie\'s Determination MEG', 4],
    ['Hilda WHT', 4],
    ['Boss\'s Orders MEG', 3],
    ['Wally\'s Compassion MEG', 3],
    ['Buddy-Buddy Poffin TEF', 4],
    ['Poké Pad POR', 4],
    ['Ultra Ball MEG', 4],
    ['Night Stretcher ASC', 2],
    ['Special Red Card CRI', 1],
    ['Air Balloon ASC', 2],
    ['Battle Cage PFL', 3],
    ['Mist Energy TEF', 4],
    ['Water Energy EVO', 3],
    ['Enriching Energy SSP', 1]
  ]),

  deck('sv-greninja', 'Standard (Scarlet & Violet): Greninja ex', 'sv', [
    ['Froakie CRI', 3],
    ['Frogadier CRI', 2],
    ['Greninja ex TWM', 2],
    ['Duskull PRE', 2],
    ['Dusclops PRE', 2],
    ['Dusknoir PRE', 2],
    ['Snorunt ASC', 2],
    ['Mega Froslass ex ASC', 2],
    ['Staryu POR', 1],
    ['Mega Starmie ex POR', 1],
    ['Meowth ex POR', 2],
    ['Budew ASC', 1],
    ['Fezandipiti ex ASC', 1],
    ['Latias ex SSP', 1],
    ['Lillie\'s Determination MEG', 3],
    ['Hilda WHT', 2],
    ['Boss\'s Orders MEG', 2],
    ['Colress\'s Tenacity SFA', 1],
    ['Judge POR', 1],
    ['Team Rocket\'s Petrel DRI', 1],
    ['Buddy-Buddy Poffin TEF', 4],
    ['Ultra Ball MEG', 4],
    ['Poké Pad POR', 3],
    ['Rare Candy MEG', 2],
    ['Night Stretcher ASC', 1],
    ['Special Red Card CRI', 1],
    ['Switch MEG', 1],
    ['Grand Tree SCR', 1],
    ['Gravity Mountain SSP', 1],
    ['Water Energy EVO', 4],
    ['Bubbly Water Energy CRI', 1],
    ['Ignition Energy WHT', 3]
  ])

];

export function findDeck(name: string): BenchDeck {
  const all = [...benchDecks, ...modernBenchDecks];
  const found = all.find(d => d.name === name);
  if (found === undefined) {
    throw new Error(`Unknown deck "${name}". Known decks: ${all.map(d => d.name).join(', ')}`);
  }
  return found;
}

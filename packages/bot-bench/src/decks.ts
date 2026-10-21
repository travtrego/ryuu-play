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
  cards: string[];
}

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

function deck(name: string, description: string, list: DeckList): BenchDeck {
  return { name, description, cards: expand(list) };
}

export const benchDecks: BenchDeck[] = [

  deck('bs-fire', 'Base Set: Charizard / Arcanine / Ninetales', [
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

  deck('bs-water', 'Base Set: Blastoise / Poliwrath / Starmie / Dewgong', [
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

  deck('bs-lightning', 'Base Set: Raichu / Magneton / Electrode / Zapdos', [
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

  deck('bs-fighting', 'Base Set: Machamp / Dugtrio / Onix / Hitmonchan', [
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

  deck('bs-psychic', 'Base Set: Alakazam / Haunter / Mewtwo / Jynx', [
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

  deck('bw-emboar', 'Black & White era: Emboar / Reshiram (BS energy)', [
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

  deck('bw-zekrom', 'Black & White era: Eelektrik / Zekrom (BS energy)', [
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

export function findDeck(name: string): BenchDeck {
  const found = benchDecks.find(d => d.name === name);
  if (found === undefined) {
    throw new Error(`Unknown deck "${name}". Known decks: ${benchDecks.map(d => d.name).join(', ')}`);
  }
  return found;
}

/**
 * Learn mode: the fixed decks of a guided first game against the bot.
 *
 * Both lists use Base Set cards only, with Basic Pokemon and Stage 1
 * evolutions (no Stage 2, no Pokemon Powers) and four easy Trainers
 * (Bill, Potion, Switch, PlusPower). Neither deck's Pokemon are weak to the
 * other deck's type, so the first game is decided by play rather than by
 * Weakness. Every name is a card `fullName` exactly as a saved deck stores it.
 */

export interface BeginnerDeck {
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

/** The deck the human player gets in a guided game. */
export const beginnerPlayerDeck: BeginnerDeck = {
  name: 'Beginner Fire',
  description: 'Charmander, Growlithe, Ponyta and Magmar, with Fire Energy.',
  cards: expand([
    ['Charmander BS', 4],
    ['Charmeleon BS', 3],
    ['Growlithe BS', 4],
    ['Arcanine BS', 2],
    ['Ponyta BS', 4],
    ['Magmar BS', 3],
    ['Bill BS', 4],
    ['Potion BS', 4],
    ['Switch BS', 2],
    ['PlusPower BS', 2],
    ['Fire Energy BS', 28]
  ])
};

/** The deck the bot plays in a guided game. */
export const beginnerBotDeck: BeginnerDeck = {
  name: 'Beginner Lightning',
  description: 'Pikachu, Electabuzz, Voltorb and Rattata, with Lightning Energy.',
  cards: expand([
    ['Pikachu BS', 4],
    ['Raichu BS', 3],
    ['Electabuzz BS', 3],
    ['Voltorb BS', 3],
    ['Rattata BS', 4],
    ['Raticate BS', 3],
    ['Bill BS', 4],
    ['Potion BS', 4],
    ['Switch BS', 2],
    ['PlusPower BS', 2],
    ['Lightning Energy BS', 28]
  ])
};

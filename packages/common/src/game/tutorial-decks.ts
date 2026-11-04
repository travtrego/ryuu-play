import { BeginnerDeck, beginnerBotDeck, beginnerPlayerDeck } from './beginner-decks';

/**
 * Learn mode: the tutorial decks.
 *
 * Same sixty cards as the beginner decks (`beginner-decks.ts`), in a **fixed,
 * authored order**. A tutorial game uses `ScriptedArbiter`, which answers every
 * shuffle with the identity order, so the order below is exactly the order the
 * cards arrive in. That is what lets a lesson run on cue.
 *
 * How the engine consumes a deck during setup
 * (`packages/common/src/store/reducers/setup-reducer.ts`), all from the front:
 *
 * - cards 1-7   the opening hand
 * - cards 8-13  the six Prizes, dealt after the starting Pokemon are placed
 * - cards 14+   one draw per turn, in order
 *
 * **Cards 1-7 must contain a Basic Pokemon.** Setup loops
 * `while (!playerHasBasic || !opponentHasBasic)`, reshuffling and redrawing
 * until both players have one. With a fixed order that redraw returns the same
 * seven cards, so a hand with no Basic would hang the game forever rather than
 * mulligan. `tutorial-decks.spec.ts` asserts both opening hands hold one.
 */

/** How many cards the engine deals to the opening hand. */
export const TUTORIAL_HAND_SIZE = 7;

/** How many Prizes the engine deals, straight after the opening hands. */
export const TUTORIAL_PRIZE_COUNT = 6;

/**
 * Puts `head` first, then whatever is left of `deck` once those cards are
 * accounted for. Keeping the remainder from the beginner deck means a tutorial
 * deck is always a permutation of a list already known to be legal, so it
 * cannot drift into an illegal sixty.
 */
function ordered(deck: BeginnerDeck, name: string, description: string, head: string[]): BeginnerDeck {
  const remaining = deck.cards.slice();
  for (const card of head) {
    const index = remaining.indexOf(card);
    if (index === -1) {
      throw new Error(`Tutorial deck "${name}" wants ${card}, which is not in ${deck.name}`);
    }
    remaining.splice(index, 1);
  }
  return { name, description, cards: [...head, ...remaining] };
}

/**
 * The player's tutorial deck.
 *
 * The opening hand carries one of everything the early lessons need: a Basic to
 * put up, Energy to attach, a second Basic for the Bench lesson and two
 * Trainers. Charmeleon sits a few cards into the draws so the evolve lesson has
 * something to evolve into.
 */
export const tutorialPlayerDeck: BeginnerDeck = ordered(
  beginnerPlayerDeck,
  'Tutorial Fire',
  'The Beginner Fire deck in a fixed order, so each lesson happens on cue.',
  [
    // 1-7, the opening hand
    'Charmander BS',    // the Active Pokemon; a Basic here is required
    'Fire Energy BS',   // the attach lesson
    'Growlithe BS',     // the Bench lesson
    'Bill BS',          // the Trainer lesson
    'Fire Energy BS',
    'Potion BS',        // healing, once there is damage to heal
    'Fire Energy BS',
    // 8-13, the Prizes
    'Fire Energy BS',
    'Ponyta BS',
    'Fire Energy BS',
    'Magmar BS',
    'Fire Energy BS',
    'Fire Energy BS',
    // 14+, one draw per turn
    'Charmeleon BS',    // the evolve lesson
    'Fire Energy BS',
    'Switch BS',        // retreating and switching
    'PlusPower BS',
    'Fire Energy BS',
    'Arcanine BS',
  ]
);

/**
 * The bot's tutorial deck. Ordered so the bot has a Basic to start, Energy to
 * attack with early, and an evolution of its own to show the player that both
 * sides play by the same rules.
 */
export const tutorialBotDeck: BeginnerDeck = ordered(
  beginnerBotDeck,
  'Tutorial Lightning',
  'The Beginner Lightning deck in a fixed order, to partner the tutorial.',
  [
    // 1-7, the opening hand
    'Pikachu BS',            // the bot's Active; a Basic here is required
    'Lightning Energy BS',
    'Rattata BS',
    'Lightning Energy BS',
    'Voltorb BS',
    'Bill BS',
    'Lightning Energy BS',
    // 8-13, the Prizes
    'Lightning Energy BS',
    'Electabuzz BS',
    'Lightning Energy BS',
    'Lightning Energy BS',
    'Potion BS',
    'Lightning Energy BS',
    // 14+, one draw per turn
    'Raichu BS',             // the bot evolves too
    'Lightning Energy BS',
    'Lightning Energy BS',
    'Raticate BS',
  ]
);

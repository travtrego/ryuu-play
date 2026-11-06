import { Action, BotAi, BotAiFactory, CardManager, DeckAnalyser, State } from '@ptcg/common';
import { MODERN_STANDARD_NAME } from '@ptcg/sets';
import { SimpleBot } from '@ptcg/simple-bot';

type ExplainingAi = BotAi & { explainLastAction(): string | undefined };
import { registerCardSets } from './card-setup';
import { benchDecks, findDeck, modernBenchDecks } from './decks';
import { rulesForDecks } from './benchmark';
import { GameSeat, playGame } from './headless-game';

/** Wraps SimpleBot so a test can read the "Why?" reason of every action. */
class ReasonRecorder extends BotAiFactory {
  public reasons: string[] = [];
  private inner: SimpleBot;

  constructor(name: string) {
    super(name);
    this.inner = new SimpleBot(name);
  }

  public createBotAi(playerId: number, deck: string[] | null): BotAi {
    const ai = this.inner.createBotAi(playerId, deck) as ExplainingAi;
    const reasons = this.reasons;
    return {
      decodeNextAction(state: State): Action | undefined {
        const action = ai.decodeNextAction(state);
        const reason = ai.explainLastAction();
        if (action !== undefined && reason) {
          reasons.push(reason);
        }
        return action;
      }
    } as BotAi;
  }
}

describe('Modern Standard bench decks', () => {

  beforeAll(() => {
    registerCardSets();
  });

  it('every modern deck is a valid 60-card deck in the modern Standard format', () => {
    const cardManager = CardManager.getInstance();
    for (const deck of modernBenchDecks) {
      expect(deck.cards.length).withContext(deck.name).toBe(60);
      deck.cards.forEach(name => expect(cardManager.isCardDefined(name)).withContext(name).toBeTrue());
      const analyser = new DeckAnalyser(deck.cards);
      expect(analyser.isValid()).withContext(deck.name).toBeTrue();
      expect(analyser.getDeckFormats().map(f => f.name)).withContext(deck.name).toContain(MODERN_STANDARD_NAME);
    }
  });

  it('modern decks are not in the default (older-era) pool', () => {
    modernBenchDecks.forEach(d => expect(benchDecks).not.toContain(d));
    expect(findDeck('sv-tr-mewtwo').era).toBe('sv');
  });

  it('plays modern decks under today\'s rules and older decks under the defaults', () => {
    const tr = findDeck('sv-tr-mewtwo');
    const old = benchDecks[0];
    expect(rulesForDecks(tr, tr).firstTurnAttack).toBeFalse();
    expect(rulesForDecks(tr, tr).firstTurnUseSupporter).toBeFalse();
    expect(rulesForDecks(old, old).firstTurnAttack).toBeTrue();
    expect(rulesForDecks(tr, old).firstTurnAttack).toBeTrue();
  });

  ['sv-tr-mewtwo', 'sv-dragapult'].forEach(name => [1, 2, 3].forEach(seed => {
    it(`plays a ${name} mirror to a normal finish, with reasons (seed ${seed})`, () => {
      const deck = findDeck(name);
      const a = new ReasonRecorder('a');
      const b = new ReasonRecorder('b');
      const seats: [GameSeat, GameSeat] = [
        { name: 'a', bot: a, deck: deck.cards },
        { name: 'b', bot: b, deck: deck.cards }
      ];
      const result = playGame(seats, seed, {}, rulesForDecks(deck, deck));
      expect(result.error).toBeUndefined();
      expect(['win', 'draw']).toContain(result.outcome);
      expect(result.invalidMoves).toEqual([0, 0]);
      expect(a.reasons.length + b.reasons.length).toBeGreaterThan(10);
    });
  }));
});

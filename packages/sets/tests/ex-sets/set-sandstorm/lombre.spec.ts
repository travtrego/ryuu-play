import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Lombre } from '../../../src/ex-sets/set-sandstorm/lombre';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Lombre SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Lombre()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Surprise (10) - Choose 1 card from your opponent's hand without looking. Look at the card you chose, then have
  // your opponent shuffle that card into his or her deck.
  it('Should use Surprise', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const card = new TestCard();
    opponent.hand.cards = [card];
    const deckSize = opponent.deck.cards.length;

    sim.dispatch(new AttackAction(1, 'Surprise'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DECK,
      cards: opponent.hand,
      options: jasmine.objectContaining({ min: 1, max: 1, isSecret: true })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [card]));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, true));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    // shuffled into the deck, then 1 card drawn at the start of the turn
    expect(opponent.hand.cards.length).toEqual(1);
    expect(opponent.deck.cards.length).toEqual(deckSize);
  });

  it('Should use Surprise when the opponent has no cards in hand', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    opponent.hand.cards = [];

    sim.dispatch(new AttackAction(1, 'Surprise'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Fury Swipes (20x) - Flip 3 coins. This attack does 20 damages times the number of heads.
  it('Should use Fury Swipes - 3 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true, true]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Fury Swipes - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false, true]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Fury Swipes - 3 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false, false]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});

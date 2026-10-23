import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Duskull2 } from '../../../src/ex-sets/set-sandstorm/duskull-2';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Duskull SS-2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Duskull2()], [CardType.PSYCHIC]);
  });

  // Surprise - Choose 1 card from your opponent's hand without looking. Look at the card you chose, then have your
  // opponent shuffle that card into his or her deck.
  it('Should use Surprise', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const card1 = new TestCard();
    const card2 = new TestCard();
    opponent.hand.cards = [card1, card2];
    const deckSize = opponent.deck.cards.length;

    sim.dispatch(new AttackAction(1, 'Surprise'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DECK,
      cards: opponent.hand,
      options: jasmine.objectContaining({ min: 1, max: 1, isSecret: true })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [card2]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: player.id,
      cards: [card2]
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, true));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    // opponent draws a card at the start of the turn
    expect(opponent.hand.cards.length).toEqual(2);
    expect(opponent.hand.cards).toContain(card1);
    expect(opponent.deck.cards.length).toEqual(deckSize);
  });

  it('Should use Surprise when the opponent has no cards in hand', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    opponent.hand.cards = [];

    sim.dispatch(new AttackAction(1, 'Surprise'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
  });

  // Confuse Ray - Flip a coin. If heads, the Defending Pokémon is now Confused.
  it('Should use Confuse Ray - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Confuse Ray'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Confuse Ray - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Confuse Ray'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([]);
  });
});

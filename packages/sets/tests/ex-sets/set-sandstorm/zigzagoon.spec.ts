import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Zigzagoon } from '../../../src/ex-sets/set-sandstorm/zigzagoon';
import { TestUtils } from '../../test-utils';

describe('Zigzagoon SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Zigzagoon()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Collect - Draw a card.
  it('Should use Collect', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const topCard = player.deck.cards[0];
    const deckSize = player.deck.cards.length;

    sim.dispatch(new AttackAction(1, 'Collect'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([topCard]);
    expect(player.deck.cards.length).toEqual(deckSize - 1);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Collect with an empty deck', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.deck.cards = [];

    sim.dispatch(new AttackAction(1, 'Collect'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
  });

  // Headbutt (20)
  it('Should use Headbutt', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Headbutt'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });
});

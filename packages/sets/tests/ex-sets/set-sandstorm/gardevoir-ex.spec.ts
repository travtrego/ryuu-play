import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { GardevoirEx } from '../../../src/ex-sets/set-sandstorm/gardevoir-ex';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Gardevoir ex SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new GardevoirEx()],
      [CardType.PSYCHIC, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Feedback - Count the number of cards in your opponent's hand. Put that many damage counters on the Defending
  // Pokémon.
  it('Should use Feedback', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.hand.cards = TestUtils.makeTestCards(4);

    sim.dispatch(new AttackAction(1, 'Feedback'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Feedback ignoring Weakness (damage counters)', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = new TestPokemon();
    defending.weakness = [{ type: CardType.PSYCHIC }];
    TestUtils.setDefending(sim, [defending]);
    opponent.hand.cards = TestUtils.makeTestCards(3);

    sim.dispatch(new AttackAction(1, 'Feedback'));

    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Feedback with an empty opponent\'s hand', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.hand.cards = [];

    sim.dispatch(new AttackAction(1, 'Feedback'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Psystorm (10x) - Does 10 damage times the total amount of Energy attached to all Pokémon in play.
  it('Should use Psystorm counting all Energy in play', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.WATER, CardType.WATER]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [CardType.FIRE]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [CardType.GRASS, CardType.GRASS]);

    sim.dispatch(new AttackAction(1, 'Psystorm'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    // 4 (Gardevoir) + 2 (player bench) + 2 (defending) + 1 (opponent bench)
    expect(opponent.active.damage).toEqual(90);
  });
});

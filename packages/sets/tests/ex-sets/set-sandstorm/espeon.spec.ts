import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Espeon } from '../../../src/ex-sets/set-sandstorm/espeon';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Espeon SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Espeon()],
      [CardType.PSYCHIC, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Confuse Ray (20) - Flip a coin. If heads, the Defending Pokémon is now Confused.
  it('Should use Confuse Ray - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Confuse Ray'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should use Confuse Ray - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Confuse Ray'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Energy Crush (20+) - Does 20 more damage plus 10 more damage for each Energy attached to all of your opponent's
  // Pokémon.
  it('Should use Energy Crush counting Energy on all opponent\'s Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.WATER, CardType.WATER]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [CardType.FIRE]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [CardType.FIRE]);

    sim.dispatch(new AttackAction(1, 'Energy Crush'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Energy Crush when the opponent has no Energy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Energy Crush'));

    expect(opponent.active.damage).toEqual(20);
  });
});

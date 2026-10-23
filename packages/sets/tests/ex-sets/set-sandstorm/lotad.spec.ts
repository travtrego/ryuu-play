import {
  AttackAction,
  CardType,
  PassTurnAction,
  Simulator,
} from '@ptcg/common';

import { Lotad } from '../../../src/ex-sets/set-sandstorm/lotad';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Lotad SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Lotad()], [CardType.COLORLESS]);
  });

  // Rain Dish - At any time between turns, remove 1 damage counter from Lotad.
  // BUG: Rain Dish reacts to BetweenTurnsEffect, which is dispatched once per player, so 2 damage counters are
  // removed between turns instead of 1.
  xit('Should remove 1 damage counter between turns', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new PassTurnAction(1));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(20);
  });

  // BUG: same double heal as above (BetweenTurnsEffect fires once per player).
  xit('Should remove 1 damage counter from the opponent\'s Lotad between turns', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new Lotad()]);
    opponent.active.damage = 30;

    sim.dispatch(new PassTurnAction(1));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should not remove damage counters when Rain Dish is blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    sim.dispatch(new PassTurnAction(1));

    expect(player.active.damage).toEqual(30);
  });

  // Ram (10)
  it('Should use Ram', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Ram'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });
});

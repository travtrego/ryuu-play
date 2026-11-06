import {
  AttackAction,
  CardType,
  PassTurnAction,
  Simulator,
} from '@ptcg/common';

import { Lombre2 } from '../../../src/ex-sets/set-sandstorm/lombre-2';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Lombre SS-2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Lombre2()], [CardType.WATER, CardType.COLORLESS]);
  });

  // Rain Dish - At any time between turns, remove 1 damage counter from Lombre.
  it('Should remove 1 damage counter between turns', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new PassTurnAction(1));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(20);
  });

  it('Should remove 1 damage counter from a Benched Lombre between turns', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Lombre2()], [], [], 30);

    sim.dispatch(new PassTurnAction(1));

    expect(player.bench[0].damage).toEqual(20);
  });

  it('Should do nothing when Lombre has no damage counters', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new PassTurnAction(1));

    expect(player.active.damage).toEqual(0);
  });

  it('Should not remove damage counters when Rain Dish is blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    sim.dispatch(new PassTurnAction(1));

    expect(player.active.damage).toEqual(30);
  });

  // Double Scratch (30x) - Flip 2 coins. This attack does 30 damage times the number of heads.
  it('Should use Double Scratch - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Double Scratch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Double Scratch - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Double Scratch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});

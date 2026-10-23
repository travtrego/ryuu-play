import {
  AttackAction,
  CardType,
  PassTurnAction,
  Simulator,
} from '@ptcg/common';

import { Ludicolo } from '../../../src/ex-sets/set-sandstorm/ludicolo';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Ludicolo SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Ludicolo()],
      [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Rain Dish - At any time between turns, remove 1 damage counter from Ludicolo.
  // BUG: Rain Dish reacts to BetweenTurnsEffect, which is dispatched once per player, so 2 damage counters are
  // removed between turns instead of 1.
  xit('Should remove 1 damage counter between turns', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new PassTurnAction(1));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(20);
  });

  it('Should not remove damage counters when Rain Dish is blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    sim.dispatch(new PassTurnAction(1));

    expect(player.active.damage).toEqual(30);
  });

  // Hydro Punch (50+) - Does 50 damage plus 10 more damage for each W Energy attached to Ludicolo but not used to
  // pay for this attack's Energy cost. You can't add more than 20 damage in this way.
  it('Should use Hydro Punch without extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Hydro Punch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Hydro Punch with 1 extra Water Energy', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies(
      [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Hydro Punch'));

    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Hydro Punch adding no more than 20 damage', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies(
      [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS, CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Hydro Punch'));

    expect(opponent.active.damage).toEqual(70);
  });

  it('Should use Hydro Punch not counting other extra Energy', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies(
      [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS, CardType.FIRE]);

    sim.dispatch(new AttackAction(1, 'Hydro Punch'));

    expect(opponent.active.damage).toEqual(50);
  });
});

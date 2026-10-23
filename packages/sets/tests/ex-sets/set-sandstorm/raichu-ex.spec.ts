import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { RaichuEx } from '../../../src/ex-sets/set-sandstorm/raichu-ex';
import { TestUtils } from '../../test-utils';

describe('Raichu ex SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new RaichuEx()],
      [CardType.LIGHTNING, CardType.LIGHTNING, CardType.COLORLESS]
    );
  });

  // Dazzle Blast (20) - Flip a coin. If heads, the Defending Pokémon is now Confused.
  it('Should use Dazzle Blast - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Dazzle Blast'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should use Dazzle Blast - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Dazzle Blast'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Mega Thunderbolt (120) - Discard all Energy cards attached to Raichu ex.
  it('Should use Mega Thunderbolt and discard all Energy', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const energies = player.active.energies.cards.slice();

    sim.dispatch(new AttackAction(1, 'Mega Thunderbolt'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(120);
    expect(player.active.energies.cards).toEqual([]);
    expect(player.discard.cards).toEqual(energies);
  });
});

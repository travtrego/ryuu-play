import {
  AttackAction,
  CardType,
  PassTurnAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Nidoking } from '../../../src/base-sets/set-base/nidoking';
import { TestUtils } from '../../test-utils';

describe('Nidoking BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Nidoking()],
      [CardType.GRASS, CardType.GRASS, CardType.GRASS],
    );
  });

  // Thrash (30+) - Flip a coin. If heads, this attack does 30 damage plus 10 more damage; if tails, this attack
  // does 30 damage and Nidoking does 10 damage to itself.
  it('Should use Thrash for 40 damage on heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Thrash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Thrash for 30 damage and 10 damage to itself on tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Thrash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.damage).toEqual(10);
  });

  // Toxic (20) - The Defending Pokémon is now Poisoned. It now takes 20 Poison damage instead of 10 after each
  // player's turn (even if it was already Poisoned).
  it('Should use Toxic and poison the Defending Pokémon for 20 damage between turns', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Toxic'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // 20 attack damage + 20 Poison damage
    expect(opponent.active.damage).toEqual(40);

    sim.dispatch(new PassTurnAction(2));

    // + 20 Poison damage after the opponent's turn
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Toxic and upgrade an existing Poison to 20 damage', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.addSpecialCondition(SpecialCondition.POISONED);

    sim.dispatch(new AttackAction(1, 'Toxic'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(opponent.active.damage).toEqual(40);
  });
});

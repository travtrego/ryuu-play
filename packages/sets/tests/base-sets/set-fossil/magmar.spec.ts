import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Magmar } from '../../../src/base-sets/set-fossil/magmar';
import { TestUtils } from '../../test-utils';

describe('Magmar FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Magmar()],
      [CardType.FIRE, CardType.FIRE]
    );
  });

  // Smokescreen (10) - If the Defending Pokémon tries to attack during your opponent's next turn, your opponent
  // flips a coin. If tails, that attack does nothing.
  it('Should use Smokescreen - opponent flips tails, attack does nothing', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Smokescreen'));
    expect(opponent.active.damage).toEqual(10);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Smokescreen - opponent flips heads, attack works', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Smokescreen'));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  // Smog (20) - Flip a coin. If heads, the Defending Pokémon is now Poisoned.
  it('Should use Smog - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Smog'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(opponent.active.damage).toEqual(30); // 20 + 10 Poison between turns
  });

  it('Should use Smog - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Smog'));

    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.active.damage).toEqual(20);
  });
});

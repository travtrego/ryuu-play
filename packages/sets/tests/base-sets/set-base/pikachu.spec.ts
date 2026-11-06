import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Pikachu } from '../../../src/base-sets/set-base/pikachu';
import { TestUtils } from '../../test-utils';

describe('Pikachu BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Pikachu()],
      [CardType.LIGHTNING, CardType.COLORLESS],
    );
  });

  it('Should use Gnaw', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Gnaw'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Thunder Jolt (30) - Flip a coin. If tails, Pikachu does 10 damage to itself.
  it('Should use Thunder Jolt without self damage on heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Thunder Jolt'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Thunder Jolt and do 10 damage to itself on tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Thunder Jolt'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.damage).toEqual(10);
  });
});

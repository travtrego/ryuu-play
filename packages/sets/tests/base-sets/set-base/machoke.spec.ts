import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Machoke } from '../../../src/base-sets/set-base/machoke';
import { TestUtils } from '../../test-utils';

describe('Machoke BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Machoke()],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Karate Chop (50-) - Does 50 damage minus 10 damage for each damage counter on Machoke.
  it('Should use Karate Chop for 50 damage when Machoke has no damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Karate Chop'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Karate Chop for 30 damage when Machoke has 2 damage counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 20;

    sim.dispatch(new AttackAction(1, 'Karate Chop'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Karate Chop for 0 damage when Machoke has 5 or more damage counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 70;

    sim.dispatch(new AttackAction(1, 'Karate Chop'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Submission (60) - Machoke does 20 damage to itself.
  it('Should use Submission and do 20 damage to itself', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Submission'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
    expect(player.active.damage).toEqual(20);
  });
});

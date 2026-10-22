import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Tauros } from '../../../src/base-sets/set-jungle/tauros';
import { TestUtils } from '../../test-utils';

describe('Tauros JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Tauros()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Stomp (20+) - Flip a coin. If heads, this attack does 20 damage plus 10 more damage; if tails, this attack does
  // 20 damage.
  it('Should use Stomp - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Stomp'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Stomp - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Stomp'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Rampage (20+) - Does 20 damage plus 10 more damage for each damage counter on Tauros. Flip a coin. If tails,
  // Tauros is now Confused (after doing damage).
  it('Should use Rampage - heads', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 20;
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Rampage'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(player.active.specialConditions).toEqual([]);
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Rampage - tails, Tauros is now Confused', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Rampage'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(opponent.active.specialConditions).toEqual([]);
    expect(player.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should use Rampage without damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Rampage'));

    expect(opponent.active.damage).toEqual(20);
  });
});

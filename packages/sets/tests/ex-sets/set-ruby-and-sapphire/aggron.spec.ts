import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Aggron } from '../../../src/ex-sets/set-ruby-and-sapphire/aggron';
import { TestUtils } from '../../test-utils';

describe('Aggron RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Aggron()],
      [CardType.METAL, CardType.METAL, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Retaliate (10x) - Flip a coin. If heads, this attack does 10 damage times the number of damage counters on
  // Aggron.
  it('Should use Retaliate - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);
    player.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Retaliate'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Retaliate - tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);
    player.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Retaliate'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Retaliate - heads, no damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Retaliate'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Mega Punch (40)
  it('Should use Mega Punch', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Mega Punch'));

    expect(opponent.active.damage).toEqual(40);
  });

  // Double Lariat (70x) - Flip 2 coins. This attack does 70 damage times the number of heads.
  it('Should use Double Lariat - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Double Lariat'));

    expect(opponent.active.damage).toEqual(140);
  });

  it('Should use Double Lariat - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new AttackAction(1, 'Double Lariat'));

    expect(opponent.active.damage).toEqual(70);
  });

  it('Should use Double Lariat - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Double Lariat'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});

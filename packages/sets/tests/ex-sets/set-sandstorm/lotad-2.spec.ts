import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Lotad2 } from '../../../src/ex-sets/set-sandstorm/lotad-2';
import { TestUtils } from '../../test-utils';

describe('Lotad SS-2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Lotad2()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Tackle (10)
  it('Should use Tackle', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Tackle'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Blot (20) - Remove 1 damage counter from Lotad.
  it('Should use Blot and remove 1 damage counter', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Blot'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Blot without damage counters on Lotad', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Blot'));

    expect(opponent.active.damage).toEqual(20);
    expect(player.active.damage).toEqual(0);
  });
});

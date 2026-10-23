import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Pikachu } from '../../../src/ex-sets/set-sandstorm/pikachu';
import { TestUtils } from '../../test-utils';

describe('Pikachu SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Pikachu()],
      [CardType.LIGHTNING, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Scratch (10)
  it('Should use Scratch', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Scratch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Pika Bolt (40)
  it('Should use Pika Bolt', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Pika Bolt'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });
});

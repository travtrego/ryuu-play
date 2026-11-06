import { AttackAction, CardType, Simulator } from '@ptcg/common';

import { Tepig } from '../../../src/standard/set-black-and-white/tepig';
import { TestUtils } from '../../test-utils';

describe('Tepig BW', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Tepig()],
      [CardType.FIRE, CardType.COLORLESS]
    );
  });

  // Tackle (10)
  it('Should use Tackle for 10 damage', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Tackle'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Rollout (20)
  it('Should use Rollout for 20 damage', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rollout'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });
});

import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { NidoranMale } from '../../../src/base-sets/set-base/nidoran-male';
import { TestUtils } from '../../test-utils';

describe('Nidoran Male BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new NidoranMale()],
      [CardType.GRASS],
    );
  });

  // Horn Hazard (30) - Flip a coin. If tails, this attack does nothing.
  it('Should use Horn Hazard for 30 damage on heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Horn Hazard'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Horn Hazard and do nothing on tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Horn Hazard'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});

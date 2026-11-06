import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Seedot2 } from '../../../src/ex-sets/set-sandstorm/seedot-2';
import { TestUtils } from '../../test-utils';

describe('Seedot SS-2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Seedot2()], [CardType.COLORLESS]);
  });

  // Tackle (10)
  it('Should use Tackle', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Tackle'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });
});

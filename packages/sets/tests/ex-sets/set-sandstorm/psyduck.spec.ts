import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Psyduck } from '../../../src/ex-sets/set-sandstorm/psyduck';
import { TestUtils } from '../../test-utils';

describe('Psyduck SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Psyduck()], [CardType.COLORLESS]);
  });

  // Confusion Wave - Both Psyduck and the Defending Pokémon are now Confused.
  it('Should use Confusion Wave', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Confusion Wave'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
    expect(opponent.active.damage).toEqual(0);
  });
});

import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Shroomish } from '../../../src/ex-sets/set-ruby-and-sapphire/shroomish';
import { TestUtils } from '../../test-utils';

describe('Shroomish RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Shroomish()], [CardType.COLORLESS]);
  });

  // Sleep Powder (10) - The Defending Pokémon is now Asleep.
  it('Should use Sleep Powder', () => {
    const { opponent } = TestUtils.getAll(sim);
    // Asleep flip between turns: tails, stays Asleep
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Sleep Powder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

});

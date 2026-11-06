import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Torchic2 } from '../../../src/ex-sets/set-ruby-and-sapphire/torchic-2';
import { TestUtils } from '../../test-utils';

describe('Torchic RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Torchic2()], [CardType.COLORLESS]);
  });

  // Singe - Flip a coin. If heads, the Defending Pokémon is now Burned.
  it('Should use Singe - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    // attack flip, then Burned flip between turns (heads, no damage)
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Singe'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.BURNED]);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Singe - heads, Burn damage between turns', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new AttackAction(1, 'Singe'));

    expect(opponent.active.specialConditions).toEqual([SpecialCondition.BURNED]);
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Singe - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Singe'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.active.damage).toEqual(0);
  });

});

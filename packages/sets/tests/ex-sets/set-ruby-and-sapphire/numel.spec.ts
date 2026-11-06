import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Numel } from '../../../src/ex-sets/set-ruby-and-sapphire/numel';
import { TestUtils } from '../../test-utils';

describe('Numel RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Numel()], [CardType.FIRE, CardType.COLORLESS]);
  });

  // Headbutt (10)
  it('Should use Headbutt', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Headbutt'));

    expect(opponent.active.damage).toEqual(10);
  });

  // Burn Off - Flip a coin. If heads, each Defending Pokémon is now Burned.
  it('Should use Burn Off - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    // attack flip, then Burned flip between turns
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Burn Off'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.BURNED]);
  });

  it('Should use Burn Off - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Burn Off'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.active.damage).toEqual(0);
  });

});

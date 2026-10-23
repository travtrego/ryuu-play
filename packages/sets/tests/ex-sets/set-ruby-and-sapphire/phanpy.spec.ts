import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Phanpy } from '../../../src/ex-sets/set-ruby-and-sapphire/phanpy';
import { TestUtils } from '../../test-utils';

describe('Phanpy RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Phanpy()], [CardType.FIGHTING, CardType.COLORLESS]);
  });

  // Stampede (10)
  it('Should use Stampede', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Stampede'));

    expect(opponent.active.damage).toEqual(10);
  });

  // Trembler - Flip a coin. If heads, this attack does 10 damage to each Defending Pokémon, and each Defending
  // Pokémon is now Paralyzed.
  it('Should use Trembler - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Trembler'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Trembler - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Trembler'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([]);
  });

});

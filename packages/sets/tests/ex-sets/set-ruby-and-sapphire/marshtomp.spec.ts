import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Marshtomp } from '../../../src/ex-sets/set-ruby-and-sapphire/marshtomp';
import { TestUtils } from '../../test-utils';

describe('Marshtomp RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Marshtomp()], [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Bubble (10) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Bubble - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Bubble'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Bubble - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Bubble'));

    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Slash (40)
  it('Should use Slash', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(opponent.active.damage).toEqual(40);
  });

});

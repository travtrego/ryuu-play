import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Ralts2 } from '../../../src/ex-sets/set-ruby-and-sapphire/ralts-2';
import { TestUtils } from '../../test-utils';

describe('Ralts RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Ralts2()], [CardType.PSYCHIC, CardType.COLORLESS]);
  });

  // Headbutt (10)
  it('Should use Headbutt', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Headbutt'));

    expect(opponent.active.damage).toEqual(10);
  });

  // Hypnoblast (20) - The Defending Pokémon is now Asleep.
  it('Should use Hypnoblast', () => {
    const { opponent } = TestUtils.getAll(sim);
    // Asleep flip between turns: tails, stays Asleep
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Hypnoblast'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

});

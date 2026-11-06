import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Parasect } from '../../../src/base-sets/set-jungle/parasect';
import { TestUtils } from '../../test-utils';

describe('Parasect JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Parasect()],
      [CardType.GRASS, CardType.GRASS, CardType.COLORLESS],
    );
  });

  // Spore - The Defending Pokémon is now Asleep.
  it('Should use Spore', () => {
    const { opponent } = TestUtils.getAll(sim);
    // tails for the between-turns sleep check
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Spore'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

  // Slash (30)
  it('Should use Slash', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([]);
  });
});

import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Sceptile } from '../../../src/ex-sets/set-ruby-and-sapphire/sceptile';
import { TestUtils } from '../../test-utils';

describe('Sceptile RS', () => {
  let sim: Simulator;

  function setup(energies: CardType[]) {
    sim = TestUtils.createTestSimulator();
    TestUtils.setActive(sim, [new Sceptile()], energies);
    // Asleep and Burned flips between turns: tails (stay Asleep), heads (no burn damage)
    TestUtils.setFlipResults(sim, [false, true]);
  }

  // Lizard Poison (20) - If 1 Energy is attached to Sceptile, the Defending Pokémon is now Asleep. If 2 Energy is
  // attached to Sceptile, the Defending Pokémon is now Poisoned. If 3 Energy is attached to Sceptile, the Defending
  // Pokémon is now Asleep and Poisoned. If 4 or more Energy is attached to Sceptile, the Defending Pokémon is now
  // Asleep, Burned, and Poisoned.
  it('Should use Lizard Poison - 1 Energy', () => {
    setup([CardType.GRASS]);
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Lizard Poison'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Lizard Poison - 2 Energy', () => {
    setup([CardType.GRASS, CardType.GRASS]);
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Lizard Poison'));

    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  it('Should use Lizard Poison - 3 Energy', () => {
    setup([CardType.GRASS, CardType.GRASS, CardType.GRASS]);
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Lizard Poison'));

    expect(opponent.active.specialConditions).toEqual(jasmine.arrayWithExactContents([
      SpecialCondition.ASLEEP, SpecialCondition.POISONED
    ]));
  });

  it('Should use Lizard Poison - 4 or more Energy', () => {
    setup([CardType.GRASS, CardType.GRASS, CardType.GRASS, CardType.GRASS, CardType.GRASS]);
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Lizard Poison'));

    expect(opponent.active.specialConditions).toEqual(jasmine.arrayWithExactContents([
      SpecialCondition.ASLEEP, SpecialCondition.BURNED, SpecialCondition.POISONED
    ]));
  });

  // Solarbeam (70)
  it('Should use Solarbeam', () => {
    setup([CardType.GRASS, CardType.GRASS, CardType.GRASS, CardType.GRASS, CardType.GRASS]);
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Solarbeam'));

    expect(opponent.active.damage).toEqual(70);
    expect(opponent.active.specialConditions).toEqual([]);
  });

});

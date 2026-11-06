import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Ralts } from '../../../src/ex-sets/set-sandstorm/ralts';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Ralts SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Ralts()], [CardType.PSYCHIC]);
  });

  // Hypnosis - The Defending Pokémon is now Asleep.
  it('Should use Hypnosis', () => {
    const { opponent } = TestUtils.getAll(sim);
    // tails for the Asleep check between turns
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Hypnosis'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

  // Psychic Boom (10x) - Does 10 damage times the amount of Energy attached to the Defending Pokémon.
  it('Should use Psychic Boom', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.WATER, CardType.FIRE, CardType.COLORLESS]);

    sim.dispatch(new AttackAction(1, 'Psychic Boom'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Psychic Boom against a Defending Pokémon without Energy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Psychic Boom'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});

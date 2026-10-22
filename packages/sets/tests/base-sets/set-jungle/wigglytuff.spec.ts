import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Wigglytuff } from '../../../src/base-sets/set-jungle/wigglytuff';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Wigglytuff JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Wigglytuff()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Lullaby - The Defending Pokémon is now Asleep.
  it('Should use Lullaby', () => {
    const { opponent } = TestUtils.getAll(sim);
    // tails for the between-turns sleep check
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Lullaby'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

  // Do the Wave (10+) - Does 10 damage plus 10 more damage for each of your Benched Pokémon.
  it('Should use Do the Wave without Benched Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Do the Wave'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Do the Wave with 3 Benched Pokémon', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[2] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[4] = TestUtils.pokemonSlot([new TestPokemon()]);
    // the opponent's Benched Pokémon don't count
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Do the Wave'));

    expect(opponent.active.damage).toEqual(40);
  });
});

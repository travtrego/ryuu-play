import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Weezing } from '../../../src/ex-sets/set-ruby-and-sapphire/weezing';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Weezing RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Weezing()], [CardType.GRASS, CardType.COLORLESS]);
  });

  // Confusion Gas (10) - The Defending Pokémon is now Confused.
  it('Should use Confusion Gas', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Confusion Gas'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  // Poison Smog - Each Defending Pokémon is now Poisoned. Does 10 damage to each of your opponent's Benched
  // Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.)
  it('Should use Poison Smog', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const weakBenched = new TestPokemon();
    weakBenched.weakness = [{ type: CardType.GRASS }];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([weakBenched]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Poison Smog'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // Poison between turns only
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.bench[0].damage).toEqual(10);
    expect(opponent.bench[1].damage).toEqual(10);
    expect(player.bench[0].damage).toEqual(0);
  });

});

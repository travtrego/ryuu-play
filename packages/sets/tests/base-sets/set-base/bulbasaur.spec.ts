import {
  AttackAction,
  CardType,
  Effect,
  PutDamageEffect,
  Simulator,
  State,
  StoreLike,
} from '@ptcg/common';

import { Bulbasaur } from '../../../src/base-sets/set-base/bulbasaur';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

// Defending Pokémon that prevents all damage done to itself
class TestPokemonPreventDamage extends TestPokemon {
  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof PutDamageEffect && effect.target.pokemons.cards.includes(this)) {
      effect.preventDefault = true;
    }
    return state;
  }
}

describe('Bulbasaur BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Bulbasaur()],
      [CardType.GRASS, CardType.GRASS],
    );
  });

  // Leech Seed (20) - Unless all damage from this attack is prevented, you may remove 1 damage counter from
  // Bulbasaur.
  it('Should use Leech Seed - removes 1 damage counter', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 20;

    sim.dispatch(new AttackAction(1, 'Leech Seed'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Leech Seed - no damage counters on Bulbasaur', () => {
    const { opponent, player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Leech Seed'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Leech Seed - all damage prevented, no healing', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemonPreventDamage()]);
    player.active.damage = 20;

    sim.dispatch(new AttackAction(1, 'Leech Seed'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(player.active.damage).toEqual(20);
  });

});

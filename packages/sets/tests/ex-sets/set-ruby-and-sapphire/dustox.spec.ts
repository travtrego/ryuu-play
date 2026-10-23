import {
  AddSpecialConditionsEffect,
  AttackAction,
  AttackEffect,
  CardType,
  Effect,
  PassTurnAction,
  Simulator,
  SpecialCondition,
  State,
  StoreLike,
} from '@ptcg/common';

import { Dustox } from '../../../src/ex-sets/set-ruby-and-sapphire/dustox';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

// Test Pokemon whose attack does 20 damage and Poisons the Defending Pokemon.
class PoisonAttacker extends TestPokemon {
  public attacks = [{ name: 'Poison attack', cost: [], damage: '20', text: '' }];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.POISONED]));
    }
    return state;
  }
}

describe('Dustox RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Dustox()], [CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS]);
    TestUtils.setDefending(sim, [new PoisonAttacker()]);
  });

  // Protective Dust - Prevent all effects of attacks, except damage, done to Dustox by the Attacking Pokémon.
  it('Should use Protective Dust - prevents effects but not damage', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Poison attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(20);
    expect(player.active.specialConditions).toEqual([]);
  });

  it('Should use Protective Dust - power blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Poison attack'));

    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  it('Should use Protective Dust - does not protect other Pokemon', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = player.active;
    player.active = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Poison attack'));

    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  // Toxic - The Defending Pokémon is now Poisoned. Put 2 damage counters instead of 1 on the Defending Pokémon
  // between turns.
  it('Should use Toxic', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Toxic'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(opponent.active.damage).toEqual(20);
  });

  // Gust (50)
  it('Should use Gust', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Gust'));

    expect(opponent.active.damage).toEqual(50);
  });

});

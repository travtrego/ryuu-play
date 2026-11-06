import {
  AddSpecialConditionsEffect,
  AttackAction,
  AttackEffect,
  CardType,
  Effect,
  PassTurnAction,
  PokemonSlot,
  Simulator,
  SpecialCondition,
  State,
  StoreLike,
} from '@ptcg/common';

import { Snorlax } from '../../../src/base-sets/set-jungle/snorlax';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

class AttackerPokemon extends TestPokemon {
  public attacks = [
    { name: 'Paralyze', cost: [], damage: '10', text: '' },
    { name: 'Poison', cost: [], damage: '10', text: '' },
    { name: 'Confuse', cost: [], damage: '10', text: '' },
    { name: 'Sleep', cost: [], damage: '10', text: '' },
  ];

  private conditions = [
    SpecialCondition.PARALYZED,
    SpecialCondition.POISONED,
    SpecialCondition.CONFUSED,
    SpecialCondition.ASLEEP,
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect) {
      const index = this.attacks.findIndex(a => a === effect.attack);
      if (index !== -1) {
        store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [this.conditions[index]]));
      }
    }
    return state;
  }
}

describe('Snorlax JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Snorlax()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Thick Skinned - Snorlax can't become Asleep, Confused, Paralyzed, or Poisoned. This power can't be used if
  // Snorlax is already Asleep, Confused, or Paralyzed.
  ['Paralyze', 'Poison', 'Confuse', 'Sleep'].forEach(attack => {
    it(`Should not be affected by ${attack}`, () => {
      TestUtils.setActive(sim, [new AttackerPokemon()]);
      TestUtils.setDefending(sim, [new Snorlax()]);
      const { opponent } = TestUtils.getAll(sim);

      sim.dispatch(new AttackAction(1, attack));

      expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
      expect(opponent.active.specialConditions).toEqual([]);
      // no Poison damage between turns
      expect(opponent.active.damage).toEqual(10);
    });
  });

  it('Should be affected by Special Conditions when Pokémon Powers are blocked', () => {
    TestUtils.setActive(sim, [new AttackerPokemon()]);
    TestUtils.setDefending(sim, [new Snorlax()]);
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    sim.dispatch(new AttackAction(1, 'Paralyze'));

    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should not protect Snorlax that is already Confused', () => {
    TestUtils.setActive(sim, [new AttackerPokemon()]);
    TestUtils.setDefending(sim, [new Snorlax()]);
    const { opponent, player } = TestUtils.getAll(sim);

    // Snorlax becomes Confused while its power is blocked
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    sim.dispatch(new AttackAction(1, 'Confuse'));
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);

    // The blocker leaves play, Snorlax is still Confused
    opponent.bench[0] = new PokemonSlot();
    sim.dispatch(new PassTurnAction(2));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);

    sim.dispatch(new AttackAction(1, 'Poison'));

    expect(opponent.active.specialConditions).toContain(SpecialCondition.CONFUSED);
    expect(opponent.active.specialConditions).toContain(SpecialCondition.POISONED);
  });

  // Body Slam (30) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Body Slam - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Body Slam'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Body Slam - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Body Slam'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([]);
  });
});

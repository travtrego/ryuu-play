import {
  AddSpecialConditionsEffect,
  AttackAction,
  AttackEffect,
  CardType,
  Effect,
  PokemonCard,
  Simulator,
  SpecialCondition,
  State,
  StoreLike,
} from '@ptcg/common';

import { MrMime } from '../../../src/base-sets/set-jungle/mr-mime';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

class AttackerPokemon extends TestPokemon {
  public attacks = [
    { name: 'Attack', cost: [], damage: '30', text: '' },
    { name: 'Poison attack', cost: [], damage: '30', text: 'The Defending Pokémon is now Poisoned.' },
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.POISONED]));
    }
    return state;
  }
}

describe('Mr. Mime JU', () => {
  let sim: Simulator;
  let attacker: AttackerPokemon;
  let mrMime: MrMime;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    // Our attacker vs the opponent's Mr. Mime
    attacker = new AttackerPokemon();
    mrMime = new MrMime();
    TestUtils.setActive(sim, [attacker]);
    TestUtils.setDefending(sim, [mrMime]);
  });

  function attack(damage: number, name = 'Attack') {
    attacker.attacks.forEach(a => a.damage = String(damage));
    sim.dispatch(new AttackAction(1, name));
  }

  // Invisible Wall - Whenever an attack (including your own) does 30 or more damage to Mr. Mime (after applying
  // Weakness and Resistance), prevent that damage. (Any other effects of attacks still happen.) This power can't
  // be used if Mr. Mime is Asleep, Confused, or Paralyzed.
  it('Should prevent 30 damage', () => {
    const { opponent } = TestUtils.getAll(sim);
    attack(30);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should not prevent 20 damage', () => {
    const { opponent } = TestUtils.getAll(sim);
    attack(20);
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should prevent damage that reaches 30 after applying Weakness', () => {
    const { opponent } = TestUtils.getAll(sim);
    attacker.cardTypes = [CardType.PSYCHIC];
    attack(20);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should not prevent damage that drops below 30 after applying Resistance', () => {
    const { opponent } = TestUtils.getAll(sim);
    attacker.cardTypes = [CardType.FIGHTING];
    mrMime.resistance = [{ type: CardType.FIGHTING, value: -30 }];
    attack(50);
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should still apply other effects of the attack', () => {
    const { opponent } = TestUtils.getAll(sim);
    attack(30, 'Poison attack');
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // only Poison damage between turns
    expect(opponent.active.damage).toEqual(10);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not prevent damage while Mr. Mime is ${condition}`, () => {
      const { opponent } = TestUtils.getAll(sim);
      opponent.active.addSpecialCondition(condition);
      // tails, so a sleeping Mr. Mime stays Asleep
      TestUtils.setFlipResults(sim, [false]);
      attack(30);
      expect(opponent.active.damage).toEqual(30);
    });
  });

  it('Should not prevent damage when Pokémon Powers are blocked', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    attack(30);
    expect(opponent.active.damage).toEqual(30);
  });

  // Meditate (10+) - Does 10 damage plus 10 more damage for each damage counter on the Defending Pokémon.
  it('Should use Meditate', () => {
    TestUtils.setActive(sim, [new MrMime()], [CardType.PSYCHIC, CardType.COLORLESS]);
    TestUtils.setDefending(sim, [new TestPokemon()]);
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Meditate'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(70);
  });

  it('Should use Meditate without damage counters on the Defending Pokémon', () => {
    TestUtils.setActive(sim, [new MrMime()], [CardType.PSYCHIC, CardType.COLORLESS]);
    TestUtils.setDefending(sim, [new TestPokemon()]);
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).hp = 400;

    sim.dispatch(new AttackAction(1, 'Meditate'));

    expect(opponent.active.damage).toEqual(10);
  });
});

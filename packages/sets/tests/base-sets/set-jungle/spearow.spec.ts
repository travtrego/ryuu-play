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

import { Spearow } from '../../../src/base-sets/set-jungle/spearow';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class AttackerPokemon extends TestPokemon {
  public hp = 400;

  public attacks = [
    { name: 'Attack 30', cost: [], damage: '30', text: '' },
    { name: 'Poison attack', cost: [], damage: '10', text: 'The Defending Pokémon is now Poisoned.' },
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.POISONED]));
    }
    return state;
  }
}

describe('Spearow JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Spearow()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
    TestUtils.setDefending(sim, [new AttackerPokemon()]);
  });

  // Peck (10)
  it('Should use Peck', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Peck'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Mirror Move - If Spearow was attacked last turn, do the final result of that attack on Spearow to the
  // Defending Pokémon.
  it('Should use Mirror Move and do nothing if Spearow was not attacked last turn', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Mirror Move'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Mirror Move and do the damage Spearow took last turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Attack 30'));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(30);

    sim.dispatch(new AttackAction(1, 'Mirror Move'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Mirror Move and copy the final damage after Resistance', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as AttackerPokemon).cardTypes = [CardType.FIGHTING];

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Attack 30'));
    // Spearow resists Fighting: 30 - 30 = 0
    expect(player.active.damage).toEqual(0);

    sim.dispatch(new AttackAction(1, 'Mirror Move'));

    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Mirror Move and do nothing if Spearow was attacked two turns ago', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Attack 30'));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();

    sim.dispatch(new AttackAction(1, 'Mirror Move'));

    expect(opponent.active.damage).toEqual(0);
  });

  // BUG: Mirror Move only copies damage; the printed card does the "final result" of the attack, including
  // Special Conditions such as Poison.
  // 2026-10-23: WotC chat answers from 2000-2002, quoted secondhand (pkmncards comments, TCG ONE forum), say Mirror
  // Move also copies a Special Condition the attack actually applied. Not found in a primary rulings compendium, so
  // this stays pending for the owner to decide.
  xit('Should use Mirror Move and also copy the Special Condition from the attack', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Poison attack'));
    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);

    sim.dispatch(new AttackAction(1, 'Mirror Move'));

    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });
});

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

import { Fearow } from '../../../src/base-sets/set-jungle/fearow';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class AttackerPokemon extends TestPokemon {
  public attacks = [
    { name: 'Poison attack', cost: [], damage: '30', text: 'The Defending Pokémon is now Poisoned.' },
  ];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.POISONED]));
    }
    return state;
  }
}

describe('Fearow JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Fearow()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
    TestUtils.setDefending(sim, [new AttackerPokemon()]);
  });

  // Agility (20) - Flip a coin. If heads, during your opponent's next turn, prevent all effects of attacks,
  // including damage, done to Fearow.
  it('Should use Agility - heads, prevents damage and effects during the opponent\'s next turn', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Agility'));
    expect(opponent.active.damage).toEqual(20);

    sim.dispatch(new AttackAction(2, 'Poison attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
    expect(player.active.specialConditions).toEqual([]);
  });

  it('Should use Agility - tails, Fearow is damaged normally', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Agility'));
    expect(opponent.active.damage).toEqual(20);

    sim.dispatch(new AttackAction(2, 'Poison attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    // 30 damage + 10 Poison between turns
    expect(player.active.damage).toEqual(40);
    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  it('Should use Agility - the effect ends after the opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Agility'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Poison attack'));

    expect(player.active.damage).toEqual(40);
    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  // Drill Peck (40)
  it('Should use Drill Peck', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Drill Peck'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });
});

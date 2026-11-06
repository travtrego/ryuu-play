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

import { Rapidash } from '../../../src/base-sets/set-jungle/rapidash';
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

describe('Rapidash JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Rapidash()],
      [CardType.FIRE, CardType.FIRE, CardType.COLORLESS],
    );
    TestUtils.setDefending(sim, [new AttackerPokemon()]);
  });

  // Stomp (20+) - Flip a coin. If heads, this attack does 20 damage plus 10 more damage; if tails, this attack does
  // 20 damage.
  it('Should use Stomp - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Stomp'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Stomp - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Stomp'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Agility (30) - Flip a coin. If heads, during your opponent's next turn, prevent all effects of attacks,
  // including damage, done to Rapidash.
  it('Should use Agility - heads, prevents damage and effects during the opponent\'s next turn', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Agility'));
    expect(opponent.active.damage).toEqual(30);

    sim.dispatch(new AttackAction(2, 'Poison attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
    expect(player.active.specialConditions).toEqual([]);
  });

  it('Should use Agility - tails, Rapidash is damaged normally', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Agility'));
    expect(opponent.active.damage).toEqual(30);

    sim.dispatch(new AttackAction(2, 'Poison attack'));

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
});

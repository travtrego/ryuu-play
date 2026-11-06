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

import { ScytherEx } from '../../../src/ex-sets/set-ruby-and-sapphire/scyther-ex';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

// Test Pokemon whose attack does 30 damage and Poisons the Defending Pokemon.
class PoisonAttacker extends TestPokemon {
  public attacks = [{ name: 'Poison attack', cost: [], damage: '30', text: '' }];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.POISONED]));
    }
    return state;
  }
}

describe('Scyther ex RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new ScytherEx()], [CardType.GRASS, CardType.GRASS, CardType.COLORLESS]);
    TestUtils.setDefending(sim, [new PoisonAttacker()]);
  });

  // Agility (10) - Flip a coin. If heads, prevent all effects of an attack, including damage, done to Scyther ex
  // during your opponent's next turn.
  it('Should use Agility - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Agility'));
    expect(opponent.active.damage).toEqual(10);

    sim.dispatch(new AttackAction(2, 'Poison attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
    expect(player.active.specialConditions).toEqual([]);
  });

  it('Should use Agility - tails', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Agility'));
    sim.dispatch(new AttackAction(2, 'Poison attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // 30 + 10 Poison between turns
    expect(player.active.damage).toEqual(40);
  });

  it('Should use Agility - effect ends after opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Agility'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Poison attack'));

    expect(player.active.damage).toEqual(40);
  });

  // Slash (50)
  it('Should use Slash', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(opponent.active.damage).toEqual(50);
  });

});

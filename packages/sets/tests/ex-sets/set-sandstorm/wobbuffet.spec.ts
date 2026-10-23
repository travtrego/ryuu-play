import {
  AttackAction,
  CardType,
  Effect,
  PokemonCard,
  Simulator,
  SpecialCondition,
  State,
  StoreLike,
  AttackEffect,
  AddSpecialConditionsEffect,
} from '@ptcg/common';

import { Wobbuffet } from '../../../src/ex-sets/set-sandstorm/wobbuffet';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestPokemonEx } from '../../test-cards/test-pokemon-ex';
import { TestUtils } from '../../test-utils';

// Pokémon-ex whose attack does 30 damage and Poisons the Defending Pokémon.
class TestPoisonEx extends TestPokemonEx {
  public attacks = [{ name: 'Test attack', cost: [], damage: '30', text: '' }];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      store.reduceEffect(state, new AddSpecialConditionsEffect(effect, [SpecialCondition.POISONED]));
    }
    return state;
  }
}

describe('Wobbuffet SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Wobbuffet()],
      [CardType.PSYCHIC, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  function opponentAttacksWith(attacker: PokemonCard) {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [attacker]);
    TestUtils.setActivePlayer(sim, opponent);
    sim.dispatch(new AttackAction(2, 'Test attack'));
  }

  // Safeguard - Prevent all effects of attacks, including damage, done to Wobbuffet by your opponent's Pokémon-ex.
  it('Should prevent damage and effects from an opponent\'s Pokémon-ex', () => {
    const { player } = TestUtils.getAll(sim);

    opponentAttacksWith(new TestPoisonEx());

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
    expect(player.active.specialConditions).toEqual([]);
  });

  it('Should not prevent damage from a non Pokémon-ex', () => {
    const { player } = TestUtils.getAll(sim);

    opponentAttacksWith(new TestPokemon());

    expect(player.active.damage).toEqual(10);
  });

  it('Should not prevent damage when Safeguard is blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    opponentAttacksWith(new TestPoisonEx());

    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // 30 damage + 10 poison
    expect(player.active.damage).toEqual(40);
  });

  // Flip Over (50) - Wobbuffet does 10 damage to itself, and don't apply Weakness and Resistance to this damage.
  it('Should use Flip Over', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Flip Over'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    // Wobbuffet is weak to Psychic, but Weakness is not applied to the self damage
    expect(player.active.damage).toEqual(10);
  });
});

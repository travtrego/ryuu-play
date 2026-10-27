import {
  AttackAction,
  CardType,
  DealDamageEffect,
  Effect,
  Simulator,
  State,
  StoreLike,
} from '@ptcg/common';

import { Rayquaza } from '../../../src/standard/set-black-and-white/rayquaza';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

// Reduces incoming attack damage by 30, the kind of effect Shred ignores.
class TestPokemonReduceDamage extends TestPokemon {
  public hp = 300;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof DealDamageEffect && effect.target.pokemons.cards.includes(this)) {
      effect.damage = Math.max(0, effect.damage - 30);
    }
    return state;
  }
}

describe('Rayquaza DRV', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Rayquaza()],
      [CardType.FIRE, CardType.LIGHTNING, CardType.COLORLESS]
    );
  });

  // Dragon Pulse (40) - Discard the top 2 cards of your deck.
  it('Should use Dragon Pulse and discard the top 2 cards of your deck', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const deckBefore = player.deck.cards.length;
    const top2 = player.deck.cards.slice(0, 2);

    sim.dispatch(new AttackAction(1, 'Dragon Pulse'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(player.deck.cards.length).toEqual(deckBefore - 2);
    expect(player.discard.cards).toEqual(top2);
  });

  // Shred (90) - This attack's damage isn't affected by any effects on the Defending Pokemon.
  it('Should use Shred for 90 damage', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Shred'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(90);
  });

  it('Should use Shred and still apply Weakness', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = new TestPokemon();
    defending.hp = 300;
    defending.weakness = [{ type: CardType.DRAGON }];
    TestUtils.setDefending(sim, [defending]);

    sim.dispatch(new AttackAction(1, 'Shred'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(180);
  });

  it('Should use Shred ignoring damage reduction on the Defending Pokemon', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = new TestPokemonReduceDamage();
    TestUtils.setDefending(sim, [defending]);

    sim.dispatch(new AttackAction(1, 'Shred'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(90);
  });
});

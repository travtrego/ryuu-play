import {
  AttackAction,
  AttackEffect,
  CardType,
  ChooseCardsPrompt,
  Effect,
  GameMessage,
  PassTurnAction,
  PokemonCard,
  PutDamageEffect,
  ResolvePromptAction,
  Simulator,
  State,
  StoreLike,
} from '@ptcg/common';

import { Mightyena } from '../../../src/ex-sets/set-ruby-and-sapphire/mightyena';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

// Test Pokemon whose attack does 40 damage and 20 damage to each of the opponent's Benched Pokemon.
class SpreadAttacker extends TestPokemon {
  public attacks = [{ name: 'Spread attack', cost: [], damage: '40', text: '' }];

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      effect.opponent.bench.forEach(b => {
        if (b.pokemons.cards.length > 0) {
          const damage = new PutDamageEffect(effect, 20);
          damage.target = b;
          store.reduceEffect(state, damage);
        }
      });
    }
    return state;
  }
}

describe('Mightyena RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Mightyena()], [CardType.DARK, CardType.COLORLESS, CardType.COLORLESS]);
    TestUtils.setDefending(sim, [new SpreadAttacker()]);
  });

  // Intimidating Fang - As long as Mightyena is your Active Pokémon, any damage done to your Pokémon by an
  // opponent's attack is reduced by 10 (before applying Weakness and Resistance).
  it('Should use Intimidating Fang - reduces damage to Mightyena and Benched Pokemon', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Spread attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(30);
    expect(player.bench[0].damage).toEqual(10);
  });

  it('Should use Intimidating Fang - before applying Weakness', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).cardTypes = [CardType.FIGHTING];
    (opponent.active.getPokemonCard() as PokemonCard).attacks[0].damage = '30';

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Spread attack'));

    // (30 - 10) x2
    expect(player.active.damage).toEqual(40);
  });

  it('Should use Intimidating Fang - not when Mightyena is on the Bench', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = player.active;
    player.active = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Spread attack'));

    expect(player.active.damage).toEqual(40);
    expect(player.bench[0].damage).toEqual(20);
  });

  it('Should use Intimidating Fang - power blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Spread attack'));

    expect(player.active.damage).toEqual(40);
  });

  it('Should use Intimidating Fang - does not reduce own attacks', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Shakedown'));

    expect(opponent.active.damage).toEqual(40);
  });

  // Shakedown (40) - Flip a coin. If heads, choose 1 card from your opponent's hand without looking and discard it.
  it('Should use Shakedown - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);
    const card = new TestCard();
    opponent.hand.cards = [card, new TestCard()];

    sim.dispatch(new AttackAction(1, 'Shakedown'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      cards: opponent.hand,
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: false, isSecret: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [card]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(opponent.discard.cards).toEqual([card]);
  });

  it('Should use Shakedown - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);
    opponent.hand.cards = [new TestCard()];

    sim.dispatch(new AttackAction(1, 'Shakedown'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(opponent.discard.cards).toEqual([]);
  });

});

import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Nosepass } from '../../../src/ex-sets/set-ruby-and-sapphire/nosepass';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Nosepass RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Nosepass()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Invisible Hand - If any of your opponent's Active Pokémon are Evolved Pokémon, search your deck for any 1 card
  // and put it into your hand. Shuffle your deck afterward.
  it('Should use Invisible Hand - Defending Pokemon is evolved', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon(), new TestPokemon()]);
    const card = player.deck.cards[20];

    sim.dispatch(new AttackAction(1, 'Invisible Hand'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [card]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([card]);
    expect(player.deck.cards.length).toEqual(49);
  });

  it('Should use Invisible Hand - Defending Pokemon is not evolved', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Invisible Hand'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
  });

  // Repulsion - Flip a coin. If heads, your opponent returns the Defending Pokémon and all cards attached to it to
  // his or her hand. (If your opponent doesn't have any Benched Pokémon or other Active Pokémon, this attack does
  // nothing.)
  it('Should use Repulsion - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);
    const basic = new TestPokemon();
    const evolution = new TestPokemon();
    TestUtils.setDefending(sim, [basic, evolution], [CardType.FIRE]);
    const energy = opponent.active.energies.cards[0];
    opponent.active.damage = 30;
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Repulsion'));

    expect(opponent.hand.cards).toEqual(jasmine.arrayContaining([basic, evolution, energy]));
    expect(opponent.hand.cards.length).toEqual(3);
  });

  it('Should use Repulsion - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    const active = opponent.active.getPokemonCard();

    sim.dispatch(new AttackAction(1, 'Repulsion'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(active);
    expect(opponent.hand.cards).not.toContain(active as TestPokemon);
  });

  it('Should use Repulsion - opponent has no Benched Pokemon', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);
    const active = opponent.active.getPokemonCard();

    sim.dispatch(new AttackAction(1, 'Repulsion'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(active);
    expect(opponent.hand.cards).not.toContain(active as TestPokemon);
  });

});

import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Anorith } from '../../../src/ex-sets/set-sandstorm/anorith';
import { Kabuto } from '../../../src/ex-sets/set-sandstorm/kabuto';
import { Lileep } from '../../../src/ex-sets/set-sandstorm/lileep';
import { Omanyte } from '../../../src/ex-sets/set-sandstorm/omanyte';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Lileep SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Lileep()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Influence - Search your deck for Omanyte, Kabuto, Aerodactyl, Lileep, or Anorith and put up to 2 of them onto
  // your Bench. Shuffle your deck afterward. Treat the new Benched Pokémon as Basic Pokémon.
  it('Should use Influence and put up to 2 Pokémon onto the Bench', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const omanyte = new Omanyte();
    const kabuto = new Kabuto();
    const anorith = new Anorith();
    player.deck.cards = [omanyte, kabuto, anorith];

    sim.dispatch(new AttackAction(1, 'Influence'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,
      cards: player.deck,
      options: jasmine.objectContaining({ min: 0, max: 2, allowCancel: false })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [omanyte, anorith]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([omanyte]);
    expect(player.bench[1].pokemons.cards).toEqual([anorith]);
    expect(player.deck.cards).toEqual([kabuto]);
  });

  it('Should use Influence with only 1 empty Bench slot', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    for (let i = 0; i < 4; i++) {
      player.bench[i] = TestUtils.pokemonSlot([new TestPokemon()]);
    }
    player.deck.cards = [new Omanyte(), new Kabuto()];

    sim.dispatch(new AttackAction(1, 'Influence'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      options: jasmine.objectContaining({ max: 1 })
    }));
  });

  // Time Spiral - If your opponent has any Evolved Pokémon in play, choose 1 of them and flip a coin. If heads,
  // remove the highest Stage Evolution card on that Pokémon and have your opponent shuffle it into his or her deck.
  it('Should use Time Spiral - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const basic = new TestPokemon();
    const evolution = new TestPokemon();
    TestUtils.setDefending(sim, [basic, evolution], [CardType.WATER]);
    opponent.active.damage = 20;
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    const deckSize = opponent.deck.cards.length;
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Time Spiral'));

    const prompt = TestUtils.lastPrompt(sim)!;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_PICK_UP,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
      options: jasmine.objectContaining({
        blocked: [{ player: PlayerType.TOP_PLAYER, slot: SlotType.BENCH, index: 0 }]
      })
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.active]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.pokemons.cards).toEqual([basic]);
    expect(opponent.active.energies.cards.length).toEqual(1);
    expect(opponent.active.damage).toEqual(20);
    // evolution shuffled into the deck, then 1 card drawn at the start of the turn
    expect(opponent.deck.cards.length + opponent.hand.cards.length).toEqual(deckSize + 1);
    expect([...opponent.deck.cards, ...opponent.hand.cards]).toContain(evolution);
  });

  it('Should use Time Spiral - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    const basic = new TestPokemon();
    const evolution = new TestPokemon();
    TestUtils.setDefending(sim, [basic, evolution]);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Time Spiral'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.pokemons.cards).toEqual([basic, evolution]);
  });

  it('Should use Time Spiral when the opponent has no Evolved Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Time Spiral'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.pokemons.cards.length).toEqual(1);
  });
});

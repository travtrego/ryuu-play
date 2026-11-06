import {
  CardType,
  GameMessage,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
} from '@ptcg/common';

import { MrFuji } from '../../../src/base-sets/set-fossil/mr-fuji';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Mr. Fuji FO', () => {
  let sim: Simulator;
  let trainerCard: MrFuji;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new MrFuji();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  // Choose a Pokémon on your Bench. Shuffle it and any cards attached to it into your deck.
  it('Should shuffle a Benched Pokémon and its attached cards into the deck', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const basic = new TestPokemon();
    const evolved = new TestPokemon();
    player.bench[0] = TestUtils.pokemonSlot([basic, evolved], [CardType.WATER, CardType.FIRE], [], 30);
    player.bench[0].specialConditions.push(SpecialCondition.POISONED);
    const energies = player.bench[0].energies.cards.slice();
    const deckSize = player.deck.cards.length;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_PICK_UP,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.BENCH],
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([]);
    expect(player.bench[0].energies.cards).toEqual([]);
    expect(player.bench[0].damage).toEqual(0);
    expect(player.deck.cards.length).toEqual(deckSize + 4);
    [basic, evolved, ...energies].forEach(c => expect(player.deck.cards).toContain(c));
    expect(player.discard.cards).toEqual([trainerCard]);
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeTrue();
  });

  it('Should keep Mr. Fuji in hand when the prompt is canceled', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const benched = new TestPokemon();
    player.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([benched]);
    expect(player.hand.cards).toEqual([trainerCard]);
  });

  it('Should not be playable without Benched Pokémon', () => {
    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });
});

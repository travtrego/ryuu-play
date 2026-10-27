import {
  ChoosePokemonPrompt,
  GameMessage,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { PokemonCatcher } from '../../../src/standard/set-black-and-white/pokemon-catcher';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Pokemon Catcher SSH', () => {
  let sim: Simulator;
  let trainerCard: PokemonCatcher;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new PokemonCatcher();
    sim.store.state.players[0].hand.cards = [trainerCard];
    TestUtils.setActive(sim, [new TestPokemon()]);
    TestUtils.setDefending(sim, [new TestPokemon()]);
  });

  function playCard(): string {
    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Flip a coin. If heads, switch 1 of your opponent's Benched Pokemon with their Active Pokemon.
  it('Should switch the opponents Active Pokemon on heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    const benched = new TestPokemon();
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);
    TestUtils.setFlipResults(sim, [true]);

    expect(playCard()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(benched);
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
  });

  it('Should not switch on tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setFlipResults(sim, [false]);

    expect(playCard()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(defending);
    expect(player.discard.cards).toContain(trainerCard);
  });

  it('Should not be playable when the opponent has no Benched Pokemon', () => {
    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });
});

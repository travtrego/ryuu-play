import {
  ChoosePokemonPrompt,
  GameMessage,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Switch } from '../../../src/standard/set-black-and-white/switch';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Switch SSH', () => {
  let sim: Simulator;
  let trainerCard: Switch;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Switch();
    sim.store.state.players[0].hand.cards = [trainerCard];
    TestUtils.setActive(sim, [new TestPokemon()]);
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

  // Switch your Active Pokemon with 1 of your Benched Pokemon.
  it('Should switch the Active Pokemon with a chosen Benched Pokemon', () => {
    const { player } = TestUtils.getAll(sim);
    const active = player.active.getPokemonCard();
    const benched = new TestPokemon();
    player.bench[0] = TestUtils.pokemonSlot([benched]);

    expect(playCard()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.getPokemonCard()).toBe(benched);
    expect(player.bench[0].getPokemonCard()).toBe(active);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should not be playable with no Benched Pokemon', () => {
    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should keep the card in hand when the prompt is canceled', () => {
    const { player } = TestUtils.getAll(sim);
    const active = player.active.getPokemonCard();
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    expect(playCard()).toEqual('');
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(player.active.getPokemonCard()).toBe(active);
    expect(player.hand.cards).toEqual([trainerCard]);
    expect(player.discard.cards.length).toEqual(0);
  });
});

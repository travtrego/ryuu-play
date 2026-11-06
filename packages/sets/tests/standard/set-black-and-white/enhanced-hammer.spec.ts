import {
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  GameMessage,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { EnhancedHammer } from '../../../src/standard/set-black-and-white/enhanced-hammer';
import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { RainbowEnergy } from '../../../src/standard/set-black-and-white/rainbow-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Enhanced Hammer DEX', () => {
  let sim: Simulator;
  let trainerCard: EnhancedHammer;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new EnhancedHammer();
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

  // Discard a Special Energy attached to 1 of your opponent's Pokemon.
  it('Should discard a Special Energy from an opponents Pokemon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const rainbow = new RainbowEnergy();
    opponent.active.energies.cards = [rainbow, new FireEnergy()];

    expect(playCard()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_DISCARD_CARDS,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.active]));

    const cardPrompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(cardPrompt.id, [rainbow]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.discard.cards).toContain(rainbow);
    expect(opponent.active.energies.cards.length).toEqual(1);
  });

  it('Should not be playable when the opponent has only basic Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.energies.cards = [new FireEnergy()];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should not be playable when the opponent has no Energy', () => {
    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should keep the card in hand when the prompt is canceled', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const rainbow = new RainbowEnergy();
    opponent.active.energies.cards = [rainbow];

    expect(playCard()).toEqual('');
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(player.hand.cards).toEqual([trainerCard]);
    expect(opponent.active.energies.cards).toEqual([rainbow]);
  });
});

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

import { CrushingHammer } from '../../../src/standard/set-black-and-white/crushing-hammer';
import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Crushing Hammer EPO', () => {
  let sim: Simulator;
  let trainerCard: CrushingHammer;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new CrushingHammer();
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

  // Flip a coin. If heads, discard an Energy attached to 1 of your opponent's Pokemon.
  it('Should discard an Energy on heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    opponent.active.energies.cards = [fire];
    TestUtils.setFlipResults(sim, [true]);

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

    // Then choose which Energy card to discard
    const cardPrompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(cardPrompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: false }),
    }));
    sim.dispatch(new ResolvePromptAction(cardPrompt.id, [fire]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.energies.cards.length).toEqual(0);
    expect(opponent.discard.cards).toContain(fire);
  });

  it('Should discard nothing on tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    opponent.active.energies.cards = [fire];
    TestUtils.setFlipResults(sim, [false]);

    expect(playCard()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.energies.cards).toEqual([fire]);
    expect(player.discard.cards).toContain(trainerCard);
  });

  it('Should not be playable when the opponent has no Energy in play', () => {
    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should only offer Pokemon that have Energy attached', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.active.energies.cards = [];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], []);
    opponent.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1].energies.cards = [new FireEnergy()];
    TestUtils.setFlipResults(sim, [true]);

    expect(playCard()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    const blocked = (prompt.options as { blocked: { slot: number, index: number }[] }).blocked;
    // The Active and the empty Bench slot are blocked, bench[1] is not
    expect(blocked.length).toBeGreaterThan(0);
    expect(blocked.some(b => b.slot === SlotType.BENCH && b.index === 1)).toBeFalse();
  });
});

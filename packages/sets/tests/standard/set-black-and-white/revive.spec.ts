import {
  ChooseCardsPrompt,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Revive } from '../../../src/standard/set-black-and-white/revive';
import { Tepig } from '../../../src/standard/set-black-and-white/tepig';
import { Prinplup } from '../../../src/standard/set-black-and-white/prinplup';
import { TestUtils } from '../../test-utils';

describe('Revive BW', () => {
  let sim: Simulator;
  let trainerCard: Revive;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Revive();
    sim.store.state.players[0].hand.cards = [trainerCard];
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

  // Put a Basic Pokemon from your discard pile onto your Bench.
  it('Should put a Basic Pokemon from the discard pile onto the Bench', () => {
    const { player } = TestUtils.getAll(sim);
    const tepig = new Tepig();
    player.discard.cards = [tepig];

    expect(playCard()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_PUT_ONTO_BENCH,
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [tepig]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.bench[0].pokemons.cards).toEqual([tepig]);
    expect(player.discard.cards).toContain(trainerCard);
  });

  it('Should not be playable with no Basic Pokemon in the discard pile', () => {
    const { player } = TestUtils.getAll(sim);
    // A Stage 1 is not a valid target
    player.discard.cards = [new Prinplup()];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should not be playable with an empty discard pile', () => {
    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should not be playable with a full Bench', () => {
    const { player } = TestUtils.getAll(sim);
    player.discard.cards = [new Tepig()];
    player.bench.forEach(b => b.pokemons.cards = [new Tepig()]);

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should keep the card in hand when the prompt is canceled', () => {
    const { player } = TestUtils.getAll(sim);
    const tepig = new Tepig();
    player.discard.cards = [tepig];

    expect(playCard()).toEqual('');
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(player.hand.cards).toEqual([trainerCard]);
    expect(player.discard.cards).toEqual([tepig]);
    expect(player.bench.every(b => b.pokemons.cards.length === 0)).toBeTrue();
  });
});

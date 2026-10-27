import {
  ChooseCardsPrompt,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  SuperType,
  TrainerType,
} from '@ptcg/common';

import { Cheren } from '../../../src/standard/set-black-and-white/cheren';
import { Pokegear30 } from '../../../src/standard/set-black-and-white/pokegear-30';
import { TestUtils } from '../../test-utils';

describe('Pokegear 30 UNB', () => {
  let sim: Simulator;
  let trainerCard: Pokegear30;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Pokegear30();
    const player = sim.store.state.players[0];
    player.hand.cards = [trainerCard];
    player.deck.cards = TestUtils.makeTestCards(10);
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

  function resolveShowCards() {
    const { opponent } = TestUtils.getAll(sim);
    const show = TestUtils.lastPrompt(sim, opponent);
    if (show !== undefined && show.type === 'Show cards' && show.result === undefined) {
      sim.dispatch(new ResolvePromptAction(show.id, true));
    }
  }

  // Look at the top 7 cards of your deck. You may reveal a Supporter card you find there and put it into your
  // hand. Shuffle the other cards back into your deck.
  it('Should put a Supporter from the top 7 cards into the hand', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const cheren = new Cheren();
    player.deck.cards = [cheren, ...TestUtils.makeTestCards(9)];
    const deckBefore = player.deck.cards.length;

    expect(playCard()).toEqual('');

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: true }),
    }));
    expect(prompt.filter).toEqual(jasmine.objectContaining({
      superType: SuperType.TRAINER,
      trainerType: TrainerType.SUPPORTER,
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [cheren]));
    resolveShowCards();

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toContain(cheren);
    // The other 6 go back, so the deck is 1 smaller
    expect(player.deck.cards.length).toEqual(deckBefore - 1);
    expect(player.discard.cards).toContain(trainerCard);
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeTrue();
  });

  it('Should put everything back when no Supporter is taken', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const deckBefore = player.deck.cards.length;

    expect(playCard()).toEqual('');
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.deck.cards.length).toEqual(deckBefore);
  });

  it('Should not be playable with an empty deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards = [];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });
});

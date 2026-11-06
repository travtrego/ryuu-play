import {
  ChooseCardsPrompt,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { ComputerSearch } from '../../../src/standard/set-black-and-white/computer-search';
import { TestUtils } from '../../test-utils';

describe('Computer Search BCR', () => {
  let sim: Simulator;
  let trainerCard: ComputerSearch;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new ComputerSearch();
    const player = sim.store.state.players[0];
    player.hand.cards = [trainerCard, ...TestUtils.makeTestCards(3)];
    player.deck.cards = TestUtils.makeTestCards(5);
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

  // Discard 2 cards from your hand. (If you can't discard 2 cards, you can't play this card.)
  // Search your deck for a card and put it into your hand. Shuffle your deck afterward.
  it('Should discard 2 cards and take any card from the deck', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const toDiscard = player.hand.cards.slice(1, 3);
    const wanted = player.deck.cards[2];

    expect(playCard()).toEqual('');

    const discardPrompt = prompts[0] as ChooseCardsPrompt;
    expect(discardPrompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      options: jasmine.objectContaining({ min: 2, max: 2, allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(discardPrompt.id, toDiscard));

    const searchPrompt = prompts[1] as ChooseCardsPrompt;
    expect(searchPrompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
    }));
    sim.dispatch(new ResolvePromptAction(searchPrompt.id, [wanted]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toContain(wanted);
    toDiscard.forEach(c => expect(player.discard.cards).toContain(c));
    expect(player.discard.cards).toContain(trainerCard);
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeTrue();
  });

  it('Should not be playable with fewer than 2 other cards in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard, ...TestUtils.makeTestCards(1)];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should not be playable with an empty deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards = [];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should keep everything when the discard prompt is canceled', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const handBefore = player.hand.cards.slice();

    expect(playCard()).toEqual('');
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(player.hand.cards).toEqual(handBefore);
    expect(player.discard.cards.length).toEqual(0);
  });
});

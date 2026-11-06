import {
  ChooseCardsPrompt,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  Stage,
} from '@ptcg/common';

import { Emboar } from '../../../src/standard/set-black-and-white/emboar';
import { QuickBall } from '../../../src/standard/set-black-and-white/quick-ball';
import { Tepig } from '../../../src/standard/set-black-and-white/tepig';
import { TestUtils } from '../../test-utils';

describe('Quick Ball SSH', () => {
  let sim: Simulator;
  let trainerCard: QuickBall;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new QuickBall();
    const player = sim.store.state.players[0];
    player.hand.cards = [trainerCard, ...TestUtils.makeTestCards(2)];
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

  function resolveShowCards() {
    const { opponent } = TestUtils.getAll(sim);
    const show = TestUtils.lastPrompt(sim, opponent);
    if (show !== undefined && show.type === 'Show cards' && show.result === undefined) {
      sim.dispatch(new ResolvePromptAction(show.id, true));
    }
  }

  // You can play this card only if you discard another card from your hand. Search your deck for a Basic
  // Pokemon, reveal it, and put it into your hand. Then, shuffle your deck.
  it('Should discard a card and put a Basic Pokemon into the hand', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const tepig = new Tepig();
    player.deck.cards = [tepig, ...TestUtils.makeTestCards(4)];
    const toDiscard = player.hand.cards[1];

    expect(playCard()).toEqual('');

    const discardPrompt = prompts[0] as ChooseCardsPrompt;
    expect(discardPrompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(discardPrompt.id, [toDiscard]));

    const searchPrompt = prompts[1] as ChooseCardsPrompt;
    expect(searchPrompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
    }));
    sim.dispatch(new ResolvePromptAction(searchPrompt.id, [tepig]));
    resolveShowCards();

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toContain(tepig);
    expect(player.discard.cards).toContain(toDiscard);
    expect(player.discard.cards).toContain(trainerCard);
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeTrue();
  });

  it('Should only offer Basic Pokemon from the deck', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.deck.cards = [new Emboar(), new Tepig()];

    expect(playCard()).toEqual('');
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.hand.cards[1]]));

    const searchPrompt = prompts[1] as ChooseCardsPrompt;
    expect(searchPrompt.filter).toEqual(jasmine.objectContaining({ stage: Stage.BASIC }));
  });

  it('Should not be playable with no other card in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard];

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

import {
  ChooseCardsPrompt,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Cheren } from '../../../src/standard/set-black-and-white/cheren';
import { DowsingMachine } from '../../../src/standard/set-black-and-white/dowsing-machine';
import { TestUtils } from '../../test-utils';

describe('Dowsing Machine PLS', () => {
  let sim: Simulator;
  let trainerCard: DowsingMachine;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new DowsingMachine();
    const player = sim.store.state.players[0];
    player.hand.cards = [trainerCard, ...TestUtils.makeTestCards(3)];
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
  // Put a Trainer card from your discard pile into your hand.
  it('Should discard 2 cards and take a Trainer from the discard pile', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const cheren = new Cheren();
    player.discard.cards = [cheren, ...TestUtils.makeTestCards(1)];
    const toDiscard = player.hand.cards.slice(1, 3);

    expect(playCard()).toEqual('');

    const discardPrompt = prompts[0] as ChooseCardsPrompt;
    expect(discardPrompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      options: jasmine.objectContaining({ min: 2, max: 2, allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(discardPrompt.id, toDiscard));

    const takePrompt = prompts[1] as ChooseCardsPrompt;
    expect(takePrompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.discard,
    }));
    sim.dispatch(new ResolvePromptAction(takePrompt.id, [cheren]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toContain(cheren);
    toDiscard.forEach(c => expect(player.discard.cards).toContain(c));
    expect(player.discard.cards).toContain(trainerCard);
  });

  it('Should not be playable with fewer than 2 other cards in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard, ...TestUtils.makeTestCards(1)];
    player.discard.cards = [new Cheren()];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should not be playable with no Trainer in the discard pile', () => {
    const { player } = TestUtils.getAll(sim);
    player.discard.cards = TestUtils.makeTestCards(2);

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should keep everything when the discard prompt is canceled', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.discard.cards = [new Cheren()];
    const handBefore = player.hand.cards.slice();

    expect(playCard()).toEqual('');
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(player.hand.cards).toEqual(handBefore);
  });
});

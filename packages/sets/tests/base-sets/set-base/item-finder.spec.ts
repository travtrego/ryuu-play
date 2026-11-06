import {
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { ItemFinder } from '../../../src/base-sets/set-base/item-finder';
import { Bill } from '../../../src/base-sets/set-base/bill';
import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Item Finder BS', () => {
  let sim: Simulator;
  let trainerCard: ItemFinder;
  let x: TestCard;
  let y: TestCard;
  let bill: Bill;
  let fire: FireEnergy;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new ItemFinder();
    x = new TestCard();
    y = new TestCard();
    bill = new Bill();
    fire = new FireEnergy();
    const player = sim.store.state.players[0];
    player.hand.cards = [trainerCard, x, y];
    player.discard.cards = [fire, bill];
  });

  it('Should discard 2 cards to put a Trainer card from the discard pile into hand', () => {
    const { player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      options: jasmine.objectContaining({ min: 2, max: 2 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [x, y]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.discard,
      options: jasmine.objectContaining({ min: 1, max: 1, blocked: [0] }), // energy is blocked
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [bill]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([bill]);
    expect(player.discard.cards).toEqual(jasmine.arrayWithExactContents([fire, trainerCard, x, y]));
  });

  it('Should not be playable with fewer than 2 other cards in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard, x];

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard, x]);
  });

  it('Should not be playable without a Trainer card in the discard pile', () => {
    const { player } = TestUtils.getAll(sim);
    player.discard.cards = [fire];

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards.length).toEqual(3);
  });

  it('Should keep everything in hand when cancelled', () => {
    const { player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(3);
    expect(player.discard.cards).toEqual([fire, bill]);
  });
});

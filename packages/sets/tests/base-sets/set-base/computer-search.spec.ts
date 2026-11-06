import {
  CardType,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { ComputerSearch } from '../../../src/base-sets/set-base/computer-search';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Computer Search BS', () => {
  let sim: Simulator;
  let trainerCard: ComputerSearch;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new ComputerSearch();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should discard 2 cards and search the deck for any card, then shuffle', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const [x, y, z] = TestUtils.makeEnergies([CardType.FIRE, CardType.WATER, CardType.GRASS]);
    const [a, b, c] = TestUtils.makeEnergies([CardType.LIGHTNING, CardType.PSYCHIC, CardType.FIGHTING]);
    player.hand.cards = [trainerCard, x, y, z];
    player.deck.cards = [a, b, c];

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
      cards: player.deck,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [b]));

    expect(prompts[2]).toEqual(jasmine.objectContaining({ type: 'Shuffle deck', playerId: player.id }));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([z, b]);
    expect(player.discard.cards).toEqual([trainerCard, x, y]);
    expect(player.deck.cards).toEqual([c, a]); // reverse shuffle
  });

  it('Should not be playable with fewer than 2 other cards in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard, new TestCard()];

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards.length).toEqual(2);
    expect(player.discard.cards).toEqual([]);
  });

  it('Should keep everything in hand when cancelled', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const x = new TestCard();
    const y = new TestCard();
    player.hand.cards = [trainerCard, x, y];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(3);
    expect(player.hand.cards[0]).toBe(trainerCard);
    expect(player.discard.cards).toEqual([]);
    expect(player.deck.cards.length).toEqual(50);
  });
});

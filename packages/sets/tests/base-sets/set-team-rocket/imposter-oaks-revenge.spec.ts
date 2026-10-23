import {
  CardType,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { ImposterOaksRevenge } from '../../../src/base-sets/set-team-rocket/imposter-oaks-revenge';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Imposter Oak\'s Revenge TR', () => {
  let sim: Simulator;
  let trainerCard: ImposterOaksRevenge;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new ImposterOaksRevenge();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  // Discard a card from your hand in order to play this card. Your opponent shuffles his or her hand into his or
  // her deck, then draws 4 cards.
  it('Should discard a card and make the opponent shuffle the hand into the deck and draw 4', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const [x, y] = TestUtils.makeEnergies([CardType.FIRE, CardType.WATER]);
    player.hand.cards = [trainerCard, x, y];
    opponent.hand.cards = TestUtils.makeTestCards(7);
    opponent.deck.cards = TestUtils.makeTestCards(10);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [x]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([y]);
    expect(player.discard.cards.length).toEqual(2);
    expect(player.discard.cards).toContain(trainerCard);
    expect(player.discard.cards).toContain(x);
    expect(opponent.hand.cards.length).toEqual(4);
    expect(opponent.deck.cards.length).toEqual(13);
    expect(prompts.some(p => p.type === 'Shuffle deck' && p.playerId === opponent.id)).toBeTrue();
  });

  it('Should make the opponent draw 4 cards even with an empty hand', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const x = new TestCard();
    player.hand.cards = [trainerCard, x];
    opponent.hand.cards = [];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [x]));

    expect(opponent.hand.cards.length).toEqual(4);
    expect(opponent.deck.cards.length).toEqual(46);
    expect(player.hand.cards).toEqual([]);
  });

  it('Should not be playable without another card in hand to discard', () => {
    const { player } = TestUtils.getAll(sim);

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(TestUtils.getAll(sim).player.hand.cards.length).toEqual(1);
    expect(player.discard.cards).toEqual([]);
  });

  it('Should keep everything in hand when cancelled', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard, new TestCard()];
    opponent.hand.cards = TestUtils.makeTestCards(2);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(2);
    expect(player.discard.cards).toEqual([]);
    expect(opponent.hand.cards.length).toEqual(2);
  });
});

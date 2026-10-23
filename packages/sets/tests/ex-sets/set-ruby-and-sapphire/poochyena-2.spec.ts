import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Poochyena2 } from '../../../src/ex-sets/set-ruby-and-sapphire/poochyena-2';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Poochyena RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Poochyena2()], [CardType.DARK, CardType.COLORLESS]);
  });

  // Knock Off - Flip a coin. If heads, choose 1 card from your opponent's hand without looking and discard it.
  it('Should use Knock Off - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);
    const card = new TestCard();
    opponent.hand.cards = [new TestCard(), card];

    sim.dispatch(new AttackAction(1, 'Knock Off'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      cards: opponent.hand,
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: false, isSecret: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [card]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.discard.cards).toEqual([card]);
  });

  it('Should use Knock Off - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);
    opponent.hand.cards = [new TestCard()];

    sim.dispatch(new AttackAction(1, 'Knock Off'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.discard.cards).toEqual([]);
  });

  it('Should use Knock Off - opponent has no cards in hand', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Knock Off'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.discard.cards).toEqual([]);
  });

  // Rear Kick (20)
  it('Should use Rear Kick', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rear Kick'));

    expect(opponent.active.damage).toEqual(20);
  });

});

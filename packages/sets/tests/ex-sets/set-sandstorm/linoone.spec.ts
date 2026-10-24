import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Linoone } from '../../../src/ex-sets/set-sandstorm/linoone';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Linoone SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Linoone()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Sniff Out - Put any 1 card from your discard pile into your hand.
  it('Should use Sniff Out', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const card1 = new TestCard();
    const card2 = new TestCard();
    player.discard.cards = [card1, card2];

    sim.dispatch(new AttackAction(1, 'Sniff Out'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.discard,
      options: jasmine.objectContaining({ min: 1, max: 1 })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [card2]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([card2]);
    expect(player.discard.cards).toEqual([card1]);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Sniff Out with an empty deck', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const card = new TestCard();
    player.deck.cards = [];
    player.discard.cards = [card];

    sim.dispatch(new AttackAction(1, 'Sniff Out'));

    expect(prompts.length).toEqual(1);
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [card]));

    expect(player.hand.cards).toEqual([card]);
    expect(player.discard.cards).toEqual([]);
  });

  it('Should use Sniff Out with an empty discard pile', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.discard.cards = [];

    sim.dispatch(new AttackAction(1, 'Sniff Out'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
  });

  // Fury Swipes (20x) - Flip 3 coins. This attack does 20 damage times the number of heads.
  it('Should use Fury Swipes - 3 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true, true]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Fury Swipes - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, true, false]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Fury Swipes - 3 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false, false]);

    sim.dispatch(new AttackAction(1, 'Fury Swipes'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});

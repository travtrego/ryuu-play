import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Oddish } from '../../../src/standard/set-black-and-white-2/oddish';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Oddish UND', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    TestUtils.setActive(sim, [new Oddish()], [CardType.GRASS]);
  });

  it('Find a Friend: on heads, search a Grass Pokémon, show it and shuffle', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const target = new Oddish();
    player.deck.cards = [new TestCard(), target, new TestCard()];

    sim.dispatch(new AttackAction(1, 'Find a Friend'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({ type: 'Coin flip', playerId: player.id }));
    expect(prompts[0].result).toBeTrue();
    expect(prompts[1]).toEqual(jasmine.objectContaining({
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
    }));

    sim.dispatch(new ResolvePromptAction(prompts[1].id, [target]));

    expect(prompts[2]).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: opponent.id,
      cards: [target],
    }));

    sim.dispatch(new ResolvePromptAction(prompts[2].id, true));

    expect(prompts[3]).toEqual(jasmine.objectContaining({ type: 'Shuffle deck', playerId: player.id }));
    expect(player.hand.cards).toEqual([target]);
    expect(player.deck.cards.length).toEqual(2);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
  });

  it('Find a Friend: on tails, does nothing', () => {
    TestUtils.setFlipResults(sim, [false]);
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const deck = [new TestCard(), new Oddish(), new TestCard()];
    player.deck.cards = deck.slice();

    sim.dispatch(new AttackAction(1, 'Find a Friend'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({ type: 'Coin flip', playerId: player.id }));
    expect(prompts[0].result).toBeFalse();
    expect(player.hand.cards).toEqual([]);
    expect(player.deck.cards).toEqual(deck);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
  });
});

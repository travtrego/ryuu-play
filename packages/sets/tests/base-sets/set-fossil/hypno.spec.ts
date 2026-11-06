import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Hypno } from '../../../src/base-sets/set-fossil/hypno';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Hypno FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Hypno()],
      [CardType.PSYCHIC, CardType.PSYCHIC, CardType.PSYCHIC]
    );
  });

  // Prophecy - Look at up to 3 cards from the top of either player's deck and rearrange them as you like.
  it('Should use Prophecy on own deck', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const cards = TestUtils.makeTestCards(5);
    player.deck.cards = cards.slice();

    sim.dispatch(new AttackAction(1, 'Prophecy'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Select',
      playerId: player.id,
      values: [GameMessage.REVEAL_TOP_DECK_CARD, GameMessage.REVEAL_OPPONENT_TOP_DECK_CARD],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, 0));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Order cards',
      playerId: player.id,
    }));
    expect((prompts[1] as any).cards.cards).toEqual(cards.slice(0, 3));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [2, 0, 1]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.deck.cards.length).toEqual(5);
    expect(player.deck.cards).toEqual([cards[2], cards[0], cards[1], cards[3], cards[4]]);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Prophecy on the opponent\'s deck', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const cards = TestUtils.makeTestCards(4);
    opponent.deck.cards = cards.slice();
    const ownDeck = player.deck.cards.slice();

    sim.dispatch(new AttackAction(1, 'Prophecy'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, 1));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [1, 2, 0]));

    expect(player.deck.cards).toEqual(ownDeck);
    // opponent draws the new top card at the start of the turn
    expect(opponent.hand.cards).toContain(cards[1]);
    expect(opponent.deck.cards).toEqual([cards[2], cards[0], cards[3]]);
  });

  it('Should use Prophecy with fewer than 3 cards in the deck', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const cards = TestUtils.makeTestCards(2);
    player.deck.cards = cards.slice();

    sim.dispatch(new AttackAction(1, 'Prophecy'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, 0));
    expect((prompts[1] as any).cards.cards).toEqual(cards);
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [1, 0]));

    expect(player.deck.cards).toEqual([cards[1], cards[0]]);
  });

  // Dark Mind (30) - If your opponent has any Benched Pokémon, choose 1 of them and this attack does 10 damage to it.
  it('Should use Dark Mind', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.PSYCHIC }];
    opponent.bench[0] = TestUtils.pokemonSlot([weak]);

    sim.dispatch(new AttackAction(1, 'Dark Mind'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.bench[0].damage).toEqual(10);
  });

  it('Should use Dark Mind without Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Dark Mind'));

    expect(prompts.length).toEqual(0);
    expect(opponent.active.damage).toEqual(30);
  });
});

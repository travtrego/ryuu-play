import { PlayCardAction, Simulator } from '@ptcg/common';

import { ProfessorOaksNewTheory } from '../../../src/standard/set-black-and-white/professor-oaks-new-theory';
import { TestUtils } from '../../test-utils';

describe('Professor Oaks New Theory HGSS', () => {
  let sim: Simulator;
  let trainerCard: ProfessorOaksNewTheory;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new ProfessorOaksNewTheory();
    const player = sim.store.state.players[0];
    player.hand.cards = [trainerCard, ...TestUtils.makeTestCards(3)];
    player.deck.cards = TestUtils.makeTestCards(20);
  });

  // Shuffle your hand into your deck. Then, draw 6 cards.
  it('Should shuffle the hand into the deck and draw 6 cards', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const oldHand = player.hand.cards.filter(c => c !== trainerCard);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(6);
    // 20 + 3 shuffled back - 6 drawn
    expect(player.deck.cards.length).toEqual(17);
    expect(player.supporter.cards).toEqual([trainerCard]);
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeTrue();
    oldHand.forEach(c => {
      expect(player.deck.cards.includes(c) || player.hand.cards.includes(c)).toBeTrue();
    });
  });

  it('Should draw 6 cards with no other cards in hand', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards.length).toEqual(6);
    expect(player.deck.cards.length).toEqual(14);
    // Nothing to shuffle back
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeFalse();
  });
});

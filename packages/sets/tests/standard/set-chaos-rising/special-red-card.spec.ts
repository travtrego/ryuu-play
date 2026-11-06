import { PlayCardAction, Simulator } from '@ptcg/common';

import { SpecialRedCard } from '../../../src/standard/set-chaos-rising/special-red-card';
import { TestUtils } from '../../test-utils';

describe('Special Red Card CRI', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('needs the opponent to have 3 or fewer Prize cards left', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new SpecialRedCard()];
    expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
  });

  it('the opponent puts their hand on the bottom of the deck and draws 3', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.prizes.slice(0, 3).forEach(p => { p.cards = []; });
    const hand = TestUtils.makeTestCards(6);
    opponent.hand.cards = [...hand];
    player.hand.cards = [new SpecialRedCard()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    expect(opponent.hand.cards.length).toEqual(3);
    expect(opponent.hand.cards.some(c => hand.includes(c))).toBeFalse();
    expect(opponent.deck.cards.slice(-6)).toEqual(hand);
  });
});

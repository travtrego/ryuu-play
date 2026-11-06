import { CardTag, PlayCardAction, Simulator } from '@ptcg/common';

import { UnfairStamp } from '../../../src/standard/set-twilight-masquerade/unfair-stamp';
import { TestUtils } from '../../test-utils';

describe('Unfair Stamp TWM', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
  });

  it('is an ACE SPEC', () => {
    expect(new UnfairStamp().tags).toContain(CardTag.ACE_SPEC);
  });

  it('can\'t be played unless one of your Pokémon was Knocked Out last turn', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [new UnfairStamp()];
    expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
    player.knockedOutTurn = 3;
    expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
  });

  it('shuffles both hands in; you draw 5, the opponent draws 2', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.knockedOutTurn = 4;
    player.hand.cards = [new UnfairStamp(), ...TestUtils.makeTestCards(2)];
    opponent.hand.cards = TestUtils.makeTestCards(7);
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    expect(player.hand.cards.length).toEqual(5);
    expect(opponent.hand.cards.length).toEqual(2);
    expect(player.deck.cards.length).toEqual(50 + 2 - 5);
    expect(opponent.deck.cards.length).toEqual(50 + 7 - 2);
  });
});

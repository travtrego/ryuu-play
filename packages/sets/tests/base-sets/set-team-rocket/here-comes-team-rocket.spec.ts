import {
  PlayCardAction,
  Simulator,
} from '@ptcg/common';

import { HereComesTeamRocket } from '../../../src/base-sets/set-team-rocket/here-comes-team-rocket';
import { TestUtils } from '../../test-utils';

describe('Here Comes Team Rocket! TR', () => {
  let sim: Simulator;
  let trainerCard: HereComesTeamRocket;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new HereComesTeamRocket();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  // Each player plays with his or her Prize cards face up for the rest of the game.
  it('Should turn both players\' Prize cards face up', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    expect(player.prizes.some(p => p.isPublic)).toBeFalse();

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.prizes.length).toEqual(6);
    player.prizes.forEach(p => expect(p.isPublic).toBeTrue());
    opponent.prizes.forEach(p => expect(p.isPublic).toBeTrue());
    player.prizes.forEach(p => expect(p.isSecret).toBeFalse());
    opponent.prizes.forEach(p => expect(p.isSecret).toBeFalse());
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should keep the Prize cards in place', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const prizeCards = player.prizes.map(p => p.cards[0]);
    const opponentPrizeCards = opponent.prizes.map(p => p.cards[0]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(player.prizes.map(p => p.cards[0])).toEqual(prizeCards);
    expect(opponent.prizes.map(p => p.cards[0])).toEqual(opponentPrizeCards);
    expect(player.hand.cards).toEqual([]);
  });
});

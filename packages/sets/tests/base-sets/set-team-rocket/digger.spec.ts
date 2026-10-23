import {
  PlayCardAction,
  Simulator,
} from '@ptcg/common';

import { Digger } from '../../../src/base-sets/set-team-rocket/digger';
import { TestUtils } from '../../test-utils';

describe('Digger TR', () => {
  let sim: Simulator;
  let trainerCard: Digger;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Digger();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  // Flip a coin. If tails, do 10 damage to your Active Pokémon. If heads, your opponent flips a coin. If tails,
  // your opponent does 10 damage to his or her Active Pokémon. If heads, you flip a coin. Keep doing this until a
  // player gets tails.
  it('Should be discarded after it is played', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
    expect(player.active.damage + TestUtils.getAll(sim).opponent.active.damage).toEqual(10);
  });

  it('Should do 10 damage to your Active Pokémon when you flip tails first', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(player.active.damage).toEqual(10);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should do 10 damage to the opponent\'s Active Pokémon on heads, then opponent\'s tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(player.active.damage).toEqual(0);
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should keep flipping until tails - heads, heads, tails damages your Active Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true, false]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(player.active.damage).toEqual(10);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should keep flipping until tails - only one Active Pokémon takes 10 damage', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true, true, true, false]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts.filter(p => p.type === 'Coin flip').length).toEqual(5);
    expect(player.active.damage + opponent.active.damage).toEqual(10);
  });
});

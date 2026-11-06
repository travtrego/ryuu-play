import {
  PlayCardAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Sleep } from '../../../src/base-sets/set-team-rocket/sleep';
import { TestUtils } from '../../test-utils';

describe('Sleep! TR', () => {
  let sim: Simulator;
  let trainerCard: Sleep;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Sleep();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  // Flip a coin. If heads, the Defending Pokémon is now Asleep.
  it('Should make the Defending Pokémon Asleep - heads', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts.filter(p => p.type === 'Coin flip').length).toEqual(1);
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
    expect(player.active.specialConditions).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should do nothing - tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([]);
    expect(player.hand.cards).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should replace Confusion with Sleep - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.addSpecialCondition(SpecialCondition.CONFUSED);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });
});

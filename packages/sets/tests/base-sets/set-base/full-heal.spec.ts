import {
  PlayCardAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { FullHeal } from '../../../src/base-sets/set-base/full-heal';
import { TestUtils } from '../../test-utils';

describe('Full Heal BS', () => {
  let sim: Simulator;
  let trainerCard: FullHeal;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new FullHeal();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should remove Asleep and Poisoned from the Active Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.addSpecialCondition(SpecialCondition.ASLEEP);
    player.active.addSpecialCondition(SpecialCondition.POISONED);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.specialConditions).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should remove Confused and Paralyzed but not damage counters', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    player.active.addSpecialCondition(SpecialCondition.CONFUSED);
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    expect(player.active.specialConditions).toEqual([]);

    const second = new FullHeal();
    player.hand.cards = [second];
    player.active.addSpecialCondition(SpecialCondition.PARALYZED);
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(player.active.specialConditions).toEqual([]);
    expect(player.active.damage).toEqual(30);
    expect(player.discard.cards).toEqual([trainerCard, second]);
  });
});

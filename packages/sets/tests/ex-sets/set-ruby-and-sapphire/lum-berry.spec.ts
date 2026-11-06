import {
  PassTurnAction,
  PlayCardAction,
  Simulator,
  SpecialCondition,
  TrainerCard,
} from '@ptcg/common';

import { LumBerry } from '../../../src/ex-sets/set-ruby-and-sapphire/lum-berry';
import { TestUtils } from '../../test-utils';

describe('Lum Berry RS', () => {
  let sim: Simulator;
  let trainerCard: TrainerCard;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new LumBerry();
  });

  // At any time between turns, if the Pokémon this card is attached to is affected by any Special Conditions, remove
  // all of them. Then discard Lum Berry.
  it('Should attach Lum Berry as a Pokemon Tool', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.trainers.cards).toEqual([trainerCard]);
  });

  it('Should remove all Special Conditions between turns and discard Lum Berry', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.trainers.cards = [trainerCard];
    player.active.addSpecialCondition(SpecialCondition.CONFUSED);
    player.active.addSpecialCondition(SpecialCondition.POISONED);

    sim.dispatch(new PassTurnAction(1));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.specialConditions).toEqual([]);
    expect(player.active.trainers.cards).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should work on the opponent\'s Pokemon between turns', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.trainers.cards = [trainerCard];
    opponent.active.addSpecialCondition(SpecialCondition.BURNED);

    sim.dispatch(new PassTurnAction(1));

    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.discard.cards).toEqual([trainerCard]);
  });

  it('Should stay attached when there are no Special Conditions', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.trainers.cards = [trainerCard];

    sim.dispatch(new PassTurnAction(1));

    expect(player.active.trainers.cards).toEqual([trainerCard]);
    expect(player.discard.cards).toEqual([]);
  });

});

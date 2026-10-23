import {
  GameMessage,
  PlayCardAction,
  Simulator,
  SpecialCondition,
  TrainerCard,
} from '@ptcg/common';

import { DoubleFullHeal } from '../../../src/ex-sets/set-sandstorm/double-full-heal';
import { TestUtils } from '../../test-utils';

describe('Double Full Heal SS', () => {
  let sim: Simulator;
  let trainerCard: TrainerCard;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new DoubleFullHeal();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  // Remove all Special Conditions from each of your Active Pokémon.
  it('Should remove all Special Conditions from the Active Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.addSpecialCondition(SpecialCondition.POISONED);
    player.active.addSpecialCondition(SpecialCondition.BURNED);
    player.active.addSpecialCondition(SpecialCondition.CONFUSED);
    opponent.active.addSpecialCondition(SpecialCondition.POISONED);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.specialConditions).toEqual([]);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(player.discard.cards).toEqual([trainerCard]);
    expect(player.hand.cards).toEqual([]);
  });

  it('Should remove Asleep and Paralyzed', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.addSpecialCondition(SpecialCondition.ASLEEP);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(player.active.specialConditions).toEqual([]);
  });

  it('Should not be played when the Active Pokémon has no Special Conditions', () => {
    const { player } = TestUtils.getAll(sim);

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });
});

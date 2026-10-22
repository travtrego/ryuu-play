import {
  AttackAction,
  CardType,
  GameMessage,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Haunter } from '../../../src/base-sets/set-base/haunter';
import { TestUtils } from '../../test-utils';

describe('Haunter BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Haunter()],
      [CardType.PSYCHIC, CardType.PSYCHIC],
    );
  });

  // Hypnosis - The Defending Pokémon is now Asleep.
  it('Should use Hypnosis', () => {
    const { opponent } = TestUtils.getAll(sim);
    // tails on the between-turns sleep check, so the Defending Pokémon stays Asleep
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Hypnosis'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

  // Dream Eater (50) - You can't use this attack unless the Defending Pokémon is Asleep.
  it('Should not use Dream Eater when the Defending Pokémon is not Asleep', () => {
    const { opponent, player } = TestUtils.getAll(sim);

    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Dream Eater'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.BLOCKED_BY_SPECIAL_CONDITION);
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Dream Eater when the Defending Pokémon is Asleep', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.addSpecialCondition(SpecialCondition.ASLEEP);

    sim.dispatch(new AttackAction(1, 'Dream Eater'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });

});

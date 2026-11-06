import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { LaprasEx } from '../../../src/ex-sets/set-ruby-and-sapphire/lapras-ex';
import { TestUtils } from '../../test-utils';

describe('Lapras ex RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new LaprasEx()], [CardType.WATER]);
  });

  // Energy Ball (10+) - Does 10 damage plus 10 more damage for each Energy attached to Lapras ex but not used to pay
  // for this attack's Energy cost. You can't add more than 20 damage in this way.
  it('Should use Energy Ball - no extra Energy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Energy Ball'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Energy Ball - 1 extra Energy', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([CardType.WATER, CardType.FIRE]);

    sim.dispatch(new AttackAction(1, 'Energy Ball'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Energy Ball - capped at 20 extra damage', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([
      CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER
    ]);

    sim.dispatch(new AttackAction(1, 'Energy Ball'));

    expect(opponent.active.damage).toEqual(30);
  });

  // Confuse Ray (30) - The Defending Pokémon is now Confused.
  it('Should use Confuse Ray', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([CardType.WATER, CardType.WATER, CardType.COLORLESS]);

    sim.dispatch(new AttackAction(1, 'Confuse Ray'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

});

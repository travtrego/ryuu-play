import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Wailmer } from '../../../src/ex-sets/set-ruby-and-sapphire/wailmer';
import { TestUtils } from '../../test-utils';

describe('Wailmer RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Wailmer()], [CardType.WATER, CardType.COLORLESS]);
  });

  // Rest - Remove all Special Conditions and 4 damage counters from Wailmer (all if there are less than 4). Wailmer
  // is now Asleep.
  it('Should use Rest - remove Special Conditions and 4 damage counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 60;
    player.active.addSpecialCondition(SpecialCondition.POISONED);
    player.active.addSpecialCondition(SpecialCondition.BURNED);

    sim.dispatch(new AttackAction(1, 'Rest'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(20);
    expect(player.active.specialConditions).not.toContain(SpecialCondition.POISONED);
    expect(player.active.specialConditions).not.toContain(SpecialCondition.BURNED);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Rest - fewer than 4 damage counters', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 20;

    sim.dispatch(new AttackAction(1, 'Rest'));

    expect(player.active.damage).toEqual(0);
  });

  it('Should use Rest - Wailmer is now Asleep', () => {
    const { player } = TestUtils.getAll(sim);
    // Asleep flip between turns: tails, stays Asleep
    TestUtils.setFlipResults(sim, [false]);
    player.active.damage = 20;

    sim.dispatch(new AttackAction(1, 'Rest'));

    expect(player.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

  // Water Gun (20+) - This attack does 20 damage plus 10 more damage for each W Energy attached to Wailmer but not
  // used to pay for this attack's Energy cost. You can't add more than 20 damage in this way.
  it('Should use Water Gun - no extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Water Gun - 1 extra Water Energy', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([CardType.WATER, CardType.FIRE, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Water Gun - extra non-Water Energy does not count', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([CardType.WATER, CardType.FIRE, CardType.FIRE]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Water Gun - capped at 20 extra damage', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([
      CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER
    ]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(40);
  });

});

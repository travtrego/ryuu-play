import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Pelipper } from '../../../src/ex-sets/set-sandstorm/pelipper';
import { TestUtils } from '../../test-utils';

describe('Pelipper SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Pelipper()], [CardType.WATER, CardType.WATER]);
  });

  // Water Gun (30+) - This attack does 30 damage plus 10 more damage for each W Energy attached to Pelipper but not
  // used to pay for this attack's Energy cost. You can't add more than 20 damage in this way.
  it('Should use Water Gun without extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Water Gun with 1 extra Water Energy', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Water Gun adding no more than 20 damage', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies(
      [CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Water Gun not counting non-Water extra Energy', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([CardType.FIRE, CardType.FIRE, CardType.FIRE]);

    sim.dispatch(new AttackAction(1, 'Water Gun'));

    expect(opponent.active.damage).toEqual(30);
  });
});

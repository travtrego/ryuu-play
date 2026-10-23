import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Breloom } from '../../../src/ex-sets/set-ruby-and-sapphire/breloom';
import { TestUtils } from '../../test-utils';

describe('Breloom RS', () => {
  let sim: Simulator;

  // Headbutt (20)
  it('Should use Headbutt', () => {
    sim = TestUtils.createTestSimulator();
    TestUtils.setActive(sim, [new Breloom()], [CardType.COLORLESS, CardType.COLORLESS]);
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Headbutt'));

    expect(opponent.active.damage).toEqual(20);
  });

  // Battle Blast (40+) - Does 40 damage plus 10 more damage for each F Energy attached to Breloom.
  it('Should use Battle Blast - no Fighting Energy', () => {
    sim = TestUtils.createTestSimulator();
    TestUtils.setActive(sim, [new Breloom()], [CardType.GRASS, CardType.GRASS, CardType.WATER]);
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Battle Blast'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Battle Blast - 2 Fighting Energy', () => {
    sim = TestUtils.createTestSimulator();
    TestUtils.setActive(sim, [new Breloom()], [CardType.GRASS, CardType.FIGHTING, CardType.FIGHTING]);
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Battle Blast'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

});

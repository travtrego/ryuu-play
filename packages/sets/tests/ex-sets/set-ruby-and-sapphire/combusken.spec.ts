import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Combusken } from '../../../src/ex-sets/set-ruby-and-sapphire/combusken';
import { TestUtils } from '../../test-utils';

describe('Combusken RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Combusken()], [CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Flare (20)
  it('Should use Flare', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Flare'));

    expect(opponent.active.damage).toEqual(20);
  });

  // Double Kick (40x) - Flip 2 coins. This attack does 40 damage times the number of heads.
  it('Should use Double Kick - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Double Kick'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(80);
  });

  it('Should use Double Kick - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, true]);

    sim.dispatch(new AttackAction(1, 'Double Kick'));

    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Double Kick - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Double Kick'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});

import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Mightyena2 } from '../../../src/ex-sets/set-ruby-and-sapphire/mightyena-2';
import { TestUtils } from '../../test-utils';

describe('Mightyena RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Mightyena2()], [CardType.DARK, CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Bite (20)
  it('Should use Bite', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Bite'));

    expect(opponent.active.damage).toEqual(20);
  });

  // Ambush (30+) - Flip a coin. If heads, this attack does 30 damage plus 30 more damage.
  it('Should use Ambush - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Ambush'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Ambush - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Ambush'));

    expect(opponent.active.damage).toEqual(30);
  });

});

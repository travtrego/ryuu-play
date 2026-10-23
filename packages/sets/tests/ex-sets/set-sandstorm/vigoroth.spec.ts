import {
  AttackAction,
  CardType,
  PassTurnAction,
  Simulator,
} from '@ptcg/common';

import { Vigoroth } from '../../../src/ex-sets/set-sandstorm/vigoroth';
import { TestUtils } from '../../test-utils';

describe('Vigoroth SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Vigoroth()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Slash (40)
  it('Should use Slash', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  // Focus Energy - During your next turn, base damage of Vigoroth's Slash is attack is 90 instead of 40.
  it('Should use Focus Energy and do 90 damage with Slash during the next turn', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Focus Energy'));
    expect(opponent.active.damage).toEqual(0);

    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(90);
  });

  it('Should use Focus Energy - the bonus ends after the next turn', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Focus Energy'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(opponent.active.damage).toEqual(40);
  });
});

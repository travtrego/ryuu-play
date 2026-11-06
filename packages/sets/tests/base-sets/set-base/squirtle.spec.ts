import {
  AttackAction,
  CardType,
  PassTurnAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Squirtle } from '../../../src/base-sets/set-base/squirtle';
import { TestUtils } from '../../test-utils';

describe('Squirtle BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Squirtle()],
      [CardType.WATER, CardType.COLORLESS],
    );
  });

  // Bubble (10) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Bubble and paralyze on heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Bubble'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Bubble and not paralyze on tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Bubble'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Withdraw - Flip a coin. If heads, prevent all damage done to Squirtle during your opponent's next turn.
  it('Should use Withdraw and prevent damage during the opponent\'s next turn on heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Withdraw'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Withdraw and not prevent damage on tails', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Withdraw'));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(10);
  });

  it('Should stop Withdraw after the opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Withdraw'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(10);
  });
});

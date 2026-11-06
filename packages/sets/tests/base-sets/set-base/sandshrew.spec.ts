import {
  AttackAction,
  CardType,
  PassTurnAction,
  Simulator,
} from '@ptcg/common';

import { Sandshrew } from '../../../src/base-sets/set-base/sandshrew';
import { TestUtils } from '../../test-utils';

describe('Sandshrew BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Sandshrew()],
      [CardType.FIGHTING],
    );
  });

  // Sand-attack (10) - If the Defending Pokémon tries to attack during your opponent's next turn, your opponent
  // flips a coin. If tails, that attack does nothing.
  it('Should use Sand-attack and the opponent\'s attack works on heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Sand-attack'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);

    TestUtils.setFlipResults(sim, [true]);
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Sand-attack and the opponent\'s attack does nothing on tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Sand-attack'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();

    TestUtils.setFlipResults(sim, [false]);
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should stop Sand-attack after the opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Sand-attack'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));

    TestUtils.setFlipResults(sim, [false]);
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(10);
  });
});

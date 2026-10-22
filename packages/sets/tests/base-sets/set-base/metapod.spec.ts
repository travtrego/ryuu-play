import {
  AttackAction,
  CardType,
  PassTurnAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Metapod } from '../../../src/base-sets/set-base/metapod';
import { TestUtils } from '../../test-utils';

describe('Metapod BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Metapod()],
      [CardType.GRASS, CardType.GRASS],
    );
  });

  // Stiffen - Flip a coin. If heads, prevent all damage done to Metapod during your opponent's next turn.
  it('Should use Stiffen and prevent damage during the opponent\'s next turn on heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Stiffen'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Stiffen and not prevent damage on tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Stiffen'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(10);
  });

  it('Should stop preventing damage after the opponent\'s next turn', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Stiffen'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(10);
  });

  // Stun Spore (20) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Stun Spore and paralyze on heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Stun Spore'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Stun Spore and not paralyze on tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Stun Spore'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([]);
  });
});

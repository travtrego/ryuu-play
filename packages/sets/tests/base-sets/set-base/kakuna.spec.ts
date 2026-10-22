import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Kakuna } from '../../../src/base-sets/set-base/kakuna';
import { TestUtils } from '../../test-utils';

describe('Kakuna BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Kakuna()],
      [CardType.GRASS, CardType.GRASS],
    );
  });

  // Stiffen - Flip a coin. If heads, prevent all damage done to Kakuna during your opponent's next turn. (Any other effects of attacks still happen.)
  it('Should use Stiffen - heads, prevents damage during opponent\'s next turn', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Stiffen'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);

    // Opponent attacks with Test attack (10)
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Stiffen - tails, damage is not prevented', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Stiffen'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Stiffen - protection ends after opponent\'s next turn', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Stiffen'));
    sim.dispatch(new AttackAction(2, 'Test attack'));
    expect(player.active.damage).toEqual(0);

    // Our turn: attack with Stiffen again but now tails (no new protection)
    TestUtils.setFlipResults(sim, [false]);
    sim.dispatch(new AttackAction(1, 'Stiffen'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();

    sim.dispatch(new AttackAction(2, 'Test attack'));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  // Poisonpowder (20) - Flip a coin. If heads, the Defending Pokémon is now Poisoned.
  it('Should use Poisonpowder - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Poisonpowder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // 20 damage + 10 Poison damage between turns
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Poisonpowder - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Poisonpowder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.active.damage).toEqual(20);
  });

});

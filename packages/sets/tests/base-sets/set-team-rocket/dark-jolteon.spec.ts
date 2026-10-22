import {
  AttackAction,
  CardType,
  PassTurnAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { DarkJolteon } from '../../../src/base-sets/set-team-rocket/dark-jolteon';
import { TestUtils } from '../../test-utils';

describe('Dark Jolteon TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new DarkJolteon()],
      [CardType.LIGHTNING, CardType.LIGHTNING, CardType.LIGHTNING]
    );
  });

  // Lightning Flash (20) - If the Defending Pokémon tries to attack during your opponent's next turn, your opponent
  // flips a coin. If tails, that attack does nothing.
  it('Should use Lightning Flash - opponent\'s attack does nothing on tails', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Lightning Flash'));
    expect(opponent.active.damage).toEqual(20);

    TestUtils.setFlipResults(sim, [false]);
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(prompts.some(p => p.type === 'Coin flip' && p.playerId === opponent.id)).toBeTrue();
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Lightning Flash - opponent\'s attack works on heads', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Lightning Flash'));
    TestUtils.setFlipResults(sim, [true]);
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  it('Should stop the Lightning Flash effect after the opponent\'s next turn', () => {
    const { player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Lightning Flash'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    const flipsBefore = prompts.filter(p => p.type === 'Coin flip').length;
    TestUtils.setFlipResults(sim, [false]);
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(prompts.filter(p => p.type === 'Coin flip').length).toEqual(flipsBefore);
    expect(player.active.damage).toEqual(10);
  });

  // Thunder Attack (30) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed. If tails, Dark Jolteon
  // does 10 damage to itself.
  it('Should use Thunder Attack - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Thunder Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Thunder Attack - tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Thunder Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([]);
    expect(player.active.damage).toEqual(10);
  });
});

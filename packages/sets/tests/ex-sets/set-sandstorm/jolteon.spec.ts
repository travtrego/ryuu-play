import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Jolteon } from '../../../src/ex-sets/set-sandstorm/jolteon';
import { TestUtils } from '../../test-utils';

describe('Jolteon SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Jolteon()],
      [CardType.LIGHTNING, CardType.LIGHTNING, CardType.COLORLESS]
    );
  });

  // Double Kick (20x) - Flip 2 coins. This attack does 20 damage times the number of heads.
  it('Should use Double Kick - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Double Kick'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Double Kick - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, true]);

    sim.dispatch(new AttackAction(1, 'Double Kick'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Double Kick - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Double Kick'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Lightning Strike (40) - You may discard all L Energy cards attached to Jolteon. If you do, this attack's base
  // damage is 70 instead of 40.
  it('Should use Lightning Strike and discard Lightning Energy', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Lightning Strike'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Confirm',
      playerId: player.id,
      message: GameMessage.WANT_TO_DISCARD_ENERGY
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, true));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(70);
    expect(player.active.energies.cards).toEqual(TestUtils.makeEnergies([CardType.COLORLESS]));
    expect(player.discard.cards).toEqual(TestUtils.makeEnergies([CardType.LIGHTNING, CardType.LIGHTNING]));
  });

  it('Should use Lightning Strike without discarding', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Lightning Strike'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, false));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(player.active.energies.cards.length).toEqual(3);
    expect(player.discard.cards).toEqual([]);
  });
});

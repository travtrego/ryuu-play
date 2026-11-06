import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Chansey } from '../../../src/base-sets/set-base/chansey';
import { TestUtils } from '../../test-utils';

describe('Chansey BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Chansey()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Scrunch - Flip a coin. If heads, prevent all damage done to Chansey during your opponent's next turn. (Any other effects of attacks still happen.)
  it('Should use Scrunch - heads, prevents damage during opponent\'s next turn', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Scrunch'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);

    // Opponent attacks with Test attack (10)
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Scrunch - tails, damage is not prevented', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Scrunch'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Scrunch - protection ends after opponent\'s next turn', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Scrunch'));
    sim.dispatch(new AttackAction(2, 'Test attack'));
    expect(player.active.damage).toEqual(0);

    // Our turn: attack with Scrunch again but now tails (no new protection)
    TestUtils.setFlipResults(sim, [false]);
    sim.dispatch(new AttackAction(1, 'Scrunch'));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();

    sim.dispatch(new AttackAction(2, 'Test attack'));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  // Double-edge (80) - Chansey does 80 damage to itself.
  it('Should use Double-edge', () => {
    const { opponent, player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Double-edge'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(80);
    expect(player.active.damage).toEqual(80);
  });

});

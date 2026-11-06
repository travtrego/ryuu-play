import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Wailord } from '../../../src/ex-sets/set-ruby-and-sapphire/wailord';
import { TestUtils } from '../../test-utils';

describe('Wailord RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Wailord()],
      [CardType.WATER, CardType.WATER, CardType.WATER, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Take Down (50) - Wailord does 20 damage to itself.
  it('Should use Take Down', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Take Down'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(player.active.damage).toEqual(20);
  });

  // Surf (70)
  it('Should use Surf', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Surf'));

    expect(opponent.active.damage).toEqual(70);
    expect(player.active.damage).toEqual(0);
  });

});

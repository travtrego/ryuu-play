import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Goldeen } from '../../../src/ex-sets/set-ruby-and-sapphire/goldeen';
import { TestUtils } from '../../test-utils';

describe('Goldeen RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Goldeen()], [CardType.COLORLESS]);
  });

  // Flail (10x) - Does 10 damage for each damage counter on Goldeen.
  it('Should use Flail - 3 damage counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Flail'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Flail - no damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Flail'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});

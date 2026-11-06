import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Koffing } from '../../../src/ex-sets/set-ruby-and-sapphire/koffing';
import { TestUtils } from '../../test-utils';

describe('Koffing RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Koffing()], [CardType.GRASS, CardType.COLORLESS]);
  });

  // Tackle (10)
  it('Should use Tackle', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Tackle'));

    expect(opponent.active.damage).toEqual(10);
    expect(player.active.damage).toEqual(0);
  });

  // Double-edge (30) - Koffing does 10 damage to itself.
  it('Should use Double-edge', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Double-edge'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.damage).toEqual(10);
  });

});

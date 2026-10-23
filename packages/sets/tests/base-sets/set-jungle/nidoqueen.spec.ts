import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Nidoking } from '../../../src/base-sets/set-base/nidoking';
import { Nidoqueen } from '../../../src/base-sets/set-jungle/nidoqueen';
import { TestUtils } from '../../test-utils';

describe('Nidoqueen JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Nidoqueen()],
      [CardType.GRASS, CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Boyfriends (20+) - Does 20 damage plus 20 more damage for each Nidoking you have in play.
  it('Should use Boyfriends without Nidoking in play', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Boyfriends'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Boyfriends with 2 Nidoking in play', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Nidoking()]);
    player.bench[1] = TestUtils.pokemonSlot([new Nidoking()]);

    sim.dispatch(new AttackAction(1, 'Boyfriends'));

    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Boyfriends and not count the opponent\'s Nidoking', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new Nidoking()]);

    sim.dispatch(new AttackAction(1, 'Boyfriends'));

    expect(opponent.active.damage).toEqual(20);
  });

  // Mega Punch (50)
  it('Should use Mega Punch', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Mega Punch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });
});

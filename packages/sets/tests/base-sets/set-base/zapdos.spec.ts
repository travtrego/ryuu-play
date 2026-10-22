import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Zapdos } from '../../../src/base-sets/set-base/zapdos';
import { TestUtils } from '../../test-utils';

describe('Zapdos BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Zapdos()],
      [CardType.LIGHTNING, CardType.LIGHTNING, CardType.LIGHTNING, CardType.LIGHTNING, CardType.COLORLESS],
    );
  });

  // Thunder (60) - Flip a coin. If tails, Zapdos does 30 damage to itself.
  it('Should use Thunder without self damage on heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Thunder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Thunder and do 30 damage to itself on tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Thunder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
    expect(player.active.damage).toEqual(30);
  });

  // Thunderbolt (100) - Discard all Energy cards attached to Zapdos in order to use this attack.
  it('Should use Thunderbolt and discard all Energy cards', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const energies = player.active.energies.cards.slice();

    sim.dispatch(new AttackAction(1, 'Thunderbolt'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(100);
    expect(player.active.energies.cards).toEqual([]);
    expect(player.discard.cards).toEqual(energies);
  });
});

import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Donphan } from '../../../src/ex-sets/set-ruby-and-sapphire/donphan';
import { TestUtils } from '../../test-utils';

describe('Donphan RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Donphan()],
      [CardType.FIGHTING, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Rend (20+) - If the Defending Pokémon has any damage counters on it, this attack does 20 damage plus 20 more
  // damage.
  it('Should use Rend - Defending Pokemon not damaged', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rend'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Rend - Defending Pokemon damaged', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.damage = 10;

    sim.dispatch(new AttackAction(1, 'Rend'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });

  // Double Spin (60x) - Flip 2 coins. This attack does 60 damage times the number of heads.
  it('Should use Double Spin - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Double Spin'));

    expect(opponent.active.damage).toEqual(120);
  });

  it('Should use Double Spin - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new AttackAction(1, 'Double Spin'));

    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Double Spin - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Double Spin'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});

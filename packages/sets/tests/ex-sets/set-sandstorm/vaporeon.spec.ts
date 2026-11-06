import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Vaporeon } from '../../../src/ex-sets/set-sandstorm/vaporeon';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Vaporeon SS', () => {
  let sim: Simulator;
  let defending: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Vaporeon()],
      [CardType.WATER, CardType.COLORLESS, CardType.COLORLESS]
    );

    defending = new TestPokemon();
    defending.resistance = [{ type: CardType.WATER, value: -30 }];
    TestUtils.setDefending(sim, [defending]);
  });

  // Aurora Beam (30)
  it('Should use Aurora Beam applying Resistance', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Aurora Beam'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Aurora Beam', () => {
    const { opponent } = TestUtils.getAll(sim);
    defending.resistance = [];

    sim.dispatch(new AttackAction(1, 'Aurora Beam'));

    expect(opponent.active.damage).toEqual(30);
  });

  // Aqua Sonic (50) - This attack's damage is not affected by Resistance.
  it('Should use Aqua Sonic ignoring Resistance', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Aqua Sonic'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Aqua Sonic applying Weakness', () => {
    const { opponent } = TestUtils.getAll(sim);
    defending.resistance = [];
    defending.weakness = [{ type: CardType.WATER }];

    sim.dispatch(new AttackAction(1, 'Aqua Sonic'));

    expect(opponent.active.damage).toEqual(100);
  });
});

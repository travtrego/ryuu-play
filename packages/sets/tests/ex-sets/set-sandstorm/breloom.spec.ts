import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Breloom } from '../../../src/ex-sets/set-sandstorm/breloom';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Breloom SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Breloom()],
      [CardType.FIGHTING, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Super Poison Breath - Each Defending Pokémon is now Poisoned.
  it('Should use Super Poison Breath', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Super Poison Breath'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // poison damage between turns only
    expect(opponent.active.damage).toEqual(10);
  });

  // Sky Uppercut (50) - This attack's damage is not affected by Resistance.
  it('Should use Sky Uppercut ignoring Resistance', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = new TestPokemon();
    defending.resistance = [{ type: CardType.GRASS, value: -30 }];
    TestUtils.setDefending(sim, [defending]);

    sim.dispatch(new AttackAction(1, 'Sky Uppercut'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Sky Uppercut applying Weakness', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = new TestPokemon();
    defending.weakness = [{ type: CardType.GRASS }];
    TestUtils.setDefending(sim, [defending]);

    sim.dispatch(new AttackAction(1, 'Sky Uppercut'));

    expect(opponent.active.damage).toEqual(100);
  });
});

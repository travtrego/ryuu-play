import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Kirlia } from '../../../src/ex-sets/set-sandstorm/kirlia';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Kirlia SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Kirlia()],
      [CardType.PSYCHIC, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Psyshock (20) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Psyshock - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Psyshock'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Psyshock - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Psyshock'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Link Blast (60) - If Kirlia and the Defending Pokémon have a different amount of Energy attached to them, this
  // attack's base damage is 30 instead of 60.
  it('Should use Link Blast with the same amount of Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.WATER, CardType.WATER, CardType.FIRE]);

    sim.dispatch(new AttackAction(1, 'Link Blast'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Link Blast with a different amount of Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Link Blast'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });
});

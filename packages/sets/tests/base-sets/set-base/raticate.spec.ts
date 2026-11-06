import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Raticate } from '../../../src/base-sets/set-base/raticate';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class Pokemon60 extends TestPokemon {
  public hp = 60;
}

describe('Raticate BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Raticate()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
    TestUtils.setDefending(sim, [new Pokemon60()]);
  });

  it('Should use Bite', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Bite'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Super Fang - Does damage to the Defending Pokémon equal to half the Defending Pokémon's remaining HP
  // (rounded up to the nearest 10).
  it('Should use Super Fang for half of the remaining HP', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Super Fang'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    // 60 HP remaining -> 30 damage
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Super Fang and round up to the nearest 10', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.damage = 10;

    sim.dispatch(new AttackAction(1, 'Super Fang'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    // 50 HP remaining -> 25 rounded up to 30 damage
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Super Fang for 10 damage when 10 HP remain', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.damage = 50;
    const defending = opponent.active.getPokemonCard();

    sim.dispatch(new AttackAction(1, 'Super Fang'));

    // 10 HP remaining -> 5 rounded up to 10 damage -> Knocked Out
    expect(opponent.discard.cards).toContain(defending as any);
  });
});

import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Fearow } from '../../../src/ex-sets/set-sandstorm/fearow';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Fearow SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Fearow()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Double Wing Attack - Does 20 damage to each Defending Pokémon.
  it('Should use Double Wing Attack', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Double Wing Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.bench[0].damage).toEqual(0);
  });

  // Rend (30+) - If the Defending Pokémon has any damage counters on it, this attack does 30 damage plus 20 more
  // damage.
  it('Should use Rend against an undamaged Defending Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rend'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Rend against a damaged Defending Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.damage = 10;

    sim.dispatch(new AttackAction(1, 'Rend'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });
});

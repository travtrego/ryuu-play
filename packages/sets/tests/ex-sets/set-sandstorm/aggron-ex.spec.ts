import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { AggronEx } from '../../../src/ex-sets/set-sandstorm/aggron-ex';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Aggron ex SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new AggronEx()],
      [CardType.METAL, CardType.METAL, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Rend (30+) - If the Defending Pokémon has any damage counters on it, this attack does 30 damage plus 30 more
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
    expect(opponent.active.damage).toEqual(70);
  });

  // Metal Surge (50) - Does 20 damage to each of your opponent's Benched Pokémon. (Don't apply Weakness and
  // Resistance for Benched Pokémon.)
  it('Should use Metal Surge', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const weakToMetal = new TestPokemon();
    weakToMetal.weakness = [{ type: CardType.METAL }];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[2] = TestUtils.pokemonSlot([weakToMetal]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Metal Surge'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(opponent.bench[0].damage).toEqual(20);
    expect(opponent.bench[1].damage).toEqual(0);
    expect(opponent.bench[2].damage).toEqual(20);
    expect(player.bench[0].damage).toEqual(0);
  });
});

import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Magneton } from '../../../src/base-sets/set-base/magneton';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

// Benched Pokémon that would take double damage if Weakness were applied.
class LightningWeakPokemon extends TestPokemon {
  public weakness = [{ type: CardType.LIGHTNING }];
}

describe('Magneton BS', () => {
  let sim: Simulator;
  let magneton: Magneton;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    magneton = new Magneton();

    TestUtils.setActive(
      sim,
      [magneton],
      [CardType.LIGHTNING, CardType.LIGHTNING, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Thunder Wave (30) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Thunder Wave and paralyze on heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Thunder Wave'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Thunder Wave and not paralyze on tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Thunder Wave'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Selfdestruct (80) - Does 20 damage to each Pokémon on each player's Bench. (Don't apply Weakness and
  // Resistance for Benched Pokémon.) Magneton does 80 damage to itself.
  it('Should use Selfdestruct and damage both Benches and itself', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[2] = TestUtils.pokemonSlot([new LightningWeakPokemon()]);

    sim.dispatch(new AttackAction(1, 'Selfdestruct'));

    expect(opponent.active.damage).toEqual(80);
    expect(opponent.bench[0].damage).toEqual(20);
    expect(opponent.bench[2].damage).toEqual(20);
    expect(player.bench[0].damage).toEqual(20);
    expect(player.bench[1].damage).toEqual(20);
    // 80 damage Knocks Out Magneton (60 HP)
    expect(player.discard.cards).toContain(magneton);
  });
});

import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Magnemite } from '../../../src/base-sets/set-base/magnemite';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

// Benched Pokémon that would take double damage if Weakness were applied.
class LightningWeakPokemon extends TestPokemon {
  public weakness = [{ type: CardType.LIGHTNING }];
}

describe('Magnemite BS', () => {
  let sim: Simulator;
  let magnemite: Magnemite;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    magnemite = new Magnemite();

    TestUtils.setActive(
      sim,
      [magnemite],
      [CardType.LIGHTNING, CardType.COLORLESS],
    );
  });

  // Thunder Wave (10) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Thunder Wave and paralyze on heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Thunder Wave'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Thunder Wave and not paralyze on tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Thunder Wave'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Selfdestruct (40) - Does 10 damage to each Pokémon on each player's Bench. (Don't apply Weakness and
  // Resistance for Benched Pokémon.) Magnemite does 40 damage to itself.
  it('Should use Selfdestruct and damage both Benches and itself', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[2] = TestUtils.pokemonSlot([new LightningWeakPokemon()]);

    sim.dispatch(new AttackAction(1, 'Selfdestruct'));

    expect(opponent.active.damage).toEqual(40);
    expect(opponent.bench[0].damage).toEqual(10);
    expect(opponent.bench[2].damage).toEqual(10);
    expect(player.bench[0].damage).toEqual(10);
    expect(player.bench[1].damage).toEqual(10);
    // 40 damage Knocks Out Magnemite (40 HP)
    expect(player.discard.cards).toContain(magnemite);
  });
});

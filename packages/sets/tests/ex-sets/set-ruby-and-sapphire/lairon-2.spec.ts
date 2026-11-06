import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Lairon2 } from '../../../src/ex-sets/set-ruby-and-sapphire/lairon-2';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Lairon RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Lairon2()],
      [CardType.METAL, CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Magnitude (20) - Does 10 damage to each Benched Pokémon (both yours and your opponent's). (Don't apply Weakness
  // and Resistance for Benched Pokémon.)
  it('Should use Magnitude', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const weakBenched = new TestPokemon();
    weakBenched.weakness = [{ type: CardType.METAL }];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([weakBenched]);

    sim.dispatch(new AttackAction(1, 'Magnitude'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(player.active.damage).toEqual(0);
    expect(player.bench[0].damage).toEqual(10);
    expect(opponent.bench[0].damage).toEqual(10);
    expect(opponent.bench[1].damage).toEqual(10);
  });

  // One-Two Strike (30+) - Flip 2 coins. This attack does 30 damage plus 20 more damage for each heads.
  it('Should use One-Two Strike - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'One-Two Strike'));

    expect(opponent.active.damage).toEqual(70);
  });

  it('Should use One-Two Strike - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new AttackAction(1, 'One-Two Strike'));

    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use One-Two Strike - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'One-Two Strike'));

    expect(opponent.active.damage).toEqual(30);
  });

});

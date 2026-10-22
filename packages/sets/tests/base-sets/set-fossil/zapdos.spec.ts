import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Zapdos } from '../../../src/base-sets/set-fossil/zapdos';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Zapdos FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Zapdos()],
      [CardType.LIGHTNING, CardType.LIGHTNING, CardType.LIGHTNING, CardType.LIGHTNING]
    );
  });

  // Thunderstorm (40) - For each of your opponent's Benched Pokémon, flip a coin. If heads, this attack does 20
  // damage to that Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.) Then, Zapdos does 10 damage
  // times the number of tails to itself.
  it('Should use Thunderstorm - mixed flips', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.LIGHTNING }];
    opponent.bench[0] = TestUtils.pokemonSlot([weak]);
    opponent.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[2] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setFlipResults(sim, [true, false, true]);

    sim.dispatch(new AttackAction(1, 'Thunderstorm'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(opponent.bench[0].damage).toEqual(20);
    expect(opponent.bench[1].damage).toEqual(0);
    expect(opponent.bench[2].damage).toEqual(20);
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Thunderstorm - all tails', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Thunderstorm'));

    expect(opponent.active.damage).toEqual(40);
    expect(opponent.bench[0].damage).toEqual(0);
    expect(opponent.bench[1].damage).toEqual(0);
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Thunderstorm - all heads', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Thunderstorm'));

    expect(opponent.active.damage).toEqual(40);
    expect(opponent.bench[0].damage).toEqual(20);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Thunderstorm - no Benched Pokémon', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Thunderstorm'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(player.active.damage).toEqual(0);
  });
});

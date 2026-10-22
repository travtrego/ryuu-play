import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Articuno } from '../../../src/base-sets/set-fossil/articuno';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Articuno FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Articuno()],
      [CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER]
    );
  });

  // Freeze Dry (30) - Flip a coin. If heads, the Defending Pokémon is now Paralyzed.
  it('Should use Freeze Dry - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Freeze Dry'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
  });

  it('Should use Freeze Dry - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Freeze Dry'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Blizzard (50) - Flip a coin. If heads, this attack does 10 damage to each of your opponent's Benched Pokémon.
  // If tails, this attack does 10 damage to each of your own Benched Pokémon. (Don't apply Weakness and Resistance
  // for Benched Pokémon.)
  it('Should use Blizzard - heads damages opponent\'s Bench', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.WATER }];
    opponent.bench[0] = TestUtils.pokemonSlot([weak]);
    opponent.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Blizzard'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(opponent.bench[0].damage).toEqual(10);
    expect(opponent.bench[1].damage).toEqual(10);
    expect(player.bench[0].damage).toEqual(0);
  });

  it('Should use Blizzard - tails damages own Bench', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Blizzard'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(opponent.bench[0].damage).toEqual(0);
    expect(player.bench[0].damage).toEqual(10);
    expect(player.bench[1].damage).toEqual(10);
    expect(player.active.damage).toEqual(0);
  });
});

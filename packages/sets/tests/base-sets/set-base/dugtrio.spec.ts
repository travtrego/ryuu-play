import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Dugtrio } from '../../../src/base-sets/set-base/dugtrio';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dugtrio BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Dugtrio()],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING],
    );
  });

  // Slash (40)
  it('Should use Slash', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  // Earthquake (70) - Does 10 damage to each of your own Benched Pokémon. (Don't apply Weakness and Resistance
  // for Benched Pokémon.)
  it('Should use Earthquake - damages own Benched Pokémon only', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[2] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Earthquake'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(70);
    expect(opponent.bench[0].damage).toEqual(0);
    expect(player.active.damage).toEqual(0);
    expect(player.bench[0].damage).toEqual(10);
    expect(player.bench[1].damage).toEqual(0);
    expect(player.bench[2].damage).toEqual(10);
  });

  it('Should use Earthquake - no Weakness or Resistance for Benched Pokémon', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.FIGHTING }];
    const resistant = new TestPokemon();
    resistant.resistance = [{ type: CardType.FIGHTING, value: -30 }];
    player.bench[0] = TestUtils.pokemonSlot([weak]);
    player.bench[1] = TestUtils.pokemonSlot([resistant]);

    sim.dispatch(new AttackAction(1, 'Earthquake'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.bench[0].damage).toEqual(10);
    expect(player.bench[1].damage).toEqual(10);
  });

});

import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { ChanseyEx } from '../../../src/ex-sets/set-ruby-and-sapphire/chansey-ex';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Chansey ex RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new ChanseyEx()], [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Healing Egg - Remove 2 damage counters (1 if there is only 1) from each of your Pokémon. Remove no damage
  // counters from Chansey ex.
  it('Should use Healing Egg', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 50;
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 50);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 10);
    player.bench[2] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Healing Egg'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(player.active.damage).toEqual(50);
    expect(player.bench[0].damage).toEqual(30);
    expect(player.bench[1].damage).toEqual(0);
    expect(player.bench[2].damage).toEqual(0);
  });

  it('Should use Healing Egg - does not heal the opponent', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.damage = 50;
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 50);

    sim.dispatch(new AttackAction(1, 'Healing Egg'));

    expect(opponent.active.damage).toEqual(50);
    expect(opponent.bench[0].damage).toEqual(50);
  });

  // Double-edge (80) - Chansey ex does 60 damage to itself.
  it('Should use Double-edge', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Double-edge'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(80);
    expect(player.active.damage).toEqual(60);
  });

});

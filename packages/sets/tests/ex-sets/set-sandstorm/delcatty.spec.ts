import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Delcatty } from '../../../src/ex-sets/set-sandstorm/delcatty';
import { MultiEnergy } from '../../../src/ex-sets/set-sandstorm/multi-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Delcatty SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Delcatty()],
      [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Scratch (30)
  it('Should use Scratch', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Scratch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  // Ultra Energy Source (10x) - Does 10 damage times the number of basic Energy cards attached to all of the Active
  // Pokémon (both yours and your opponent's).
  it('Should use Ultra Energy Source counting both Active Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.WATER, CardType.FIRE]);
    // Benched energies are not counted
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [CardType.WATER]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Ultra Energy Source'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Ultra Energy Source not counting Special Energy cards', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards.push(new MultiEnergy());
    opponent.active.energies.cards = [new MultiEnergy()];

    sim.dispatch(new AttackAction(1, 'Ultra Energy Source'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });
});

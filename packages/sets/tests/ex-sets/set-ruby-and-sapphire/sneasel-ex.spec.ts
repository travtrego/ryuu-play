import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { SneaselEx } from '../../../src/ex-sets/set-ruby-and-sapphire/sneasel-ex';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Sneasel ex RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new SneaselEx()], [CardType.DARK, CardType.DARK, CardType.COLORLESS]);
  });

  // Double Scratch (10x) - Flip 2 coins. This attack does 10 damage times the number of heads.
  it('Should use Double Scratch - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Double Scratch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Double Scratch - 1 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, true]);

    sim.dispatch(new AttackAction(1, 'Double Scratch'));

    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Double Scratch - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Double Scratch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Beat Up (20x) - Flip a coin for each of your Pokémon in play (including Sneasel ex). This attack does 20 damage
  // times the number of heads.
  it('Should use Beat Up - only Sneasel ex in play, heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Beat Up'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Beat Up - 3 Pokemon in play, all heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setFlipResults(sim, [true, true, true]);

    sim.dispatch(new AttackAction(1, 'Beat Up'));

    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Beat Up - 3 Pokemon in play, 1 heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setFlipResults(sim, [false, true, false]);

    sim.dispatch(new AttackAction(1, 'Beat Up'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Beat Up - all tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Beat Up'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});

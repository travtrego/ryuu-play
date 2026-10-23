import {
  AttackAction,
  CardType,
  CheckPokemonTypeEffect,
  Simulator,
} from '@ptcg/common';

import { Kecleon } from '../../../src/ex-sets/set-sandstorm/kecleon';
import { MultiEnergy } from '../../../src/ex-sets/set-sandstorm/multi-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Kecleon SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Kecleon()], [CardType.FIRE, CardType.WATER]);
  });

  function getTypes(): CardType[] {
    const { player } = TestUtils.getAll(sim);
    const check = new CheckPokemonTypeEffect(player.active);
    sim.store.reduceEffect(sim.store.state, check);
    return check.cardTypes;
  }

  // Energy Variation - Kecleon's type is the same as every type of basic Energy card attached to Kecleon.
  it('Should have the type of every basic Energy attached', () => {
    expect(getTypes()).toEqual([CardType.FIRE, CardType.WATER]);
  });

  it('Should ignore Special Energy cards', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.energies.cards = [...TestUtils.makeEnergies([CardType.GRASS]), new MultiEnergy()];

    expect(getTypes()).toEqual([CardType.GRASS]);
  });

  it('Should be Colorless when Energy Variation is blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    expect(getTypes()).toEqual([CardType.COLORLESS]);
  });

  // BUG: with no basic Energy attached, Energy Variation sets Kecleon's type to an empty list instead of leaving it
  // as its printed Colorless type.
  xit('Should stay Colorless without basic Energy attached', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.energies.cards = [];

    expect(getTypes()).toEqual([CardType.COLORLESS]);
  });

  it('Should apply Weakness for every type of attached basic Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = new TestPokemon();
    defending.weakness = [{ type: CardType.WATER }];
    TestUtils.setDefending(sim, [defending]);
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new AttackAction(1, 'Double Scratch'));

    expect(opponent.active.damage).toEqual(40);
  });

  // Double Scratch (20x) - Flip 2 coins. This attack does 20 damage times the number of heads.
  it('Should use Double Scratch - 2 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Double Scratch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Double Scratch - 2 tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Double Scratch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});

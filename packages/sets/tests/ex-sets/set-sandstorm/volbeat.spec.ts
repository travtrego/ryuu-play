import {
  AttackAction,
  CardType,
  CheckRetreatCostEffect,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Illumise } from '../../../src/ex-sets/set-sandstorm/illumise';
import { Volbeat } from '../../../src/ex-sets/set-sandstorm/volbeat';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Volbeat SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Volbeat()], [CardType.GRASS, CardType.COLORLESS]);
  });

  function getRetreatCost(): CardType[] {
    const { player } = TestUtils.getAll(sim);
    const check = new CheckRetreatCostEffect(player);
    sim.store.reduceEffect(sim.store.state, check);
    return check.cost;
  }

  // Uplifting Glow - As long as Illumise is in play, Volbeat's Retreat Cost is 0.
  it('Should have no Retreat Cost when Illumise is in play', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Illumise()]);

    expect(getRetreatCost()).toEqual([]);
  });

  it('Should have its normal Retreat Cost without Illumise', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    expect(getRetreatCost()).toEqual([CardType.COLORLESS]);
  });

  it('Should have its normal Retreat Cost when Uplifting Glow is blocked', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Illumise()]);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    expect(getRetreatCost()).toEqual([CardType.COLORLESS]);
  });

  // Toxic Vibration - Flip a coin. If heads, the Defending Pokémon is now Poisoned. If tails, the Defending Pokémon
  // is now Asleep.
  it('Should use Toxic Vibration - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Toxic Vibration'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Toxic Vibration - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    // tails for the attack, tails for the Asleep check between turns
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Toxic Vibration'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
    expect(opponent.active.damage).toEqual(0);
  });

  // Pester (20+) - If the Defending Pokémon is affected by a Special Condition, this attack does 20 damage plus 20
  // more damage.
  it('Should use Pester against a healthy Defending Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Pester'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Pester against an affected Defending Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.active.addSpecialCondition(SpecialCondition.CONFUSED);

    sim.dispatch(new AttackAction(1, 'Pester'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });
});

import {
  AttachEnergyEffect,
  CardType,
  CheckProvidedEnergyEffect,
  CheckTableStateEffect,
  Simulator,
  StateUtils,
} from '@ptcg/common';

import { TeamRocketsEnergy } from '../../../src/standard/set-destined-rivals/team-rockets-energy';
import { TeamRocketsTarountula } from '../../../src/standard/set-destined-rivals/team-rockets-tarountula';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Team Rocket\'s Energy DRI', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  function providedOn(): CheckProvidedEnergyEffect {
    const { player } = TestUtils.getAll(sim);
    const check = new CheckProvidedEnergyEffect(player);
    sim.store.reduceEffect(sim.store.state, check);
    return check;
  }

  it('can be attached to a Team Rocket\'s Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    const energy = new TeamRocketsEnergy();
    player.active.pokemons.cards = [new TeamRocketsTarountula()];
    expect(() => energy.reduceEffect(sim.store, sim.store.state,
      new AttachEnergyEffect(player, energy, player.active))).not.toThrow();
  });

  it('can\'t be attached to any other Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    const energy = new TeamRocketsEnergy();
    player.active.pokemons.cards = [new TestPokemon()];
    expect(() => energy.reduceEffect(sim.store, sim.store.state,
      new AttachEnergyEffect(player, energy, player.active))).toThrow();
  });

  it('provides 2 Energy in any combination of P and D', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new TeamRocketsTarountula()];
    player.active.energies.cards = [new TeamRocketsEnergy()];
    const energy = providedOn().energyMap;
    expect(StateUtils.checkEnoughEnergy(energy, [CardType.PSYCHIC, CardType.PSYCHIC])).toBeTrue();
    expect(StateUtils.checkEnoughEnergy(energy, [CardType.DARK, CardType.DARK])).toBeTrue();
    expect(StateUtils.checkEnoughEnergy(energy, [CardType.PSYCHIC, CardType.DARK])).toBeTrue();
    expect(StateUtils.checkEnoughEnergy(energy, [CardType.COLORLESS, CardType.COLORLESS])).toBeTrue();
    expect(StateUtils.checkEnoughEnergy(energy, [CardType.GRASS])).toBeFalse();
    expect(StateUtils.checkEnoughEnergy(energy,
      [CardType.PSYCHIC, CardType.PSYCHIC, CardType.COLORLESS])).toBeFalse();
  });

  it('is discarded when it is on a Pokémon that is not Team Rocket\'s', () => {
    const { player } = TestUtils.getAll(sim);
    const energy = new TeamRocketsEnergy();
    player.active.pokemons.cards = [new TestPokemon()];
    player.active.energies.cards = [energy];
    sim.store.reduceEffect(sim.store.state, new CheckTableStateEffect());
    expect(player.active.energies.cards).not.toContain(energy);
    expect(player.discard.cards).toContain(energy);
  });

  it('stays on a Team Rocket\'s Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    const energy = new TeamRocketsEnergy();
    player.active.pokemons.cards = [new TeamRocketsTarountula()];
    player.active.energies.cards = [energy];
    sim.store.reduceEffect(sim.store.state, new CheckTableStateEffect());
    expect(player.active.energies.cards).toContain(energy);
  });
});

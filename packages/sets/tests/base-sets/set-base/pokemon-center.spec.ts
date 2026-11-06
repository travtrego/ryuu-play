import {
  PlayCardAction,
  Simulator,
} from '@ptcg/common';

import { PokemonCenter } from '../../../src/base-sets/set-base/pokemon-center';
import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { WaterEnergy } from '../../../src/base-sets/set-base/water-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Pokemon Center BS', () => {
  let sim: Simulator;
  let trainerCard: PokemonCenter;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new PokemonCenter();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should heal all damaged Pokémon and discard their Energy cards', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    const water = new WaterEnergy();
    const fire2 = new FireEnergy();
    player.active.damage = 30;
    player.active.energies.cards = [fire];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 0);
    player.bench[0].energies.cards = [water];
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 50);
    player.bench[1].energies.cards = [fire2];
    opponent.active.damage = 40;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
    expect(player.active.energies.cards).toEqual([]);
    expect(player.bench[1].damage).toEqual(0);
    expect(player.bench[1].energies.cards).toEqual([]);
    // undamaged Pokémon keeps its energy
    expect(player.bench[0].energies.cards).toEqual([water]);
    // opponent is not affected
    expect(opponent.active.damage).toEqual(40);
    expect(player.discard.cards).toEqual(jasmine.arrayWithExactContents([fire, fire2, trainerCard]));
  });

  it('Should heal damaged Pokémon without Energy attached', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 60;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(player.active.damage).toEqual(0);
    expect(player.discard.cards).toEqual([trainerCard]);
  });
});

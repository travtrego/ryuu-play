import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Omastar } from '../../../src/ex-sets/set-sandstorm/omastar';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Omastar SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Omastar()], [CardType.WATER, CardType.WATER]);
  });

  // Pull Down - If your opponent has any Evolved Pokémon in play, remove the highest Stage Evolution card from each
  // of them and put those cards back into his or her hand.
  it('Should use Pull Down on each Evolved Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    const activeBasic = new TestPokemon();
    const activeStage1 = new TestPokemon();
    const activeStage2 = new TestPokemon();
    const benchBasic = new TestPokemon();
    const benchStage1 = new TestPokemon();
    const notEvolved = new TestPokemon();
    TestUtils.setDefending(sim, [activeBasic, activeStage1, activeStage2], [CardType.WATER]);
    opponent.active.damage = 20;
    opponent.bench[0] = TestUtils.pokemonSlot([benchBasic, benchStage1]);
    opponent.bench[1] = TestUtils.pokemonSlot([notEvolved]);
    opponent.hand.cards = [];

    sim.dispatch(new AttackAction(1, 'Pull Down'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.pokemons.cards).toEqual([activeBasic, activeStage1]);
    expect(opponent.active.energies.cards.length).toEqual(1);
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.bench[0].pokemons.cards).toEqual([benchBasic]);
    expect(opponent.bench[1].pokemons.cards).toEqual([notEvolved]);
    // 2 evolution cards + 1 card drawn at the start of the turn
    expect(opponent.hand.cards.length).toEqual(3);
    expect(opponent.hand.cards).toContain(activeStage2);
    expect(opponent.hand.cards).toContain(benchStage1);
  });

  it('Should use Pull Down when the opponent has no Evolved Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.hand.cards = [];

    sim.dispatch(new AttackAction(1, 'Pull Down'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.pokemons.cards.length).toEqual(1);
    expect(opponent.hand.cards.length).toEqual(1);
    expect(opponent.active.damage).toEqual(0);
  });

  // Hydrocannon (30+) - Does 30 damage plus 20 more damage for each W Energy attached to Omastar but not used to pay
  // for this attack's Energy cost. You can't add more than 40 damage in this way.
  it('Should use Hydrocannon without extra Water Energy', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Hydrocannon'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Hydrocannon with 1 extra Water Energy', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Hydrocannon'));

    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Hydrocannon adding no more than 40 damage', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies(
      [CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Hydrocannon'));

    expect(opponent.active.damage).toEqual(70);
  });

  it('Should use Hydrocannon not counting non-Water extra Energy', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([CardType.FIRE, CardType.FIRE, CardType.FIRE]);

    sim.dispatch(new AttackAction(1, 'Hydrocannon'));

    expect(opponent.active.damage).toEqual(30);
  });
});

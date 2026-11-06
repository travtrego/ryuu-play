import {
  AttackAction,
  CardType,
  EnergyType,
  GameMessage,
  Simulator,
} from '@ptcg/common';

import { MultiEnergy } from '../../../src/ex-sets/set-sandstorm/multi-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Multi Energy SS', () => {
  let sim: Simulator;
  let pokemonCard: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    pokemonCard = new TestPokemon();

    TestUtils.setActive(sim, [pokemonCard]);
  });

  it('Should be a Special Energy card', () => {
    expect(new MultiEnergy().energyType).toEqual(EnergyType.SPECIAL);
  });

  // While in play, Multi Energy provides every type of Energy but provides only 1 Energy at a time.
  it('Should provide any energy type', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.energies.cards = [new MultiEnergy()];
    pokemonCard.attacks[0].cost = [CardType.FIRE];

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should provide only one energy', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.energies.cards = [new MultiEnergy()];
    pokemonCard.attacks[0].cost = [CardType.FIRE, CardType.FIRE];

    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Test attack'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(message).toEqual(GameMessage.NOT_ENOUGH_ENERGY);
  });

  it('Should work together with basic Energy', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.energies.cards = [...TestUtils.makeEnergies([CardType.WATER]), new MultiEnergy()];
    pokemonCard.attacks[0].cost = [CardType.WATER, CardType.FIRE];

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
  });

  // Multi energy provides C Energy when attached to a Pokémon that already has Special Energy cards attached to it.
  it('Should provide C when another Special Energy is attached - typed cost', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.energies.cards = [new MultiEnergy(), new MultiEnergy()];
    pokemonCard.attacks[0].cost = [CardType.FIRE];

    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Test attack'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(message).toEqual(GameMessage.NOT_ENOUGH_ENERGY);
  });

  it('Should provide C when another Special Energy is attached - colorless cost', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.energies.cards = [new MultiEnergy(), new MultiEnergy()];
    pokemonCard.attacks[0].cost = [CardType.COLORLESS, CardType.COLORLESS];

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });
});

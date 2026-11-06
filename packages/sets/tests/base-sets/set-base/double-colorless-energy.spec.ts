import {
  AttackAction,
  CardType,
  EnergyType,
  GameMessage,
  Simulator,
} from '@ptcg/common';

import { DoubleColorlessEnergy } from '../../../src/base-sets/set-base/double-colorless-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Double Colorless Energy BS', () => {
  let sim: Simulator;
  let pokemonCard: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    pokemonCard = new TestPokemon();
    TestUtils.setActive(sim, [pokemonCard]);
    sim.store.state.players[0].active.energies.cards = [new DoubleColorlessEnergy()];
  });

  it('Should provide 2 Colorless Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    pokemonCard.attacks[0].cost = [CardType.COLORLESS, CardType.COLORLESS];

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should not provide 3 Colorless Energy', () => {
    const { player } = TestUtils.getAll(sim);
    pokemonCard.attacks[0].cost = [CardType.COLORLESS, CardType.COLORLESS, CardType.COLORLESS];

    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Test attack'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(message).toEqual(GameMessage.NOT_ENOUGH_ENERGY);
  });

  it('Should not provide typed Energy', () => {
    const { player } = TestUtils.getAll(sim);
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

  it('Should not count as a basic Energy card', () => {
    expect(new DoubleColorlessEnergy().energyType).toEqual(EnergyType.SPECIAL);
  });
});

import {
  AttackAction,
  CardType,
  GameMessage,
  Simulator,
  Stage,
} from '@ptcg/common';

import { PrismEnergy } from '../../../src/standard/set-black-and-white/prism-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Prism Energy NXD', () => {
  let sim: Simulator;
  let energyCard: PrismEnergy;
  let pokemonCard: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;
    energyCard = new PrismEnergy();
    pokemonCard = new TestPokemon();
    TestUtils.setActive(sim, [pokemonCard]);
    sim.store.state.players[0].active.energies.cards = [energyCard];
  });

  function attack(): string {
    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Test attack'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // This card provides C Energy. If the Pokemon this card is attached to is a Basic Pokemon, this card provides
  // every type of Energy but provides only 1 Energy at a time.
  it('Should provide Colorless Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    pokemonCard.attacks[0].cost = [CardType.COLORLESS];

    expect(attack()).toEqual('');
    expect(opponent.active.damage).toEqual(10);
  });

  [CardType.GRASS, CardType.FIRE, CardType.WATER, CardType.LIGHTNING, CardType.PSYCHIC, CardType.FIGHTING]
    .forEach(cardType => {
      it(`Should provide ${CardType[cardType]} Energy on a Basic Pokemon`, () => {
        const { opponent } = TestUtils.getAll(sim);
        pokemonCard.attacks[0].cost = [cardType];

        expect(attack()).toEqual('');
        expect(opponent.active.damage).toEqual(10);
      });
    });

  it('Should only provide Colorless Energy on an evolved Pokemon', () => {
    const basic = new TestPokemon();
    const evolved = new TestPokemon();
    evolved.stage = Stage.STAGE_1;
    evolved.attacks[0].cost = [CardType.FIRE];
    TestUtils.setActive(sim, [basic, evolved]);
    sim.store.state.players[0].active.energies.cards = [energyCard];

    expect(attack()).toEqual(GameMessage.NOT_ENOUGH_ENERGY);
  });

  it('Should only provide 1 Energy at a time', () => {
    pokemonCard.attacks[0].cost = [CardType.FIRE, CardType.WATER];

    expect(attack()).toEqual(GameMessage.NOT_ENOUGH_ENERGY);
  });
});

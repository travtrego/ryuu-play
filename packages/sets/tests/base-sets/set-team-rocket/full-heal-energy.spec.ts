import {
  AttackAction,
  CardType,
  EnergyType,
  GameMessage,
  PlayCardAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { FullHealEnergy } from '../../../src/base-sets/set-team-rocket/full-heal-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Full Heal Energy TR', () => {
  let sim: Simulator;
  let energyCard: FullHealEnergy;
  let pokemonCard: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;
    energyCard = new FullHealEnergy();
    pokemonCard = new TestPokemon();
    TestUtils.setActive(sim, [pokemonCard]);
    sim.store.state.players[0].hand.cards = [energyCard];
  });

  // If you play this card from hand, the Pokémon you attach it to is no longer Asleep, Confused, Paralyzed, or
  // Poisoned. Full Heal Energy provides C energy. (Doesn't count as a basic Energy card.)
  [
    SpecialCondition.ASLEEP,
    SpecialCondition.CONFUSED,
    SpecialCondition.PARALYZED,
    SpecialCondition.POISONED,
  ].forEach(condition => {
    it(`Should remove ${SpecialCondition[condition]} when attached from hand`, () => {
      const { player } = TestUtils.getAll(sim);
      player.active.addSpecialCondition(condition);

      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

      expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
      expect(player.active.energies.cards).toEqual([energyCard]);
      expect(player.active.specialConditions).toEqual([]);
    });
  });

  it('Should remove Poison and Paralysis together', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.addSpecialCondition(SpecialCondition.POISONED);
    player.active.addSpecialCondition(SpecialCondition.PARALYZED);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(player.active.specialConditions).toEqual([]);
  });

  it('Should cure a Benched Pokémon it is attached to', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.addSpecialCondition(SpecialCondition.POISONED);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[0].addSpecialCondition(SpecialCondition.POISONED);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));

    expect(player.bench[0].specialConditions).toEqual([]);
    expect(player.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  it('Should provide Colorless Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.getAll(sim).player.active.energies.cards = [energyCard];
    pokemonCard.attacks[0].cost = [CardType.COLORLESS];

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should not provide typed Energy', () => {
    TestUtils.getAll(sim).player.active.energies.cards = [energyCard];
    pokemonCard.attacks[0].cost = [CardType.FIRE];

    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Test attack'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.NOT_ENOUGH_ENERGY);
  });

  it('Should not count as a basic Energy card', () => {
    expect(new FullHealEnergy().energyType).toEqual(EnergyType.SPECIAL);
  });
});

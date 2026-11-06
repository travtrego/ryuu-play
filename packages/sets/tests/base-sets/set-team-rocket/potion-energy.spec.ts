import {
  AttackAction,
  CardType,
  EnergyType,
  GameMessage,
  PlayCardAction,
  Simulator,
} from '@ptcg/common';

import { PotionEnergy } from '../../../src/base-sets/set-team-rocket/potion-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Potion Energy TR', () => {
  let sim: Simulator;
  let energyCard: PotionEnergy;
  let pokemonCard: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;
    energyCard = new PotionEnergy();
    pokemonCard = new TestPokemon();
    TestUtils.setActive(sim, [pokemonCard]);
    sim.store.state.players[0].hand.cards = [energyCard];
  });

  // If you play this card from your hand, remove 1 damage counter from the Pokemon you attach it to, if it has any.
  // Potion Energy provides C energy. (Doesn't count as a basic Energy card.)
  it('Should remove 1 damage counter when attached from hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.energies.cards).toEqual([energyCard]);
    expect(player.active.damage).toEqual(20);
  });

  it('Should remove a damage counter from a Benched Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 10);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));

    expect(player.bench[0].damage).toEqual(0);
    expect(player.active.damage).toEqual(30);
  });

  it('Should do nothing to a Pokémon without damage counters', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(player.active.energies.cards).toEqual([energyCard]);
    expect(player.active.damage).toEqual(0);
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
    pokemonCard.attacks[0].cost = [CardType.WATER];

    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Test attack'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.NOT_ENOUGH_ENERGY);
  });

  it('Should not count as a basic Energy card', () => {
    expect(new PotionEnergy().energyType).toEqual(EnergyType.SPECIAL);
  });
});

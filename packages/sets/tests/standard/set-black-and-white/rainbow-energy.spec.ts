import {
  AttackAction,
  CardType,
  GameMessage,
  PlayCardAction,
  Simulator,
} from '@ptcg/common';

import { RainbowEnergy } from '../../../src/standard/set-black-and-white/rainbow-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Rainbow Energy SUM', () => {
  let sim: Simulator;
  let energyCard: RainbowEnergy;
  let pokemonCard: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;
    energyCard = new RainbowEnergy();
    pokemonCard = new TestPokemon();
    TestUtils.setActive(sim, [pokemonCard]);
  });

  function attachInPlay() {
    sim.store.state.players[0].active.energies.cards = [energyCard];
  }

  function attack(): string {
    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Test attack'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // This card provides C Energy. While in play, this card provides every type of Energy but provides only
  // 1 Energy at a time. When you attach this card from your hand to 1 of your Pokemon, put 1 damage counter
  // on that Pokemon.
  it('Should put 1 damage counter on the Pokemon it is attached to from hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [energyCard];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.energies.cards).toEqual([energyCard]);
    expect(player.active.damage).toEqual(10);
  });

  it('Should put 1 damage counter on a Benched Pokemon it is attached to from hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.hand.cards = [energyCard];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));

    expect(player.bench[0].energies.cards).toEqual([energyCard]);
    expect(player.bench[0].damage).toEqual(10);
    expect(player.active.damage).toEqual(0);
  });

  [CardType.GRASS, CardType.FIRE, CardType.WATER, CardType.LIGHTNING, CardType.PSYCHIC, CardType.FIGHTING]
    .forEach(cardType => {
      it(`Should provide ${CardType[cardType]} Energy while in play`, () => {
        const { opponent } = TestUtils.getAll(sim);
        attachInPlay();
        pokemonCard.attacks[0].cost = [cardType];

        expect(attack()).toEqual('');
        expect(opponent.active.damage).toEqual(10);
      });
    });

  it('Should provide Colorless Energy while in play', () => {
    const { opponent } = TestUtils.getAll(sim);
    attachInPlay();
    pokemonCard.attacks[0].cost = [CardType.COLORLESS];

    expect(attack()).toEqual('');
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should only provide 1 Energy at a time', () => {
    attachInPlay();
    pokemonCard.attacks[0].cost = [CardType.FIRE, CardType.WATER];

    expect(attack()).toEqual(GameMessage.NOT_ENOUGH_ENERGY);
  });
});

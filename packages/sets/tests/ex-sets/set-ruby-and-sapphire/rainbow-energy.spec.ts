import {
  AttackAction,
  CardType,
  EnergyType,
  GameMessage,
  PlayCardAction,
  PokemonCard,
  Simulator,
} from '@ptcg/common';

import { RainbowEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/rainbow-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Rainbow Energy RS', () => {
  let sim: Simulator;
  let attacker: PokemonCard;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    attacker = new TestPokemon();
    attacker.attacks = [
      { name: 'Fire attack', cost: [CardType.FIRE], damage: '20', text: '' },
      { name: 'Double attack', cost: [CardType.FIRE, CardType.WATER], damage: '30', text: '' },
    ];
    TestUtils.setActive(sim, [attacker]);
    sim.store.state.turn = 3;
  });

  // Attach Rainbow Energy to 1 of your Pokémon. While in play, Rainbow Energy provides every type of Energy but
  // provides only 1 Energy at a time. (Doesn't count as a basic Energy card when not in play.) When you attach this
  // card from your hand to 1 of your Pokémon, put 1 damage counter on that Pokémon.
  it('Should be a Special Energy', () => {
    expect(new RainbowEnergy().energyType).toEqual(EnergyType.SPECIAL);
  });

  it('Should put 1 damage counter when attached from hand', () => {
    const { player } = TestUtils.getAll(sim);
    const energy = new RainbowEnergy();
    player.hand.cards = [energy];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.active)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.energies.cards).toEqual([energy]);
    expect(player.active.damage).toEqual(10);
  });

  it('Should put 1 damage counter on a Benched Pokemon', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.hand.cards = [new RainbowEnergy()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim, player.bench[0])));

    expect(player.bench[0].damage).toEqual(10);
    expect(player.active.damage).toEqual(0);
  });

  it('Should provide any type of Energy', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = [new RainbowEnergy()];

    sim.dispatch(new AttackAction(1, 'Fire attack'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should provide only 1 Energy at a time', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.energies.cards = [new RainbowEnergy()];

    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Double attack'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.NOT_ENOUGH_ENERGY);
  });

});

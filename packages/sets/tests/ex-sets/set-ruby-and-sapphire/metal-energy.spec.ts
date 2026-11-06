import {
  AttackAction,
  CardType,
  PassTurnAction,
  PokemonCard,
  Simulator,
} from '@ptcg/common';

import { MetalEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/metal-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Metal Energy RS', () => {
  let sim: Simulator;
  let defender: PokemonCard;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    defender = new TestPokemon();
    TestUtils.setActive(sim, [defender]);
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = [new MetalEnergy()];
    (opponent.active.getPokemonCard() as PokemonCard).attacks = [
      { name: 'Big attack', cost: [], damage: '40', text: '' }
    ];
  });

  // Damage done by attacks to the Pokémon that Metal Energy is attached to is reduced by 10 (after applying Weakness
  // and Resistance). Ignore this effect if the Pokémon that Metal Energy is attached to isn't M. Metal Energy
  // provides M Energy. (Doesn't count as a basic Energy card.)
  it('Should provide Metal Energy', () => {
    expect(new MetalEnergy().provides).toEqual([CardType.METAL]);
  });

  it('Should reduce damage to a Metal Pokemon by 10', () => {
    const { player } = TestUtils.getAll(sim);
    defender.cardTypes = [CardType.METAL];

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Big attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(30);
  });

  it('Should reduce damage after applying Weakness', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    defender.cardTypes = [CardType.METAL];
    defender.weakness = [{ type: CardType.FIRE }];
    (opponent.active.getPokemonCard() as PokemonCard).cardTypes = [CardType.FIRE];

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Big attack'));

    expect(player.active.damage).toEqual(70);
  });

  it('Should not reduce damage to a non-Metal Pokemon', () => {
    const { player } = TestUtils.getAll(sim);
    defender.cardTypes = [CardType.WATER];

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Big attack'));

    expect(player.active.damage).toEqual(40);
  });

});

import {
  AttackAction,
  CardType,
  PokemonCard,
  Simulator,
} from '@ptcg/common';

import { DarknessEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/darkness-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Darkness Energy RS', () => {
  let sim: Simulator;
  let attacker: PokemonCard;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    attacker = new TestPokemon();
    TestUtils.setActive(sim, [attacker]);
    const { player } = TestUtils.getAll(sim);
    player.active.energies.cards = [new DarknessEnergy()];
  });

  // If the Pokémon Darkness Energy is attached to attacks, the attack does 10 more damage to the Active Pokémon
  // (before applying Weakness and Resistance). Ignore this effect unless the Attacking Pokémon is D or has Dark in
  // its name. Darkness Energy provides D Energy. (Doesn't count as a basic Energy card.)
  it('Should provide Darkness Energy', () => {
    const energy = new DarknessEnergy();
    expect(energy.provides).toEqual([CardType.DARK]);
  });

  it('Should add 10 damage for a Darkness Pokemon', () => {
    const { opponent } = TestUtils.getAll(sim);
    attacker.cardTypes = [CardType.DARK];

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should add 10 damage before applying Weakness', () => {
    const { opponent } = TestUtils.getAll(sim);
    attacker.cardTypes = [CardType.DARK];
    (opponent.active.getPokemonCard() as PokemonCard).weakness = [{ type: CardType.DARK }];

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(opponent.active.damage).toEqual(40);
  });

  it('Should add 10 damage for a Pokemon with Dark in its name', () => {
    const { opponent } = TestUtils.getAll(sim);
    attacker.name = 'Dark Pokemon';

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should not add damage for other Pokemon', () => {
    const { opponent } = TestUtils.getAll(sim);
    attacker.cardTypes = [CardType.FIRE];

    sim.dispatch(new AttackAction(1, 'Test attack'));

    expect(opponent.active.damage).toEqual(10);
  });

  it('Should not add damage when attack does no damage', () => {
    const { opponent } = TestUtils.getAll(sim);
    attacker.cardTypes = [CardType.DARK];
    attacker.attacks = [{ name: 'Growl', cost: [], damage: '', text: '' }];

    sim.dispatch(new AttackAction(1, 'Growl'));

    expect(opponent.active.damage).toEqual(0);
  });

});

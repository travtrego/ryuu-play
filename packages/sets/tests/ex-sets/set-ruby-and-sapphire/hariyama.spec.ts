import {
  AttackAction,
  CardType,
  PokemonCard,
  Simulator,
} from '@ptcg/common';

import { Hariyama } from '../../../src/ex-sets/set-ruby-and-sapphire/hariyama';
import { TestPokemonEx } from '../../test-cards/test-pokemon-ex';
import { TestUtils } from '../../test-utils';

describe('Hariyama RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Hariyama()], [CardType.FIGHTING, CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Super Slap Push - Does 20 damage to each Defending Pokémon.
  it('Should use Super Slap Push', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Super Slap Push'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Super Slap Push - Weakness applied', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).weakness = [{ type: CardType.FIGHTING }];

    sim.dispatch(new AttackAction(1, 'Super Slap Push'));

    expect(opponent.active.damage).toEqual(40);
  });

  // Mega Throw (40+) - If the Defending Pokémon is a Pokémon-ex, this attack does 40 damage plus 40 more damage.
  it('Should use Mega Throw - not a Pokemon-ex', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Mega Throw'));

    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Mega Throw - Pokemon-ex', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemonEx()]);

    sim.dispatch(new AttackAction(1, 'Mega Throw'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(80);
  });

});

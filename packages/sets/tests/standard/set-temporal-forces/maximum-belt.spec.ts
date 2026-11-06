import {
  AttackAction,
  CardTag,
  Simulator,
} from '@ptcg/common';

import { MaximumBelt } from '../../../src/standard/set-temporal-forces/maximum-belt';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

class TestPokemonEx extends TestPokemon {
  public tags = [CardTag.POKEMON_EX];
  public name = 'Pokemon ex';
  public fullName = 'Pokemon ex TEST';
}

describe('Maximum Belt TEF', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  it('is an ACE SPEC Pokémon Tool', () => {
    expect(new MaximumBelt().tags).toContain(CardTag.ACE_SPEC);
  });

  it('adds 50 damage against the opponent\'s Active Pokémon ex', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.active.pokemons.cards = [new TestPokemonEx()];
    player.active.trainers.cards = [new MaximumBelt()];
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(opponent.active.damage).toEqual(60);
  });

  it('adds nothing against a Pokémon that is not ex', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.trainers.cards = [new MaximumBelt()];
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(opponent.active.damage).toEqual(10);
  });
});

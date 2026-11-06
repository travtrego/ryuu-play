import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Growlithe } from '../../../src/ex-sets/set-sandstorm/growlithe';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Growlithe SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Growlithe()], [CardType.FIRE, CardType.COLORLESS]);
  });

  // Fire Veil - If Growlithe is your Active Pokémon and is damaged by an opponent's attack (even if Growlithe is
  // Knocked Out), the Attacking Pokémon is now Burned.
  it('Should burn the Attacking Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.BURNED]);
  });

  it('Should not burn the Attacking Pokémon when Growlithe is on the Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new Growlithe()]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(opponent.active.specialConditions).toEqual([]);
  });

  it('Should not burn the Attacking Pokémon when Fire Veil is blocked', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Flare (20)
  it('Should use Flare', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Flare'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });
});

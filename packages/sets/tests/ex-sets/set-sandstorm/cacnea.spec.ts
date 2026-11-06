import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Cacnea } from '../../../src/ex-sets/set-sandstorm/cacnea';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Cacnea SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Cacnea()], [CardType.COLORLESS]);
  });

  // Poison Payback - If Cacnea is your Active Pokémon and is damaged by an opponent's attack (even if Cacnea is
  // Knocked Out), the Attacking Pokémon is now Poisoned.
  it('Should poison the Attacking Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // poison damage between turns
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should poison the Attacking Pokémon even if Cacnea is Knocked Out', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 40;
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  it('Should not poison the Attacking Pokémon when Cacnea is on the Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new Cacnea()]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(opponent.active.specialConditions).toEqual([]);
  });

  it('Should not poison the Attacking Pokémon when Poison Payback is blocked', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Light Punch (10)
  it('Should use Light Punch', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Light Punch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });
});

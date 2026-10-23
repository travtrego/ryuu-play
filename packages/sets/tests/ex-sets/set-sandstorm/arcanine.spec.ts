import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Arcanine } from '../../../src/ex-sets/set-sandstorm/arcanine';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Arcanine SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Arcanine()],
      [CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Fire Veil - If Arcanine is your Active Pokémon and is damaged by an opponent's attack (even if Arcanine is
  // Knocked Out), the Attacking Pokémon is now Burned.
  it('Should burn the Attacking Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.BURNED]);
  });

  it('Should burn the Attacking Pokémon even if Arcanine is Knocked Out', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 70;
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(opponent.active.specialConditions).toEqual([SpecialCondition.BURNED]);
  });

  it('Should not burn the Attacking Pokémon when the attack does no damage', () => {
    const { opponent } = TestUtils.getAll(sim);
    const attacker = new TestPokemon();
    attacker.attacks = [{ name: 'Test attack', cost: [], damage: '', text: '' }];
    TestUtils.setDefending(sim, [attacker]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(opponent.active.specialConditions).toEqual([]);
  });

  it('Should not burn the Attacking Pokémon when Fire Veil is blocked', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    TestUtils.setActivePlayer(sim, opponent);

    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Burn Up (60) - Flip a coin. If tails, discard all R Energy cards attached to Arcanine.
  it('Should use Burn Up - heads', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Burn Up'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
    expect(player.active.energies.cards).toEqual(
      TestUtils.makeEnergies([CardType.FIRE, CardType.COLORLESS, CardType.COLORLESS]));
  });

  it('Should use Burn Up - tails', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies(
      [CardType.FIRE, CardType.FIRE, CardType.COLORLESS]);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Burn Up'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
    expect(player.active.energies.cards).toEqual(TestUtils.makeEnergies([CardType.COLORLESS]));
    expect(player.discard.cards).toEqual(TestUtils.makeEnergies([CardType.FIRE, CardType.FIRE]));
  });
});

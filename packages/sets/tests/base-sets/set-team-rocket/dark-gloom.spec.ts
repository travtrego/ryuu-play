import {
  AttackAction,
  CardType,
  GameMessage,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { DarkGloom } from '../../../src/base-sets/set-team-rocket/dark-gloom';
import { Oddish } from '../../../src/base-sets/set-team-rocket/oddish';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dark Gloom TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Oddish(), new DarkGloom()],
      [CardType.GRASS, CardType.GRASS]
    );
  });

  function usePollenStench(): string {
    const { player } = TestUtils.getAll(sim);
    const slot = player.active.getPokemonCard() instanceof DarkGloom ? player.active : player.bench[0];
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Pollen Stench', TestUtils.target(sim, slot)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Pollen Stench - Once during your turn (before your attack), you may flip a coin. If heads, the Defending
  // Pokémon is now Confused; if tails, your Active Pokémon is now Confused. This power can't be used if Dark Gloom
  // is Asleep, Confused, or Paralyzed.
  it('Should use Pollen Stench - heads confuses the Defending Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    expect(usePollenStench()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
    expect(player.active.specialConditions).toEqual([]);
  });

  it('Should use Pollen Stench - tails confuses your Active Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    expect(usePollenStench()).toEqual('');

    expect(opponent.active.specialConditions).toEqual([]);
    expect(player.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should use Pollen Stench from the Bench - tails confuses your Active Pokémon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Oddish(), new DarkGloom()]);
    TestUtils.setActive(sim, [new TestPokemon()]);
    TestUtils.setFlipResults(sim, [false]);

    expect(usePollenStench()).toEqual('');

    expect(opponent.active.specialConditions).toEqual([]);
    expect(player.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
    expect(player.bench[0].specialConditions).toEqual([]);
  });

  it('Should use Pollen Stench only once per turn', () => {
    TestUtils.setFlipResults(sim, [true]);

    expect(usePollenStench()).toEqual('');
    expect(usePollenStench()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not use Pollen Stench when Dark Gloom is ${SpecialCondition[condition]}`, () => {
      const { player, prompts } = TestUtils.getAll(sim);
      player.active.addSpecialCondition(condition);

      expect(usePollenStench()).toEqual(GameMessage.CANNOT_USE_POWER);
      expect(prompts.length).toEqual(0);
    });
  });

  // Poisonpowder (10) - The Defending Pokémon is now Poisoned.
  it('Should use Poisonpowder', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Poisonpowder'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(opponent.active.damage).toEqual(20); // 10 + 10 Poison between turns
  });
});

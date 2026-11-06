import {
  AttackAction,
  CardType,
  GameMessage,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Drowzee } from '../../../src/base-sets/set-team-rocket/drowzee';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Drowzee TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Drowzee()],
      [CardType.PSYCHIC, CardType.COLORLESS]
    );
  });

  function useHypnosis(): string {
    const { player } = TestUtils.getAll(sim);
    const slot = player.active.getPokemonCard() instanceof Drowzee ? player.active : player.bench[0];
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Long-Distance Hypnosis', TestUtils.target(sim, slot)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Long-Distance Hypnosis - Once during your turn (before your attack), you may flip a coin. If heads, the
  // Defending Pokémon is now Asleep; if tails, your Active Pokémon is now Asleep. This power can't be used if
  // Drowzee is Asleep, Confused, or Paralyzed.
  it('Should use Long-Distance Hypnosis - heads puts the Defending Pokémon to sleep', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    expect(useHypnosis()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
    expect(player.active.specialConditions).toEqual([]);
  });

  it('Should use Long-Distance Hypnosis - tails puts your Active Pokémon to sleep', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    expect(useHypnosis()).toEqual('');

    expect(opponent.active.specialConditions).toEqual([]);
    expect(player.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

  it('Should use Long-Distance Hypnosis from the Bench - tails puts your Active Pokémon to sleep', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Drowzee()]);
    TestUtils.setActive(sim, [new TestPokemon()]);
    TestUtils.setFlipResults(sim, [false]);

    expect(useHypnosis()).toEqual('');

    expect(opponent.active.specialConditions).toEqual([]);
    expect(player.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
    expect(player.bench[0].specialConditions).toEqual([]);
  });

  it('Should use Long-Distance Hypnosis only once per turn', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Drowzee()]);
    TestUtils.setActive(sim, [new TestPokemon()]);
    TestUtils.setFlipResults(sim, [true]);

    expect(useHypnosis()).toEqual('');
    expect(useHypnosis()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not use Long-Distance Hypnosis when Drowzee is ${SpecialCondition[condition]}`, () => {
      const { player, prompts } = TestUtils.getAll(sim);
      player.active.addSpecialCondition(condition);

      expect(useHypnosis()).toEqual(GameMessage.CANNOT_USE_POWER);
      expect(prompts.length).toEqual(0);
    });
  });

  // Nightmare (10) - The Defending Pokémon is now Asleep.
  it('Should use Nightmare', () => {
    const { opponent } = TestUtils.getAll(sim);
    // Between turns the opponent flips for Sleep: tails stays Asleep
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Nightmare'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });
});

import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Arbok } from '../../../src/base-sets/set-fossil/arbok';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Arbok FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Arbok()],
      [CardType.GRASS, CardType.GRASS, CardType.COLORLESS]
    );
  });

  // Terror Strike (10) - Flip a coin. If heads and if your opponent has any Benched Pokémon, he or she chooses 1 of
  // them and switches it with the Defending Pokémon. (Do the damage before switching the Pokémon.)
  it('Should use Terror Strike - heads, opponent switches after damage', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    const benched = new TestPokemon();
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Terror Strike'));

    const prompt = prompts.find(p => p.type === 'Choose pokemon');
    expect(prompt).toEqual(jasmine.objectContaining({
      playerId: opponent.id,
      message: GameMessage.CHOOSE_POKEMON_TO_SWITCH,
    }));

    sim.dispatch(new ResolvePromptAction(prompt!.id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(benched);
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
    expect(opponent.bench[0].damage).toEqual(10);
  });

  it('Should use Terror Strike - tails, no switch', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Terror Strike'));

    expect(prompts.some(p => p.type === 'Choose pokemon')).toBeFalse();
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(defending);
    expect(opponent.active.damage).toEqual(10);
    expect(opponent.bench[0].damage).toEqual(0);
  });

  it('Should use Terror Strike - heads, but opponent has no Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Terror Strike'));

    expect(prompts.some(p => p.type === 'Choose pokemon')).toBeFalse();
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  // Poison Fang (20) - The Defending Pokémon is now Poisoned.
  it('Should use Poison Fang', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Poison Fang'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    // 20 damage plus 10 from Poison between turns
    expect(opponent.active.damage).toEqual(30);
  });
});

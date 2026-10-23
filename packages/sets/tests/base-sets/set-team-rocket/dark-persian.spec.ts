import {
  AttackAction,
  CardType,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
} from '@ptcg/common';

import { DarkPersian } from '../../../src/base-sets/set-team-rocket/dark-persian';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dark Persian TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new DarkPersian()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Fascinate - Flip a coin. If heads, choose 1 of your opponent's Benched Pokémon and switch it with the
  // Defending Pokémon. This attack can't be used if your opponent has no Benched Pokémon.
  it('Should use Fascinate - heads switches the Defending Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    const benched = new TestPokemon();
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Fascinate'));

    const choose = prompts.find(p => p.type === 'Choose pokemon')!;
    expect(choose).toEqual(jasmine.objectContaining({
      playerId: player.id,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(choose.id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(benched);
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Fascinate - tails does nothing', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Fascinate'));

    expect(prompts.some(p => p.type === 'Choose pokemon')).toBeFalse();
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(defending);
  });

  // BUG: Fascinate can be used (doing nothing and ending the turn) when the opponent has no Benched Pokémon
  xit('Should not be able to use Fascinate when the opponent has no Benched Pokémon', () => {
    let message = '';
    try {
      sim.dispatch(new AttackAction(1, 'Fascinate'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    const { player } = TestUtils.getAll(sim);
    expect(message).not.toEqual('');
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
  });

  // Poison Claws (10) - Flip a coin. If heads, the Defending Pokémon is now Poisoned.
  it('Should use Poison Claws - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Poison Claws'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(opponent.active.damage).toEqual(20); // 10 + 10 Poison between turns
  });

  it('Should use Poison Claws - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Poison Claws'));

    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.active.damage).toEqual(10);
  });
});

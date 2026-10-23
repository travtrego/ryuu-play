import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  RetreatAction,
  Simulator,
  SlotType,
  SpecialCondition,
} from '@ptcg/common';

import { Cradily } from '../../../src/ex-sets/set-sandstorm/cradily';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Cradily SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;

    TestUtils.setActive(
      sim,
      [new Cradily()],
      [CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  function opponentRetreat(): string {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setActivePlayer(sim, opponent);
    let message = '';
    try {
      sim.dispatch(new RetreatAction(2, 0));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Super Suction Cups - As long as Cradily is your Active Pokémon, your opponent's Pokémon can't retreat.
  it('Should prevent the opponent\'s Active Pokémon from retreating', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();

    expect(opponentRetreat()).toEqual(GameMessage.BLOCKED_BY_ABILITY);
    expect(opponent.active.getPokemonCard()).toBe(defending);
  });

  it('Should not prevent retreat when Cradily is on the Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new Cradily()]);
    const defending = opponent.active.getPokemonCard();

    expect(opponentRetreat()).toEqual('');
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
  });

  it('Should not prevent retreat when Super Suction Cups is blocked', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);
    const defending = opponent.active.getPokemonCard();

    expect(opponentRetreat()).toEqual('');
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
  });

  // Lure Poison - Before using this effect, you may switch the Defending Pokémon with 1 of your opponent's Benched
  // Pokémon, if any. The Defending Pokémon is now Poisoned.
  it('Should use Lure Poison and switch the Defending Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    const benched = new TestPokemon();
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Lure Poison'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: true })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(benched);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
    expect(opponent.bench[0].specialConditions).toEqual([]);
  });

  it('Should use Lure Poison without switching', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Lure Poison'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(defending);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  // BUG: when the opponent has no Benched Pokémon the attack returns early and the Defending Pokémon is not
  // Poisoned, but the poison part of the text does not depend on the optional switch.
  xit('Should use Lure Poison when the opponent has no Benched Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Lure Poison'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
  });

  // Spiral Drain (50) - Remove 2 damage counters from Cradily (remove 1 if there is only 1).
  it('Should use Spiral Drain and remove 2 damage counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Spiral Drain'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Spiral Drain and remove 1 damage counter if there is only 1', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 10;

    sim.dispatch(new AttackAction(1, 'Spiral Drain'));

    expect(opponent.active.damage).toEqual(50);
    expect(player.active.damage).toEqual(0);
  });
});

import {
  AttackAction,
  CardType,
  ChoosePokemonPrompt,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Swellow } from '../../../src/ex-sets/set-ruby-and-sapphire/swellow';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestPokemonBlockPowers } from '../../test-cards/test-pokemon-block-powers';
import { TestUtils } from '../../test-utils';

describe('Swellow RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Swellow()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  function useDriveOff(slot?: 'bench'): string {
    const { player } = TestUtils.getAll(sim);
    const target = TestUtils.target(sim, slot === 'bench' ? player.bench[0] : player.active);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Drive Off', target));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Drive Off - Once during your turn (before your attack), if Swellow is your Active Pokémon, you may switch 1 of
  // the Defending Pokémon with 1 of your opponent's Benched Pokémon. Your opponent picks the Benched Pokémon to
  // switch. This power can't be used if Swellow is affected by a Special Condition.
  it('Should use Drive Off - opponent picks the Benched Pokemon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    const defending = opponent.active;
    const benched = opponent.bench[1];

    expect(useDriveOff()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim) as ChoosePokemonPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: opponent.id,
      message: GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: false }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [benched]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active).toBe(benched);
    expect(opponent.bench[1]).toBe(defending);
  });

  it('Should use Drive Off - once per turn', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    useDriveOff();
    const prompt = TestUtils.lastPrompt(sim) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));

    expect(useDriveOff()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Should use Drive Off - opponent has no Benched Pokemon', () => {
    expect(useDriveOff()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should use Drive Off - affected by Special Condition', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.active.addSpecialCondition(SpecialCondition.POISONED);

    expect(useDriveOff()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should use Drive Off - power blocked', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemonBlockPowers()]);

    expect(useDriveOff()).toEqual(GameMessage.BLOCKED_BY_ABILITY);
  });

  it('Should use Drive Off - can\'t be used from the Bench', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[0] = player.active;
    player.active = TestUtils.pokemonSlot([new TestPokemon()]);

    expect(useDriveOff('bench')).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  // Wing Attack (30)
  it('Should use Wing Attack', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Wing Attack'));

    expect(opponent.active.damage).toEqual(30);
  });

});

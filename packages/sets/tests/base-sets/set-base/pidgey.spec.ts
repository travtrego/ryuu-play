import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Pidgey } from '../../../src/base-sets/set-base/pidgey';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Pidgey BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Pidgey()],
      [CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Whirlwind (10) - If your opponent has any Benched Pokémon, he or she chooses 1 of them and switches it with
  // the Defending Pokémon. (Do the damage before switching the Pokémon.)
  it('Should use Whirlwind, do the damage, then the opponent chooses a Benched Pokémon to switch', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    const benched = new TestPokemon();
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Whirlwind'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: opponent.id,
      message: GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: false })
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(benched);
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
    expect(opponent.bench[0].damage).toEqual(10);
  });

  it('Should use Whirlwind without switching when the opponent has no Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();

    sim.dispatch(new AttackAction(1, 'Whirlwind'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(defending);
    expect(opponent.active.damage).toEqual(10);
  });
});

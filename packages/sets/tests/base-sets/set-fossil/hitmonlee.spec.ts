import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Hitmonlee } from '../../../src/base-sets/set-fossil/hitmonlee';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Hitmonlee FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Hitmonlee()],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING]
    );
  });

  // Stretch Kick - If your opponent has any Benched Pokémon, choose 1 of them and this attack does 20 damage to it.
  // (Don't apply Weakness and Resistance for Benched Pokémon.)
  it('Should use Stretch Kick', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.FIGHTING }];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([weak]);

    sim.dispatch(new AttackAction(1, 'Stretch Kick'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[1]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.bench[0].damage).toEqual(0);
    expect(opponent.bench[1].damage).toEqual(20);
  });

  it('Should use Stretch Kick without Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Stretch Kick'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // High Jump Kick (50)
  it('Should use High Jump Kick', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'High Jump Kick'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });
});

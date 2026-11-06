import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Pikachu } from '../../../src/base-sets/set-jungle/pikachu';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Pikachu JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Pikachu()],
      [CardType.LIGHTNING, CardType.LIGHTNING],
    );
  });

  // Spark (20) - If your opponent has any Benched Pokémon, choose 1 of them and this attack does 10 damage to it.
  // (Don't apply Weakness and Resistance for Benched Pokémon.)
  it('Should use Spark and damage a chosen Benched Pokémon', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const benched = new TestPokemon();
    benched.weakness = [{ type: CardType.LIGHTNING }];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Spark'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[1]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.bench[0].damage).toEqual(0);
    // Weakness is not applied to Benched Pokémon
    expect(opponent.bench[1].damage).toEqual(10);
  });

  it('Should use Spark without opponent\'s Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Spark'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Spark and apply Weakness only to the Defending Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = new TestPokemon();
    defending.weakness = [{ type: CardType.LIGHTNING }];
    TestUtils.setDefending(sim, [defending]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Spark'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(opponent.active.damage).toEqual(40);
    expect(opponent.bench[0].damage).toEqual(10);
  });
});

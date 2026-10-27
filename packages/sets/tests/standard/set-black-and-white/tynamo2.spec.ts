import {
  AttackAction,
  CardType,
  ChoosePokemonPrompt,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Tynamo2 } from '../../../src/standard/set-black-and-white/tynamo2';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Tynamo DEX', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Tynamo2()], [CardType.LIGHTNING]);
  });

  // Spark (10) - Does 10 damage to 1 of your opponent's Benched Pokemon.
  // (Don't apply Weakness and Resistance for Benched Pokemon.)
  it('Should use Spark and damage a chosen Benched Pokemon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const benched = new TestPokemon();
    benched.weakness = [{ type: CardType.LIGHTNING }];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Spark'));

    const prompt = TestUtils.lastPrompt(sim) as ChoosePokemonPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_DAMAGE,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: false }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[1]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    // Weakness is not applied on the Bench
    expect(opponent.bench[1].damage).toEqual(10);
    expect(opponent.bench[0].damage).toEqual(0);
  });

  it('Should use Spark without a prompt when the opponent has no Benched Pokemon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Spark'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });
});

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

import { Makuhita2 } from '../../../src/ex-sets/set-ruby-and-sapphire/makuhita-2';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Makuhita RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Makuhita2()], [CardType.FIGHTING, CardType.COLORLESS]);
  });

  // Fling - Your opponent switches the Defending Pokémon with 1 of his or her Benched Pokémon.
  it('Should use Fling - opponent chooses the new Active Pokemon', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    const active = opponent.active;
    const benched = opponent.bench[1];

    sim.dispatch(new AttackAction(1, 'Fling'));

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

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active).toBe(benched);
    expect(opponent.bench[1]).toBe(active);
    expect(active.damage).toEqual(0);
  });

  it('Should use Fling - no Benched Pokemon', () => {
    const { opponent } = TestUtils.getAll(sim);
    const active = opponent.active;

    sim.dispatch(new AttackAction(1, 'Fling'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active).toBe(active);
  });

  // Low Kick (30)
  it('Should use Low Kick', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Low Kick'));

    expect(opponent.active.damage).toEqual(30);
  });

});

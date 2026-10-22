import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  PlayerType,
  ResolvePromptAction,
  RetreatAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Victreebel } from '../../../src/base-sets/set-jungle/victreebel';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Victreebel JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Victreebel()],
      [CardType.GRASS, CardType.GRASS],
    );
  });

  // Lure - If your opponent has any Benched Pokémon, choose 1 of them and switch it with his or her Active Pokémon.
  it('Should use Lure and switch the chosen Benched Pokémon with the Defending Pokémon', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    const benched = new TestPokemon();
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Lure'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[1]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(benched);
    expect(opponent.bench[1].getPokemonCard()).toBe(defending);
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.bench[1].damage).toEqual(0);
  });

  it('Should use Lure without opponent\'s Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();

    sim.dispatch(new AttackAction(1, 'Lure'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(defending);
  });

  // Acid (20) - Flip a coin. If heads, the Defending Pokémon can't retreat during your opponent's next turn.
  function opponentRetreat(): string {
    let message = '';
    try {
      sim.dispatch(new RetreatAction(2, 0));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  it('Should use Acid - heads, the Defending Pokémon can\'t retreat', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Acid'));
    expect(opponent.active.damage).toEqual(20);

    const message = opponentRetreat();

    expect(message).toEqual(GameMessage.BLOCKED_BY_EFFECT);
    expect(TestUtils.getAll(sim).opponent.active.getPokemonCard()).toBe(defending);
  });

  it('Should use Acid - tails, the Defending Pokémon can retreat', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Acid'));
    const message = opponentRetreat();

    expect(message).toEqual('');
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
  });

  it('Should use Acid - the effect ends after the opponent\'s next turn', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Acid'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    const message = opponentRetreat();

    expect(message).toEqual('');
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
  });
});

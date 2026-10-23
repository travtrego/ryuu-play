import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Exeggutor } from '../../../src/base-sets/set-jungle/exeggutor';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Exeggutor JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Exeggutor()],
      [CardType.PSYCHIC, CardType.GRASS, CardType.GRASS],
    );
  });

  // Teleport - Switch Exeggutor with 1 of your Benched Pokémon.
  it('Should use Teleport', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const exeggutor = player.active.getPokemonCard();
    const benched = new TestPokemon();
    player.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Teleport'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.BENCH],
      message: GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.getPokemonCard()).toBe(benched);
    expect(player.bench[0].getPokemonCard()).toBe(exeggutor);
    expect(player.bench[0].energies.cards.length).toEqual(3);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Teleport without Benched Pokémon', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const exeggutor = player.active.getPokemonCard();

    sim.dispatch(new AttackAction(1, 'Teleport'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.getPokemonCard()).toBe(exeggutor);
  });

  // Big Eggsplosion (20x) - Flip a number of coins equal to the number of Energy attached to Exeggutor. This
  // attack does 20 damage times the number of heads.
  it('Should use Big Eggsplosion - flips a coin for each attached Energy', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false, true]);

    sim.dispatch(new AttackAction(1, 'Big Eggsplosion'));

    expect(prompts.filter(p => p.type === 'Coin flip' && p.playerId === player.id).length).toEqual(3);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Big Eggsplosion - all heads with 5 Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Exeggutor()],
      [CardType.GRASS, CardType.GRASS, CardType.GRASS, CardType.GRASS, CardType.GRASS]);

    sim.dispatch(new AttackAction(1, 'Big Eggsplosion'));

    expect(opponent.active.damage).toEqual(100);
  });

  it('Should use Big Eggsplosion - all tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Big Eggsplosion'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});

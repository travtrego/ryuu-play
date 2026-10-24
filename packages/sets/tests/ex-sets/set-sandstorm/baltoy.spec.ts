import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Baltoy } from '../../../src/ex-sets/set-sandstorm/baltoy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Baltoy SS', () => {
  let sim: Simulator;
  let baltoy: Baltoy;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    baltoy = new Baltoy();

    TestUtils.setActive(sim, [baltoy], [CardType.COLORLESS]);
  });

  // Rapid Spin (10) - Your opponent switches the Defending Pokémon with 1 of his or her Benched Pokémon, if any. You
  // switch Baltoy with 1 of your Benched Pokémon, if any.
  it('Should use Rapid Spin - both players switch', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    const opponentBenched = new TestPokemon();
    const playerBenched = new TestPokemon();
    opponent.bench[0] = TestUtils.pokemonSlot([opponentBenched]);
    player.bench[0] = TestUtils.pokemonSlot([playerBenched]);

    sim.dispatch(new AttackAction(1, 'Rapid Spin'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: opponent.id,
      message: GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: false })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: false })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [player.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(opponentBenched);
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
    expect(player.active.getPokemonCard()).toBe(playerBenched);
    expect(player.bench[0].getPokemonCard()).toBe(baltoy);
  });

  it('Should use Rapid Spin - damage goes to the original Defending Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Rapid Spin'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [player.bench[0]]));

    expect(opponent.bench[0].damage).toEqual(10);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Rapid Spin - nobody has Benched Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rapid Spin'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(player.active.getPokemonCard()).toBe(baltoy);
  });

  it('Should use Rapid Spin - only the attacker has Benched Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const playerBenched = new TestPokemon();
    player.bench[0] = TestUtils.pokemonSlot([playerBenched]);

    sim.dispatch(new AttackAction(1, 'Rapid Spin'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0].playerId).toEqual(player.id);
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(player.active.getPokemonCard()).toBe(playerBenched);
  });
});

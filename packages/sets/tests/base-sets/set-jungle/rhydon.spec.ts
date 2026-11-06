import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Rhydon } from '../../../src/base-sets/set-jungle/rhydon';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Rhydon JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Rhydon()],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING],
    );
  });

  // Horn Attack (30)
  it('Should use Horn Attack', () => {
    const { opponent, player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Horn Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.damage).toEqual(0);
  });

  // Ram (50) - Rhydon does 20 damage to itself. If your opponent has any Benched Pokémon, he or she chooses 1 of
  // them and switches it with the Defending Pokémon. (Do the damage before switching the Pokémon. Switch the
  // Pokémon even if Rhydon is knocked out.)
  it('Should use Ram - damage first, then the opponent switches', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    const benched = new TestPokemon();
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Ram'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: opponent.id,
      message: GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: false }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(20);
    expect(opponent.active.getPokemonCard()).toBe(benched);
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
    expect(opponent.bench[0].damage).toEqual(50);
  });

  it('Should use Ram without opponent\'s Benched Pokémon', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Ram'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(20);
    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Ram - switches even if Rhydon is Knocked Out', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    const benched = new TestPokemon();
    opponent.bench[0] = TestUtils.pokemonSlot([benched]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.active.damage = 90;

    sim.dispatch(new AttackAction(1, 'Ram'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));

    // Rhydon is Knocked Out, resolve Prize and promotion prompts
    for (let i = 0; i < 5; i++) {
      const prompt = prompts.find(p => p.result === undefined);
      if (prompt === undefined) {
        break;
      }
      if (prompt.type === 'Choose prize') {
        sim.dispatch(new ResolvePromptAction(prompt.id, opponent.prizes.slice(0, 1)));
      } else if (prompt.type === 'Choose pokemon') {
        sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[0]]));
      }
    }

    expect(opponent.active.getPokemonCard()).toBe(benched);
    expect(opponent.bench[0].damage).toEqual(50);
    expect(player.discard.cards.some(c => c instanceof Rhydon)).toBeTrue();
    expect(opponent.getPrizeLeft()).toEqual(5);
  });
});

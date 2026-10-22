import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Ninetales } from '../../../src/base-sets/set-base/ninetales';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Ninetales BS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Ninetales()],
      [CardType.FIRE, CardType.FIRE, CardType.FIRE, CardType.FIRE],
    );
  });

  // Lure - If your opponent has any Benched Pokémon, choose 1 of them and switch it with his or her Active Pokémon.
  it('Should use Lure and switch the chosen Benched Pokémon with the Defending Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    const benched = new TestPokemon();
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([benched]);

    sim.dispatch(new AttackAction(1, 'Lure'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
      options: jasmine.objectContaining({ allowCancel: false })
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[1]]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(benched);
    expect(opponent.bench[1].getPokemonCard()).toBe(defending);
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.bench[1].damage).toEqual(0);
  });

  it('Should use Lure and do nothing when the opponent has no Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();

    sim.dispatch(new AttackAction(1, 'Lure'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(defending);
  });

  // Fire Blast (80) - Discard 1 R Energy card attached to Ninetales in order to use this attack.
  it('Should use Fire Blast and discard 1 Fire Energy', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const energy = player.active.energies.cards[0];

    sim.dispatch(new AttackAction(1, 'Fire Blast'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose energy',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cost: [CardType.FIRE],
      options: jasmine.objectContaining({ allowCancel: false })
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{ card: energy, provides: [CardType.FIRE] }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(80);
    expect(player.discard.cards).toEqual([energy]);
    expect(player.active.energies.cards.length).toEqual(3);
  });
});

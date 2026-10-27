import {
  ChoosePokemonPrompt,
  GameMessage,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { MaxPotion } from '../../../src/standard/set-black-and-white/max-potion';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Max Potion EPO', () => {
  let sim: Simulator;
  let trainerCard: MaxPotion;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new MaxPotion();
    sim.store.state.players[0].hand.cards = [trainerCard];
    TestUtils.setActive(sim, [new TestPokemon()]);
  });

  function playCard(): string {
    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Heal all damage from 1 of your Pokemon. Then, discard all Energy attached to that Pokemon.
  it('Should heal all damage and discard all Energy', () => {
    const { player } = TestUtils.getAll(sim);
    const fire1 = new FireEnergy();
    const fire2 = new FireEnergy();
    player.active.damage = 70;
    player.active.energies.cards = [fire1, fire2];

    expect(playCard()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_HEAL,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.active]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
    expect(player.active.energies.cards.length).toEqual(0);
    expect(player.discard.cards).toContain(fire1);
    expect(player.discard.cards).toContain(fire2);
    expect(player.discard.cards).toContain(trainerCard);
  });

  it('Should heal a Benched Pokemon', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[0].damage = 40;

    expect(playCard()).toEqual('');
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[0]]));

    expect(player.bench[0].damage).toEqual(0);
  });

  it('Should not be playable when no Pokemon is damaged', () => {
    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should keep the card in hand when the prompt is canceled', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 50;

    expect(playCard()).toEqual('');
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(player.active.damage).toEqual(50);
    expect(player.hand.cards).toEqual([trainerCard]);
  });
});

import {
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Potion } from '../../../src/base-sets/set-base/potion';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Potion BS', () => {
  let sim: Simulator;
  let trainerCard: Potion;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Potion();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should remove 2 damage counters from the chosen Pokémon', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.active.damage = 50;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_HEAL,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
    }));

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.active]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(30);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should heal a benched Pokémon', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()], [], [], 40);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.bench[0]]));

    expect(player.bench[0].damage).toEqual(20);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should not be playable when no Pokémon is damaged', () => {
    const { player } = TestUtils.getAll(sim);

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).not.toEqual('');
    expect(player.hand.cards).toEqual([trainerCard]);
  });
});

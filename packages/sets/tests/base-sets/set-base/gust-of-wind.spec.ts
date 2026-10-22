import {
  GameMessage,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
} from '@ptcg/common';

import { GustOfWind } from '../../../src/base-sets/set-base/gust-of-wind';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Gust of Wind BS', () => {
  let sim: Simulator;
  let trainerCard: GustOfWind;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new GustOfWind();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should switch an opponent\'s Benched Pokémon with the Active Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    const active = opponent.active;
    const benched = opponent.bench[0];
    active.addSpecialCondition(SpecialCondition.POISONED);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [benched]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active).toBe(benched);
    expect(opponent.bench[0]).toBe(active);
    expect(active.specialConditions).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should not be playable when the opponent has no Benched Pokémon', () => {
    const { player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });

  it('Should keep the card in hand when cancelled', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    const active = opponent.active;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([trainerCard]);
    expect(opponent.active).toBe(active);
  });
});

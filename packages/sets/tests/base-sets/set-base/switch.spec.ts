import {
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  SlotType,
  SpecialCondition,
} from '@ptcg/common';

import { Switch } from '../../../src/base-sets/set-base/switch';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Switch BS', () => {
  let sim: Simulator;
  let trainerCard: Switch;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Switch();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should switch a Benched Pokémon with the Active Pokémon', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    const active = player.active;
    const benched = player.bench[0];
    active.addSpecialCondition(SpecialCondition.CONFUSED);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_SWITCH,
      slots: [SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [benched]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active).toBe(benched);
    expect(player.bench[0]).toBe(active);
    expect(active.specialConditions).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should not be playable without a Benched Pokémon', () => {
    const { player } = TestUtils.getAll(sim);

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
    const { player, prompts } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    const active = player.active;

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([trainerCard]);
    expect(player.active).toBe(active);
  });
});

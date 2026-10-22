import {
  GameMessage,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { EnergyRemoval } from '../../../src/base-sets/set-base/energy-removal';
import { DoubleColorlessEnergy } from '../../../src/base-sets/set-base/double-colorless-energy';
import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { WaterEnergy } from '../../../src/base-sets/set-base/water-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Energy Removal BS', () => {
  let sim: Simulator;
  let trainerCard: EnergyRemoval;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new EnergyRemoval();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should discard 1 Energy card attached to the opponent\'s Active Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    const water = new WaterEnergy();
    opponent.active.energies.cards = [fire, water];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      playerType: PlayerType.TOP_PLAYER,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.active]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      cards: opponent.active.energies,
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [fire]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.energies.cards).toEqual([water]);
    expect(opponent.discard.cards).toEqual([fire]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should discard a Special Energy card from a Benched Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const dce = new DoubleColorlessEnergy();
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[0].energies.cards = [dce];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [opponent.bench[0]]));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [dce]));

    expect(opponent.bench[0].energies.cards).toEqual([]);
    expect(opponent.discard.cards).toEqual([dce]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should not be playable when the opponent has no Energy attached', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.energies.cards = [new FireEnergy()];

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
    opponent.active.energies.cards = [new FireEnergy()];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([trainerCard]);
    expect(opponent.active.energies.cards.length).toEqual(1);
  });
});

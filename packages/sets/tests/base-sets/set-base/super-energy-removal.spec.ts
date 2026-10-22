import {
  GameMessage,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { SuperEnergyRemoval } from '../../../src/base-sets/set-base/super-energy-removal';
import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { WaterEnergy } from '../../../src/base-sets/set-base/water-energy';
import { TestUtils } from '../../test-utils';

describe('Super Energy Removal BS', () => {
  let sim: Simulator;
  let trainerCard: SuperEnergyRemoval;
  let ownFire: FireEnergy;
  let fire: FireEnergy;
  let water1: WaterEnergy;
  let water2: WaterEnergy;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new SuperEnergyRemoval();
    ownFire = new FireEnergy();
    fire = new FireEnergy();
    water1 = new WaterEnergy();
    water2 = new WaterEnergy();
    const state = sim.store.state;
    state.players[0].hand.cards = [trainerCard];
    state.players[0].active.energies.cards = [ownFire];
    state.players[1].active.energies.cards = [water1, fire, water2];
  });

  it('Should discard 1 own Energy card to discard up to 2 Energy cards from an opponent\'s Pokémon', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      playerType: PlayerType.BOTTOM_PLAYER,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.active]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      cards: player.active.energies,
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [ownFire]));

    expect(prompts[2]).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      playerType: PlayerType.TOP_PLAYER,
    }));
    sim.dispatch(new ResolvePromptAction(prompts[2].id, [opponent.active]));

    expect(prompts[3]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      cards: opponent.active.energies,
      options: jasmine.objectContaining({ min: 1, max: 2 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[3].id, [water1, water2]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.energies.cards).toEqual([]);
    expect(opponent.active.energies.cards).toEqual([fire]);
    expect(opponent.discard.cards).toEqual([water1, water2]);
    expect(player.discard.cards).toEqual(jasmine.arrayWithExactContents([ownFire, trainerCard]));
  });

  it('Should not be playable when your Pokémon have no Energy attached', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.energies.cards = [];

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });

  it('Should not be playable when the opponent\'s Pokémon have no Energy attached', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.active.energies.cards = [];

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
    expect(player.active.energies.cards).toEqual([ownFire]);
  });

  it('Should not discard anything when cancelled', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [player.active]));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [ownFire]));
    sim.dispatch(new ResolvePromptAction(prompts[2].id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([trainerCard]);
    expect(player.active.energies.cards).toEqual([ownFire]);
    expect(opponent.active.energies.cards.length).toEqual(3);
  });
});

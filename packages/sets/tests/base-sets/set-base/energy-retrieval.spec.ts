import {
  EnergyType,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  SuperType,
} from '@ptcg/common';

import { EnergyRetrieval } from '../../../src/base-sets/set-base/energy-retrieval';
import { DoubleColorlessEnergy } from '../../../src/base-sets/set-base/double-colorless-energy';
import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { WaterEnergy } from '../../../src/base-sets/set-base/water-energy';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Energy Retrieval BS', () => {
  let sim: Simulator;
  let trainerCard: EnergyRetrieval;
  let other: TestCard;
  let fire: FireEnergy;
  let water: WaterEnergy;
  let dce: DoubleColorlessEnergy;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new EnergyRetrieval();
    other = new TestCard();
    fire = new FireEnergy();
    water = new WaterEnergy();
    dce = new DoubleColorlessEnergy();
    const player = sim.store.state.players[0];
    player.hand.cards = [trainerCard, other];
    player.discard.cards = [fire, dce, water];
  });

  it('Should trade 1 card from hand for up to 2 basic Energy cards from the discard pile', () => {
    const { player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [other]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.discard,
      filter: { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
      options: jasmine.objectContaining({ max: 2 }),
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [fire, water]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([fire, water]);
    expect(player.discard.cards).toEqual(jasmine.arrayWithExactContents([dce, trainerCard, other]));
  });

  it('Should allow taking only 1 basic Energy card', () => {
    const { player, prompts } = TestUtils.getAll(sim);

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [other]));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, [water]));

    expect(player.hand.cards).toEqual([water]);
    expect(player.discard.cards).toEqual(jasmine.arrayWithExactContents([fire, dce, trainerCard, other]));
  });

  it('Should not be playable without another card in hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [trainerCard];

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });

  it('Should not be playable without basic Energy in the discard pile', () => {
    const { player } = TestUtils.getAll(sim);
    player.discard.cards = [dce];

    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard, other]);
  });
});

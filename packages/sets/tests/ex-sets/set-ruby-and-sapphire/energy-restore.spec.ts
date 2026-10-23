import {
  ChooseCardsPrompt,
  EnergyType,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  SuperType,
  TrainerCard,
} from '@ptcg/common';

import { DarknessEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/darkness-energy';
import { EnergyRestore } from '../../../src/ex-sets/set-ruby-and-sapphire/energy-restore';
import { FireEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/fire-energy';
import { WaterEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/water-energy';
import { TestUtils } from '../../test-utils';

describe('Energy Restore RS', () => {
  let sim: Simulator;
  let trainerCard: TrainerCard;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new EnergyRestore();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  function play(): string {
    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Flip 3 coins. For each heads, put a basic Energy card from your discard pile into your hand. If you don't have
  // that many basic Energy cards in your discard pile, put all of them into your hand.
  it('Should play Energy Restore - 2 heads', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false, true]);
    const fire = new FireEnergy();
    const water = new WaterEnergy();
    const fire2 = new FireEnergy();
    player.discard.cards = [fire, water, fire2, new DarknessEnergy()];

    expect(play()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.discard,
      filter: { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
      options: jasmine.objectContaining({ min: 2, max: 2, allowCancel: false }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [fire, water]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([fire, water]);
    expect(player.discard.cards).toContain(trainerCard);
    expect(player.discard.cards).toContain(fire2);
  });

  it('Should play Energy Restore - more heads than basic Energy cards', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true, true]);
    const fire = new FireEnergy();
    player.discard.cards = [fire, new DarknessEnergy()];

    play();

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt.options).toEqual(jasmine.objectContaining({ min: 1, max: 1 }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [fire]));

    expect(player.hand.cards).toEqual([fire]);
  });

  it('Should play Energy Restore - all tails', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false, false]);
    player.discard.cards = [new FireEnergy()];

    expect(play()).toEqual('');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
    expect(player.discard.cards).toContain(trainerCard);
    expect(player.discard.cards.length).toEqual(2);
  });

  it('Should play Energy Restore - no basic Energy in discard', () => {
    const { player } = TestUtils.getAll(sim);
    player.discard.cards = [new DarknessEnergy()];

    expect(play()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });

});

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
import { FireEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/fire-energy';
import { GrassEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/grass-energy';
import { LadyOuting } from '../../../src/ex-sets/set-ruby-and-sapphire/lady-outing';
import { WaterEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/water-energy';
import { TestUtils } from '../../test-utils';

describe('Lady Outing RS', () => {
  let sim: Simulator;
  let trainerCard: TrainerCard;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new LadyOuting();
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

  // Search your deck for up to 3 different types of basic Energy cards, show them to your opponent, and put them
  // into your hand. Shuffle your deck afterward.
  it('Should play Lady Outing - take 3 different basic Energy cards', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    const water = new WaterEnergy();
    const grass = new GrassEnergy();
    player.deck.cards.push(fire, new FireEnergy(), water, grass, new DarknessEnergy());

    expect(play()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
      filter: { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
      options: jasmine.objectContaining({ min: 0, max: 3, allowCancel: true, differentTypes: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [fire, water, grass]));

    const show = TestUtils.lastPrompt(sim);
    expect(show).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: opponent.id,
      cards: [fire, water, grass],
    }));
    sim.dispatch(new ResolvePromptAction((show as ChooseCardsPrompt).id, true));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([fire, water, grass]);
    expect(player.supporter.cards).toEqual([trainerCard]);
  });

  it('Should play Lady Outing - two Energy cards of the same type are not allowed', () => {
    const { player } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    const fire2 = new FireEnergy();
    player.deck.cards.push(fire, fire2);

    play();
    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;

    expect(prompt.validate([fire, fire2])).toBeFalse();
    expect(prompt.validate([fire])).toBeTrue();
  });

  it('Should play Lady Outing - canceled', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards.push(new FireEnergy());

    play();
    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
    expect(player.deck.cards.length).toEqual(51);
  });

  it('Should play Lady Outing - empty deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards = [];

    expect(play()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });

});

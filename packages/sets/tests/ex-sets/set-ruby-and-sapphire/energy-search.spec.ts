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
import { EnergySearch } from '../../../src/ex-sets/set-ruby-and-sapphire/energy-search';
import { FireEnergy } from '../../../src/ex-sets/set-ruby-and-sapphire/fire-energy';
import { TestUtils } from '../../test-utils';

describe('Energy Search RS', () => {
  let sim: Simulator;
  let trainerCard: TrainerCard;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new EnergySearch();
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

  // Search your deck for a basic Energy card, show it to your opponent, and put it into your hand. Shuffle your
  // deck afterward.
  it('Should play Energy Search', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    player.deck.cards.push(fire, new DarknessEnergy());

    expect(play()).toEqual('');

    let prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
      filter: { superType: SuperType.ENERGY, energyType: EnergyType.BASIC },
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [fire]));

    const show = TestUtils.lastPrompt(sim);
    expect(show).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: opponent.id,
      message: GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,
      cards: [fire],
    }));
    sim.dispatch(new ResolvePromptAction((show as ChooseCardsPrompt).id, true));

    prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt.type).toEqual('Shuffle deck');

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([fire]);
    expect(player.discard.cards).toEqual([trainerCard]);
    expect(player.deck.cards.length).toEqual(51);
  });

  it('Should play Energy Search - canceled', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards.push(new FireEnergy());

    play();
    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
    expect(player.deck.cards.length).toEqual(51);
  });

  it('Should play Energy Search - empty deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards = [];

    expect(play()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });

});

import {
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  OrderCardsPrompt,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
  TrainerCard,
} from '@ptcg/common';

import { Pokenav } from '../../../src/ex-sets/set-ruby-and-sapphire/pokenav';
import { TestCard } from '../../test-cards/test-card';
import { TestEnergy } from '../../test-cards/test-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Pokenav RS', () => {
  let sim: Simulator;
  let trainerCard: TrainerCard;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Pokenav();
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

  // Look at the top 3 cards of your deck, and choose a Basic Pokémon, Evolution card, or Energy card. Show it to
  // your opponent and put it into your hand. Put the 2 other cards back on top of your deck in any order.
  it('Should play Pokenav - take a Pokemon and reorder the rest', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const pokemon = new TestPokemon();
    const energy = new TestEnergy(CardType.FIRE);
    const other = new TestCard();
    player.deck.cards.unshift(other, pokemon, energy);

    expect(play()).toEqual('');

    const choose = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(choose).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      options: jasmine.objectContaining({ min: 0, max: 1, blocked: [0] }),
    }));
    expect(choose.cards.cards).toEqual([other, pokemon, energy]);
    sim.dispatch(new ResolvePromptAction(choose.id, [pokemon]));

    const show = TestUtils.lastPrompt(sim);
    expect(show).toEqual(jasmine.objectContaining({ type: 'Show cards', playerId: opponent.id, cards: [pokemon] }));
    sim.dispatch(new ResolvePromptAction((show as ChooseCardsPrompt).id, true));

    const order = TestUtils.lastPrompt(sim) as OrderCardsPrompt;
    expect(order).toEqual(jasmine.objectContaining({
      type: 'Order cards',
      playerId: player.id,
    }));
    // put energy on top, then the other card
    sim.dispatch(new ResolvePromptAction(order.id, [1, 0]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([pokemon]);
    expect(player.deck.cards.slice(0, 2)).toEqual([energy, other]);
    expect(player.deck.cards.length).toEqual(52);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should play Pokenav - take nothing', () => {
    const { player } = TestUtils.getAll(sim);
    const top = player.deck.cards.slice(0, 3);

    play();
    const choose = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(choose.id, []));
    const order = TestUtils.lastPrompt(sim) as OrderCardsPrompt;
    sim.dispatch(new ResolvePromptAction(order.id, null));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
    expect(player.deck.cards.slice(0, 3)).toEqual(top);
  });

  it('Should play Pokenav - empty deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards = [];

    expect(play()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    expect(player.hand.cards).toEqual([trainerCard]);
  });

});

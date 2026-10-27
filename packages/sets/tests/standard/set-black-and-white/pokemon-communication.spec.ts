import {
  ChooseCardsPrompt,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { PokemonCommunication } from '../../../src/standard/set-black-and-white/pokemon-communication';
import { Tepig } from '../../../src/standard/set-black-and-white/tepig';
import { Emboar } from '../../../src/standard/set-black-and-white/emboar';
import { TestUtils } from '../../test-utils';

describe('Pokemon Communication TEU', () => {
  let sim: Simulator;
  let trainerCard: PokemonCommunication;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new PokemonCommunication();
    const player = sim.store.state.players[0];
    player.hand.cards = [trainerCard];
    player.deck.cards = TestUtils.makeTestCards(5);
  });

  function playCard(): string {
    let message = '';
    try {
      sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  function resolveShowCards() {
    const { opponent } = TestUtils.getAll(sim);
    const show = TestUtils.lastPrompt(sim, opponent);
    if (show !== undefined && show.type === 'Show cards' && show.result === undefined) {
      sim.dispatch(new ResolvePromptAction(show.id, true));
    }
  }

  // Reveal a Pokemon from your hand and put it into your deck. If you do, search your deck for a Pokemon,
  // reveal it, and put it into your hand. Then, shuffle your deck.
  it('Should swap a Pokemon from hand for one from the deck', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const fromHand = new Tepig();
    const fromDeck = new Emboar();
    player.hand.cards = [trainerCard, fromHand];
    player.deck.cards = [fromDeck, ...TestUtils.makeTestCards(4)];

    expect(playCard()).toEqual('');

    const handPrompt = prompts[0] as ChooseCardsPrompt;
    expect(handPrompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DECK,
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(handPrompt.id, [fromHand]));
    resolveShowCards();

    const deckPrompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(deckPrompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      message: GameMessage.CHOOSE_CARD_TO_HAND,
    }));
    sim.dispatch(new ResolvePromptAction(deckPrompt.id, [fromDeck]));
    resolveShowCards();

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toContain(fromDeck);
    expect(player.deck.cards).toContain(fromHand);
    expect(player.discard.cards).toContain(trainerCard);
  });

  it('Should not be playable with no Pokemon in hand', () => {
    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should keep the card in hand when the prompt is canceled', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const fromHand = new Tepig();
    player.hand.cards = [trainerCard, fromHand];

    expect(playCard()).toEqual('');
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(player.hand.cards).toContain(trainerCard);
    expect(player.hand.cards).toContain(fromHand);
    expect(player.discard.cards.length).toEqual(0);
  });
});

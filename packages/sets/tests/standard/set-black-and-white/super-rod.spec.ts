import {
  ChooseCardsPrompt,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { RainbowEnergy } from '../../../src/standard/set-black-and-white/rainbow-energy';
import { SuperRod } from '../../../src/standard/set-black-and-white/super-rod';
import { Tepig } from '../../../src/standard/set-black-and-white/tepig';
import { TestUtils } from '../../test-utils';

describe('Super Rod NV', () => {
  let sim: Simulator;
  let trainerCard: SuperRod;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new SuperRod();
    sim.store.state.players[0].hand.cards = [trainerCard];
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

  // Shuffle 3 in any combination of Pokemon and basic Energy cards from your discard pile back into your deck.
  it('Should shuffle 3 Pokemon or basic Energy back into the deck', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const tepig = new Tepig();
    const fire1 = new FireEnergy();
    const fire2 = new FireEnergy();
    player.discard.cards = [tepig, fire1, fire2];
    const deckBefore = player.deck.cards.length;

    expect(playCard()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DECK,
      cards: player.discard,
      options: jasmine.objectContaining({ min: 3, max: 3, allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [tepig, fire1, fire2]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.deck.cards.length).toEqual(deckBefore + 3);
    expect(player.deck.cards).toContain(tepig);
    expect(player.discard.cards).toContain(trainerCard);
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeTrue();
  });

  it('Should ask for fewer cards when the discard pile holds fewer', () => {
    const { player } = TestUtils.getAll(sim);
    player.discard.cards = [new Tepig()];

    expect(playCard()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.options).toEqual(jasmine.objectContaining({ min: 1, max: 1 }));
  });

  it('Should block cards that are neither Pokemon nor basic Energy', () => {
    const { player } = TestUtils.getAll(sim);
    // Special Energy and a plain card are not valid, the Tepig is
    player.discard.cards = [new RainbowEnergy(), new Tepig()];

    expect(playCard()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    const blocked = (prompt.options as { blocked: number[] }).blocked;
    expect(blocked).toContain(0);
    expect(blocked).not.toContain(1);
  });

  it('Should not be playable with nothing valid in the discard pile', () => {
    const { player } = TestUtils.getAll(sim);
    player.discard.cards = [new RainbowEnergy()];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should keep the card in hand when the prompt is canceled', () => {
    const { player } = TestUtils.getAll(sim);
    const tepig = new Tepig();
    player.discard.cards = [tepig];

    expect(playCard()).toEqual('');
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(player.hand.cards).toEqual([trainerCard]);
    expect(player.discard.cards).toEqual([tepig]);
  });
});

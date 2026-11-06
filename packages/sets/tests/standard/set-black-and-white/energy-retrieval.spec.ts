import {
  ChooseCardsPrompt,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { EnergyRetrieval } from '../../../src/standard/set-black-and-white/energy-retrieval';
import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { RainbowEnergy } from '../../../src/standard/set-black-and-white/rainbow-energy';
import { TestUtils } from '../../test-utils';

describe('Energy Retrieval SUM', () => {
  let sim: Simulator;
  let trainerCard: EnergyRetrieval;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new EnergyRetrieval();
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

  // Put 2 basic Energy cards from your discard pile into your hand.
  it('Should put 2 basic Energy cards into the hand', () => {
    const { player } = TestUtils.getAll(sim);
    const fire1 = new FireEnergy();
    const fire2 = new FireEnergy();
    player.discard.cards = [fire1, fire2, ...TestUtils.makeTestCards(1)];

    expect(playCard()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.discard,
      options: jasmine.objectContaining({ min: 2, max: 2, allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [fire1, fire2]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toContain(fire1);
    expect(player.hand.cards).toContain(fire2);
    expect(player.discard.cards).toContain(trainerCard);
  });

  it('Should ask for 1 card when only 1 basic Energy is in the discard pile', () => {
    const { player } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    player.discard.cards = [fire];

    expect(playCard()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.options).toEqual(jasmine.objectContaining({ min: 1, max: 1 }));
  });

  it('Should not be playable with no basic Energy in the discard pile', () => {
    const { player } = TestUtils.getAll(sim);
    // A Special Energy is not a basic Energy
    player.discard.cards = [new RainbowEnergy()];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should keep the card in hand when the prompt is canceled', () => {
    const { player } = TestUtils.getAll(sim);
    const fire = new FireEnergy();
    player.discard.cards = [fire, new FireEnergy()];

    expect(playCard()).toEqual('');
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(player.hand.cards).toEqual([trainerCard]);
    expect(player.discard.cards).toContain(fire);
  });
});

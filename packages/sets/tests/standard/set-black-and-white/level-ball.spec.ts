import {
  ChooseCardsPrompt,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Emboar } from '../../../src/standard/set-black-and-white/emboar';
import { LevelBall } from '../../../src/standard/set-black-and-white/level-ball';
import { Tepig } from '../../../src/standard/set-black-and-white/tepig';
import { TestUtils } from '../../test-utils';

describe('Level Ball NXD', () => {
  let sim: Simulator;
  let trainerCard: LevelBall;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new LevelBall();
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

  // Search your deck for a Pokemon with 90 HP or less, reveal it, and put it into your hand.
  // Shuffle your deck afterward.
  it('Should put a Pokemon with 90 HP or less into the hand', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const tepig = new Tepig();
    player.deck.cards = [tepig, ...TestUtils.makeTestCards(4)];

    expect(playCard()).toEqual('');

    const prompt = prompts[0] as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [tepig]));

    // The card is revealed to the opponent
    const show = TestUtils.lastPrompt(sim, opponent);
    if (show !== undefined && show.type === 'Show cards' && show.result === undefined) {
      sim.dispatch(new ResolvePromptAction(show.id, true));
    }

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toContain(tepig);
    expect(player.deck.cards).not.toContain(tepig);
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeTrue();
  });

  it('Should block Pokemon with more than 90 HP', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const emboar = new Emboar();
    const tepig = new Tepig();
    player.deck.cards = [emboar, tepig];

    expect(playCard()).toEqual('');

    const prompt = prompts[0] as ChooseCardsPrompt;
    const blocked = (prompt.options as { blocked: number[] }).blocked;
    // Emboar (index 0) has more than 90 HP, Tepig (index 1) does not
    expect(blocked).toContain(0);
    expect(blocked).not.toContain(1);
  });

  it('Should not be playable with an empty deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards = [];

    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should take nothing when the prompt is canceled', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const tepig = new Tepig();
    player.deck.cards = [tepig];

    expect(playCard()).toEqual('');
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(player.deck.cards).toContain(tepig);
    expect(player.hand.cards).not.toContain(tepig);
  });
});

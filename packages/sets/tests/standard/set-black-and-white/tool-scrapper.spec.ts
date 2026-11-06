import {
  ChoosePokemonPrompt,
  GameMessage,
  PlayCardAction,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { ExpShare } from '../../../src/standard/set-black-and-white/exp-share';
import { ToolScrapper } from '../../../src/standard/set-black-and-white/tool-scrapper';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Tool Scrapper DRX', () => {
  let sim: Simulator;
  let trainerCard: ToolScrapper;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new ToolScrapper();
    sim.store.state.players[0].hand.cards = [trainerCard];
    TestUtils.setActive(sim, [new TestPokemon()]);
    TestUtils.setDefending(sim, [new TestPokemon()]);
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

  // Choose up to 2 Pokemon Tool cards attached to Pokemon in play and discard them.
  it('Should discard a Tool from the opponents Pokemon', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const tool = new ExpShare();
    opponent.active.trainers.cards = [tool];

    expect(playCard()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose pokemon',
      playerId: player.id,
      message: GameMessage.CHOOSE_POKEMON_TO_DISCARD_CARDS,
      playerType: PlayerType.ANY,
      slots: [SlotType.ACTIVE, SlotType.BENCH],
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.active]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.active.trainers.cards.length).toEqual(0);
    expect(opponent.discard.cards).toContain(tool);
    expect(player.discard.cards).toContain(trainerCard);
  });

  it('Should discard Tools from both players, up to 2', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const mine = new ExpShare();
    const theirs = new ExpShare();
    player.active.trainers.cards = [mine];
    opponent.active.trainers.cards = [theirs];

    expect(playCard()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt.options).toEqual(jasmine.objectContaining({ min: 1, max: 2 }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.active, opponent.active]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    // Each Tool goes to its own owner's discard pile
    expect(player.discard.cards).toContain(mine);
    expect(opponent.discard.cards).toContain(theirs);
  });

  it('Should not be playable when no Pokemon holds a Tool', () => {
    expect(playCard()).toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
  });

  it('Should keep the card in hand when the prompt is canceled', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const tool = new ExpShare();
    opponent.active.trainers.cards = [tool];

    expect(playCard()).toEqual('');
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(player.hand.cards).toEqual([trainerCard]);
    expect(opponent.active.trainers.cards).toEqual([tool]);
  });
});

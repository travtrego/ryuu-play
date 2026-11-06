import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Linoone } from '../../../src/ex-sets/set-ruby-and-sapphire/linoone';
import { TestUtils } from '../../test-utils';

describe('Linoone RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Linoone()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Seek Out - Search your deck for up to 2 cards and put them into your hand. Shuffle your deck afterward.
  it('Should use Seek Out - take 2 cards', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const selected = player.deck.cards.slice(10, 12);

    sim.dispatch(new AttackAction(1, 'Seek Out'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
      options: jasmine.objectContaining({ min: 0, max: 2, allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, selected));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(player.hand.cards).toEqual(selected);
    expect(player.deck.cards.length).toEqual(48);
  });

  it('Should use Seek Out - canceled', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Seek Out'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
    expect(player.deck.cards.length).toEqual(50);
  });

  it('Should use Seek Out - empty deck', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.deck.cards = [];

    sim.dispatch(new AttackAction(1, 'Seek Out'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
  });

  // Continuous Headbutt (40x) - Flip a coin until you get tails. This attack does 40 damage times the number of
  // heads.
  it('Should use Continuous Headbutt - 3 heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true, true, false]);

    sim.dispatch(new AttackAction(1, 'Continuous Headbutt'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(120);
  });

  it('Should use Continuous Headbutt - tails first', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Continuous Headbutt'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});

import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  ResolvePromptAction,
  SelectPrompt,
  ShowCardsPrompt,
  Simulator,
  SpecialCondition,
  UseAbilityAction,
} from '@ptcg/common';

import { Mankey } from '../../../src/base-sets/set-jungle/mankey';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Mankey JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Mankey()],
      [CardType.COLORLESS],
    );
  });

  function usePeek(): SelectPrompt {
    const { player } = TestUtils.getAll(sim);
    sim.dispatch(new UseAbilityAction(1, 'Peek', TestUtils.target(sim, player.active)));
    return TestUtils.lastPrompt(sim) as SelectPrompt;
  }

  function choose(select: SelectPrompt, option: GameMessage) {
    const index = select.values.indexOf(option);
    expect(index).not.toEqual(-1);
    sim.dispatch(new ResolvePromptAction(select.id, index));
  }

  // Peek - Once during your turn (before your attack), you may look at one of the following: the top card of either
  // player's deck, a random card from your opponent's hand, or one of either player's Prizes. This power can't be
  // used if Mankey is Asleep, Confused, or Paralyzed.
  it('Should use Peek to look at the top card of your deck', () => {
    const { player } = TestUtils.getAll(sim);
    const topCard = player.deck.cards[0];

    const select = usePeek();
    expect(select).toEqual(jasmine.objectContaining({
      type: 'Select',
      playerId: player.id,
      message: GameMessage.CHOOSE_OPTION,
    }));
    choose(select, GameMessage.REVEAL_TOP_DECK_CARD);

    const show = TestUtils.lastPrompt(sim) as ShowCardsPrompt;
    expect(show).toEqual(jasmine.objectContaining({ type: 'Show cards', playerId: player.id, cards: [topCard] }));
    sim.dispatch(new ResolvePromptAction(show.id, true));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.deck.cards[0]).toBe(topCard);
    expect(player.hand.cards).toEqual([]);
  });

  it('Should use Peek to look at the top card of the opponent\'s deck', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    const topCard = opponent.deck.cards[0];

    choose(usePeek(), GameMessage.REVEAL_OPPONENT_TOP_DECK_CARD);

    const show = TestUtils.lastPrompt(sim) as ShowCardsPrompt;
    expect(show).toEqual(jasmine.objectContaining({ type: 'Show cards', playerId: player.id, cards: [topCard] }));
    expect(opponent.deck.cards[0]).toBe(topCard);
  });

  it('Should use Peek to look at a hidden card from the opponent\'s hand', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    const handCard = new TestCard();
    opponent.hand.cards = [handCard, new TestCard()];

    choose(usePeek(), GameMessage.REVEAL_OPPONENT_HAND_CARD);

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      cards: opponent.hand,
      options: jasmine.objectContaining({ min: 1, max: 1, isSecret: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [handCard]));

    const show = TestUtils.lastPrompt(sim) as ShowCardsPrompt;
    expect(show).toEqual(jasmine.objectContaining({ type: 'Show cards', playerId: player.id, cards: [handCard] }));
    expect(opponent.hand.cards.length).toEqual(2);
  });

  it('Should use Peek to look at one of the opponent\'s Prizes', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    const prize = opponent.prizes[2].cards[0];

    choose(usePeek(), GameMessage.REVEAL_OPPONENT_PRIZE_CARD);

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      options: jasmine.objectContaining({ min: 1, max: 1, isSecret: true }),
    }));
    expect(prompt.cards.cards.length).toEqual(6);
    sim.dispatch(new ResolvePromptAction(prompt.id, [prize]));

    const show = TestUtils.lastPrompt(sim) as ShowCardsPrompt;
    expect(show).toEqual(jasmine.objectContaining({ type: 'Show cards', playerId: player.id, cards: [prize] }));
    expect(opponent.prizes[2].cards).toEqual([prize]);
  });

  it('Should use Peek to look at one of your Prizes', () => {
    const { player } = TestUtils.getAll(sim);
    const prize = player.prizes[0].cards[0];

    choose(usePeek(), GameMessage.REVEAL_PRIZE_CARD);

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [prize]));

    const show = TestUtils.lastPrompt(sim) as ShowCardsPrompt;
    expect(show).toEqual(jasmine.objectContaining({ type: 'Show cards', playerId: player.id, cards: [prize] }));
  });

  it('Should use Peek only once per turn', () => {
    choose(usePeek(), GameMessage.REVEAL_TOP_DECK_CARD);
    const show = TestUtils.lastPrompt(sim) as ShowCardsPrompt;
    sim.dispatch(new ResolvePromptAction(show.id, true));

    let message = '';
    try {
      usePeek();
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(message).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Should use Peek again during your next turn', () => {
    const { player } = TestUtils.getAll(sim);
    choose(usePeek(), GameMessage.REVEAL_TOP_DECK_CARD);
    sim.dispatch(new ResolvePromptAction((TestUtils.lastPrompt(sim) as ShowCardsPrompt).id, true));

    sim.dispatch(new AttackAction(1, 'Scratch'));
    sim.dispatch(new AttackAction(2, 'Test attack'));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();

    const select = usePeek();
    expect(select).toEqual(jasmine.objectContaining({ type: 'Select', playerId: player.id }));
  });

  [SpecialCondition.ASLEEP, SpecialCondition.CONFUSED, SpecialCondition.PARALYZED].forEach(condition => {
    it(`Should not use Peek when Mankey is ${condition}`, () => {
      const { player } = TestUtils.getAll(sim);
      player.active.addSpecialCondition(condition);

      let message = '';
      try {
        usePeek();
      } catch (error) {
        message = TestUtils.getErrorMessage(error);
      }

      expect(message).toEqual(GameMessage.CANNOT_USE_POWER);
      expect(TestUtils.getAll(sim).prompts.length).toEqual(0);
    });
  });

  // Scratch (10)
  it('Should use Scratch', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Scratch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });
});

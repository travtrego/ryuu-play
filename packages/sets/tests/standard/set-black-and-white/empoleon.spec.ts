import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  PassTurnAction,
  ResolvePromptAction,
  Simulator,
  UseAbilityAction,
} from '@ptcg/common';

import { Empoleon } from '../../../src/standard/set-black-and-white/empoleon';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Empoleon DEX', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Empoleon()], [CardType.WATER]);
  });

  function useDivingDraw(): string {
    const { player } = TestUtils.getAll(sim);
    let message = '';
    try {
      sim.dispatch(new UseAbilityAction(1, 'Diving Draw', TestUtils.target(sim, player.active)));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Diving Draw - Once during your turn (before your attack), you may discard a card from your hand.
  // If you do, draw 2 cards.
  it('Should use Diving Draw to discard 1 card and draw 2', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = TestUtils.makeTestCards(3);
    const discarded = player.hand.cards[0];
    const handBefore = player.hand.cards.length;

    expect(useDivingDraw()).toEqual('');

    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_DISCARD,
      options: jasmine.objectContaining({ min: 1, max: 1, allowCancel: true }),
    }));
    sim.dispatch(new ResolvePromptAction(prompt.id, [discarded]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    // -1 discarded, +2 drawn
    expect(player.hand.cards.length).toEqual(handBefore + 1);
    expect(player.discard.cards).toEqual([discarded]);
  });

  it('Should not use Diving Draw with an empty hand', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = [];

    expect(useDivingDraw()).toEqual(GameMessage.CANNOT_USE_POWER);
  });

  it('Should not use Diving Draw twice in the same turn', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = TestUtils.makeTestCards(3);

    expect(useDivingDraw()).toEqual('');
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.hand.cards[0]]));

    expect(useDivingDraw()).toEqual(GameMessage.POWER_ALREADY_USED);
  });

  it('Should use Diving Draw again on the next turn', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = TestUtils.makeTestCards(3);

    expect(useDivingDraw()).toEqual('');
    let prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [player.hand.cards[0]]));

    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));

    expect(useDivingDraw()).toEqual('');
    prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt.type).toEqual('Choose cards');
  });

  it('Should keep the card when the Diving Draw prompt is canceled', () => {
    const { player } = TestUtils.getAll(sim);
    player.hand.cards = TestUtils.makeTestCards(3);
    const handBefore = player.hand.cards.length;

    expect(useDivingDraw()).toEqual('');
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(player.hand.cards.length).toEqual(handBefore);
    expect(player.discard.cards.length).toEqual(0);
    // The ability was not used, so it is still available
    expect(useDivingDraw()).toEqual('');
  });

  // Attack Command (10x) - Does 10 damage times the number of Pokemon in play
  // (both yours and your opponent's).
  it('Should use Attack Command for 10 per Pokemon in play', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);

    // Empoleon + 1 Benched + opponent Active + 2 Benched = 5
    sim.dispatch(new AttackAction(1, 'Attack Command'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Attack Command with only the two Active Pokemon in play', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Attack Command'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });
});

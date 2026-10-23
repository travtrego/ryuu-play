import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  GameMessage,
  ResolvePromptAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Beautifly } from '../../../src/ex-sets/set-ruby-and-sapphire/beautifly';
import { Cascoon } from '../../../src/ex-sets/set-ruby-and-sapphire/cascoon';
import { Dustox } from '../../../src/ex-sets/set-ruby-and-sapphire/dustox';
import { Silcoon } from '../../../src/ex-sets/set-ruby-and-sapphire/silcoon';
import { Wurmple } from '../../../src/ex-sets/set-ruby-and-sapphire/wurmple';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Wurmple RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Wurmple()], [CardType.GRASS]);
  });

  // Signs of Evolution - Search your deck for Silcoon and Beautifly, or Cascoon and Dustox cards. Show 1 card or
  // both cards of a pair to your opponent and put them into your hand. Shuffle your deck afterward.
  it('Should use Signs of Evolution - Silcoon and Beautifly', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const silcoon = new Silcoon();
    const beautifly = new Beautifly();
    const other = new TestPokemon();
    player.deck.cards.push(other, silcoon, beautifly, new Cascoon());

    sim.dispatch(new AttackAction(1, 'Signs of Evolution'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(prompt).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
      options: jasmine.objectContaining({ min: 1, max: 2, allowCancel: true }),
    }));
    expect(prompt.options.blocked).toContain(player.deck.cards.indexOf(other));
    expect(prompt.options.blocked).not.toContain(player.deck.cards.indexOf(silcoon));
    sim.dispatch(new ResolvePromptAction(prompt.id, [silcoon, beautifly]));

    const show = TestUtils.lastPrompt(sim);
    expect(show).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: opponent.id,
      cards: [silcoon, beautifly],
    }));
    sim.dispatch(new ResolvePromptAction((show as ChooseCardsPrompt).id, true));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([silcoon, beautifly]);
  });

  it('Should use Signs of Evolution - one card of a pair', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const dustox = new Dustox();
    player.deck.cards.push(dustox);

    sim.dispatch(new AttackAction(1, 'Signs of Evolution'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [dustox]));
    const show = TestUtils.lastPrompt(sim);
    sim.dispatch(new ResolvePromptAction((show as ChooseCardsPrompt).id, true));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([dustox]);
  });

  it('Should use Signs of Evolution - cards from different pairs are rejected', () => {
    const { player } = TestUtils.getAll(sim);
    const silcoon = new Silcoon();
    const dustox = new Dustox();
    player.deck.cards.push(silcoon, dustox);

    sim.dispatch(new AttackAction(1, 'Signs of Evolution'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, [silcoon, dustox]));

    // asked again
    const next = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    expect(next.id).not.toEqual(prompt.id);
    expect(next.type).toEqual('Choose cards');
    expect(player.hand.cards).toEqual([]);
  });

  it('Should use Signs of Evolution - canceled', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Signs of Evolution'));

    const prompt = TestUtils.lastPrompt(sim) as ChooseCardsPrompt;
    sim.dispatch(new ResolvePromptAction(prompt.id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
  });

  // Poison Barb - The Defending Pokémon is now Poisoned.
  it('Should use Poison Barb', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Poison Barb'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(opponent.active.damage).toEqual(10);
  });

});

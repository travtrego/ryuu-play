import {
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Lass } from '../../../src/base-sets/set-base/lass';
import { Bill } from '../../../src/base-sets/set-base/bill';
import { Charmander } from '../../../src/base-sets/set-base/charmander';
import { FireEnergy } from '../../../src/base-sets/set-base/fire-energy';
import { Potion } from '../../../src/base-sets/set-base/potion';
import { TestUtils } from '../../test-utils';

describe('Lass BS', () => {
  let sim: Simulator;
  let trainerCard: Lass;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Lass();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should show hands and shuffle all Trainer cards from both hands into the decks', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const bill = new Bill();
    const charmander = new Charmander();
    const potion = new Potion();
    const fire = new FireEnergy();
    player.hand.cards = [trainerCard, bill, charmander];
    opponent.hand.cards = [potion, fire];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts.length).toEqual(2);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: opponent.id,
      message: GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,
      cards: [bill, charmander],
    }));
    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: player.id,
      message: GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,
      cards: [potion, fire],
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, true));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, true));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([charmander]);
    expect(opponent.hand.cards).toEqual([fire]);
    expect(player.deck.cards.length).toEqual(51);
    expect(player.deck.cards.includes(bill)).toBeTrue();
    expect(opponent.deck.cards.length).toEqual(51);
    expect(opponent.deck.cards.includes(potion)).toBeTrue();
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should not shuffle non-Trainer cards into the decks', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const charmander = new Charmander();
    const fire = new FireEnergy();
    player.hand.cards = [trainerCard, charmander];
    opponent.hand.cards = [fire];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    prompts.slice().forEach(p => sim.dispatch(new ResolvePromptAction(p.id, true)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.hand.cards).toEqual([charmander]);
    expect(opponent.hand.cards).toEqual([fire]);
    expect(player.deck.cards.length).toEqual(50);
    expect(opponent.deck.cards.length).toEqual(50);
  });
});

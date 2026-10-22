import {
  CardType,
  GameMessage,
  PlayCardAction,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Pokedex } from '../../../src/base-sets/set-base/pokedex';
import { TestUtils } from '../../test-utils';

describe('Pokedex BS', () => {
  let sim: Simulator;
  let trainerCard: Pokedex;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new Pokedex();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should rearrange the top 5 cards of the deck', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const cards = TestUtils.makeEnergies([
      CardType.FIRE, CardType.WATER, CardType.GRASS, CardType.LIGHTNING, CardType.PSYCHIC, CardType.FIGHTING
    ]);
    const [a, b, c, d, e, f] = cards;
    player.deck.cards = cards.slice();

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Order cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARDS_ORDER,
    }));
    expect((prompts[0] as any).cards.cards).toEqual([a, b, c, d, e]);

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [4, 3, 2, 1, 0]));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.deck.cards).toEqual([e, d, c, b, a, f]);
    expect(player.hand.cards).toEqual([]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should look at the whole deck when it has fewer than 5 cards', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const cards = TestUtils.makeEnergies([CardType.FIRE, CardType.WATER, CardType.GRASS]);
    const [a, b, c] = cards;
    player.deck.cards = cards.slice();

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    expect((prompts[0] as any).cards.cards).toEqual([a, b, c]);

    sim.dispatch(new ResolvePromptAction(prompts[0].id, [2, 0, 1]));

    expect(player.deck.cards).toEqual([c, a, b]);
  });
});

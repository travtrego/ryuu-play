import {
  CardType,
  PlayCardAction,
  Simulator,
} from '@ptcg/common';

import { ImpostorProfessorOak } from '../../../src/base-sets/set-base/impostor-professor-oak';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Impostor Professor Oak BS', () => {
  let sim: Simulator;
  let trainerCard: ImpostorProfessorOak;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    trainerCard = new ImpostorProfessorOak();
    sim.store.state.players[0].hand.cards = [trainerCard];
  });

  it('Should make the opponent shuffle their hand into the deck and draw 7 cards', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const [fire, water] = TestUtils.makeEnergies([CardType.FIRE, CardType.WATER]);
    opponent.hand.cards = [fire, water];
    const playerHandCard = new TestCard();
    player.hand.cards = [trainerCard, playerHandCard];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(prompts[0]).toEqual(jasmine.objectContaining({ type: 'Shuffle deck', playerId: opponent.id }));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.hand.cards.length).toEqual(7);
    expect(opponent.deck.cards.length).toEqual(45);
    // reverse shuffle puts the former hand cards on top of the deck
    expect(opponent.hand.cards.slice(0, 2)).toEqual([water, fire]);
    expect(player.hand.cards).toEqual([playerHandCard]);
    expect(player.discard.cards).toEqual([trainerCard]);
  });

  it('Should make the opponent draw 7 cards when their hand is empty', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.hand.cards = [];

    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(opponent.hand.cards.length).toEqual(7);
    expect(opponent.deck.cards.length).toEqual(43);
    expect(player.discard.cards).toEqual([trainerCard]);
  });
});

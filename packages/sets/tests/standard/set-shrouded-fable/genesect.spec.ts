import { CardType, PlayCardAction, Simulator } from '@ptcg/common';

import { Genesect } from '../../../src/standard/set-shrouded-fable/genesect';
import { UnfairStamp } from '../../../src/standard/set-twilight-masquerade/unfair-stamp';
import { LuckyHelmet } from '../../../src/standard/set-twilight-masquerade/lucky-helmet';
import { TestUtils } from '../../test-utils';

describe('Genesect SFA', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
  });

  it('Should have the printed stats', () => {
    const card = new Genesect();
    expect([card.hp, card.cardTypes[0], card.retreat.length]).toEqual([110, CardType.METAL, 1]);
  });

  it('with a Tool attached, the opponent can\'t play ACE SPEC cards', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0].pokemons.cards = [new Genesect()];
    opponent.bench[0].trainers.cards = [new LuckyHelmet()];
    player.knockedOutTurn = 4;
    player.hand.cards = [new UnfairStamp()];
    expect(() => sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)))).toThrow();
  });

  it('without a Tool, ACE SPEC cards can be played', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    opponent.bench[0].pokemons.cards = [new Genesect()];
    player.knockedOutTurn = 4;
    player.hand.cards = [new UnfairStamp()];
    sim.dispatch(new PlayCardAction(1, 0, TestUtils.target(sim)));
    expect(player.hand.cards.length).toEqual(5);
  });
});

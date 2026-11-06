import {
  AttackAction,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { N } from '../../../src/standard/set-diamond-and-pearl/n';
import { Sableye } from '../../../src/standard/set-diamond-and-pearl/sableye';
import { TestUtils } from '../../test-utils';

describe('Sableye SF', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    TestUtils.setActive(sim, [new Sableye()], []);
  });

  // Impersonate - Search your deck for a Supporter card and discard it. Shuffle your deck afterward.
  // Then, use the effect of that card as the effect of this attack.
  it('Should shuffle the deck before using the Supporter\'s effect', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const n = new N();
    const others = TestUtils.makeTestCards(10);
    player.deck.cards = [n, ...others];

    sim.dispatch(new AttackAction(1, 'Impersonate'));

    const choose = prompts.find(p => p.type === 'Choose cards');
    expect(choose).toEqual(jasmine.objectContaining({
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_COPY_EFFECT,
    }));
    sim.dispatch(new ResolvePromptAction(choose!.id, [n]));

    const playerShuffles = prompts.filter(p => p.type === 'Shuffle deck' && p.playerId === player.id);
    const opponentShuffle = prompts.find(p => p.type === 'Shuffle deck' && p.playerId !== player.id);
    // Two shuffles for the player: Sableye's own, then N's. The opponent only shuffles because of N,
    // so Sableye's shuffle must come before the opponent's.
    expect(playerShuffles.length).toEqual(2);
    expect(opponentShuffle).toBeDefined();
    expect(prompts.indexOf(playerShuffles[0])).toBeLessThan(prompts.indexOf(opponentShuffle!));
    expect(player.deck.cards).not.toContain(n);
    // N's effect resolved: the player drew one card per remaining Prize
    expect(player.hand.cards.length).toEqual(player.getPrizeLeft());
  });

  it('Should do nothing when no Supporter is chosen', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    const others = TestUtils.makeTestCards(5);
    player.deck.cards = [...others];

    sim.dispatch(new AttackAction(1, 'Impersonate'));
    const choose = prompts.find(p => p.type === 'Choose cards');
    sim.dispatch(new ResolvePromptAction(choose!.id, []));

    expect(player.deck.cards.length).toEqual(5);
    expect(prompts.some(p => p.type === 'Shuffle deck')).toBeFalse();
  });
});

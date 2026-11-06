import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Moltres } from '../../../src/base-sets/set-fossil/moltres';
import { TestUtils } from '../../test-utils';

describe('Moltres FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
  });

  // Wildfire - You may discard any number of R Energy cards attached to Moltres when you use this attack. If you do,
  // discard that many cards from the top of your opponent's deck.
  it('Should use Wildfire and discard 2 Fire Energy', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Moltres()], [CardType.FIRE, CardType.FIRE, CardType.FIRE, CardType.WATER]);
    const [fire1, fire2, fire3, water] = player.active.energies.cards;
    const topCards = opponent.deck.cards.slice(0, 2);
    const deckSize = opponent.deck.cards.length;

    sim.dispatch(new AttackAction(1, 'Wildfire'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_ENERGIES_TO_DISCARD,
      cards: player.active.energies,
      options: jasmine.objectContaining({ min: 0, blocked: [3] })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [fire1, fire3]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.energies.cards).toEqual([fire2, water]);
    expect(player.discard.cards).toEqual([fire1, fire3]);
    expect(opponent.discard.cards).toEqual(topCards);
    // 2 discarded, then 1 drawn at the start of the opponent's turn
    expect(opponent.deck.cards.length).toEqual(deckSize - 3);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Wildfire and discard nothing', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Moltres()], [CardType.FIRE, CardType.FIRE]);

    sim.dispatch(new AttackAction(1, 'Wildfire'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, []));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.energies.cards.length).toEqual(2);
    expect(opponent.discard.cards).toEqual([]);
  });

  // Dive Bomb (80) - Flip a coin. If tails, this attack does nothing.
  it('Should use Dive Bomb - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Moltres()], [CardType.FIRE, CardType.FIRE, CardType.FIRE, CardType.FIRE]);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Dive Bomb'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(80);
  });

  it('Should use Dive Bomb - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new Moltres()], [CardType.FIRE, CardType.FIRE, CardType.FIRE, CardType.FIRE]);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Dive Bomb'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});

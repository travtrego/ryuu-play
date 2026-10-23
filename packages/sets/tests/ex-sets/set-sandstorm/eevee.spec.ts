import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { Eevee } from '../../../src/ex-sets/set-sandstorm/eevee';
import { Espeon } from '../../../src/ex-sets/set-sandstorm/espeon';
import { Flareon } from '../../../src/ex-sets/set-sandstorm/flareon';
import { Jolteon } from '../../../src/ex-sets/set-sandstorm/jolteon';
import { TestCard } from '../../test-cards/test-card';
import { TestUtils } from '../../test-utils';

describe('Eevee SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Eevee()], [CardType.COLORLESS]);
  });

  // Signs of Evolution - Search your deck for up to 3 cards that evolve from Eevee, show them to your opponent, and
  // put them into your hand. Shuffle your deck afterward.
  it('Should use Signs of Evolution', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const espeon = new Espeon();
    const flareon = new Flareon();
    const jolteon = new Jolteon();
    const card = new TestCard();
    player.deck.cards = [espeon, card, flareon, jolteon];

    sim.dispatch(new AttackAction(1, 'Signs of Evolution'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.deck,
      filter: jasmine.objectContaining({ evolvesFrom: 'Eevee' }),
      options: jasmine.objectContaining({ min: 0, max: 3 })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [espeon, flareon]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: opponent.id,
      cards: [espeon, flareon]
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, true));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([espeon, flareon]);
    expect(player.deck.cards).toEqual([jolteon, card]);
  });

  it('Should use Signs of Evolution and choose nothing', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const espeon = new Espeon();
    player.deck.cards = [espeon];

    sim.dispatch(new AttackAction(1, 'Signs of Evolution'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, []));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
    expect(player.deck.cards).toEqual([espeon]);
  });

  it('Should use Signs of Evolution with an empty deck', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.deck.cards = [];

    sim.dispatch(new AttackAction(1, 'Signs of Evolution'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
  });

  // Quick Attack (10+) - Flip a coin. If heads, this attack does 10 damage plus 10 more damage.
  it('Should use Quick Attack - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Quick Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Quick Attack - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Quick Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });
});

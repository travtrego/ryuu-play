import {
  AttackAction,
  CardType,
  GameMessage,
  PlayerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
} from '@ptcg/common';

import { Azumarill } from '../../../src/ex-sets/set-sandstorm/azumarill';
import { TestUtils } from '../../test-utils';

describe('Azumarill SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Azumarill()], [CardType.WATER, CardType.COLORLESS]);
  });

  // Drizzle - If you have W Energy cards in your hand, attach as many W Energy cards as you like to any of your
  // Active Pokémon.
  it('Should use Drizzle and attach Water Energy cards from hand', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const [water1, water2, grass] = TestUtils.makeEnergies([CardType.WATER, CardType.WATER, CardType.GRASS]);
    player.hand.cards = [water1, water2, grass];

    sim.dispatch(new AttackAction(1, 'Drizzle'));

    expect(prompts.length).toEqual(1);
    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Attach energy',
      playerId: player.id,
      message: GameMessage.ATTACH_ENERGY_TO_ACTIVE,
      cardList: player.hand,
      playerType: PlayerType.BOTTOM_PLAYER,
      slots: [SlotType.ACTIVE],
      options: jasmine.objectContaining({ allowCancel: true })
    }));

    const to = TestUtils.target(sim, player.active);
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [{ card: water1, to }, { card: water2, to }]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([grass]);
    expect(player.active.energies.cards).toEqual(TestUtils.makeEnergies(
      [CardType.WATER, CardType.COLORLESS, CardType.WATER, CardType.WATER]));
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Drizzle and cancel', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.hand.cards = TestUtils.makeEnergies([CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Drizzle'));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, null));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards.length).toEqual(1);
    expect(player.active.energies.cards.length).toEqual(2);
  });

  it('Should use Drizzle without Water Energy cards in hand', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.hand.cards = TestUtils.makeEnergies([CardType.GRASS]);

    sim.dispatch(new AttackAction(1, 'Drizzle'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards.length).toEqual(1);
  });

  // Max Bubbles (30x) - Flip a coin for each Energy attached to all of your Active Pokémon. This attack does 30
  // damage times the number of heads.
  it('Should use Max Bubbles - flips a coin for each Energy', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([CardType.WATER, CardType.COLORLESS, CardType.WATER]);
    TestUtils.setFlipResults(sim, [true, false, true]);

    sim.dispatch(new AttackAction(1, 'Max Bubbles'));

    expect(prompts.filter(p => p.type === 'Coin flip').length).toEqual(3);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Max Bubbles - all heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Max Bubbles'));

    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Max Bubbles - all tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Max Bubbles'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});

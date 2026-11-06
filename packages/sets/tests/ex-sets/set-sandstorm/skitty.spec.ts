import {
  AttackAction,
  CardType,
  GameMessage,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { MultiEnergy } from '../../../src/ex-sets/set-sandstorm/multi-energy';
import { Skitty } from '../../../src/ex-sets/set-sandstorm/skitty';
import { TestUtils } from '../../test-utils';

describe('Skitty SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Skitty()], [CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Energy Catch - Search your discard pile for a basic Energy card, show it to your opponent, and put it into your
  // hand.
  it('Should use Energy Catch', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const [water] = TestUtils.makeEnergies([CardType.WATER]);
    const multi = new MultiEnergy();
    player.discard.cards = [multi, water];

    sim.dispatch(new AttackAction(1, 'Energy Catch'));

    expect(prompts[0]).toEqual(jasmine.objectContaining({
      type: 'Choose cards',
      playerId: player.id,
      message: GameMessage.CHOOSE_CARD_TO_HAND,
      cards: player.discard,
      options: jasmine.objectContaining({ min: 1, max: 1 })
    }));
    sim.dispatch(new ResolvePromptAction(prompts[0].id, [water]));

    expect(prompts[1]).toEqual(jasmine.objectContaining({
      type: 'Show cards',
      playerId: opponent.id,
      cards: [water]
    }));
    sim.dispatch(new ResolvePromptAction(prompts[1].id, true));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([water]);
    expect(player.discard.cards).toEqual([multi]);
  });

  it('Should use Energy Catch without basic Energy in the discard pile', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.discard.cards = [new MultiEnergy()];

    sim.dispatch(new AttackAction(1, 'Energy Catch'));

    expect(prompts.length).toEqual(0);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.hand.cards).toEqual([]);
  });

  // Double-edge (30) - Skitty does 10 damage to itself.
  it('Should use Double-edge', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Double-edge'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.damage).toEqual(10);
  });
});

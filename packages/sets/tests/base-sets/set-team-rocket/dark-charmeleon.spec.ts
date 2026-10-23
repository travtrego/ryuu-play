import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { DarkCharmeleon } from '../../../src/base-sets/set-team-rocket/dark-charmeleon';
import { TestUtils } from '../../test-utils';

describe('Dark Charmeleon TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new DarkCharmeleon()],
      [CardType.FIRE, CardType.FIRE, CardType.FIRE, CardType.WATER]
    );
  });

  // Tail Slap (20)
  it('Should use Tail Slap', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Tail Slap'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Fireball (70) - Use this attack only if there are any R Energy cards attached to Dark Charmeleon. Flip a coin.
  // If heads, discard 1 of those Energy cards. If tails, this attack does nothing (not even damage).
  it('Should use Fireball - heads does 70 and discards a R Energy card', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const [f1, f2, f3, water] = player.active.energies.cards;
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Fireball'));

    const choose = prompts.find(p => p.type === 'Choose cards') as ChooseCardsPrompt;
    expect(choose).toEqual(jasmine.objectContaining({
      playerId: player.id,
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    expect(choose.validate([water])).toBeFalse();
    sim.dispatch(new ResolvePromptAction(choose.id, [f2]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(70);
    expect(player.active.energies.cards).toEqual([f1, f3, water]);
    expect(player.discard.cards).toEqual([f2]);
  });

  it('Should use Fireball - tails does nothing', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Fireball'));

    expect(prompts.some(p => p.type === 'Choose cards')).toBeFalse();
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(player.active.energies.cards.length).toEqual(4);
  });
});

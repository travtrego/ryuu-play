import {
  AttackAction,
  CardType,
  ChooseCardsPrompt,
  ResolvePromptAction,
  Simulator,
} from '@ptcg/common';

import { DarkFlareon } from '../../../src/base-sets/set-team-rocket/dark-flareon';
import { TestUtils } from '../../test-utils';

describe('Dark Flareon TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new DarkFlareon()],
      [CardType.FIRE, CardType.FIRE, CardType.WATER]
    );
  });

  // Rage (10+) - Does 10 damage plus 10 more damage for each damage counter on Dark Flareon.
  it('Should use Rage without damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rage'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Rage with 3 damage counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Rage'));

    expect(opponent.active.damage).toEqual(40);
  });

  // Playing with Fire (30+) - Use this attack only if there are any R Energy cards attached to Dark Flareon. Flip a
  // coin. If heads, discard 1 of those Energy cards and this attack does 30 damage plus 20 more damage; if tails,
  // this attack does 30 damage.
  it('Should use Playing with Fire - heads discards a R Energy card and does 50', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    const [f1, f2, water] = player.active.energies.cards;
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Playing with Fire'));

    const choose = prompts.find(p => p.type === 'Choose cards') as ChooseCardsPrompt;
    expect(choose).toEqual(jasmine.objectContaining({
      playerId: player.id,
      options: jasmine.objectContaining({ min: 1, max: 1 }),
    }));
    expect(choose.validate([water])).toBeFalse();
    sim.dispatch(new ResolvePromptAction(choose.id, [f1]));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(player.active.energies.cards).toEqual([f2, water]);
    expect(player.discard.cards).toEqual([f1]);
  });

  it('Should use Playing with Fire - tails does 30', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Playing with Fire'));

    expect(prompts.some(p => p.type === 'Choose cards')).toBeFalse();
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(player.active.energies.cards.length).toEqual(3);
  });
});

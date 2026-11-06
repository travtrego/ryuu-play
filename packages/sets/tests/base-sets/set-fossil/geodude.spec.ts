import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Geodude } from '../../../src/base-sets/set-fossil/geodude';
import { TestUtils } from '../../test-utils';

describe('Geodude FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Geodude()],
      [CardType.FIGHTING, CardType.COLORLESS]
    );
  });

  // Stone Barrage (10×) - Flip a coin until you get tails. This attack does 10 damage times the number of heads.
  it('Should use Stone Barrage - 3 heads then tails', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true, true, false]);

    sim.dispatch(new AttackAction(1, 'Stone Barrage'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(prompts.filter(p => p.type === 'Coin flip').length).toEqual(4);
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Stone Barrage - tails first', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Stone Barrage'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(prompts.filter(p => p.type === 'Coin flip').length).toEqual(1);
    expect(opponent.active.damage).toEqual(0);
  });
});

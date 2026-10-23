import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { KabutopsEx } from '../../../src/ex-sets/set-sandstorm/kabutops-ex';
import { TestUtils } from '../../test-utils';

describe('Kabutops ex SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new KabutopsEx()],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  // Hydrocutter (40x) - Flip a number of coins equal to the amount of Energy attached to Kabutops ex. This attack
  // does 40 damage times the number of heads. You can't flip more than 3 coins in this way.
  it('Should use Hydrocutter and flip no more than 3 coins', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true, true, true]);

    sim.dispatch(new AttackAction(1, 'Hydrocutter'));

    expect(prompts.filter(p => p.type === 'Coin flip').length).toEqual(3);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(120);
  });

  it('Should use Hydrocutter flipping a coin for each Energy', () => {
    const { player, opponent, prompts } = TestUtils.getAll(sim);
    player.active.energies.cards = TestUtils.makeEnergies([CardType.WATER, CardType.WATER]);
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new AttackAction(1, 'Hydrocutter'));

    expect(prompts.filter(p => p.type === 'Coin flip').length).toEqual(2);
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Hydrocutter - all tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false, false]);

    sim.dispatch(new AttackAction(1, 'Hydrocutter'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Spiral Drain (70) - Remove 2 damage counter from Kabutops ex (remove 1 if there is only 1).
  it('Should use Spiral Drain and remove 2 damage counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 50;

    sim.dispatch(new AttackAction(1, 'Spiral Drain'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(70);
    expect(player.active.damage).toEqual(30);
  });

  it('Should use Spiral Drain and remove 1 damage counter if there is only 1', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 10;

    sim.dispatch(new AttackAction(1, 'Spiral Drain'));

    expect(opponent.active.damage).toEqual(70);
    expect(player.active.damage).toEqual(0);
  });
});

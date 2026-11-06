import {
  AttackAction,
  CardType,
  PassTurnAction,
  Simulator,
} from '@ptcg/common';

import { Horsea } from '../../../src/base-sets/set-fossil/horsea';
import { TestUtils } from '../../test-utils';

describe('Horsea FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Horsea()],
      [CardType.WATER]
    );
  });

  // Smokescreen (10) - If the Defending Pokémon tries to attack during your opponent's next turn, your opponent
  // flips a coin. If tails, that attack does nothing.
  it('Should use Smokescreen', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Smokescreen'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Smokescreen - opponent flips tails, attack does nothing', () => {
    const { opponent, player, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Smokescreen'));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    const flip = prompts.find(p => p.type === 'Coin flip');
    expect(flip).toBeDefined();
    expect(flip!.playerId).toEqual(opponent.id);
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Smokescreen - opponent flips heads, attack works', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Smokescreen'));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Smokescreen - the effect ends after the opponent\'s next turn', () => {
    const { player, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Smokescreen'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(prompts.some(p => p.type === 'Coin flip')).toBeFalse();
    expect(player.active.damage).toEqual(10);
  });
});

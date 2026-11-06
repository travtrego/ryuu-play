import {
  AttackAction,
  CardType,
  PassTurnAction,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { MagmarEx } from '../../../src/ex-sets/set-ruby-and-sapphire/magmar-ex';
import { TestUtils } from '../../test-utils';

describe('Magmar ex RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new MagmarEx()], [CardType.FIRE, CardType.FIRE, CardType.COLORLESS]);
  });

  // Smokescreen (10) - If the Defending Pokémon tries to attack during your opponent's next turn, your opponent
  // flips a coin. If tails, that attack does nothing.
  it('Should use Smokescreen - opponent flips tails, attack does nothing', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Smokescreen'));
    expect(opponent.active.damage).toEqual(10);

    sim.dispatch(new AttackAction(2, 'Test attack'));

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

  it('Should use Smokescreen - effect ends after opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Smokescreen'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    TestUtils.setFlipResults(sim, [false]);
    sim.dispatch(new AttackAction(2, 'Test attack'));

    expect(player.active.damage).toEqual(10);
  });

  // Super Singe (40) - The Defending Pokémon is now Burned.
  it('Should use Super Singe', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Super Singe'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.BURNED]);
  });

});

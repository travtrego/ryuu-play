import {
  AttackAction,
  CardType,
  PokemonCard,
  Simulator,
} from '@ptcg/common';

import { HitmonchanEx } from '../../../src/ex-sets/set-ruby-and-sapphire/hitmonchan-ex';
import { TestUtils } from '../../test-utils';

describe('Hitmonchan ex RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new HitmonchanEx()], [CardType.FIGHTING, CardType.FIGHTING, CardType.COLORLESS]);
  });

  // Steady Punch (10+) - Flip a coin. If heads, this attack does 10 damage plus 10 more damage.
  it('Should use Steady Punch - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Steady Punch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Steady Punch - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Steady Punch'));

    expect(opponent.active.damage).toEqual(10);
  });

  // Sky Uppercut (50) - This attack's damage is not affected by Resistance.
  it('Should use Sky Uppercut - ignores Resistance', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).resistance = [{ type: CardType.FIGHTING, value: -30 }];

    sim.dispatch(new AttackAction(1, 'Sky Uppercut'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
  });

  it('Should use Sky Uppercut - Weakness still applied', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).weakness = [{ type: CardType.FIGHTING }];

    sim.dispatch(new AttackAction(1, 'Sky Uppercut'));

    expect(opponent.active.damage).toEqual(100);
  });

});

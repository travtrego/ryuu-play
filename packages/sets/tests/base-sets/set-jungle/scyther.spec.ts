import {
  AttackAction,
  CardType,
  PassTurnAction,
  PokemonCard,
  Simulator,
} from '@ptcg/common';

import { Scyther } from '../../../src/base-sets/set-jungle/scyther';
import { TestUtils } from '../../test-utils';

describe('Scyther JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Scyther()],
      [CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  // Slash (30)
  it('Should use Slash', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  // Swords Dance - During your next turn, Scyther's Slash attack's base damage is 60 instead of 30.
  it('Should use Swords Dance - Slash does 60 damage during your next turn', () => {
    const { opponent, player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Swords Dance'));
    expect(opponent.active.damage).toEqual(0);

    sim.dispatch(new PassTurnAction(2));
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  it('Should use Swords Dance - Weakness is applied to the new base damage', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).weakness = [{ type: CardType.GRASS }];

    sim.dispatch(new AttackAction(1, 'Swords Dance'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(opponent.active.damage).toEqual(120);
  });

  it('Should use Swords Dance - the effect ends after your next turn', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Swords Dance'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new AttackAction(1, 'Slash'));

    expect(opponent.active.damage).toEqual(30);
  });
});

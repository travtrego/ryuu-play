import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Golbat } from '../../../src/base-sets/set-fossil/golbat';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Golbat FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Golbat()],
      [CardType.GRASS, CardType.GRASS, CardType.COLORLESS]
    );
  });

  // Wing Attack (30)
  it('Should use Wing Attack', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Wing Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  // Leech Life (20) - Remove a number of damage counters from Golbat equal to the damage done to the Defending
  // Pokémon (after applying Weakness and Resistance). If Golbat has fewer damage counters than that, remove all.
  it('Should use Leech Life', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 40;

    sim.dispatch(new AttackAction(1, 'Leech Life'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Leech Life - after Weakness', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 50;
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.GRASS }];
    TestUtils.setDefending(sim, [weak]);

    sim.dispatch(new AttackAction(1, 'Leech Life'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Leech Life - after Resistance', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 50;
    const resistant = new TestPokemon();
    resistant.resistance = [{ type: CardType.GRASS, value: -30 }];
    TestUtils.setDefending(sim, [resistant]);

    sim.dispatch(new AttackAction(1, 'Leech Life'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(player.active.damage).toEqual(50);
  });

  it('Should use Leech Life - fewer damage counters than damage done', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 10;

    sim.dispatch(new AttackAction(1, 'Leech Life'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(player.active.damage).toEqual(0);
  });
});

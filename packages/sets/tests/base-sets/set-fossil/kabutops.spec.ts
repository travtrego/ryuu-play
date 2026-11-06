import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Kabutops } from '../../../src/base-sets/set-fossil/kabutops';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Kabutops FO', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Kabutops()],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING]
    );
  });

  // Sharp Sickle (30)
  it('Should use Sharp Sickle', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Sharp Sickle'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  // Absorb (40) - Remove a number of damage counters from Kabutops equal to half the damage done to the Defending
  // Pokémon (after applying Weakness and Resistance) (rounded up to the nearest 10). If Kabutops has fewer damage
  // counters than that, remove all of them.
  it('Should use Absorb', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 50;

    sim.dispatch(new AttackAction(1, 'Absorb'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
    expect(player.active.damage).toEqual(30);
  });

  it('Should use Absorb - after Weakness', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 50;
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.FIGHTING }];
    TestUtils.setDefending(sim, [weak]);

    sim.dispatch(new AttackAction(1, 'Absorb'));

    expect(opponent.active.damage).toEqual(80);
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Absorb - after Resistance, rounded up', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 50;
    const resistant = new TestPokemon();
    resistant.resistance = [{ type: CardType.FIGHTING, value: -30 }];
    TestUtils.setDefending(sim, [resistant]);

    sim.dispatch(new AttackAction(1, 'Absorb'));

    // 10 damage done, half is 5, rounded up to 10
    expect(opponent.active.damage).toEqual(10);
    expect(player.active.damage).toEqual(40);
  });

  it('Should use Absorb - fewer damage counters than healing', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.damage = 10;

    sim.dispatch(new AttackAction(1, 'Absorb'));

    expect(player.active.damage).toEqual(0);
  });
});

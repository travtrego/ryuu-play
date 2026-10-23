import {
  AttackAction,
  CardType,
  PokemonCard,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Kirlia2 } from '../../../src/ex-sets/set-ruby-and-sapphire/kirlia-2';
import { TestUtils } from '../../test-utils';

describe('Kirlia RS 2', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Kirlia2()], [CardType.PSYCHIC]);
  });

  // Dazzle Dance - Flip a coin. If heads, each Defending Pokémon is now Confused.
  it('Should use Dazzle Dance - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Dazzle Dance'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.CONFUSED]);
  });

  it('Should use Dazzle Dance - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Dazzle Dance'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([]);
  });

  // Life Drain - Flip a coin. If heads, put damage counters on the Defending Pokémon until it is 10 HP away from
  // being Knocked Out.
  it('Should use Life Drain - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);
    (opponent.active.getPokemonCard() as PokemonCard).hp = 80;
    opponent.active.damage = 20;

    sim.dispatch(new AttackAction(1, 'Life Drain'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(70);
  });

  it('Should use Life Drain - heads, not affected by Weakness', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);
    const defending = opponent.active.getPokemonCard() as PokemonCard;
    defending.hp = 80;
    defending.weakness = [{ type: CardType.PSYCHIC }];

    sim.dispatch(new AttackAction(1, 'Life Drain'));

    expect(opponent.active.damage).toEqual(70);
  });

  it('Should use Life Drain - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);
    (opponent.active.getPokemonCard() as PokemonCard).hp = 80;

    sim.dispatch(new AttackAction(1, 'Life Drain'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

});

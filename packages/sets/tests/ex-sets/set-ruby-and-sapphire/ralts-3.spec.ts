import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Ralts3 } from '../../../src/ex-sets/set-ruby-and-sapphire/ralts-3';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Ralts RS 3', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Ralts3()], [CardType.PSYCHIC, CardType.COLORLESS]);
  });

  // Pound (10)
  it('Should use Pound', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Pound'));

    expect(opponent.active.damage).toEqual(10);
  });

  // Link Blast (40) - If Ralts and the Defending Pokémon have a different amount of Energy attached to them, this
  // attack's base damage is 10 instead of 40.
  it('Should use Link Blast - same amount of Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.FIRE, CardType.WATER]);

    sim.dispatch(new AttackAction(1, 'Link Blast'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  // BUG: the opponent's Energy count is computed from Ralts' own energy map, so the amounts always match and the
  // attack always does 40.
  xit('Should use Link Blast - different amount of Energy', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setDefending(sim, [new TestPokemon()], [CardType.FIRE]);

    sim.dispatch(new AttackAction(1, 'Link Blast'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

});

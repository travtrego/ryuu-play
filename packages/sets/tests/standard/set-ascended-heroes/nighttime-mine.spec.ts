import { AttackAction, CardType, Simulator } from '@ptcg/common';

import { NighttimeMine } from '../../../src/standard/set-ascended-heroes/nighttime-mine';
import { DragapultEx } from '../../../src/standard/set-twilight-masquerade/dragapult-ex';
import { TestUtils } from '../../test-utils';

describe('Nighttime Mine ASC', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    TestUtils.getAll(sim).opponent.stadium.cards = [new NighttimeMine()];
  });

  it('a Tera Pokémon\'s attacks cost C more', () => {
    TestUtils.setActive(sim, [new DragapultEx()], [CardType.FIRE, CardType.PSYCHIC]);
    expect(() => sim.dispatch(new AttackAction(1, 'Phantom Dive'))).toThrow();
  });

  it('with the extra Energy the attack works', () => {
    TestUtils.setActive(sim, [new DragapultEx()], [CardType.FIRE, CardType.PSYCHIC, CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Jet Headbutt'));
    expect(TestUtils.getAll(sim).opponent.active.damage).toEqual(70);
  });

  it('other Pokémon are not affected', () => {
    sim.dispatch(new AttackAction(1, 'Test attack'));
    expect(TestUtils.getAll(sim).opponent.active.damage).toEqual(10);
  });
});

import {
  AttackAction,
  CardType,
  PokemonCard,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Aron2 } from '../../../src/ex-sets/set-ruby-and-sapphire/aron-2';
import { Grovyle } from '../../../src/ex-sets/set-ruby-and-sapphire/grovyle';
import { TestUtils } from '../../test-utils';

describe('Grovyle RS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Grovyle()], [CardType.GRASS, CardType.COLORLESS, CardType.COLORLESS]);
  });

  // Poison Breath - The Defending Pokémon is now Poisoned.
  it('Should use Poison Breath', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Poison Breath'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(opponent.active.damage).toEqual(10);
  });

  // Swift (30) - This attack's damage isn't affected by Weakness, Resistance, Poké-Powers, Poké-Bodies, or any other
  // effects on the Defending Pokémon.
  it('Should use Swift', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Swift'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Swift - ignores Weakness', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).weakness = [{ type: CardType.GRASS }];

    sim.dispatch(new AttackAction(1, 'Swift'));

    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Swift - ignores Resistance', () => {
    const { opponent } = TestUtils.getAll(sim);
    (opponent.active.getPokemonCard() as PokemonCard).resistance = [{ type: CardType.GRASS, value: -30 }];

    sim.dispatch(new AttackAction(1, 'Swift'));

    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Swift - ignores effects on the Defending Pokemon', () => {
    const { opponent } = TestUtils.getAll(sim);
    const aron = new Aron2();
    TestUtils.setDefending(sim, [aron]);
    // Teary Eyes effect on the Defending Pokemon
    opponent.active.marker.addMarker(aron.TEARY_EYES_MARKER, aron);

    sim.dispatch(new AttackAction(1, 'Swift'));

    expect(opponent.active.damage).toEqual(30);
  });

});

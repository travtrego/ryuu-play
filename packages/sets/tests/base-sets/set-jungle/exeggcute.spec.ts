import {
  AttackAction,
  CardType,
  PokemonCard,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Exeggcute } from '../../../src/base-sets/set-jungle/exeggcute';
import { TestUtils } from '../../test-utils';

describe('Exeggcute JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Exeggcute()],
      [CardType.PSYCHIC, CardType.GRASS, CardType.GRASS],
    );
  });

  // Hypnosis - The Defending Pokémon is now Asleep.
  it('Should use Hypnosis', () => {
    const { opponent } = TestUtils.getAll(sim);
    // tails for the between-turns sleep check
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Hypnosis'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.ASLEEP]);
  });

  // Leech Seed (20) - Unless all damage from this attack is prevented, you may remove 1 damage counter from
  // Exeggcute.
  it('Should use Leech Seed and remove 1 damage counter from Exeggcute', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 30;

    sim.dispatch(new AttackAction(1, 'Leech Seed'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Leech Seed without damage counters on Exeggcute', () => {
    const { opponent, player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Leech Seed'));

    expect(opponent.active.damage).toEqual(20);
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Leech Seed and not heal when all damage is prevented', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.active.damage = 30;
    (opponent.active.getPokemonCard() as PokemonCard).resistance = [{ type: CardType.GRASS, value: -30 }];

    sim.dispatch(new AttackAction(1, 'Leech Seed'));

    expect(opponent.active.damage).toEqual(0);
    expect(player.active.damage).toEqual(30);
  });
});

import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Steelix } from '../../../src/ex-sets/set-sandstorm/steelix';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Steelix SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Steelix()],
      [CardType.METAL, CardType.METAL, CardType.FIGHTING, CardType.COLORLESS]
    );
  });

  // Rage (10+) - Does 10 damage plus 10 more damage for each damage counter on Steelix.
  it('Should use Rage without damage counters', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Rage'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Rage with damage counters', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.active.damage = 50;

    sim.dispatch(new AttackAction(1, 'Rage'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  // Spinning Tail - Does 20 damage to each of your opponent's Pokémon. (Don't apply Weakness and Resistance for
  // Benched Pokémon.)
  it('Should use Spinning Tail', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const weakBenched = new TestPokemon();
    weakBenched.weakness = [{ type: CardType.METAL }];
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[1] = TestUtils.pokemonSlot([weakBenched]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Spinning Tail'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.bench[0].damage).toEqual(20);
    expect(opponent.bench[1].damage).toEqual(20);
    expect(player.bench[0].damage).toEqual(0);
  });

  it('Should use Spinning Tail applying Weakness to the Defending Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = new TestPokemon();
    defending.weakness = [{ type: CardType.METAL }];
    TestUtils.setDefending(sim, [defending]);

    sim.dispatch(new AttackAction(1, 'Spinning Tail'));

    expect(opponent.active.damage).toEqual(40);
  });
});

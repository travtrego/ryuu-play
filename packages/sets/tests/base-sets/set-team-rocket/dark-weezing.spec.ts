import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { DarkWeezing } from '../../../src/base-sets/set-team-rocket/dark-weezing';
import { Koffing } from '../../../src/base-sets/set-team-rocket/koffing';
import { Weezing } from '../../../src/base-sets/set-fossil/weezing';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dark Weezing TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Koffing(), new DarkWeezing()],
      [CardType.GRASS, CardType.GRASS, CardType.GRASS]
    );
  });

  // Mass Explosion (20×) - Does 20 damage times the total number of Koffings, Weezings, and Dark Weezings in play
  // (Apply Weakness and Resistance.). Then, this attack does 20 damage to each Koffing, Weezing, and Dark Weezing
  // (even your own). Don't apply Weakness and Resistance.
  it('Should use Mass Explosion with only Dark Weezing in play', () => {
    const { player, opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Mass Explosion'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(player.active.damage).toEqual(20);
  });

  it('Should use Mass Explosion counting Koffings, Weezings and Dark Weezings on both sides', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new Koffing()]);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    opponent.bench[0] = TestUtils.pokemonSlot([new Koffing(), new Weezing()]);
    opponent.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Mass Explosion'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
    expect(player.active.damage).toEqual(20);
    expect(player.bench[0].damage).toEqual(20);
    expect(player.bench[1].damage).toEqual(0);
    expect(opponent.bench[0].damage).toEqual(20);
    expect(opponent.bench[1].damage).toEqual(0);
  });

  it('Should apply Weakness to the main damage but not to the 20 damage', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const koffing = new Koffing();
    koffing.hp = 400;
    koffing.weakness = [{ type: CardType.GRASS }];
    TestUtils.setDefending(sim, [koffing]);
    player.bench[0] = TestUtils.pokemonSlot([new Koffing()]);

    sim.dispatch(new AttackAction(1, 'Mass Explosion'));

    // 3 in play: 60 x2 Weakness = 120, plus 20 for being a Koffing
    expect(opponent.active.damage).toEqual(140);
    expect(player.active.damage).toEqual(20);
    expect(player.bench[0].damage).toEqual(20);
  });

  // Stun Gas (20) - Flip a coin. If heads, the Defending Pokémon is now Poisoned; if tails, the Defending Pokémon
  // is now Paralyzed.
  it('Should use Stun Gas - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Stun Gas'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(opponent.active.damage).toEqual(30); // 20 + 10 Poison between turns
  });

  it('Should use Stun Gas - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Stun Gas'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.PARALYZED]);
    expect(opponent.active.damage).toEqual(20);
  });
});

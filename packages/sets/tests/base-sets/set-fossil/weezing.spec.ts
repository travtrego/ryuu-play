import {
  AttackAction,
  CardType,
  Simulator,
  SpecialCondition,
} from '@ptcg/common';

import { Weezing } from '../../../src/base-sets/set-fossil/weezing';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Weezing FO', () => {
  let sim: Simulator;
  let weezing: Weezing;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    weezing = new Weezing();

    TestUtils.setActive(
      sim,
      [weezing],
      [CardType.GRASS, CardType.GRASS, CardType.COLORLESS]
    );
  });

  // Smog (20) - Flip a coin. If heads, the Defending Pokémon is now Poisoned.
  it('Should use Smog - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Smog'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.specialConditions).toEqual([SpecialCondition.POISONED]);
    expect(opponent.active.damage).toEqual(30); // 20 + 10 Poison between turns
  });

  it('Should use Smog - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Smog'));

    expect(opponent.active.specialConditions).toEqual([]);
    expect(opponent.active.damage).toEqual(20);
  });

  // Selfdestruct (60) - Does 10 damage to each Pokémon on each player's Bench. (Don't apply Weakness and Resistance
  // for Benched Pokémon.) Weezing does 60 damage to itself.
  it('Should use Selfdestruct', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    weezing.hp = 400; // keep Weezing in play so the self-damage can be measured
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.GRASS }];
    opponent.bench[0] = TestUtils.pokemonSlot([weak]);
    opponent.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Selfdestruct'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
    expect(opponent.bench[0].damage).toEqual(10);
    expect(opponent.bench[1].damage).toEqual(10);
    expect(player.bench[0].damage).toEqual(10);
    expect(player.active.damage).toEqual(60);
  });

  it('Should use Selfdestruct and Knock Out itself', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Selfdestruct'));

    expect(opponent.active.damage).toEqual(60);
    expect(player.discard.cards).toContain(weezing);
  });
});

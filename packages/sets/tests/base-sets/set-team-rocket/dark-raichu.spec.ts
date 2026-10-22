import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { DarkRaichu } from '../../../src/base-sets/set-team-rocket/dark-raichu';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dark Raichu TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new DarkRaichu()],
      [CardType.LIGHTNING, CardType.LIGHTNING, CardType.LIGHTNING]
    );
    const { opponent } = TestUtils.getAll(sim);
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.LIGHTNING }];
    opponent.bench[0] = TestUtils.pokemonSlot([weak]);
    opponent.bench[2] = TestUtils.pokemonSlot([new TestPokemon()]);
  });

  // Surprise Thunder (30) - Flip a coin. If heads, flip another coin. If the second coin is heads, this attack does
  // 20 damage to each of your opponent's Benched Pokémon. If the second coin is tails, this attack does 10 damage to
  // each of your opponent's Benched Pokémon. (Don't apply Weakness and Resistance for Benched Pokémon.)
  it('Should use Surprise Thunder - heads, heads', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Surprise Thunder'));

    expect(prompts.filter(p => p.type === 'Coin flip').length).toEqual(2);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.bench[0].damage).toEqual(20);
    expect(opponent.bench[1].damage).toEqual(0);
    expect(opponent.bench[2].damage).toEqual(20);
  });

  it('Should use Surprise Thunder - heads, tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new AttackAction(1, 'Surprise Thunder'));

    expect(opponent.active.damage).toEqual(30);
    expect(opponent.bench[0].damage).toEqual(10);
    expect(opponent.bench[2].damage).toEqual(10);
  });

  it('Should use Surprise Thunder - tails flips only once', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Surprise Thunder'));

    expect(prompts.filter(p => p.type === 'Coin flip').length).toEqual(1);
    expect(opponent.active.damage).toEqual(30);
    expect(opponent.bench[0].damage).toEqual(0);
    expect(opponent.bench[2].damage).toEqual(0);
  });
});

import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { DarkHypno } from '../../../src/base-sets/set-team-rocket/dark-hypno';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dark Hypno TR', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new DarkHypno()],
      [CardType.PSYCHIC, CardType.PSYCHIC, CardType.PSYCHIC]
    );
  });

  // Psypunch (20)
  it('Should use Psypunch', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Psypunch'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  // Bench Manipulation (20×) - Your opponent flips a number of coins equal to the number of Pokémon on his or her
  // Bench. This attack does 20 damage times the number of tails. Don't apply Weakness and Resistance for this attack.
  function setupBench(count: number) {
    const { opponent } = TestUtils.getAll(sim);
    for (let i = 0; i < count; i++) {
      opponent.bench[i] = TestUtils.pokemonSlot([new TestPokemon()]);
    }
  }

  it('Should use Bench Manipulation - opponent flips one coin per Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    setupBench(3);
    TestUtils.setFlipResults(sim, [false, true, false]);

    sim.dispatch(new AttackAction(1, 'Bench Manipulation'));

    const flips = prompts.filter(p => p.type === 'Coin flip');
    expect(flips.length).toEqual(3);
    flips.forEach(f => expect(f.playerId).toEqual(opponent.id));
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Bench Manipulation - all heads does nothing', () => {
    const { opponent } = TestUtils.getAll(sim);
    setupBench(2);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Bench Manipulation'));

    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Bench Manipulation without Weakness and Resistance', () => {
    const { opponent } = TestUtils.getAll(sim);
    setupBench(2);
    (opponent.active.getPokemonCard() as TestPokemon).weakness = [{ type: CardType.PSYCHIC }];
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Bench Manipulation'));

    expect(opponent.active.damage).toEqual(40);
  });

  it('Should use Bench Manipulation without opponent\'s Benched Pokémon', () => {
    const { opponent, prompts } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Bench Manipulation'));

    expect(prompts.some(p => p.type === 'Coin flip')).toBeFalse();
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });
});

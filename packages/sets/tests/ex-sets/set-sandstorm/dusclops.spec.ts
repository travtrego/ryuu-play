import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Dusclops } from '../../../src/ex-sets/set-sandstorm/dusclops';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Dusclops SS', () => {
  let sim: Simulator;
  let defending: TestPokemon;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Dusclops()],
      [CardType.PSYCHIC, CardType.COLORLESS, CardType.COLORLESS]
    );

    defending = new TestPokemon();
    TestUtils.setDefending(sim, [defending]);
    sim.store.state.players[1].bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
  });

  // Judgement - Flip 2 coins. If both of them are heads, the Defending Pokémon is Knocked Out.
  it('Should use Judgement - 2 heads Knocks Out the Defending Pokémon', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, true]);

    sim.dispatch(new AttackAction(1, 'Judgement'));

    expect(opponent.discard.cards).toContain(defending);
    expect(opponent.active.getPokemonCard()).not.toBe(defending);
  });

  it('Should use Judgement - 1 heads does nothing', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true, false]);

    sim.dispatch(new AttackAction(1, 'Judgement'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.getPokemonCard()).toBe(defending);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Should use Judgement - 2 tails does nothing', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false, false]);

    sim.dispatch(new AttackAction(1, 'Judgement'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(0);
  });

  // Random Curse - Put a total of 5 damage counters on all Defending Pokémon in any way you like.
  it('Should use Random Curse', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Random Curse'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(50);
    expect(opponent.bench[0].damage).toEqual(0);
  });

  it('Should use Random Curse ignoring Weakness (damage counters)', () => {
    const { opponent } = TestUtils.getAll(sim);
    defending.weakness = [{ type: CardType.PSYCHIC }];

    sim.dispatch(new AttackAction(1, 'Random Curse'));

    expect(opponent.active.damage).toEqual(50);
  });
});

import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Golem } from '../../../src/base-sets/set-fossil/golem';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Golem FO', () => {
  let sim: Simulator;
  let golem: Golem;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    golem = new Golem();

    TestUtils.setActive(
      sim,
      [golem],
      [CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING, CardType.FIGHTING]
    );
  });

  // Avalanche (60)
  it('Should use Avalanche', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Avalanche'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
  });

  // Selfdestruct (100) - Does 20 damage to each Pokémon on each player's Bench. (Don't apply Weakness and
  // Resistance for Benched Pokémon.) Golem does 100 damage to itself.
  it('Should use Selfdestruct', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    golem.hp = 400; // keep Golem in play so the self-damage can be measured
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.FIGHTING }];
    opponent.bench[0] = TestUtils.pokemonSlot([weak]);
    opponent.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Selfdestruct'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(100);
    expect(opponent.bench[0].damage).toEqual(20);
    expect(opponent.bench[1].damage).toEqual(20);
    expect(opponent.bench[2].damage).toEqual(0);
    expect(player.bench[0].damage).toEqual(20);
    expect(player.active.damage).toEqual(100);
  });

  it('Should use Selfdestruct and Knock Out itself', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Selfdestruct'));

    expect(opponent.active.damage).toEqual(100);
    expect(player.discard.cards).toContain(golem);
  });
});

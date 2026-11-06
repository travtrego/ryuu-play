import {
  AttackAction,
  CardType,
  Simulator,
} from '@ptcg/common';

import { Magneton } from '../../../src/base-sets/set-fossil/magneton';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Magneton FO', () => {
  let sim: Simulator;
  let magneton: Magneton;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    magneton = new Magneton();

    TestUtils.setActive(
      sim,
      [magneton],
      [CardType.LIGHTNING, CardType.LIGHTNING, CardType.LIGHTNING, CardType.LIGHTNING]
    );
  });

  // Sonicboom (20) - Don't apply Weakness and Resistance for this attack.
  it('Should use Sonicboom', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Sonicboom'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Sonicboom - ignores Weakness', () => {
    const { opponent } = TestUtils.getAll(sim);
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.LIGHTNING }];
    TestUtils.setDefending(sim, [weak]);

    sim.dispatch(new AttackAction(1, 'Sonicboom'));

    expect(opponent.active.damage).toEqual(20);
  });

  it('Should use Sonicboom - ignores Resistance', () => {
    const { opponent } = TestUtils.getAll(sim);
    const resistant = new TestPokemon();
    resistant.resistance = [{ type: CardType.LIGHTNING, value: -30 }];
    TestUtils.setDefending(sim, [resistant]);

    sim.dispatch(new AttackAction(1, 'Sonicboom'));

    expect(opponent.active.damage).toEqual(20);
  });

  // Selfdestruct (100) - Does 20 damage to each Pokémon on each player's Bench. (Don't apply Weakness and
  // Resistance for Benched Pokémon.) Magneton does 100 damage to itself.
  it('Should use Selfdestruct', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    magneton.hp = 400; // keep Magneton in play so the self-damage can be measured
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.LIGHTNING }];
    opponent.bench[0] = TestUtils.pokemonSlot([weak]);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[1] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Selfdestruct'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(100);
    expect(opponent.bench[0].damage).toEqual(20);
    expect(player.bench[0].damage).toEqual(20);
    expect(player.bench[1].damage).toEqual(20);
    expect(player.active.damage).toEqual(100);
  });

  it('Should use Selfdestruct and Knock Out itself', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Selfdestruct'));

    expect(opponent.active.damage).toEqual(100);
    expect(player.discard.cards).toContain(magneton);
  });
});

import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  RetreatAction,
  Simulator,
} from '@ptcg/common';

import { Sandslash } from '../../../src/ex-sets/set-sandstorm/sandslash';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Sandslash SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;

    TestUtils.setActive(
      sim,
      [new Sandslash()],
      [CardType.FIGHTING, CardType.COLORLESS, CardType.COLORLESS]
    );
  });

  function opponentRetreat(): string {
    let message = '';
    try {
      sim.dispatch(new RetreatAction(2, 0));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Sand Swirl - Does 20 damage to each Defending Pokémon. The Defending Pokémon can't retreat until the end of your
  // opponent's next turn.
  it('Should use Sand Swirl', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Sand Swirl'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponent.bench[0].damage).toEqual(0);
    expect(opponentRetreat()).toEqual(GameMessage.BLOCKED_BY_EFFECT);
  });

  it('Should allow retreat again after the opponent\'s next turn', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Sand Swirl'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));

    expect(opponentRetreat()).toEqual('');
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
  });

  // Earthquake (60) - Does 10 damage to each of your Benched Pokémon. (Don't apply Weakness or Resistance for
  // Benched Pokémon.)
  it('Should use Earthquake', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const weak = new TestPokemon();
    weak.weakness = [{ type: CardType.FIGHTING }];
    player.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    player.bench[1] = TestUtils.pokemonSlot([weak]);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Earthquake'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(60);
    expect(opponent.bench[0].damage).toEqual(0);
    expect(player.active.damage).toEqual(0);
    expect(player.bench[0].damage).toEqual(10);
    expect(player.bench[1].damage).toEqual(10);
    expect(player.bench[2].damage).toEqual(0);
  });
});

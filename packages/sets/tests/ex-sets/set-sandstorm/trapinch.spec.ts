import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  RetreatAction,
  Simulator,
} from '@ptcg/common';

import { Trapinch } from '../../../src/ex-sets/set-sandstorm/trapinch';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Trapinch SS', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 3;

    TestUtils.setActive(sim, [new Trapinch()], [CardType.COLORLESS, CardType.COLORLESS]);
    sim.store.state.players[1].bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
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

  // Sand Pit (10) - The Defending Pokémon can't retreat until the end of your opponent's next turn.
  it('Should use Sand Pit', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();

    sim.dispatch(new AttackAction(1, 'Sand Pit'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
    expect(opponentRetreat()).toEqual(GameMessage.BLOCKED_BY_EFFECT);
    expect(opponent.active.getPokemonCard()).toBe(defending);
  });

  it('Should allow retreat again after the opponent\'s next turn', () => {
    const { opponent } = TestUtils.getAll(sim);
    const defending = opponent.active.getPokemonCard();

    sim.dispatch(new AttackAction(1, 'Sand Pit'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));

    expect(opponentRetreat()).toEqual('');
    expect(opponent.bench[0].getPokemonCard()).toBe(defending);
  });

  // Irongrip (20)
  it('Should use Irongrip', () => {
    const { opponent } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Irongrip'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(20);
    expect(opponentRetreat()).toEqual('');
  });
});

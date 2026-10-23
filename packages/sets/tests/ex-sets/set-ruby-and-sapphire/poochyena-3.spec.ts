import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  RetreatAction,
  Simulator,
} from '@ptcg/common';

import { Poochyena3 } from '../../../src/ex-sets/set-ruby-and-sapphire/poochyena-3';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Poochyena RS 3', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(sim, [new Poochyena3()], [CardType.DARK]);
  });

  // Shadow Bind (10) - The Defending Pokémon can't retreat until the end of your opponent's next turn.
  it('Should use Shadow Bind - blocks retreat', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Shadow Bind'));

    let message = '';
    try {
      sim.dispatch(new RetreatAction(2, 0));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(message).toEqual(GameMessage.BLOCKED_BY_EFFECT);
    expect(opponent.active.damage).toEqual(10);
  });

  it('Should use Shadow Bind - effect ends after opponent\'s next turn', () => {
    const { opponent } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);
    const defending = opponent.active;

    sim.dispatch(new AttackAction(1, 'Shadow Bind'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    sim.dispatch(new RetreatAction(2, 0));

    expect(opponent.bench[0]).toBe(defending);
  });

});

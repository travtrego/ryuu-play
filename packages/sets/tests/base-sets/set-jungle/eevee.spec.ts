import {
  AttackAction,
  CardType,
  GameMessage,
  PassTurnAction,
  RetreatAction,
  Simulator,
} from '@ptcg/common';

import { Eevee } from '../../../src/base-sets/set-jungle/eevee';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

describe('Eevee JU', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();

    TestUtils.setActive(
      sim,
      [new Eevee()],
      [CardType.COLORLESS, CardType.COLORLESS],
    );
  });

  function opponentAttack(): string {
    let message = '';
    try {
      sim.dispatch(new AttackAction(2, 'Test attack'));
    } catch (error) {
      message = TestUtils.getErrorMessage(error);
    }
    return message;
  }

  // Tail Wag - Flip a coin. If heads, the Defending Pokémon can't attack Eevee during your opponent's next turn.
  // (Benching either Pokémon ends this effect.)
  it('Should use Tail Wag - heads, the Defending Pokémon can\'t attack', () => {
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Tail Wag'));
    const message = opponentAttack();

    const { opponent, player } = TestUtils.getAll(sim);
    expect(message).toEqual(GameMessage.BLOCKED_BY_EFFECT);
    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(player.active.damage).toEqual(0);
  });

  it('Should use Tail Wag - tails, the Defending Pokémon can attack', () => {
    const { player } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Tail Wag'));
    const message = opponentAttack();

    expect(message).toEqual('');
    expect(TestUtils.isPlayerTurn(sim, player)).toBeTrue();
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Tail Wag - a new Active Pokémon can attack', () => {
    const { opponent, player } = TestUtils.getAll(sim);
    opponent.bench[0] = TestUtils.pokemonSlot([new TestPokemon()]);

    sim.dispatch(new AttackAction(1, 'Tail Wag'));
    sim.dispatch(new RetreatAction(2, 0));
    const message = opponentAttack();

    expect(message).toEqual('');
    expect(player.active.damage).toEqual(10);
  });

  it('Should use Tail Wag - the effect ends after the opponent\'s next turn', () => {
    const { player } = TestUtils.getAll(sim);

    sim.dispatch(new AttackAction(1, 'Tail Wag'));
    sim.dispatch(new PassTurnAction(2));
    sim.dispatch(new PassTurnAction(1));
    const message = opponentAttack();

    expect(message).toEqual('');
    expect(player.active.damage).toEqual(10);
  });

  // Quick Attack (10+) - Flip a coin. If heads, this attack does 10 damage plus 20 more damage; if tails, this
  // attack does 10 damage.
  it('Should use Quick Attack - heads', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [true]);

    sim.dispatch(new AttackAction(1, 'Quick Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(30);
  });

  it('Should use Quick Attack - tails', () => {
    const { opponent } = TestUtils.getAll(sim);
    TestUtils.setFlipResults(sim, [false]);

    sim.dispatch(new AttackAction(1, 'Quick Attack'));

    expect(TestUtils.isPlayerTurn(sim, opponent)).toBeTrue();
    expect(opponent.active.damage).toEqual(10);
  });
});
